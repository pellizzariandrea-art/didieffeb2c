<?php
require_once '../config.php';
require_once '../includes/functions.php';

// Increase timeouts to prevent 502/504 errors
set_time_limit(300); // 5 minutes
ini_set('max_execution_time', 300);
ini_set('default_socket_timeout', 300);

header('Content-Type: application/json; charset=utf-8');

$action = $_POST['action'] ?? $_GET['action'] ?? 'status';
$stateFile = DATA_PATH . '/translation-state.json';
$productsFile = PUBLIC_JSON_PATH;  // File pubblico
$productsBackup = dirname(PUBLIC_JSON_PATH) . '/products.backup.json';
$productsTmp = dirname(PUBLIC_JSON_PATH) . '/products.translating.json';
$logFile = DATA_PATH . '/translation-process.log';

// Logging function
function logDebug($message, $data = null) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logLine = "[$timestamp] $message";
    if ($data !== null) {
        $logLine .= " | " . json_encode($data, JSON_UNESCAPED_UNICODE);
    }
    $logLine .= "\n";
    file_put_contents($logFile, $logLine, FILE_APPEND);
}

logDebug("=== TRANSLATE PROCESS START ===", ['action' => $action, 'GET' => $_GET]);
logDebug("*** FILE VERSION: 3.6 - NO LOOP INFINITI! Quick skip + 1 loadState per batch ***");

// Load or initialize state
function loadState() {
    global $stateFile;
    if (file_exists($stateFile)) {
        return json_decode(file_get_contents($stateFile), true);
    }
    return null;
}

function saveState($state) {
    global $stateFile;
    file_put_contents($stateFile, json_encode($state, JSON_PRETTY_PRINT));
}

function logMessage($message, $type = 'info') {
    global $state;
    if (!isset($state['log'])) {
        $state['log'] = [];
    }
    $state['log'][] = [
        'timestamp' => time(),
        'message' => $message,
        'type' => $type
    ];
    // Keep only last 50 log entries
    if (count($state['log']) > 50) {
        $state['log'] = array_slice($state['log'], -50);
    }
}

// ACTION: Start translation process
if ($action === 'start') {
    logDebug("ACTION: start", ['force' => $_GET['force'] ?? 'no']);

    $force = isset($_GET['force']) && $_GET['force'] == '1';

    logDebug("Checking products file", ['path' => $productsFile, 'exists' => file_exists($productsFile)]);

    // Check if products.json exists
    if (!file_exists($productsFile)) {
        logDebug("ERROR: products.json not found", ['path' => $productsFile]);
        echo json_encode([
            'success' => false,
            'error' => 'File products.json non trovato. Esegui prima un export.'
        ]);
        exit;
    }

    // Load products
    logDebug("Loading products JSON");
    $jsonData = json_decode(file_get_contents($productsFile), true);
    logDebug("JSON loaded", ['has_prodotti_key' => isset($jsonData['prodotti']), 'keys' => array_keys($jsonData)]);

    if (!$jsonData || !isset($jsonData['prodotti']) || !is_array($jsonData['prodotti'])) {
        logDebug("ERROR: Invalid products.json structure");
        echo json_encode([
            'success' => false,
            'error' => 'File products.json non valido o struttura errata.'
        ]);
        exit;
    }

    $products = $jsonData['prodotti'];
    logDebug("Products extracted", ['count' => count($products)]);

    // Create backup
    logDebug("Creating backup", ['from' => $productsFile, 'to' => $productsBackup]);
    copy($productsFile, $productsBackup);
    logDebug("Backup created");

    // Se esiste products-translating.json E non è force retranslate, usalo
    // per continuare da dove si era interrotto (preserva traduzioni già fatte)
    if (!$force && file_exists($productsTmp)) {
        logDebug("Found existing translating file, loading it to preserve translations", ['file' => $productsTmp]);
        $tmpData = json_decode(file_get_contents($productsTmp), true);
        if ($tmpData && isset($tmpData['prodotti'])) {
            $jsonData = $tmpData;
            $products = $jsonData['prodotti'];
            logDebug("Loaded translating file instead of public file", ['count' => count($products)]);
        }
    } else if ($force && file_exists($productsTmp)) {
        // Solo se force = true, cancella il file temporaneo
        unlink($productsTmp);
        logDebug("Force retranslate: old translating file deleted", ['file' => $productsTmp]);
    }

    // Initialize state - NEW: Language-by-language approach
    $translationSettings = loadTranslationSettings();
    $allLanguages = array_filter($translationSettings['languages'], function($lang) {
        return $lang !== 'it'; // Exclude Italian (source language)
    });

    $state = [
        'status' => 'running',
        'started_at' => time(),
        'total_products' => count($products),
        'completed_products' => 0,
        'api_calls' => 0,
        'current_language_index' => 0,
        'current_language' => reset($allLanguages),
        'languages' => array_values($allLanguages),
        'total_languages' => count($allLanguages),
        'current_product_index' => 0,
        'current_product' => null,
        'error' => null,
        'force_retranslate' => $force,
        'log' => []
    ];

    logDebug("Saving initial state", $state);
    saveState($state);
    logDebug("State saved to", ['file' => $stateFile]);

    $response = [
        'success' => true,
        'total_products' => count($products),
        'force_retranslate' => $force
    ];
    logDebug("Sending success response", $response);
    echo json_encode($response);
    exit;
}

