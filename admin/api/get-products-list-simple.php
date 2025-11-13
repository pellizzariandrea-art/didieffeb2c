<?php
/**
 * Simple version - no dependencies, just finds the file
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Try multiple paths to find products.json
$possiblePaths = [
    __DIR__ . '/../../data/products.json',  // /admin/api/../../data = /data
    $_SERVER['DOCUMENT_ROOT'] . '/data/products.json',
    dirname(dirname(__DIR__)) . '/data/products.json'
];

$productsFile = null;
$triedPaths = [];

foreach ($possiblePaths as $path) {
    $triedPaths[$path] = file_exists($path);
    if (file_exists($path)) {
        $productsFile = $path;
        break;
    }
}

if (!$productsFile) {
    echo json_encode([
        'success' => false,
        'error' => 'products.json not found',
        'tried_paths' => $triedPaths,
        'current_dir' => __DIR__,
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set'
    ], JSON_PRETTY_PRINT);
    exit;
}

$productsData = @file_get_contents($productsFile);
if (!$productsData) {
    echo json_encode([
        'success' => false,
        'error' => 'Could not read products.json',
        'file_path' => $productsFile
    ]);
    exit;
}

$data = json_decode($productsData, true);

// Check both "products" (English) and "prodotti" (Italian) keys
$productsArray = null;
if (isset($data['products'])) {
    $productsArray = $data['products'];
} elseif (isset($data['prodotti'])) {
    $productsArray = $data['prodotti'];
}

if (!$data || !$productsArray) {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid products.json format - no products/prodotti key',
        'file_path' => $productsFile,
        'available_keys' => array_keys($data)
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
    'total' => count($products),
    'file_path' => $productsFile
]);
