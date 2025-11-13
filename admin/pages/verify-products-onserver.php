<?php
require_once '../config.php';
header('Content-Type: text/plain; charset=utf-8');

$productsFile = PUBLIC_JSON_PATH;

echo "=== PRODUCTS.JSON VERIFICATION (SERVER SIDE) ===\n\n";
echo "File: $productsFile\n";
echo "Exists: " . (file_exists($productsFile) ? 'YES' : 'NO') . "\n";
echo "Size: " . filesize($productsFile) . " bytes\n";
echo "Modified: " . date('Y-m-d H:i:s', filemtime($productsFile)) . "\n\n";

$data = json_decode(file_get_contents($productsFile), true);

if (!$data || !isset($data['prodotti'])) {
    echo "ERROR: Could not read products.json\n";
    exit;
}

$translated = 0;
$empty = 0;
$emptyList = [];

foreach ($data['prodotti'] as $p) {
    $hasTranslation = isset($p['nome']['en']) && !empty($p['nome']['en']);
    if ($hasTranslation) {
        $translated++;
    } else {
        $empty++;
        if (count($emptyList) < 10) {
            $emptyList[] = $p['codice'] . ' - ' . ($p['nome']['it'] ?? 'N/A');
        }
    }
}

echo "=== TRANSLATION COUNT ===\n";
echo "Prodotti con traduzioni: $translated\n";
echo "Prodotti senza traduzioni: $empty\n";
echo "Totale: " . count($data['prodotti']) . "\n\n";

if ($empty > 0) {
    echo "=== PRIMI 10 PRODOTTI SENZA TRADUZIONI ===\n";
    foreach ($emptyList as $item) {
        echo "  - $item\n";
    }
}
?>
