<?php
header('Content-Type: text/plain; charset=utf-8');

// Cerca il file nell'ultimo export
$possiblePaths = [
    '/home/customer/www/shop.didieffeb2b.com/public_html/data/products.json',
    '../data/products.json',
    '../../data/products.json',
    __DIR__ . '/../data/products.json',
    __DIR__ . '/../../data/products.json',
];

$foundPath = null;
foreach ($possiblePaths as $path) {
    if (file_exists($path)) {
        $foundPath = $path;
        break;
    }
}

if (!$foundPath) {
    echo "ERRORE: products.json non trovato!\n";
    echo "Percorsi provati:\n";
    foreach ($possiblePaths as $p) {
        echo "  - $p\n";
    }
    exit;
}

echo "=== VERIFICA FILTRI BOOLEANI ===\n\n";
echo "File: $foundPath\n";
echo "Dimensione: " . filesize($foundPath) . " bytes\n";
echo "Modificato: " . date('Y-m-d H:i:s', filemtime($foundPath)) . "\n\n";

$data = json_decode(file_get_contents($foundPath), true);

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
?>
