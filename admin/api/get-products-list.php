<?php
/**
 * API endpoint to get products list
 * Returns only codes and basic info for translation interface
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config.php';

$productsFile = PUBLIC_JSON_PATH;

if (!file_exists($productsFile)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'products.json not found',
        'path' => $productsFile
    ]);
    exit;
}

$productsData = json_decode(file_get_contents($productsFile), true);

// Check both "products" (English) and "prodotti" (Italian) keys
$productsArray = null;
if (isset($productsData['products'])) {
    $productsArray = $productsData['products'];
} elseif (isset($productsData['prodotti'])) {
    $productsArray = $productsData['prodotti'];
}

if (!$productsData || !$productsArray) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid products.json format - no products/prodotti key',
        'available_keys' => array_keys($productsData)
    ]);
    exit;
}

// Return only necessary data for translation
$products = array_map(function($product) {
    return [
        'codice' => $product['codice'] ?? '',
        'nome' => $product['nome'] ?? [],
        'descrizione' => $product['descrizione'] ?? []
    ];
}, $productsArray);

echo json_encode([
    'success' => true,
    'products' => $products,
    'total' => count($products)
]);
