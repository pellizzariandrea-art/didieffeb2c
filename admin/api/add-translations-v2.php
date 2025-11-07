<?php
// Versione semplificata per debug
header('Content-Type: application/json');

try {
    // Step 1: Include config
    require_once '../config.php';

    // Step 2: Check if JSON file exists
    $jsonFile = PUBLIC_JSON_PATH;

    if (!file_exists($jsonFile)) {
        echo json_encode(['success' => false, 'error' => 'File not found: ' . $jsonFile]);
        exit;
    }

    // Step 3: Read JSON
    $content = file_get_contents($jsonFile);
    if (!$content) {
        echo json_encode(['success' => false, 'error' => 'Cannot read file']);
        exit;
    }

    // Step 4: Parse JSON
    $data = json_decode($content, true);
    if (!$data) {
        echo json_encode(['success' => false, 'error' => 'Invalid JSON: ' . json_last_error_msg()]);
        exit;
    }

    // Step 5: Find products key
    $key = isset($data['products']) ? 'products' : (isset($data['prodotti']) ? 'prodotti' : null);
    if (!$key) {
        echo json_encode(['success' => false, 'error' => 'No products key found', 'keys' => array_keys($data)]);
        exit;
    }

    $total = count($data[$key]);

    echo json_encode([
        'success' => true,
        'complete' => true,
        'total' => $total,
        'translated' => 0,
        'message' => 'Debug OK - found ' . $total . ' products with key: ' . $key
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ]);
}
