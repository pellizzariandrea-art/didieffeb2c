<?php
require_once '../config.php';

$productsFile = PUBLIC_JSON_PATH;

if (!file_exists($productsFile)) {
    die("products.json NOT FOUND");
}

$jsonData = json_decode(file_get_contents($productsFile), true);

if (!$jsonData || !isset($jsonData['prodotti'])) {
    die("Invalid JSON structure");
}

// Trova un prodotto con varianti (es: che ha "Colore" negli attributi)
$testProduct = null;
foreach ($jsonData['prodotti'] as $product) {
    if (isset($product['attributi']['Colore'])) {
        $testProduct = $product;
        break;
    }
}

if (!$testProduct) {
    // Prendi il primo prodotto
    $testProduct = $jsonData['prodotti'][0];
}

echo "<h2>Product Structure Test</h2>";
echo "<h3>Product: {$testProduct['codice']}</h3>";
echo "<h3>Name (nome):</h3>";
echo "<pre>" . json_encode($testProduct['nome'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";

echo "<h3>Attributes (attributi):</h3>";
echo "<pre>" . json_encode($testProduct['attributi'] ?? 'NO ATTRIBUTES', JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";

echo "<h3>First 3 attributes details:</h3>";
if (isset($testProduct['attributi'])) {
    $count = 0;
    foreach ($testProduct['attributi'] as $key => $value) {
        if ($count >= 3) break;
        echo "<h4>$key:</h4>";
        echo "<pre>" . json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
        echo "<p>Type: " . gettype($value) . "</p>";
        if (is_array($value)) {
            echo "<p>Keys: " . implode(', ', array_keys($value)) . "</p>";
        }
        $count++;
    }
}
