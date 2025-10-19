<?php
// export-stream-v2.php - Export v2.0 with incremental saves and resume capability

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Disable output buffering
while (ob_get_level()) {
    ob_end_clean();
}

require_once '../config.php';
require_once '../includes/functions.php';

// Prevent errors if headers already sent
if (headers_sent()) {
    die("Headers already sent");
}

// Set headers for SSE
header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');

// Force HTTP/1.1
if (!headers_sent()) {
    header('HTTP/1.1 200 OK');
}

// Test output immediato
echo ": SCRIPT STARTED\n\n";
flush();

// Force immediate output
@ini_set('output_buffering', 'off');
@ini_set('zlib.output_compression', false);
@apache_setenv('no-gzip', 1);
@ini_set('implicit_flush', 1);
ob_implicit_flush(true);

// Increase execution time
@ini_set('max_execution_time', 1800); // 30 minutes

// File paths
$logFile = DATA_PATH . '/export-v2-debug.log';
$stateFile = DATA_PATH . '/export-v2-state.json';
$logStartTime = microtime(true);

// Logging function
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

    // Invia anche in console come commento SSE
    echo ": LOG [{$elapsed}s] {$message}";
    if ($data !== null) {
        echo " | " . json_encode($data, JSON_UNESCAPED_UNICODE);
    }
    echo "\n\n";
    if (ob_get_level()) {
        @ob_flush();
    }
    @flush();
}

// Initialize log
file_put_contents($logFile, "\n=== EXPORT V2 START [" . date('Y-m-d H:i:s') . "] ===\n");
writeLog("Export stream v2 iniziato");

// Send SSE event
function sendSSE($event, $data) {
    if (connection_aborted()) {
        writeLog("Connection aborted by client");
        exit;
    }

    // Auto keep-alive
    if (isset($GLOBALS['lastKeepAliveTime'])) {
        $now = time();
        if (($now - $GLOBALS['lastKeepAliveTime']) >= 10) {
            sendKeepAlive();
            $GLOBALS['lastKeepAliveTime'] = $now;
        }
    }

    echo "event: $event\n";
    echo "data: " . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";

    if (ob_get_level()) {
        @ob_flush();
    }
    @flush();
    usleep(1000);
}

// Keep-alive function
function sendKeepAlive() {
    echo ": keep-alive\n\n";
    if (ob_get_level()) {
        @ob_flush();
    }
    @flush();
}

// Setup keep-alive
$GLOBALS['keepAliveCallback'] = 'sendKeepAlive';
$GLOBALS['lastKeepAliveTime'] = time();

// Load or initialize state
function loadState() {
    global $stateFile;
    if (file_exists($stateFile)) {
        $state = json_decode(file_get_contents($stateFile), true);
        writeLog("State loaded", $state);
        return $state;
    }
    return null;
}

// Save state
function saveState($state) {
    global $stateFile;
    file_put_contents($stateFile, json_encode($state, JSON_PRETTY_PRINT));
    writeLog("State saved", $state);
}

