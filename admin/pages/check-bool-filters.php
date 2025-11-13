<?php
require_once '../config.php';
header('Content-Type: text/plain; charset=utf-8');

$productsFile = PUBLIC_JSON_PATH;
$data = json_decode(file_get_contents($productsFile), true);

echo "=== VERIFICA FILTRI BOOLEANI ===\n\n";

if (!isset($data['_meta']['filters'])) {
    echo "ERRORE: Nessun filtro trovato!\n";
    exit;
}

$boolFilters = array_filter($data['_meta']['filters'], function($f) {
    return isset($f['field']) && strpos($f['field'], 'Applicazione') !== false;
});

foreach ($boolFilters as $filter) {
    echo "Filtro: {$filter['field']}\n";

    if (!empty($filter['options'])) {
        $firstOption = $filter['options'][0];

        echo "  Primo valore: " . json_encode($firstOption['value']) . "\n";
        echo "  Tipo: " . gettype($firstOption['value']) . "\n";

        if (is_array($firstOption['value'])) {
            echo "  ❌ BUG! Value è array, dovrebbe essere boolean diretto\n";
            if (isset($firstOption['value']['it'])) {
                echo "  Contenuto: it = " . json_encode($firstOption['value']['it']) . " (tipo: " . gettype($firstOption['value']['it']) . ")\n";
            }
        } elseif (is_bool($firstOption['value'])) {
            echo "  ✅ OK! Value è boolean diretto\n";
        } else {
            echo "  ⚠️  Value è " . gettype($firstOption['value']) . ": " . json_encode($firstOption['value']) . "\n";
        }
    }

    echo "\n";
}

echo "=== RIEPILOGO ===\n";
echo "File: $productsFile\n";
echo "Dimensione: " . filesize($productsFile) . " bytes\n";
echo "Modificato: " . date('Y-m-d H:i:s', filemtime($productsFile)) . "\n";
?>
