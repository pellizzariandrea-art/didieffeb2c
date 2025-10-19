<?php
// File di test per verificare la ricezione dei dati
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Gestisci preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Leggi input JSON
$input = json_decode(file_get_contents('php://input'), true);

// Restituisci esattamente quello che abbiamo ricevuto + info server
echo json_encode([
    'success' => true,
    'received_data' => $input,
    'php_version' => PHP_VERSION,
    'post_received' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