// Save chunk
function saveChunk($chunkNumber, $products) {
    $chunkFile = DATA_PATH . '/export-v2-chunk-' . str_pad($chunkNumber, 3, '0', STR_PAD_LEFT) . '.json';
    file_put_contents($chunkFile, json_encode($products, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    writeLog("Chunk saved", ['chunk' => $chunkNumber, 'file' => basename($chunkFile), 'products' => count($products)]);
    return $chunkFile;
}

// Delete old chunks
function deleteOldChunks() {
    $pattern = DATA_PATH . '/export-v2-chunk-*.json';
    $files = glob($pattern);
    foreach ($files as $file) {
        unlink($file);
    }
    writeLog("Old chunks deleted", ['count' => count($files)]);
}

try {
    writeLog("Loading configurations...");

    // Load configs
    $dbConfig = loadDBConfig();
    $mappingConfig = loadMappingConfig();
    $translationSettings = loadTranslationSettings();
    $filterConfig = loadFilterConfig();
    $imageSettings = loadImageSettings();
    $variantConfig = loadVariantConfig();
    $ecommerceConfig = loadEcommerceConfig();
    $resourceConfig = loadResourceConfig();

    if (!$dbConfig || !$mappingConfig) {
        writeLog("ERROR: Missing configuration");
        sendSSE('error', ['message' => 'Configurazione mancante']);
        exit;
    }

    // Allow disabling translations
    if (isset($_GET['skip_translations']) && $_GET['skip_translations'] == '1') {
        $translationSettings['enabled'] = false;
        writeLog("Translations DISABLED via parameter");
    }

    // Get product limit
    $productLimit = isset($_GET['limit']) && $_GET['limit'] ? intval($_GET['limit']) : null;
    writeLog("Product limit", $productLimit ?? 'ALL');

    // Load or create state
    $state = loadState();
    $isResume = false;

    if ($state && $state['status'] === 'in_progress') {
        // Resume export
        $isResume = true;
        writeLog("RESUMING export from chunk " . $state['current_chunk']);
        sendSSE('progress', [
            'phase' => 'resume',
            'message' => 'Ripresa export dal chunk ' . $state['current_chunk'] . '...',
            'current' => $state['completed_products'],
            'total' => $state['total_products'],
            'percent' => round(($state['completed_products'] / max($state['total_products'], 1)) * 100)
        ]);
    } else {
        // New export - delete old chunks
        deleteOldChunks();

        $state = [
            'status' => 'in_progress',
            'started_at' => time(),
            'total_products' => 0,
            'completed_products' => 0,
            'current_chunk' => 1,
            'chunk_size' => 50
        ];
        saveState($state);
        writeLog("NEW export started");
    }

    $startTime = microtime(true);
    $chunkSize = $state['chunk_size'];

    // Verify tables
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
            }
        }

        if ($hasErrors) {
            $errorMsg = "Errore verifica database:\n" . implode("\n", $errorMessages);
            writeLog("ERROR: Database verification failed");
            sendSSE('error', ['message' => $errorMsg]);
            exit;
        }

        if (!empty($errorMessages)) {
            $warningMsg = implode("\n", $errorMessages);
            sendSSE('warning', ['message' => $warningMsg]);
        }

    } catch (Exception $e) {
        writeLog("ERROR: Table verification exception", ['error' => $e->getMessage()]);
        sendSSE('error', ['message' => 'Errore verifica database: ' . $e->getMessage()]);
        exit;
    }

    // Define callback for progress updates
    $currentChunkNumber = $state['current_chunk'];
    $currentChunkProducts = [];
    $completedProducts = $isResume ? $state['completed_products'] : 0;
    $totalProductsCount = 0;

    $progressCallback = function($current, $total, $data) use (&$currentChunkNumber, &$currentChunkProducts, &$completedProducts, &$totalProductsCount, $chunkSize, &$state) {
        // Update total if we have it
        if ($total > 0 && $totalProductsCount === 0) {
            $totalProductsCount = $total;
            if (!$state['total_products']) {
                $state['total_products'] = $total;
                saveState($state);
            }
        }

        // Send progress SSE
        sendSSE('progress', [
            'phase' => $data['phase'] ?? 'loading',
            'message' => $data['message'] ?? 'Elaborazione...',
            'current' => $current,
            'total' => $total,
            'percent' => $data['percent'] ?? round(($current / max($total, 1)) * 100),
            'product' => $data['product'] ?? null,
            'language' => $data['language'] ?? null
        ]);

        // If we have a completed product, add to chunk
        if (isset($data['product']) && $data['phase'] === 'complete') {
            $currentChunkProducts[] = $data['product'];
            $completedProducts++;

            // Save chunk every chunkSize products
            if (count($currentChunkProducts) >= $chunkSize) {
                saveChunk($currentChunkNumber, $currentChunkProducts);

                // Update state
                $state['completed_products'] = $completedProducts;
                $state['current_chunk'] = $currentChunkNumber + 1;
                saveState($state);

                // Send chunk saved event
                sendSSE('chunk_saved', [
                    'chunk_number' => $currentChunkNumber,
                    'products_in_chunk' => count($currentChunkProducts),
                    'total_completed' => $completedProducts
                ]);

                writeLog("Chunk completed", [
                    'chunk' => $currentChunkNumber,
                    'products' => count($currentChunkProducts),
                    'total_completed' => $completedProducts
                ]);

                // Reset for next chunk
                $currentChunkNumber++;
                $currentChunkProducts = [];
            }
        }
    };

    // Use the same chunked processing as v1 WITH callback
    sendSSE('progress', [
        'phase' => 'loading',
        'message' => 'Avvio elaborazione prodotti con salvataggio incrementale...',
        'current' => 0,
        'total' => 0,
        'percent' => 0
    ]);

    writeLog("Starting chunked processing with callback");

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
        10
    );

    writeLog("Products processing completed", ['count' => $jsonData['total']]);

    // Save any remaining products in last chunk
    if (count($currentChunkProducts) > 0) {
        saveChunk($currentChunkNumber, $currentChunkProducts);

        $state['completed_products'] = $jsonData['total'];
        $state['current_chunk'] = $currentChunkNumber + 1;
        saveState($state);

        sendSSE('chunk_saved', [
            'chunk_number' => $currentChunkNumber,
            'products_in_chunk' => count($currentChunkProducts),
            'total_completed' => $jsonData['total']
        ]);

        writeLog("Final chunk saved", [
            'chunk' => $currentChunkNumber,
            'products' => count($currentChunkProducts)
        ]);
    }

    // Products are already in $jsonData from generateProductsJSONChunkedWithCallback
    // No need to merge chunks, just save the final JSON

    // Save final JSON
    sendSSE('progress', [
        'phase' => 'saving',
        'message' => 'Salvataggio JSON finale...',
        'current' => 0,
        'total' => 1,
        'percent' => 0
    ]);

    savePublicJSON($jsonData);
    writeLog("Final JSON saved", ['path' => PUBLIC_JSON_PATH]);

    // Keep chunks as backup (not deleting them)

    // Update state to completed
    $state['status'] = 'completed';
    $state['completed_at'] = time();
    saveState($state);

    $endTime = microtime(true);
    $executionTime = round($endTime - $startTime, 2);
    writeLog("Export v2 completed", [
        'execution_time' => $executionTime . 's',
        'memory_used' => memory_get_peak_usage(true) / 1024 / 1024 . ' MB'
    ]);

    // Send completion
    sendSSE('complete', [
        'message' => "Export v2.0 completato con successo!",
        'stats' => [
            'total_products' => $totalProducts,
            'execution_time' => $executionTime,
            'languages' => $jsonData['_meta']['languages'],
            'file_size' => filesize(PUBLIC_JSON_PATH)
        ]
    ]);

    logActivity("Export v2 completato: {$totalProducts} prodotti in {$executionTime}s");

} catch (Exception $e) {
    writeLog("EXCEPTION CAUGHT", [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);

    $errorLogFile = DATA_PATH . '/export-v2-error.log';
    $timestamp = date('Y-m-d H:i:s');

    $logContent = "\n=== EXPORT V2 ERROR [$timestamp] ===\n";
    $logContent .= "Tipo: Exception\n";
    $logContent .= "Messaggio: " . $e->getMessage() . "\n";
    $logContent .= "File: " . $e->getFile() . "\n";
    $logContent .= "Linea: " . $e->getLine() . "\n";
    $logContent .= "Stack Trace:\n" . $e->getTraceAsString() . "\n";
    $logContent .= "======================\n\n";

    file_put_contents($errorLogFile, $logContent, FILE_APPEND);

    sendSSE('error', [
        'message' => $e->getMessage() . ' | Vedi log: admin/data/export-v2-error.log'
    ]);
}

writeLog("=== EXPORT V2 END ===");
?>
