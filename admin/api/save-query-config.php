<?php
// save-query-config.php
// Save or update query configuration

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

$configPath = __DIR__ . '/../data/query-config.json';

// GET - Read all queries
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($configPath)) {
        echo json_encode(['queries' => []]);
        exit;
    }

    $config = json_decode(file_get_contents($configPath), true);
    echo json_encode(['queries' => $config]);
    exit;
}

// POST - Save or update a query
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $slug = $input['slug'] ?? null;
    $query = $input['query'] ?? null;

    if (!$slug || !$query) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing slug or query data']);
        exit;
    }

    // Load existing config
    $config = [];
    if (file_exists($configPath)) {
        $config = json_decode(file_get_contents($configPath), true) ?? [];
    }

    // Update or add query
    $config[$slug] = $query;

    // Save config
    if (!file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save query config']);
        exit;
    }

    logActivity("Query config updated: $slug");

    echo json_encode(['success' => true, 'message' => 'Query saved successfully']);
    exit;
}

// DELETE - Remove a query
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $slug = $input['slug'] ?? $_GET['slug'] ?? null;

    if (!$slug) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing slug']);
        exit;
    }

    if (!file_exists($configPath)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Config file not found']);
        exit;
    }

    $config = json_decode(file_get_contents($configPath), true);

    if (!isset($config[$slug])) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Query not found']);
        exit;
    }

    unset($config[$slug]);

    if (!file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save config']);
        exit;
    }

    logActivity("Query config deleted: $slug");

    echo json_encode(['success' => true, 'message' => 'Query deleted successfully']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>
