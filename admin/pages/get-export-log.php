<?php
// get-export-log.php - API per leggere il log di export in tempo reale
require_once '../config.php';

header('Content-Type: application/json');

$logFile = DATA_PATH . '/export-debug.log';

if (!file_exists($logFile)) {
    echo json_encode([
        'success' => false,
        'message' => 'Log file not found'
    ]);
    exit;
}

// Leggi ultime N righe del log
$lines = isset($_GET['lines']) ? intval($_GET['lines']) : 50;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

// Leggi file
$content = file_get_contents($logFile);
$allLines = explode("\n", $content);

// Prendi ultime N righe (o da offset specificato)
if ($offset > 0) {
    $selectedLines = array_slice($allLines, -$offset - $lines, $lines);
} else {
    $selectedLines = array_slice($allLines, -$lines);
}

// Filtra righe vuote
$selectedLines = array_filter($selectedLines, function($line) {
    return trim($line) !== '';
});

echo json_encode([
    'success' => true,
    'lines' => array_values($selectedLines),
    'total_lines' => count($allLines),
    'file_size' => filesize($logFile)
]);
