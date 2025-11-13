<?php
/**
 * Test translate-single.php with first product
 * VERSION: 2.0 (2025-11-12 08:24)
 */

$testVersion = '2.0';

// Get first product code
$productsFile = $_SERVER['DOCUMENT_ROOT'] . '/data/products.json';
$data = json_decode(file_get_contents($productsFile), true);
$firstProduct = $data['prodotti'][0] ?? null;

if (!$firstProduct) {
    die('No products found');
}

$testData = [
    'codice' => $firstProduct['codice'],
    'lang' => 'en',
    'force' => false
];

// Call the API
$ch = curl_init('https://shop.didieffeb2b.com/admin/api/translate-single.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Content-Type: application/json');
echo json_encode([
    'test_version' => $testVersion,
    'timestamp' => date('Y-m-d H:i:s'),
    'test_data' => $testData,
    'http_code' => $httpCode,
    'response' => json_decode($response, true),
    'raw_response' => $response
], JSON_PRETTY_PRINT);
