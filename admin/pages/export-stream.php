<?php
// export-stream.php - Endpoint Server-Sent Events per export con progressione real-time

// FIX: Disabilita output buffering PRIMA di tutto
while (ob_get_level()) {
    ob_end_clean();
}

require_once '../config.php';
require_once '../includes/functions.php';

// FIX: Previeni errori se headers già inviati
if (headers_sent()) {
    die("Headers already sent");
}

// Imposta headers per SSE con fix HTTP/2
header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Connection: keep-alive');
header('X-Accel-Buffering: no'); // Disabilita buffering nginx

// FIX: Forza HTTP/1.1 se possibile (evita problemi HTTP/2)
if (!headers_sent()) {
    header('HTTP/1.1 200 OK');
}

// Forza output immediato
@ini_set('output_buffering', 'off');
@ini_set('zlib.output_compression', false);
@apache_setenv('no-gzip', 1);
@ini_set('implicit_flush', 1);
ob_implicit_flush(true);

// File di log per debug
$logFile = DATA_PATH . '/export-debug.log';
$logStartTime = microtime(true);

// Funzione helper per logging
function writeLog($message, $data = null) {
    global $logFile, $logStartTime;
    $elapsed = round(microtime(true) - $logStartTime, 3);
    $timestamp = date('Y-m-d H:i:s');
    $logLine = "[{$timestamp}] [{$elapsed}s] {$message}";
    if ($data !== null) {
        $logLine .= " | Data: " . json_encode($data, JSON_UNESCAPED_UNICODE);
    }
    $logLine .= "\n";
    file_put_contents($logFile, $logLine, FILE_APPEND);
}

// Inizializza log
file_put_contents($logFile, "\n=== EXPORT START [" . date('Y-m-d H:i:s') . "] ===\n");
writeLog("Export stream iniziato");
writeLog("PHP Version", phpversion());
writeLog("Memory limit", ini_get('memory_limit'));
writeLog("Max execution time", ini_get('max_execution_time'));

// Funzione helper per inviare eventi SSE
function sendSSE($event, $data) {
    // FIX: Assicura che la connessione sia ancora attiva
    if (connection_aborted()) {
        writeLog("Connection aborted by client");
        exit;
    }

    // Keep-alive automatico ogni 10 secondi
    if (isset($GLOBALS['lastKeepAliveTime'])) {
        $now = time();
        if (($now - $GLOBALS['lastKeepAliveTime']) >= 10) {
            sendKeepAlive();
            $GLOBALS['lastKeepAliveTime'] = $now;
            writeLog("Auto keep-alive sent");
        }
    }

    writeLog("Sending SSE event: {$event}", $data);

    echo "event: $event\n";
    echo "data: " . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";

    // FIX: Flush multiplo per garantire invio
    if (ob_get_level()) {
        @ob_flush();
    }
    @flush();

    // FIX: Piccola pausa per evitare sovraccarico
    usleep(1000); // 1ms
}

// Invia keep-alive per mantenere la connessione attiva
function sendKeepAlive() {
    // Invia un commento SSE che il browser ignora ma mantiene la connessione
    echo ": keep-alive\n\n";
    if (ob_get_level()) {
        @ob_flush();
    }
    @flush();
}

// Imposta keep-alive globale per le traduzioni
$GLOBALS['keepAliveCallback'] = 'sendKeepAlive';

// Timer per keep-alive automatico
$GLOBALS['lastKeepAliveTime'] = time();