// ACTION: Stop translation process
if ($action === 'stop') {
    logDebug("ACTION: stop");

    $state = loadState();
    if ($state) {
        $state['status'] = 'stopped';
        saveState($state);
        logDebug("Translation stopped by user");

        echo json_encode([
            'success' => true,
            'message' => 'Translation stopped'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'No active translation process'
        ]);
    }
    exit;
}

// ACTION: Get status and process translations
if ($action === 'status') {
    logDebug("ACTION: status");
    $state = loadState();

    if (!$state) {
        logDebug("No state found - process is idle");
        echo json_encode([
            'status' => 'idle',
            'message' => 'Nessun processo di traduzione in corso'
        ]);
        exit;
    }

    logDebug("State loaded", ['status' => $state['status'], 'completed' => $state['completed_products'], 'total' => $state['total_products']]);

    // If stopped, return stopped status immediately (don't process anything)
    if ($state['status'] === 'stopped') {
        logDebug("Status is stopped, returning immediately");

        $totalWork = ($state['total_products'] ?? 0) * ($state['total_languages'] ?? 1);
        $completedLanguages = $state['current_language_index'] ?? 0;
        $currentLangProgress = $state['current_product_index'] ?? 0;
        $completedWork = ($completedLanguages * ($state['total_products'] ?? 0)) + $currentLangProgress;

        echo json_encode([
            'status' => 'stopped',
            'completed' => $completedWork,
            'total' => $totalWork,
            'percent' => $totalWork > 0 ? round(($completedWork / $totalWork) * 100) : 0,
            'api_calls' => $state['api_calls'] ?? 0,
            'current_language' => strtoupper($state['current_language'] ?? ''),
            'message' => 'Traduzione fermata dall\'utente'
        ]);
        exit;
    }

    // If already completed, return current state
    if ($state['status'] === 'completed') {
        $totalWork = ($state['total_products'] ?? 0) * ($state['total_languages'] ?? 1);
        echo json_encode([
            'status' => $state['status'],
            'completed' => $totalWork,
            'total' => $totalWork,
            'percent' => 100,
            'api_calls' => $state['api_calls'] ?? 0,
            'stats' => [
                'total_products' => $state['total_products'] ?? 0,
                'total_languages' => $state['total_languages'] ?? 0,
                'api_calls' => $state['api_calls'] ?? 0,
                'execution_time' => time() - ($state['started_at'] ?? time())
            ]
        ]);
        exit;
    }

    // Load products - use temporary file if exists, otherwise original
    // CRITICAL FIX: Load from temporary file to preserve translations between polling cycles
    $fileToLoad = file_exists($productsTmp) ? $productsTmp : $productsFile;
    logDebug("Loading products for processing", ['file' => $fileToLoad, 'exists' => file_exists($fileToLoad)]);

    $jsonData = json_decode(file_get_contents($fileToLoad), true);
    if (!$jsonData || !isset($jsonData['prodotti']) || !is_array($jsonData['prodotti'])) {
        logDebug("ERROR: Invalid products.json during processing");
        $state['status'] = 'error';
        $state['error'] = 'File products.json non valido';
        saveState($state);

        echo json_encode([
            'status' => 'error',
            'error' => 'File products.json non valido',
            'details' => 'Impossibile leggere il file JSON o struttura errata'
        ]);
        exit;
    }

    $products = $jsonData['prodotti'];
    logDebug("Products loaded for processing", ['count' => count($products), 'source' => basename($fileToLoad)]);

    // Load translation settings
    $translationSettings = loadTranslationSettings();
    if (empty($translationSettings['api_key'])) {
        $state['status'] = 'error';
        $state['error'] = 'API Key non configurata';
        saveState($state);

        echo json_encode([
            'status' => 'error',
            'error' => 'API Key non configurata',
            'details' => 'Configura la chiave API nelle impostazioni'
        ]);
        exit;
    }

    $languages = $translationSettings['languages'];
    $apiKey = $translationSettings['api_key'];

    // NEW v3.0: LANGUAGE-BY-LANGUAGE approach
    // Process 10 products per request (10x increase from v2.6!)
    // Each product only translated to ONE language = same API calls but better batching
    $batchSize = 10;

    // Get current language we're translating to
    $currentLang = $state['current_language'];
    $langIndex = $state['current_language_index'];

    $startIndex = $state['current_product_index'];
    $endIndex = min($startIndex + $batchSize, $state['total_products']);

    // Generous timeout since we only translate ONE language per product
    // With cache: instant, with API: ~50ms per translation
    // 10 products * 1 language * ~50ms = ~500ms theoretical (plenty of margin)
    $startTime = microtime(true);
    $maxExecutionTime = 45; // seconds - Very safe for single-language batches

    $newLogEntries = [];

    // Batch statistics
    $batchStats = [
        'products_scanned' => 0,        // Prodotti nel batch
        'products_skipped' => 0,        // Già tradotti, skippati
        'products_processed' => 0,      // Effettivamente tradotti
        'translations_done' => 0,       // Numero traduzioni fatte
        'cache_hits' => 0,
        'api_calls' => 0,
        'errors' => 0
    ];

    logDebug("Processing batch", [
        'current_language' => $currentLang,
        'language_index' => $langIndex,
        'total_languages' => $state['total_languages'],
        'product_range' => "$startIndex-$endIndex",
        'batch_size' => $batchSize
    ]);

    try {
        // CRITICAL: Check if process was stopped BEFORE starting batch (UNA SOLA VOLTA)
        $currentState = loadState();
        if ($currentState && $currentState['status'] === 'stopped') {
            logDebug("Process stopped before batch, exiting immediately");

            echo json_encode([
                'status' => 'stopped',
                'message' => 'Processo interrotto dall\'utente'
            ]);
            exit;
        }

        // Add language progress message at start of batch
        $langName = strtoupper($currentLang);
        if ($startIndex === 0) {
            $newLogEntries[] = [
                'message' => "🚀 Inizio traduzione in {$langName} - {$state['total_products']} prodotti",
                'type' => 'info'
            ];
        }

        // NEW: Quick check - se primi 5 prodotti tutti già tradotti, probabilmente tutta la lingua è completa
        // Skip intero batch per evitare loop inutili
        $quickCheckLimit = min(5, $endIndex - $startIndex);
        $allSkipped = true;
        for ($check = $startIndex; $check < $startIndex + $quickCheckLimit; $check++) {
            if (isset($products[$check]) && empty($products[$check]['nome'][$currentLang])) {
                $allSkipped = false;
                break;
            }
        }

        if ($allSkipped && !$state['force_retranslate']) {
            // Probabilmente tutta la lingua già tradotta, skippa veloce
            $batchStats['products_scanned'] = $endIndex - $startIndex;
            $batchStats['products_skipped'] = $endIndex - $startIndex;

            logDebug("Batch likely all translated, skipping fast", [
                'start' => $startIndex,
                'end' => $endIndex
            ]);

            // Avanza indice e continua
            $state['current_product_index'] = $endIndex;

            $newLogEntries[] = [
                'message' => "⏭️ Batch {$startIndex}-{$endIndex}: Tutti già tradotti in " . strtoupper($currentLang) . " (skip veloce)",
                'type' => 'info'
            ];

            // Salva stato e ritorna SUBITO (non processa loop)
            $state['log'] = array_merge($state['log'] ?? [], $newLogEntries);
            saveState($state);

            // Calcola progresso e ritorna
            $totalWork = $state['total_products'] * $state['total_languages'];
            $completedWork = ($state['current_language_index'] * $state['total_products']) + $state['current_product_index'];
            $percent = $totalWork > 0 ? round(($completedWork / $totalWork) * 100) : 0;

            echo json_encode([
                'status' => 'running',
                'completed' => $completedWork,
                'total' => $totalWork,
                'percent' => $percent,
                'current_language' => strtoupper($currentLang),
                'log' => $newLogEntries
            ]);
            exit;
        }

        for ($i = $startIndex; $i < $endIndex; $i++) {

            // Check if we're approaching timeout (unlikely with single language)
            $elapsed = microtime(true) - $startTime;
            if ($elapsed > $maxExecutionTime) {
                logDebug("Timeout protection triggered", ['elapsed' => $elapsed]);
                $newLogEntries[] = [
                    'message' => "⏱️ Timeout preventivo raggiunto, continuo nel prossimo ciclo",
                    'type' => 'warning'
                ];
                break; // Exit loop and return to client
            }

            $product = $products[$i];
            $productCode = $product['codice'] ?? 'N/A';
            $productName = $product['nome']['it'] ?? $product['nome'] ?? 'N/A';

            // Count products scanned
            $batchStats['products_scanned']++;

            // Update current product
            $state['current_product'] = [
                'codice' => $productCode,
                'nome' => is_array($productName) ? ($productName['it'] ?? 'N/A') : $productName,
                'language' => strtoupper($currentLang)
            ];

            // NEW v3.0: Check if THIS language needs translation for this product
            $needsTranslation = false;
            $skipReason = '';

            // Check nome
            if ($state['force_retranslate']) {
                $needsTranslation = true;
                $skipReason = 'force_retranslate';
            } else if (empty($products[$i]['nome'][$currentLang])) {
                $needsTranslation = true;
                $skipReason = 'nome_missing';
            } else {
                $skipReason = 'already_translated';
            }

            // Check descrizione if present
            if (!$needsTranslation && isset($product['descrizione']) && isset($product['descrizione']['it']) &&
                !empty($product['descrizione']['it']) && empty($products[$i]['descrizione'][$currentLang])) {
                $needsTranslation = true;
                $skipReason = 'descrizione_missing';
            }

            logDebug("Translation check", [
                'product' => $productCode,
                'language' => $currentLang,
                'needs_translation' => $needsTranslation,
                'reason' => $skipReason,
                'has_nome' => !empty($products[$i]['nome'][$currentLang]),
                'force' => $state['force_retranslate']
            ]);

            if (!$needsTranslation) {
                // Already translated in this language - skip
                $batchStats['products_skipped']++;
                continue;
            }

            // Translate product to CURRENT LANGUAGE ONLY
            $translatedCount = 0;
            $errorCount = 0;
            $cacheHits = 0;

            // Translate nome
            try {
                if (!empty($product['nome']['it'])) {
                    $cached = getTranslationCache($product['nome']['it'], $currentLang);
                    $isFromCache = ($cached !== null);

                    $translation = translateText($product['nome']['it'], $currentLang, $apiKey);

                    if ($isFromCache) {
                        $cacheHits++;
                        $batchStats['cache_hits']++;
                    } else {
                        $state['api_calls']++;
                        $batchStats['api_calls']++;
                    }

                    $products[$i]['nome'][$currentLang] = $translation;
                    $translatedCount++;

                    logDebug("Nome translated", [
                        'product' => $productCode,
                        'lang' => $currentLang,
                        'from_cache' => $isFromCache
                    ]);
                }
            } catch (Exception $e) {
                $errorCount++;
                $batchStats['errors']++;

                // SEMPRE mostra errori nel log utente
                $newLogEntries[] = [
                    'message' => "❌ ERRORE {$productCode} nome: " . substr($e->getMessage(), 0, 80),
                    'type' => 'error'
                ];

                logDebug("Translation ERROR (nome)", [
                    'product' => $productCode,
                    'lang' => $currentLang,
                    'error' => $e->getMessage()
                ]);
            }

            // Translate descrizione
            try {
                if (!empty($product['descrizione']['it'])) {
                    $cached = getTranslationCache($product['descrizione']['it'], $currentLang);
                    $isFromCache = ($cached !== null);

                    $translation = translateText($product['descrizione']['it'], $currentLang, $apiKey);
                    $products[$i]['descrizione'][$currentLang] = $translation;
                    $translatedCount++;

                    if ($isFromCache) {
                        $cacheHits++;
                        $batchStats['cache_hits']++;
                    } else {
                        $batchStats['api_calls']++;
                    }
                }
            } catch (Exception $e) {
                $errorCount++;
                $batchStats['errors']++;

                $newLogEntries[] = [
                    'message' => "❌ ERRORE {$productCode} descrizione: " . substr($e->getMessage(), 0, 60),
                    'type' => 'error'
                ];

                logDebug("Error translating descrizione", ['error' => $e->getMessage()]);
            }

            // Translate attributi
            if (isset($product['attributi']) && is_array($product['attributi'])) {
                foreach ($product['attributi'] as $attrKey => $attrValue) {
                    if (is_array($attrValue) && isset($attrValue['it']) && !empty($attrValue['it'])) {
                        if (!$state['force_retranslate'] && !empty($products[$i]['attributi'][$attrKey][$currentLang])) {
                            continue;
                        }

                        try {
                            $cached = getTranslationCache($attrValue['it'], $currentLang);
                            $isFromCache = ($cached !== null);

                            $translation = translateText($attrValue['it'], $currentLang, $apiKey);
                            $products[$i]['attributi'][$attrKey][$currentLang] = $translation;
                            $translatedCount++;

                            if ($isFromCache) {
                                $cacheHits++;
                                $batchStats['cache_hits']++;
                            } else {
                                $batchStats['api_calls']++;
                            }
                        } catch (Exception $e) {
                            $errorCount++;
                            $batchStats['errors']++;

                            // Log errore attributo (silenzioso nel log utente, solo in debug)
                            logDebug("Error translating attribute", [
                                'product' => $productCode,
                                'attribute' => $attrKey,
                                'error' => $e->getMessage()
                            ]);
                        }
                    }
                }
            }

            // Translate caratteristiche
            if (isset($product['caratteristiche']) && is_array($product['caratteristiche'])) {
                foreach ($product['caratteristiche'] as $charIndex => $char) {
                    if (!empty($char['nome']['it'])) {
                        try {
                            $cached = getTranslationCache($char['nome']['it'], $currentLang);
                            $isFromCache = ($cached !== null);

                            $translation = translateText($char['nome']['it'], $currentLang, $apiKey);
                            $products[$i]['caratteristiche'][$charIndex]['nome'][$currentLang] = $translation;
                            $translatedCount++;

                            if ($isFromCache) {
                                $cacheHits++;
                                $batchStats['cache_hits']++;
                            } else {
                                $batchStats['api_calls']++;
                            }
                        } catch (Exception $e) {
                            $errorCount++;
                            $batchStats['errors']++;
                        }
                    }

                    if (!empty($char['valore']['it'])) {
                        try {
                            $cached = getTranslationCache($char['valore']['it'], $currentLang);
                            $isFromCache = ($cached !== null);

                            $translation = translateText($char['valore']['it'], $currentLang, $apiKey);
                            $products[$i]['caratteristiche'][$charIndex]['valore'][$currentLang] = $translation;
                            $translatedCount++;

                            if ($isFromCache) {
                                $cacheHits++;
                                $batchStats['cache_hits']++;
                            } else {
                                $batchStats['api_calls']++;
                            }
                        } catch (Exception $e) {
                            $errorCount++;
                            $batchStats['errors']++;
                        }
                    }
                }
            }

            if ($translatedCount > 0) {
                $batchStats['products_processed']++;
                $batchStats['translations_done'] += $translatedCount;

                logDebug("Product translated", [
                    'product' => $productCode,
                    'language' => $currentLang,
                    'translations' => $translatedCount,
                    'cache_hits' => $cacheHits,
                    'errors' => $errorCount
                ]);
            }
        }

        // NEW v3.0: Advance product index
        $state['current_product_index'] = $endIndex;

        // Add batch summary to log - NUOVO: Molto più chiaro!
        $cachePercent = $batchStats['translations_done'] > 0 ?
            round(($batchStats['cache_hits'] / $batchStats['translations_done']) * 100) : 0;

        // Build clear message
        if ($batchStats['products_processed'] > 0) {
            // Batch con traduzioni effettive
            $summaryMsg = "✅ Batch {$startIndex}-{$endIndex}: " .
                "Tradotti {$batchStats['products_processed']} prodotti";

            if ($batchStats['products_skipped'] > 0) {
                $summaryMsg .= ", saltati {$batchStats['products_skipped']} (già OK)";
            }

            $summaryMsg .= " → {$batchStats['translations_done']} traduzioni " .
                "(💾 cache {$cachePercent}%, ⚡ {$batchStats['api_calls']} API)";

        } else if ($batchStats['products_skipped'] > 0) {
            // Tutti i prodotti già tradotti
            $summaryMsg = "⏭️ Batch {$startIndex}-{$endIndex}: " .
                "Tutti i {$batchStats['products_skipped']} prodotti già tradotti in " . strtoupper($currentLang);
        } else {
            // Nessun prodotto nel batch (non dovrebbe succedere)
            $summaryMsg = "⚠️ Batch {$startIndex}-{$endIndex}: Nessun prodotto da processare";
        }

        if ($batchStats['errors'] > 0) {
            $summaryMsg .= " ⚠️ {$batchStats['errors']} errori";
        }

        $newLogEntries[] = [
            'message' => $summaryMsg,
            'type' => $batchStats['errors'] > 0 ? 'warning' : ($batchStats['products_processed'] > 0 ? 'success' : 'info')
        ];

        logDebug("Batch completed", [
            'language' => $currentLang,
            'products_processed' => "$startIndex-$endIndex",
            'stats' => $batchStats,
            'next_index' => $endIndex
        ]);

        // Save checkpoint after every batch
        $jsonData['prodotti'] = $products;
        $jsonData['total'] = count($products);
        $jsonContent = json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        file_put_contents($productsTmp, $jsonContent);

        // Flush translation cache
        flushTranslationCache();

        logDebug("Checkpoint saved", [
            'language' => $currentLang,
            'products_index' => $endIndex,
            'file' => basename($productsTmp)
        ]);

        // Check if completed current language
        if ($state['current_product_index'] >= $state['total_products']) {
            // Finished all products for current language!
            $langUpper = strtoupper($currentLang);
            $newLogEntries[] = [
                'message' => "✅ Lingua {$langUpper} completata! Passo alla prossima...",
                'type' => 'success'
            ];

            logDebug("Language completed", [
                'language' => $currentLang,
                'index' => $langIndex,
                'total_languages' => $state['total_languages']
            ]);

            // Move to next language
            $state['current_language_index']++;
            $state['current_product_index'] = 0; // Reset to start for next language

            // Check if we have more languages to process
            if ($state['current_language_index'] >= $state['total_languages']) {
                // ALL LANGUAGES COMPLETED! Final save
                $jsonData['prodotti'] = $products;
                $jsonData['total'] = count($products);
                $jsonContent = json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

                logDebug("Final save - all languages completed", [
                    'file' => $productsFile,
                    'size' => strlen($jsonContent),
                    'products_count' => count($products),
                    'languages_completed' => $state['total_languages']
                ]);

                // Write directly to final file
                $bytesWritten = file_put_contents($productsFile, $jsonContent);

                if ($bytesWritten === false) {
                    throw new Exception('Impossibile scrivere il file products.json');
                }

                logDebug("File written successfully", ['bytes_written' => $bytesWritten]);

                // Verify file
                clearstatcache();
                $verify = json_decode(file_get_contents($productsFile), true);
                if ($verify && isset($verify['prodotti']) && count($verify['prodotti']) === count($products)) {
                    logDebug("Verification OK");

                    // Clean up temp file
                    if (file_exists($productsTmp)) {
                        unlink($productsTmp);
                        logDebug("Temp file removed");
                    }

                    // Final cache flush
                    flushTranslationCache();

                    $state['status'] = 'completed';
                    $state['completed_products'] = $state['total_products']; // Mark all as completed

                    $newLogEntries[] = [
                        'message' => "🎉 Traduzione completata! {$state['total_products']} prodotti in {$state['total_languages']} lingue!",
                        'type' => 'success'
                    ];
                } else {
                    throw new Exception('Verifica file fallita dopo traduzione');
                }
            } else {
                // More languages to process
                $nextLang = $state['languages'][$state['current_language_index']];
                $state['current_language'] = $nextLang;

                $nextLangUpper = strtoupper($nextLang);
                $newLogEntries[] = [
                    'message' => "🔄 Inizio traduzione in {$nextLangUpper}...",
                    'type' => 'info'
                ];

                logDebug("Moving to next language", [
                    'next_language' => $nextLang,
                    'index' => $state['current_language_index'],
                    'remaining' => $state['total_languages'] - $state['current_language_index']
                ]);
            }
        }

        // Add new log entries to state
        $state['log'] = array_merge($state['log'] ?? [], $newLogEntries);
        $state['log'] = array_slice($state['log'], -50); // Keep last 50

        saveState($state);

        // Return status - NEW v3.0: Progress calculation based on language-by-language approach
        // Total work = total_products * total_languages
        // Completed work = (completed_languages * total_products) + current_language_progress
        $totalWork = $state['total_products'] * $state['total_languages'];
        $completedLanguages = $state['current_language_index'];
        $currentLangProgress = $state['current_product_index'];
        $completedWork = ($completedLanguages * $state['total_products']) + $currentLangProgress;
        $percent = $totalWork > 0 ? round(($completedWork / $totalWork) * 100) : 0;

        // Current language info for UI
        $currentLangName = strtoupper($state['current_language'] ?? '');
        $langProgress = $state['total_products'] > 0 ?
            round(($currentLangProgress / $state['total_products']) * 100) : 0;

        echo json_encode([
            'status' => $state['status'],
            'completed' => $completedWork,
            'total' => $totalWork,
            'percent' => $percent,
            'current_product' => $state['current_product'],
            'current_language' => $currentLangName,
            'current_language_progress' => [
                'language' => $currentLangName,
                'completed' => $currentLangProgress,
                'total' => $state['total_products'],
                'percent' => $langProgress
            ],
            'languages_progress' => [
                'completed' => $completedLanguages,
                'total' => $state['total_languages']
            ],
            'api_calls' => $state['api_calls'],
            'log' => $newLogEntries,
            'stats' => $state['status'] === 'completed' ? [
                'total_products' => $state['total_products'],
                'total_languages' => $state['total_languages'],
                'api_calls' => $state['api_calls'],
                'execution_time' => time() - $state['started_at']
            ] : null
        ]);

    } catch (Exception $e) {
        // Critical error
        $state['status'] = 'error';
        $state['error'] = $e->getMessage();
        saveState($state);

        echo json_encode([
            'status' => 'error',
            'error' => $e->getMessage(),
            'details' => 'Errore durante la traduzione al prodotto ' . ($state['current_product']['codice'] ?? 'N/A'),
            'completed' => $state['completed_products'],
            'total' => $state['total_products']
        ]);
    }

    exit;
}

// Invalid action
echo json_encode([
    'success' => false,
    'error' => 'Azione non valida'
]);
?>
