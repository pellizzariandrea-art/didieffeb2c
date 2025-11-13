<?php
require_once '../config.php';
header('Content-Type: text/plain; charset=utf-8');

$productsFile = PUBLIC_JSON_PATH;
$data = json_decode(file_get_contents($productsFile), true);

echo "=== PRODOTTI TRADOTTI (hanno EN) ===\n\n";

$translatedIndexes = [];
foreach ($data['prodotti'] as $index => $p) {
    if (isset($p['nome']['en']) && !empty($p['nome']['en'])) {
        $translatedIndexes[] = $index;
        echo "Index $index: " . $p['codice'] . " - " . $p['nome']['en'] . "\n";
    }
}

echo "\n=== PATTERN ANALYSIS ===\n";
echo "Total translated: " . count($translatedIndexes) . "\n";
echo "Indexes: " . implode(', ', $translatedIndexes) . "\n";
echo "First translated index: " . ($translatedIndexes[0] ?? 'N/A') . "\n";
echo "Last translated index: " . (end($translatedIndexes) ?: 'N/A') . "\n";
?>
