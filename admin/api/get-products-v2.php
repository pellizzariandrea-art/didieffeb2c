<?php
/**
 * V2 - Fixed version with prodotti/products support
 * VERSION: 2024-11-12 v2
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Direct path - we know it exists from check-products-json.php
$productsFile = $_SERVER['DOCUMENT_ROOT'] . '/data/products.json';

// Clear file stat cache to get fresh data
clearstatcache(true, $productsFile);

if (!file_exists($productsFile)) {
    echo json_encode([
        'success' => false,
        'error' => 'File not found',
        'tried_path' => $productsFile
    ]);
    exit;
}

$content = file_get_contents($productsFile);
$data = json_decode($content, true);

if (!$data) {
    echo json_encode([
        'success' => false,
        'error' => 'JSON decode failed: ' . json_last_error_msg()
    ]);
    exit;
}

// Support both "prodotti" (Italian) and "products" (English)
$productsArray = null;
if (isset($data['prodotti'])) {
    $productsArray = $data['prodotti'];
} elseif (isset($data['products'])) {
    $productsArray = $data['products'];
}

if (!$productsArray) {
    echo json_encode([
        'success' => false,
        'error' => 'No prodotti or products key found',
        'available_keys' => array_keys($data),
        'version' => 'v2'
    ]);
    exit;
}

// Extract only necessary fields
$products = array_map(function($p) {
    return [
        'codice' => $p['codice'] ?? '',
        'nome' => $p['nome'] ?? [],
        'descrizione' => $p['descrizione'] ?? []
    ];
}, $productsArray);

echo json_encode([
    'success' => true,
    'products' => $products,
    'total' => count($products),
    'version' => 'v2',
    'file_size' => filesize($productsFile)
]);
