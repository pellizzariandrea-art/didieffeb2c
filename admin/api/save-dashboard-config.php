<?php
// save-dashboard-config.php
// Save or update dashboard KPI configuration

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

$configPath = __DIR__ . '/../data/dashboard-config.json';

// GET - Read all KPIs
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($configPath)) {
        echo json_encode(['kpis' => []]);
        exit;
    }

    $config = json_decode(file_get_contents($configPath), true);
    echo json_encode(['kpis' => $config]);
    exit;
}

// POST - Save or update a KPI
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $slug = $input['slug'] ?? null;
    $kpi = $input['config'] ?? null;

    if (!$slug || !$kpi) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing slug or KPI data']);
        exit;
    }

    // Load existing config
    $config = [];
    if (file_exists($configPath)) {
        $config = json_decode(file_get_contents($configPath), true) ?? [];
    }

    // Update or add KPI
    $config[$slug] = $kpi;

    // Save config
    if (!file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save dashboard config']);
        exit;
    }

    logActivity("Dashboard KPI config updated: $slug");

    echo json_encode(['success' => true, 'message' => 'Dashboard KPI saved successfully']);
    exit;
}

// DELETE - Remove a KPI
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
        echo json_encode(['success' => false, 'error' => 'KPI not found']);
        exit;
    }

    unset($config[$slug]);

    if (!file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save config']);
        exit;
    }

    logActivity("Dashboard KPI config deleted: $slug");

    echo json_encode(['success' => true, 'message' => 'Dashboard KPI deleted successfully']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>
