<?php
// download-log.php - Permette download sicuro dei file di log
require_once 'config.php';

// Lista whitelist di file scaricabili
$allowedFiles = [
    'export-debug.log',
    'export-error.log',
    'translation-errors.log'
];

// Ottieni nome file dalla query string
$fileName = $_GET['file'] ?? '';

// Verifica che il file sia nella whitelist
if (!in_array($fileName, $allowedFiles)) {
    http_response_code(403);
    die('File non autorizzato');
}

// Costruisci path completo
$filePath = DATA_PATH . '/' . $fileName;

// Verifica che il file esista
if (!file_exists($filePath)) {
    http_response_code(404);
    die('File non trovato');
}

// Imposta headers per download
header('Content-Type: text/plain; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $fileName . '"');
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: no-cache, must-revalidate');
header('Expires: 0');

// Invia contenuto file
readfile($filePath);
exit;
?>
