<?php
/**
 * Check what's wrong with products.json
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$productsFile = __DIR__ . '/../../data/products.json';

if (!file_exists($productsFile)) {
    echo json_encode(['error' => 'File not found']);
    exit;
}

$content = file_get_contents($productsFile);
$data = json_decode($content, true);
$jsonError = json_last_error();

echo json_encode([
    'file_exists' => true,
    'file_size' => filesize($productsFile),
    'content_length' => strlen($content),
    'first_100_chars' => substr($content, 0, 100),
    'last_100_chars' => substr($content, -100),
    'json_decode_success' => $data !== null,
    'json_error' => $jsonError,
    'json_error_msg' => json_last_error_msg(),
    'has_products_key' => isset($data['products']),
    'products_count' => isset($data['products']) ? count($data['products']) : 0,
    'top_level_keys' => $data ? array_keys($data) : null,
    'first_product' => isset($data['products'][0]) ? [
        'codice' => $data['products'][0]['codice'] ?? 'missing',
        'has_nome' => isset($data['products'][0]['nome']),
        'has_descrizione' => isset($data['products'][0]['descrizione'])
    ] : null
], JSON_PRETTY_PRINT);