try {
    writeLog("Caricamento configurazioni...");

    // Aumenta il max execution time
    @ini_set('max_execution_time', 1800); // 30 minuti
    writeLog("Max execution time set to 1800s (30 minutes)");

    // Carica configurazioni
    $dbConfig = loadDBConfig();
    writeLog("DB Config loaded", ['host' => $dbConfig['host'] ?? 'N/A', 'database' => $dbConfig['database'] ?? 'N/A']);

    $mappingConfig = loadMappingConfig();
    writeLog("Mapping Config loaded", ['fields_count' => count($mappingConfig['fields'] ?? [])]);

    $translationSettings = loadTranslationSettings();

    // Permetti di disabilitare traduzioni via parametro GET per export più veloci
    if (isset($_GET['skip_translations']) && $_GET['skip_translations'] == '1') {
        $translationSettings['enabled'] = false;
        writeLog("Translation DISABLED via parameter");
    }

    writeLog("Translation Settings loaded", ['enabled' => $translationSettings['enabled'] ?? false]);

    $filterConfig = loadFilterConfig();
    writeLog("Filter Config loaded");

    $imageSettings = loadImageSettings();
    writeLog("Image Settings loaded");

    $variantConfig = loadVariantConfig();
    writeLog("Variant Config loaded", ['enabled' => $variantConfig['enabled'] ?? false]);

    $ecommerceConfig = loadEcommerceConfig();
    writeLog("Ecommerce Config loaded");

    $resourceConfig = loadResourceConfig();
    writeLog("Resource Config loaded");

    if (!$dbConfig || !$mappingConfig) {
        writeLog("ERROR: Configurazione mancante");
        sendSSE('error', ['message' => 'Configurazione mancante']);
        exit;
    }

    // Verifica che le tabelle abbiano record
    writeLog("Verifica tabelle database...");
    sendSSE('progress', [
        'phase' => 'loading',
        'message' => 'Verifica tabelle database...',
        'current' => 0,
        'total' => 0,
        'percent' => 0
    ]);

    try {
        $tableVerification = verifyTablesHaveRecords($dbConfig);
        writeLog("Table verification results", $tableVerification);

        // Controlla se ci sono errori o tabelle vuote
        $hasErrors = false;
        $errorMessages = [];

        foreach ($tableVerification as $tableName => $result) {
            if (!$result['exists']) {
                $hasErrors = true;
                $errorMessages[] = "Tabella '$tableName' non esiste: " . $result['error'];
                writeLog("ERROR: Table does not exist", ['table' => $tableName, 'error' => $result['error']]);
            } elseif ($result['count'] === 0) {
                $errorMessages[] = "⚠️ Tabella '$tableName' è vuota (0 record)";
                writeLog("WARNING: Table is empty", ['table' => $tableName]);
            } else {
                writeLog("Table OK", ['table' => $tableName, 'count' => $result['count']]);
            }
        }

        if ($hasErrors) {
            $errorMsg = "Errore verifica database:\n" . implode("\n", $errorMessages);
            writeLog("ERROR: Database verification failed");
            sendSSE('error', ['message' => $errorMsg]);
            exit;
        }

        // Se ci sono warning ma non errori, continua
        if (!empty($errorMessages)) {
            $warningMsg = implode("\n", $errorMessages);
            sendSSE('warning', ['message' => $warningMsg]);
            writeLog("WARNING: Some tables are empty but continuing");
        }

    } catch (Exception $e) {
        writeLog("ERROR: Table verification exception", ['error' => $e->getMessage()]);
        sendSSE('error', ['message' => 'Errore verifica database: ' . $e->getMessage()]);
        exit;
    }

    // Ottieni parametri
    $productLimit = isset($_GET['limit']) && $_GET['limit'] ? intval($_GET['limit']) : null;
    writeLog("Product limit", $productLimit ?? 'ALL');

    $startTime = microtime(true);

    // Invia messaggio iniziale
    sendSSE('progress', [
        'phase' => 'loading',
        'message' => 'Avvio export...',
        'current' => 0,
        'total' => 0,
        'percent' => 0
    ]);

    usleep(100000); // 100ms pausa

    // ==================== USA LA FUNZIONE CHUNKED CON CALLBACK ====================
    // Questa funzione processa i prodotti in chunk e chiama la callback per ogni progresso
    writeLog("Inizio generazione products JSON con chunked processing...");

    // Defin callback che invia SSE
    $progressCallback = function($current, $total, $data) {
        // Invia SSE con i dati progress
        sendSSE('progress', [
            'phase' => $data['phase'] ?? 'loading',
            'message' => $data['message'] ?? 'Elaborazione...',
            'current' => $current,
            'total' => $total,
            'percent' => $data['percent'] ?? round(($current / max($total, 1)) * 100),
            'product' => $data['product'] ?? null,
            'language' => $data['language'] ?? null,
            'resources' => $data['resources'] ?? null
        ]);

        // Log
        writeLog("Progress: {$current}/{$total} - " . ($data['message'] ?? ''));
    };

    // Chiama funzione chunked con callback
    $jsonData = generateProductsJSONChunkedWithCallback(
        $dbConfig,
        $mappingConfig,
        $translationSettings,
        $productLimit,
        $filterConfig,
        $imageSettings,
        $variantConfig,
        $ecommerceConfig,
        $progressCallback,
        10 // Chunk size: 10 prodotti alla volta
    );

    writeLog("Generazione products JSON completata con chunked processing");

    $totalProducts = $jsonData['total'];
    writeLog("Total products", $totalProducts);

    // ==================== SALVATAGGIO ====================
    sendSSE('progress', [
        'phase' => 'saving',
        'message' => 'Salvataggio JSON su disco...',
        'current' => 0,
        'total' => 1,
        'percent' => 0
    ]);

    writeLog("Inizio salvataggio file JSON...");
    savePublicJSON($jsonData);
    writeLog("File JSON salvato con successo", ['path' => PUBLIC_JSON_PATH]);

    $endTime = microtime(true);
    $executionTime = round($endTime - $startTime, 2);
    writeLog("Export completato", ['execution_time' => $executionTime . 's', 'memory_used' => memory_get_peak_usage(true) / 1024 / 1024 . ' MB']);

    sendSSE('progress', [
        'phase' => 'saving',
        'message' => 'File salvato con successo',
        'current' => 1,
        'total' => 1,
        'percent' => 100
    ]);

    usleep(200000);

    // ==================== COMPLETATO ====================
    sendSSE('complete', [
        'message' => "Export completato con successo!",
        'stats' => [
            'total_products' => $totalProducts,
            'execution_time' => $executionTime,
            'languages' => $jsonData['_meta']['languages'] ?? ['it'],
            'file_size' => filesize(PUBLIC_JSON_PATH)
        ]
    ]);

    logActivity("Export completato: {$totalProducts} prodotti in {$executionTime}s");

} catch (Exception $e) {
    writeLog("EXCEPTION CAUGHT", [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);

    // Log completo con stack trace nel file locale
    $errorLogFile = DATA_PATH . '/export-error.log';
    $timestamp = date('Y-m-d H:i:s');

    $errorDetails = [
        'timestamp' => $timestamp,
        'type' => 'Exception',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ];

    $logContent = "\n=== EXPORT ERROR [$timestamp] ===\n";
    $logContent .= "Tipo: Exception\n";
    $logContent .= "Messaggio: " . $e->getMessage() . "\n";
    $logContent .= "File: " . $e->getFile() . "\n";
    $logContent .= "Linea: " . $e->getLine() . "\n";
    $logContent .= "Stack Trace:\n" . $e->getTraceAsString() . "\n";
    $logContent .= "======================\n\n";

    file_put_contents($errorLogFile, $logContent, FILE_APPEND);
    error_log("[EXPORT ERROR] Vedi dettagli in: $errorLogFile");

    sendSSE('error', [
        'message' => $e->getMessage() . ' | Vedi log: admin/data/export-error.log (File: ' . basename($e->getFile()) . ':' . $e->getLine() . ')'
    ]);
} catch (Error $e) {
    writeLog("FATAL ERROR CAUGHT", [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);

    // Cattura anche errori fatali PHP
    $errorLogFile = DATA_PATH . '/export-error.log';
    $timestamp = date('Y-m-d H:i:s');

    $errorDetails = [
        'timestamp' => $timestamp,
        'type' => 'Fatal Error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ];

    $logContent = "\n=== EXPORT FATAL ERROR [$timestamp] ===\n";
    $logContent .= "Tipo: Fatal Error\n";
    $logContent .= "Messaggio: " . $e->getMessage() . "\n";
    $logContent .= "File: " . $e->getFile() . "\n";
    $logContent .= "Linea: " . $e->getLine() . "\n";
    $logContent .= "Stack Trace:\n" . $e->getTraceAsString() . "\n";
    $logContent .= "======================\n\n";

    file_put_contents($errorLogFile, $logContent, FILE_APPEND);
    error_log("[EXPORT FATAL ERROR] Vedi dettagli in: $errorLogFile");

    sendSSE('error', [
        'message' => 'Errore PHP: ' . $e->getMessage() . ' | Vedi log: admin/data/export-error.log (File: ' . basename($e->getFile()) . ':' . $e->getLine() . ')'
    ]);
}

// Log finale
writeLog("=== EXPORT END ===");
writeLog("Log completo salvato in: admin/data/export-debug.log");
?>
