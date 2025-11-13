<?php
/**
 * Count products directly from filesystem (no HTTP cache)
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config.php';

$productsFile = PUBLIC_JSON_PATH;

if (!file_exists($productsFile)) {
    echo json_encode([
        'error' => 'File not found',
        'path' => $productsFile
    ]);
    exit;
}

$content = file_get_contents($productsFile);
$data = json_decode($content, true);

$productsArray = $data['prodotti'] ?? $data['products'] ?? [];

// Get first 3 and last 3 product codes
$first3 = array_slice($productsArray, 0, 3);
$last3 = array_slice($productsArray, -3);

echo json_encode([
    'file_path' => $productsFile,
    'file_size' => filesize($productsFile),
    'file_modified' => date('Y-m-d H:i:s', filemtime($productsFile)),
    'total_products' => count($productsArray),
    'first_3_codes' => array_map(fn($p) => $p['codice'] ?? 'N/A', $first3),
    'last_3_codes' => array_map(fn($p) => $p['codice'] ?? 'N/A', $last3),
    'json_size_mb' => round(strlen($content) / 1024 / 1024, 2)
], JSON_PRETTY_PRINT);
