<?php
require_once '../config.php';

header('Content-Type: text/plain; charset=utf-8');

$logFile = DATA_PATH . '/translation-process.log';

if (!file_exists($logFile)) {
    echo "Log file not found: $logFile\n";
    exit;
}

// Get last 100 lines
$lines = file($logFile);
$lastLines = array_slice($lines, -100);

echo "=== TRANSLATION DEBUG LOG (last 100 lines) ===\n\n";
echo implode('', $lastLines);
?>
