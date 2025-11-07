<?php
// add-translations.php - Aggiunge traduzioni al JSON esistente, 10 prodotti alla volta

// Cattura TUTTI gli errori e convertili in JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

// Cattura output buffer per evitare output non-JSON
ob_start();

$offset = 0;
$batchSize = 10;

try {
    header('Content-Type: application/json');
    error_reporting(E_ALL);
    ini_set('display_errors', 0); // Disabilita display errori per non sporcare JSON

    require_once '../config.php';
    require_once '../includes/functions.php';

    // Parametri
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    $batchSize = isset($_GET['batch_size']) ? intval($_GET['batch_size']) : 10;

    $logFile = DATA_PATH . '/translation-add.log';
    $jsonFile = PUBLIC_JSON_PATH;

function logTranslation($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message\n";

    // Scrivi nel file di log
    @file_put_contents($logFile, $logEntry, FILE_APPEND);

    // Scrivi anche in un file di debug sempre accessibile
    $debugFile = dirname(__DIR__) . '/data/translation-debug.txt';
    @file_put_contents($debugFile, $logEntry, FILE_APPEND);
}

try {
    logTranslation("=== START ADD TRANSLATIONS - Offset: $offset, Batch: $batchSize ===");
    logTranslation("Looking for JSON file at: $jsonFile");
    logTranslation("File exists: " . (file_exists($jsonFile) ? 'YES' : 'NO'));

    // Carica JSON esistente
    if (!file_exists($jsonFile)) {
        // Controlla anche altre posizioni comuni
        $alternativePaths = [
            __DIR__ . '/../../data/products.json',
            dirname(dirname(__DIR__)) . '/data/products.json',
            $_SERVER['DOCUMENT_ROOT'] . '/data/products.json'
        ];

        $foundPath = null;
        foreach ($alternativePaths as $altPath) {
            if (file_exists($altPath)) {
                $foundPath = $altPath;
                break;
            }
        }

        echo json_encode([
            'success' => false,
            'error' => 'File products.json non trovato.',
            'searched_path' => $jsonFile,
            'alternative_paths' => $alternativePaths,
            'found_alternative' => $foundPath,
            'document_root' => $_SERVER['DOCUMENT_ROOT']
        ]);
        exit;
    }

    $jsonContent = file_get_contents($jsonFile);
    logTranslation("JSON file size: " . strlen($jsonContent) . " bytes");

    $jsonData = json_decode($jsonContent, true);
    $jsonError = json_last_error();

    // Supporta sia "products" che "prodotti" (export v1 vs v2)
    $productsKey = null;
    if (isset($jsonData['products'])) {
        $productsKey = 'products';
    } elseif (isset($jsonData['prodotti'])) {
        $productsKey = 'prodotti';
        logTranslation("Using 'prodotti' key (export v1 format)");
    }

    if (!$jsonData || !$productsKey) {
        $errorDetails = [
            'success' => false,
            'error' => 'File products.json non valido o vuoto.',
            'file_path' => $jsonFile,
            'file_size' => strlen($jsonContent),
            'json_error' => $jsonError,
            'json_error_msg' => json_last_error_msg(),
            'has_products_key' => isset($jsonData['products']),
            'has_prodotti_key' => isset($jsonData['prodotti']),
            'data_type' => gettype($jsonData),
            'keys' => is_array($jsonData) ? array_keys($jsonData) : 'not an array'
        ];

        logTranslation("JSON validation failed: " . json_encode($errorDetails));

        echo json_encode($errorDetails);
        exit;
    }

    $allProducts = $jsonData[$productsKey];
    $totalProducts = count($allProducts);

    logTranslation("Total products in JSON: $totalProducts");

    // Se offset >= total, abbiamo finito
    if ($offset >= $totalProducts) {
        logTranslation("Translation complete! Offset ($offset) >= Total ($totalProducts)");
        echo json_encode([
            'success' => true,
            'complete' => true,
            'total' => $totalProducts,
            'translated' => $totalProducts
        ]);
        exit;
    }

    // Prendi il batch di prodotti da tradurre
    $productsToTranslate = array_slice($allProducts, $offset, $batchSize);
    $actualBatchSize = count($productsToTranslate);

    logTranslation("Processing batch: offset=$offset, size=$actualBatchSize");

    // Carica settings traduzioni
    $translationSettings = loadTranslationSettings();

    if (empty($translationSettings['enabled'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Traduzioni non abilitate nelle impostazioni.'
        ]);
        exit;
    }

    $languages = $translationSettings['languages'] ?? ['it'];

    // Rimuovi 'it' perché è già presente
    $languages = array_filter($languages, function($lang) {
        return $lang !== 'it';
    });

    if (empty($languages)) {
        echo json_encode([
            'success' => false,
            'error' => 'Nessuna lingua da tradurre configurata (solo italiano presente).'
        ]);
        exit;
    }

    logTranslation("Languages to translate: " . implode(', ', $languages));

    // Traduci il batch
    $translatedCount = 0;
    logTranslation("Starting translation of batch: " . count($productsToTranslate) . " products");

    foreach ($productsToTranslate as $index => $product) {
        $absoluteIndex = $offset + $index;

        logTranslation("Processing product #$absoluteIndex: " . ($product['codice'] ?? 'no-code'));

        // Traduci nome
        if (!empty($product['nome'])) {
            logTranslation("Translating nome for product #$absoluteIndex");
            $originalName = is_array($product['nome']) ? $product['nome']['it'] : $product['nome'];

            $translations = ['it' => $originalName];
            foreach ($languages as $lang) {
                $cached = getTranslationCache($originalName, $lang);
                if ($cached) {
                    $translations[$lang] = $cached;
                } else {
                    $translated = translateText($originalName, $lang, $translationSettings['api_key']);
                    if ($translated) {
                        $translations[$lang] = $translated;
                        saveTranslationCache($originalName, $lang, $translated);
                    }
                }
            }

            $allProducts[$absoluteIndex]['nome'] = $translations;
        }

        // Traduci attributi (sia label che value)
        if (!empty($product['attributi'])) {
            foreach ($product['attributi'] as $attrKey => $attrValue) {
                // TRADUCI LABEL
                $originalLabel = is_array($attrValue) ? ($attrValue['label']['it'] ?? $attrKey) : $attrKey;

                $labelTranslations = ['it' => $originalLabel];
                foreach ($languages as $lang) {
                    $cached = getTranslationCache($originalLabel, $lang);
                    if ($cached) {
                        $labelTranslations[$lang] = $cached;
                    } else {
                        $translated = translateText($originalLabel, $lang, $translationSettings['api_key']);
                        if ($translated) {
                            $labelTranslations[$lang] = $translated;
                            saveTranslationCache($originalLabel, $lang, $translated);
                        }
                    }
                }

                // TRADUCI VALUE (se non è booleano o vuoto)
                $originalValue = is_array($attrValue) ? ($attrValue['value'] ?? $attrValue) : $attrValue;

                // Gestisci casi speciali
                if ($originalValue === null || $originalValue === '') {
                    // Valore vuoto: mantieni vuoto per tutte le lingue
                    $valueTranslations = ['it' => ''];
                    foreach ($languages as $lang) {
                        $valueTranslations[$lang] = '';
                    }
                } elseif (is_bool($originalValue)) {
                    // Booleano: NON tradurre, usa true/false
                    $boolString = $originalValue ? 'true' : 'false';
                    $valueTranslations = ['it' => $boolString];
                    foreach ($languages as $lang) {
                        $valueTranslations[$lang] = $boolString;
                    }
                } elseif (is_array($originalValue)) {
                    // È già un oggetto multilingua, mantienilo
                    $valueTranslations = $originalValue;
                } else {
                    // È una stringa: TRADUCI
                    $originalValueString = (string)$originalValue;
                    $valueTranslations = ['it' => $originalValueString];

                    foreach ($languages as $lang) {
                        $cached = getTranslationCache($originalValueString, $lang);
                        if ($cached) {
                            $valueTranslations[$lang] = $cached;
                        } else {
                            $translated = translateText($originalValueString, $lang, $translationSettings['api_key']);
                            if ($translated) {
                                $valueTranslations[$lang] = $translated;
                                saveTranslationCache($originalValueString, $lang, $translated);
                            } else {
                                // Fallback: usa valore italiano
                                $valueTranslations[$lang] = $originalValueString;
                            }
                        }
                    }
                }

                $allProducts[$absoluteIndex]['attributi'][$attrKey] = [
                    'label' => $labelTranslations,
                    'value' => $valueTranslations
                ];
            }
        }

        $translatedCount++;
        logTranslation("Translated product #$absoluteIndex: " . ($product['codice'] ?? 'unknown'));
    }

    // Salva JSON aggiornato (usa la stessa chiave che abbiamo trovato)
    $jsonData[$productsKey] = $allProducts;

    // Aggiorna metadata lingue
    if (!isset($jsonData['_meta'])) {
        $jsonData['_meta'] = [];
    }
    $jsonData['_meta']['languages'] = array_merge(['it'], $languages);
    $jsonData['_meta']['last_translation_update'] = date('Y-m-d H:i:s');

    file_put_contents($jsonFile, json_encode($jsonData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

    logTranslation("Batch saved successfully. Next offset: " . ($offset + $actualBatchSize));

    // Risposta
    $nextOffset = $offset + $actualBatchSize;
    $complete = $nextOffset >= $totalProducts;

    echo json_encode([
        'success' => true,
        'complete' => $complete,
        'total' => $totalProducts,
        'translated' => $nextOffset,
        'batch_size' => $actualBatchSize,
        'next_offset' => $complete ? null : $nextOffset,
        'percent' => round(($nextOffset / $totalProducts) * 100, 1)
    ]);

    logTranslation("=== END BATCH - Next: " . ($complete ? 'COMPLETE' : $nextOffset) . " ===");

} catch (Throwable $e) {
    // Cattura TUTTO (Exception + Error)
    // Pulisci output buffer
    while (ob_get_level()) {
        ob_end_clean();
    }

    // Inizia nuovo buffer pulito
    ob_start();

    header('Content-Type: application/json');

    $errorMsg = $e->getMessage();
    $errorFile = basename($e->getFile());
    $errorLine = $e->getLine();

    // Log su file
    $logFile = dirname(__DIR__) . '/data/translation-add.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] ERROR: $errorMsg in $errorFile:$errorLine\n", FILE_APPEND);
    file_put_contents($logFile, "[$timestamp] Stack: " . $e->getTraceAsString() . "\n", FILE_APPEND);

    echo json_encode([
        'success' => false,
        'error' => $errorMsg,
        'file' => $errorFile,
        'line' => $errorLine,
        'type' => get_class($e),
        'offset' => $offset ?? 0
    ]);

    ob_end_flush();
    exit;
}

// Pulisci output buffer
while (ob_get_level()) {
    ob_end_flush();
}
