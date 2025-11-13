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

// ===== ERROR HANDLER GLOBALE =====
// Cattura TUTTI gli errori PHP inclusi timeout e memory limit
$fatalErrorLog = DATA_PATH . '/export-v2-fatal-errors.log';

set_error_handler(function($errno, $errstr, $errfile, $errline) use ($fatalErrorLog) {
    $timestamp = date('Y-m-d H:i:s');
    $errorTypes = [
        E_ERROR => 'ERROR',
        E_WARNING => 'WARNING',
        E_PARSE => 'PARSE',
        E_NOTICE => 'NOTICE',
        E_CORE_ERROR => 'CORE_ERROR',
        E_CORE_WARNING => 'CORE_WARNING',
        E_COMPILE_ERROR => 'COMPILE_ERROR',
        E_COMPILE_WARNING => 'COMPILE_WARNING',
        E_USER_ERROR => 'USER_ERROR',
        E_USER_WARNING => 'USER_WARNING',
        E_USER_NOTICE => 'USER_NOTICE',
        E_STRICT => 'STRICT',
        E_RECOVERABLE_ERROR => 'RECOVERABLE_ERROR',
        E_DEPRECATED => 'DEPRECATED',
        E_USER_DEPRECATED => 'USER_DEPRECATED'
    ];

    $errorType = $errorTypes[$errno] ?? 'UNKNOWN';
    $logEntry = "[$timestamp] PHP $errorType: $errstr in $errfile:$errline\n";
    file_put_contents($fatalErrorLog, $logEntry, FILE_APPEND);

    // Invia SSE se possibile
    echo "event: error\n";
    echo 'data: {"message":"PHP Error: ' . addslashes($errstr) . ' in ' . basename($errfile) . ':' . $errline . '"}' . "\n\n";
    flush();

    return true; // Non bloccare l'esecuzione
});

// Cattura errori FATALI (timeout, memory limit, etc.)
register_shutdown_function(function() use ($fatalErrorLog) {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE, E_RECOVERABLE_ERROR])) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] FATAL ERROR: {$error['message']} in {$error['file']}:{$error['line']}\n";
        file_put_contents($fatalErrorLog, $logEntry, FILE_APPEND);

        // Prova a inviare SSE (potrebbe non arrivare se il buffer è pieno)
        echo "event: error\n";
        echo 'data: {"message":"FATAL: ' . addslashes($error['message']) . ' in ' . basename($error['file']) . ':' . $error['line'] . '"}' . "\n\n";
        flush();
    }
});
// ===== FINE ERROR HANDLER =====

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
        $abortReason = connection_status();
        $reasons = [
            0 => 'CONNECTION_NORMAL',
            1 => 'CONNECTION_ABORTED (client disconnected)',
            2 => 'CONNECTION_TIMEOUT (script timeout)',
            3 => 'CONNECTION_ABORTED + CONNECTION_TIMEOUT'
        ];
        writeLog("Connection aborted", [
            'status' => $abortReason,
            'reason' => $reasons[$abortReason] ?? 'UNKNOWN',
            'event' => $event,
            'last_data' => json_encode($data)
        ]);
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

    try {
        echo "event: $event\n";
        echo "data: " . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";

        if (ob_get_level()) {
            @ob_flush();
        }
        @flush();
        usleep(1000);
    } catch (Exception $e) {
        writeLog("ERROR sending SSE", [
            'exception' => $e->getMessage(),
            'event' => $event
        ]);
    }
}

