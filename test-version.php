<?php
require_once 'includes/functions.php';

echo "<h2>Test Precisione Prezzi</h2>";

// Test 1: applyTransform con parseFloat
echo "<h3>Test 1: applyTransform('10.72', 'parseFloat')</h3>";
$testValue1 = "10.72";
$result1 = applyTransform($testValue1, 'parseFloat');
echo "Input: " . $testValue1 . "<br>";
echo "Output: " . $result1 . "<br>";
echo "Tipo: " . gettype($result1) . "<br>";
echo "Rappresentazione completa: " . sprintf("%.50f", $result1) . "<br>";
echo "<strong style='color: " . ($result1 == 10.72 ? "green" : "red") . "'>Risultato: " . ($result1 == 10.72 ? "✓ OK" : "✗ ERRORE") . "</strong><br>";

echo "<hr>";

// Test 2: roundFloatsRecursive su array
echo "<h3>Test 2: roundFloatsRecursive su array</h3>";
$testArray = [
    'prezzo' => 10.7200000000000006394884621840901672840118408203125,
    'sconto' => 5.5
];
echo "Input array:<br>";
echo "<pre>" . print_r($testArray, true) . "</pre>";

$result2 = roundFloatsRecursive($testArray, 2);
echo "Output array:<br>";
echo "<pre>" . print_r($result2, true) . "</pre>";
echo "Rappresentazione completa prezzo: " . sprintf("%.50f", $result2['prezzo']) . "<br>";
echo "<strong style='color: " . ($result2['prezzo'] == 10.72 ? "green" : "red") . "'>Risultato: " . ($result2['prezzo'] == 10.72 ? "✓ OK" : "✗ ERRORE") . "</strong><br>";

echo "<hr>";

// Test 3: Simulazione completa come in preview.php
echo "<h3>Test 3: Simulazione completa preview.php</h3>";
$mockRow = ['prezzo_listino' => '10.72'];
$mockMapping = [
    [
        'dbColumn' => 'prezzo_listino',
        'targetField' => 'prezzo',
        'transform' => 'parseFloat',
        'isAttribute' => false
    ]
];

$product = transformRow($mockRow, $mockMapping);
echo "Dopo transformRow:<br>";
echo "Prezzo: " . $product['prezzo'] . "<br>";
echo "Rappresentazione: " . sprintf("%.50f", $product['prezzo']) . "<br>";

$productArray = [$product];
$productArray = roundFloatsRecursive($productArray, 2);
echo "<br>Dopo roundFloatsRecursive:<br>";
echo "Prezzo: " . $productArray[0]['prezzo'] . "<br>";
echo "Rappresentazione: " . sprintf("%.50f", $productArray[0]['prezzo']) . "<br>";

// Test SENZA serialize_precision
$json1 = json_encode($productArray, JSON_PRETTY_PRINT);
echo "<br>JSON SENZA serialize_precision:<br>";
echo "<pre>" . htmlspecialchars($json1) . "</pre>";
$decoded1 = json_decode($json1, true);
$hasError1 = (strpos($json1, '10.7200000000000006394884621840901672840118408203125') !== false);
echo "<strong style='color: " . ($hasError1 ? "red" : "green") . "'>Risultato: " . ($hasError1 ? "✗ ERRORE - Float lungo!" : "✓ OK") . "</strong><br>";

echo "<hr>";

// Test CON serialize_precision
echo "<h3>Test 4: Effetto di serialize_precision</h3>";
ini_set('serialize_precision', 14);
$json2 = json_encode($productArray, JSON_PRETTY_PRINT);
echo "JSON CON serialize_precision=14:<br>";
echo "<pre>" . htmlspecialchars($json2) . "</pre>";
$hasError2 = (strpos($json2, '10.7200000000000006394884621840901672840118408203125') !== false);
echo "<strong style='color: " . ($hasError2 ? "red" : "green") . "'>Risultato: " . ($hasError2 ? "✗ ERRORE - Float lungo!" : "✓ OK - Precisione corretta!") . "</strong><br>";

echo "<hr>";

// Test 5: Forza 2 decimali fissi
echo "<h3>Test 5: Forza 2 decimali fissi nel JSON</h3>";
$testArray2 = [
    ['prezzo' => 19.0],
    ['prezzo' => 10.72],
    ['prezzo' => 5.5],
    ['prezzo' => 99.99]
];
$testArray2 = roundFloatsRecursive($testArray2, 2);
$json3 = json_encode($testArray2, JSON_PRETTY_PRINT);
echo "JSON PRIMA di forceDecimalsInJSON:<br>";
echo "<pre>" . htmlspecialchars($json3) . "</pre>";

$json3Fixed = forceDecimalsInJSON($json3, 2);
echo "<br>JSON DOPO forceDecimalsInJSON:<br>";
echo "<pre>" . htmlspecialchars($json3Fixed) . "</pre>";

// Verifica che tutti i prezzi abbiano esattamente 2 decimali
$hasTwoDecimals = (
    strpos($json3Fixed, '"prezzo": 19.00') !== false &&
    strpos($json3Fixed, '"prezzo": 10.72') !== false &&
    strpos($json3Fixed, '"prezzo": 5.50') !== false &&
    strpos($json3Fixed, '"prezzo": 99.99') !== false
);
echo "<strong style='color: " . ($hasTwoDecimals ? "green" : "red") . "'>Risultato finale: " . ($hasTwoDecimals ? "✓ OK - Tutti i prezzi hanno 2 decimali fissi!" : "✗ ERRORE") . "</strong><br>";
?>
