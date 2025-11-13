<?php
require_once '../config.php';
require_once '../includes/functions.php';

header('Content-Type: text/plain; charset=utf-8');

$translationSettings = loadTranslationSettings();
$apiKey = $translationSettings['api_key'] ?? '';

if (!$apiKey) {
    echo "ERRORE: API Key Claude mancante!\n";
    exit;
}

$languages = $translationSettings['languages'] ?? ['en', 'de', 'fr', 'es', 'pt', 'hr', 'sl', 'el'];

echo "=== TRADUZIONE METADATA ===\n\n";
echo "Lingue target: " . implode(', ', $languages) . "\n\n";

// Leggi products.json esistente
$productsFile = PUBLIC_JSON_PATH;
if (!file_exists($productsFile)) {
    echo "ERRORE: products.json non trovato!\n";
    exit;
}

$data = json_decode(file_get_contents($productsFile), true);
if (!$data || !isset($data['_meta'])) {
    echo "ERRORE: Formato products.json non valido!\n";
    exit;
}

echo "File caricato: " . filesize($productsFile) . " bytes\n\n";

// ========================================
// TRADUCI CATEGORIE
// ========================================
echo "--- TRADUZIONE CATEGORIE ---\n";

if (!empty($data['_meta']['categories'])) {
    $totalCategories = count($data['_meta']['categories']);
    echo "Categorie da tradurre: $totalCategories\n\n";

    foreach ($data['_meta']['categories'] as &$category) {
        $categoryName = $category['field'] ?? $category['label'] ?? 'N/A';
        echo "Categoria: $categoryName\n";

        // Traduci translations
        if (!isset($category['translations'])) {
            $category['translations'] = [];
        }

        // Assicurati che ci sia IT come base
        if (!isset($category['translations']['it'])) {
            $category['translations']['it'] = $categoryName;
        }

        // Traduci in tutte le lingue
        foreach ($languages as $lang) {
            if ($lang === 'it') continue;

            if (empty($category['translations'][$lang])) {
                echo "  Traduco in $lang... ";
                $translated = translateText($categoryName, $lang, $apiKey);
                $category['translations'][$lang] = $translated;
                echo "✓\n";
                usleep(100000); // 100ms pausa tra richieste
            } else {
                echo "  $lang: già tradotto\n";
            }
        }

        echo "\n";
    }
    unset($category); // Rilascia riferimento
} else {
    echo "Nessuna categoria trovata.\n\n";
}

// ========================================
// TRADUCI FILTRI
// ========================================
echo "\n--- TRADUZIONE FILTRI ---\n";

if (!empty($data['_meta']['filters'])) {
    $totalFilters = count($data['_meta']['filters']);
    echo "Filtri da tradurre: $totalFilters\n\n";

    foreach ($data['_meta']['filters'] as &$filter) {
        $filterName = $filter['field'] ?? $filter['label'] ?? 'N/A';
        echo "Filtro: $filterName\n";

        // Salta filtri range (prezzo)
        if ($filter['type'] === 'range') {
            echo "  → Saltato (range)\n\n";
            continue;
        }

        // Traduci options
        if (!empty($filter['options']) && is_array($filter['options'])) {
            $optionCount = count($filter['options']);
            echo "  Opzioni da tradurre: $optionCount\n";

            foreach ($filter['options'] as &$option) {
                // Traduci LABEL
                if (!isset($option['label']) || !is_array($option['label'])) {
                    $option['label'] = ['it' => $filterName];
                }

                foreach ($languages as $lang) {
                    if ($lang === 'it') continue;

                    if (empty($option['label'][$lang])) {
                        $option['label'][$lang] = translateText($filterName, $lang, $apiKey);
                        usleep(50000);
                    }
                }

                // Traduci VALUE (solo se è stringa multilingua, non booleani!)
                if (isset($option['value']) && is_array($option['value'])) {
                    $italianValue = $option['value']['it'] ?? '';

                    if ($italianValue && is_string($italianValue)) {
                        echo "    - \"$italianValue\"";

                        foreach ($languages as $lang) {
                            if ($lang === 'it') continue;

                            if (empty($option['value'][$lang])) {
                                $option['value'][$lang] = translateText($italianValue, $lang, $apiKey);
                                usleep(50000);
                            }
                        }

                        echo " ✓\n";
                    }
                }
            }
            unset($option);
        }

        echo "\n";
    }
    unset($filter);
} else {
    echo "Nessun filtro trovato.\n\n";
}

// ========================================
// SALVA FILE AGGIORNATO
// ========================================
echo "\n--- SALVATAGGIO ---\n";

$jsonOutput = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if ($jsonOutput === false) {
    echo "ERRORE: Impossibile codificare JSON!\n";
    exit;
}

// Backup del file originale
$backupFile = $productsFile . '.backup-' . date('YmdHis');
copy($productsFile, $backupFile);
echo "Backup creato: $backupFile\n";

// Salva il nuovo file
$bytesWritten = file_put_contents($productsFile, $jsonOutput);

if ($bytesWritten === false) {
    echo "ERRORE: Impossibile scrivere il file!\n";
    exit;
}

echo "File salvato: $bytesWritten bytes\n";

// Verifica
$verify = json_decode(file_get_contents($productsFile), true);
if (!$verify) {
    echo "⚠️ ATTENZIONE: Verifica fallita! Ripristinare il backup?\n";
    exit;
}

echo "\n✅ TRADUZIONE METADATA COMPLETATA!\n";
echo "Prodotti invariati: " . count($data['prodotti']) . "\n";
echo "Categorie tradotte: " . count($data['_meta']['categories'] ?? []) . "\n";
echo "Filtri tradotti: " . count($data['_meta']['filters'] ?? []) . "\n";
?>