// Keep-alive function
function sendKeepAlive() {
    static $keepAliveCount = 0;
    $keepAliveCount++;

    echo ": keep-alive #$keepAliveCount at " . date('H:i:s') . "\n\n";
    if (ob_get_level()) {
        @ob_flush();
    }
    @flush();

    // Log anche su file per debug
    writeLog("Keep-alive sent", ['count' => $keepAliveCount]);
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

// Load existing chunks and extract source codes
function loadExistingChunks() {
    $pattern = DATA_PATH . '/export-v2-chunk-*.json';
    $files = glob($pattern);
    sort($files); // Ordina per numero chunk

    $products = [];
    $sourceCodes = [];

    foreach ($files as $file) {
        $chunkData = json_decode(file_get_contents($file), true);
        if ($chunkData && is_array($chunkData)) {
            foreach ($chunkData as $product) {
                $products[] = $product;

                // Estrai source codes per tracking resume
                if (isset($product['_source_codes']) && is_array($product['_source_codes'])) {
                    $sourceCodes = array_merge($sourceCodes, $product['_source_codes']);
                }
            }
        }
    }

    // Rimuovi duplicati dai source codes
    $sourceCodes = array_unique($sourceCodes);

    writeLog("Existing chunks loaded", [
        'chunks' => count($files),
        'products' => count($products),
        'source_codes' => count($sourceCodes)
    ]);

    return [
        'products' => $products,
        'source_codes' => $sourceCodes
    ];
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

    // Allow disabling translations (but save original state for metadata translation)
    $skipTranslations = isset($_GET['skip_translations']) && $_GET['skip_translations'] == '1';
    if ($skipTranslations) {
        $translationSettings['enabled'] = false;
        writeLog("Translations DISABLED via parameter (products only - metadata will be translated later)");
    }

    // Get product limit
    $productLimit = isset($_GET['limit']) && $_GET['limit'] ? intval($_GET['limit']) : null;
    writeLog("Product limit", $productLimit ?? 'ALL');

    // Load or create state
    $state = loadState();
    $isResume = false;

    // Variabili per tenere i prodotti già completati e i codici sorgente (da chunk esistenti)
    $preloadedProducts = [];
    $excludeCodes = [];

    if ($state && $state['status'] === 'in_progress') {
        // Resume export - usa il limite salvato nello stato
        $isResume = true;
        if (isset($state['product_limit'])) {
            $productLimit = $state['product_limit'];
            writeLog("Using saved product limit from state", $productLimit);
        }

        // Carica i chunk già salvati ed estrai source codes
        sendSSE('progress', [
            'phase' => 'resume',
            'message' => 'Caricamento chunk già completati...',
            'current' => 0,
            'total' => 0,
            'percent' => 0
        ]);

        $chunkData = loadExistingChunks();
        $preloadedProducts = $chunkData['products'];
        $excludeCodes = $chunkData['source_codes'];
        $preloadedCount = count($preloadedProducts);

        writeLog("RESUMING export from chunk " . $state['current_chunk'], [
            'preloaded_products' => $preloadedCount,
            'exclude_codes' => count($excludeCodes),
            'state_completed' => $state['completed_products']
        ]);

        sendSSE('progress', [
            'phase' => 'resume',
            'message' => "Ripresa export: {$preloadedCount} prodotti già completati, escludo " . count($excludeCodes) . " codici dal DB...",
            'current' => $preloadedCount,
            'total' => $state['total_products'],
            'percent' => round(($preloadedCount / max($state['total_products'], 1)) * 100)
        ]);
    } else {
        // New export - delete old chunks
        deleteOldChunks();

        // Delete temporary JSON file if exists from previous interrupted export
        $tempJsonPath = PUBLIC_JSON_PATH . '.tmp';
        if (file_exists($tempJsonPath)) {
            unlink($tempJsonPath);
            writeLog("Old temporary JSON file deleted", ['path' => $tempJsonPath]);
        }

        $state = [
            'status' => 'in_progress',
            'started_at' => time(),
            'total_products' => 0,
            'completed_products' => 0,
            'current_chunk' => 1,
            'chunk_size' => 25,  // Ridotto a 25 per salvare più frequentemente
            'product_limit' => $productLimit  // Salva il limite nello stato
        ];
        saveState($state);
        writeLog("NEW export started", ['limit' => $productLimit ?? 'ALL']);
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
                writeLog("Total products set", ['total' => $total]);
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

            writeLog("Product completed", [
                'index' => $completedProducts,
                'code' => $data['product']['codice'] ?? 'unknown',
                'chunk_count' => count($currentChunkProducts)
            ]);

            // Save chunk every chunkSize products
            if (count($currentChunkProducts) >= $chunkSize) {
                writeLog("Saving chunk...", [
                    'chunk' => $currentChunkNumber,
                    'products' => count($currentChunkProducts)
                ]);

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

                writeLog("Chunk saved successfully", [
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

    // Passa i codici da escludere al fetch del database (resume ottimizzato)
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
        10,
        0,  // skipCount (deprecated, non usato più)
        $excludeCodes  // Escludi codici già processati dal database
    );

    writeLog("Products processing completed", [
        'count' => $jsonData['total'],
        'excluded_codes' => count($excludeCodes)
    ]);

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

    // Se è un resume, unisci prodotti precaricati con i nuovi
    if ($isResume && count($preloadedProducts) > 0) {
        sendSSE('progress', [
            'phase' => 'merging',
            'message' => 'Unione prodotti precaricati con nuovi...',
            'current' => 0,
            'total' => 1,
            'percent' => 90
        ]);

        writeLog("Merging preloaded products with new ones", [
            'preloaded' => count($preloadedProducts),
            'new' => count($jsonData['products'])
        ]);

        // Unisci i prodotti: precaricati + nuovi
        $jsonData['products'] = array_merge($preloadedProducts, $jsonData['products']);
        $jsonData['total'] = count($jsonData['products']);

        writeLog("Products merged", ['total' => $jsonData['total']]);
    }

    // FIX: Assicura struttura multilingua (converte stringhe in oggetti)
    sendSSE('progress', [
        'phase' => 'fixing',
        'message' => 'Normalizzazione struttura multilingua...',
        'current' => 0,
        'total' => 1,
        'percent' => 93
    ]);

    $languages = $translationSettings['languages'] ?? ['it', 'en', 'de', 'fr', 'es', 'pt', 'hr', 'sl', 'el'];

    // Fix struttura usando array_map per evitare problemi di riferimento
    $jsonData['prodotti'] = array_map(function($product) use ($languages) {
        // Fix nome
        if (isset($product['nome']) && is_string($product['nome'])) {
            $originalName = $product['nome'];
            $product['nome'] = ['it' => $originalName];
            foreach ($languages as $lang) {
                if ($lang !== 'it' && !isset($product['nome'][$lang])) {
                    $product['nome'][$lang] = '';
                }
            }
        }

        // Fix descrizione
        if (isset($product['descrizione']) && is_string($product['descrizione'])) {
            $originalDesc = $product['descrizione'];
            $product['descrizione'] = ['it' => $originalDesc];
            foreach ($languages as $lang) {
                if ($lang !== 'it' && !isset($product['descrizione'][$lang])) {
                    $product['descrizione'][$lang] = '';
                }
            }
        }

        return $product;
    }, $jsonData['prodotti']);

    writeLog("Multilingual structure normalized", ['products_count' => count($jsonData['prodotti'])]);

    // TRANSLATE METADATA if skip_translations was enabled (fast export)
    if ($skipTranslations && !empty($translationSettings['api_key'])) {
        sendSSE('progress', [
            'phase' => 'translating_metadata',
            'message' => 'Traduzione metadati (categorie e filtri)...',
            'current' => 0,
            'total' => 1,
            'percent' => 94
        ]);

        writeLog("Translating metadata (categories and filters)");

        $apiKey = $translationSettings['api_key'];
        $targetLanguages = $translationSettings['languages'] ?? ['en', 'de', 'fr', 'es', 'pt', 'hr', 'sl', 'el'];

        // Translate categories
        if (!empty($jsonData['_meta']['categories'])) {
            foreach ($jsonData['_meta']['categories'] as &$category) {
                $categoryName = $category['field'] ?? $category['label'] ?? '';

                if ($categoryName && (!isset($category['translations']) || count($category['translations']) <= 1)) {
                    $category['translations'] = $category['translations'] ?? [];

                    if (!isset($category['translations']['it'])) {
                        $category['translations']['it'] = $categoryName;
                    }

                    foreach ($targetLanguages as $lang) {
                        if ($lang === 'it') continue;

                        if (empty($category['translations'][$lang])) {
                            $category['translations'][$lang] = translateText($categoryName, $lang, $apiKey);
                            usleep(100000); // 100ms pause
                        }
                    }
                }
            }
            unset($category);
        }

        // Translate filters
        if (!empty($jsonData['_meta']['filters'])) {
            foreach ($jsonData['_meta']['filters'] as &$filter) {
                $filterName = $filter['field'] ?? $filter['label'] ?? '';

                // Skip range filters
                if ($filter['type'] === 'range') continue;

                // Translate filter options
                if (!empty($filter['options']) && is_array($filter['options'])) {
                    foreach ($filter['options'] as &$option) {
                        // Translate label
                        if (!is_array($option['label'])) {
                            $option['label'] = ['it' => $filterName];
                        }

                        foreach ($targetLanguages as $lang) {
                            if ($lang === 'it') continue;

                            if (empty($option['label'][$lang])) {
                                $option['label'][$lang] = translateText($filterName, $lang, $apiKey);
                                usleep(50000);
                            }
                        }

                        // Translate value (only if it's a multilingual object with strings, not booleans!)
                        if (isset($option['value']) && is_array($option['value'])) {
                            $italianValue = $option['value']['it'] ?? '';

                            if ($italianValue && is_string($italianValue)) {
                                foreach ($targetLanguages as $lang) {
                                    if ($lang === 'it') continue;

                                    if (empty($option['value'][$lang])) {
                                        $option['value'][$lang] = translateText($italianValue, $lang, $apiKey);
                                        usleep(50000);
                                    }
                                }
                            }
                        }
                    }
                    unset($option);
                }
            }
            unset($filter);
        }

        writeLog("Metadata translation completed");
    }

    // Save final JSON
    sendSSE('progress', [
        'phase' => 'saving',
        'message' => 'Salvataggio sicuro in corso (temp -> finale)...',
        'current' => 0,
        'total' => 1,
        'percent' => 95
    ]);

    writeLog("Saving final JSON with atomic write", ['path' => PUBLIC_JSON_PATH]);
    savePublicJSON($jsonData);
    writeLog("Final JSON saved successfully", ['path' => PUBLIC_JSON_PATH]);

    sendSSE('progress', [
        'phase' => 'saving',
        'message' => 'File pubblico aggiornato con successo!',
        'current' => 1,
        'total' => 1,
        'percent' => 100
    ]);

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
            'total_products' => $jsonData['total'],
            'execution_time' => $executionTime,
            'languages' => $jsonData['_meta']['languages'],
            'file_size' => filesize(PUBLIC_JSON_PATH)
        ]
    ]);

    logActivity("Export v2 completato: {$jsonData['total']} prodotti in {$executionTime}s");

    writeLog("=== EXPORT V2 COMPLETED - CLOSING CONNECTION ===");

    // Attendi che il client riceva l'evento 'complete' prima di chiudere
    sleep(2);
    exit(0);

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

    writeLog("=== EXPORT V2 ERROR - CLOSING CONNECTION ===");
    exit(1); // Chiudi connessione dopo errore
}

// Questo non dovrebbe mai essere raggiunto
writeLog("=== EXPORT V2 END (unreachable) ===");
?>
