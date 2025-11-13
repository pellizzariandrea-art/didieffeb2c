<?php
require_once '../config.php';
require_once '../includes/functions.php';

// Read fatal errors log
$logFile = DATA_PATH . '/export-v2-fatal-errors.log';
$lines = [];

if (file_exists($logFile)) {
    $file = new SplFileObject($logFile);
    $file->seek(PHP_INT_MAX);
    $totalLines = $file->key();

    // Get last 500 lines
    $startLine = max(0, $totalLines - 500);
    $file->seek($startLine);

    while (!$file->eof()) {
        $line = trim($file->current());
        if (!empty($line)) {
            $lines[] = $line;
        }
        $file->next();
    }
}

// Output as plain text
header('Content-Type: text/plain; charset=utf-8');

if (empty($lines)) {
    echo "No fatal errors found.\n";
    echo "Log file: $logFile\n";
} else {
    echo "=== FATAL ERRORS LOG (last " . count($lines) . " entries) ===\n\n";
    foreach ($lines as $line) {
        echo $line . "\n";
    }
}
?>
