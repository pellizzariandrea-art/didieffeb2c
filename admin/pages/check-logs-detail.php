<?php
require_once '../config.php';
header('Content-Type: text/plain; charset=utf-8');

$logFile = DATA_PATH . '/translation-process.log';

if (!file_exists($logFile)) {
    echo "Log file not found\n";
    exit;
}

// Get last 200 lines
$lines = file($logFile);
$lastLines = array_slice($lines, -200);

// Filter for specific events
echo "=== TRANSLATION PROCESS DETAILS ===\n\n";

foreach ($lastLines as $line) {
    // Skip CACHE HIT lines
    if (strpos($line, 'CACHE HIT') !== false) continue;

    // Show important lines
    if (strpos($line, 'Loading products') !== false ||
        strpos($line, 'Processing product') !== false ||
        strpos($line, 'Need translation') !== false ||
        strpos($line, 'Completed product') !== false ||
        strpos($line, 'Final save') !== false ||
        strpos($line, 'File written') !== false ||
        strpos($line, 'Verification') !== false ||
        strpos($line, 'Checkpoint') !== false ||
        strpos($line, 'ERROR') !== false) {
        echo $line;
    }
}
?>
