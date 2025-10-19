<?php
// API per aggiornare descrizioni AI modificate manualmente

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
    $language = $input['language'] ?? '';
    $html = $input['html'] ?? '';

    if (empty($productCode)) {
        http_response_code(400);
        echo json_encode(['error' => 'Product code is required']);
        exit;
    }

    if (empty($language)) {
        http_response_code(400);
        echo json_encode(['error' => 'Language is required']);
        exit;
    }

    if (empty($html)) {
        http_response_code(400);
        echo json_encode(['error' => 'HTML content is required']);
        exit;
    }

    // Path alla cartella delle descrizioni AI
    $dataPath = dirname(dirname(__DIR__)) . '/admin/data';
    $aiDescriptionsDir = $dataPath . '/ai-descriptions';
    $aiDescriptionFile = $aiDescriptionsDir . '/' . $productCode . '.json';

    // Verifica che il file esista
    if (!file_exists($aiDescriptionFile)) {
        http_response_code(404);
        echo json_encode(['error' => 'Description file not found']);
        exit;
    }

    // Leggi il file esistente
    $aiDescriptions = json_decode(file_get_contents($aiDescriptionFile), true) ?? [];

    // Aggiorna la lingua specifica
    if (!isset($aiDescriptions[$language])) {
        $aiDescriptions[$language] = [];
    }

    $aiDescriptions[$language]['html'] = $html;
    $aiDescriptions[$language]['timestamp'] = time();
    $aiDescriptions[$language]['generated_at'] = date('Y-m-d H:i:s');
    $aiDescriptions[$language]['manually_edited'] = true;

    // Salva il file
    $result = file_put_contents(
        $aiDescriptionFile,
        json_encode($aiDescriptions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );

    if ($result === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save description']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Description updated successfully',
        'code' => $productCode,
        'language' => $language
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
