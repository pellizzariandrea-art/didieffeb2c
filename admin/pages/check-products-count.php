<?php
require_once '../config.php';

$productsFile = PUBLIC_JSON_PATH;

if (!file_exists($productsFile)) {
    die("products.json NOT FOUND at: $productsFile");
}

$jsonData = json_decode(file_get_contents($productsFile), true);

echo "<h2>Products.json Info</h2>";
echo "File: $productsFile<br>";
echo "File size: " . number_format(filesize($productsFile)) . " bytes<br>";
echo "Last modified: " . date('Y-m-d H:i:s', filemtime($productsFile)) . "<br>";
echo "<br>";

if ($jsonData && isset($jsonData['prodotti'])) {
    echo "Products count: <strong>" . count($jsonData['prodotti']) . "</strong><br>";
    echo "Total field: " . ($jsonData['total'] ?? 'not set') . "<br>";
    echo "<br>";

    // Show first product code
    if (count($jsonData['prodotti']) > 0) {
        echo "First product: " . ($jsonData['prodotti'][0]['codice'] ?? 'N/A') . "<br>";
        echo "Last product: " . ($jsonData['prodotti'][count($jsonData['prodotti'])-1]['codice'] ?? 'N/A') . "<br>";
    }
} else {
    echo "ERROR: Invalid JSON structure";
}
