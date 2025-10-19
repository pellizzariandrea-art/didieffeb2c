<?php
// API per eliminare descrizioni AI

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Abilita CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Gestisci preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verifica metodo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Leggi input JSON
    $input = json_decode(file_get_contents('php://input'), true);
    $productCode = $input['code'] ?? '';

    if (empty($productCode)) {
        http_response_code(400);
        echo json_encode(['error' => 'Product code is required']);
        exit;
    }

    // Path alla cartella delle descrizioni AI
    $dataPath = dirname(dirname(__DIR__)) . '/admin/data';
    $aiDescriptionsDir = $dataPath . '/ai-descriptions';
    $aiDescriptionFile = $aiDescriptionsDir . '/' . $productCode . '.json';

    // Verifica che il file esista
    if (!file_exists($aiDescriptionFile)) {
        http_response_code(404);
        echo json_encode(['error' => 'Description not found']);
        exit;
    }

    // Elimina il file
    if (unlink($aiDescriptionFile)) {
        echo json_encode([
            'success' => true,
            'message' => 'Description deleted successfully',
            'code' => $productCode
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete description file']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
