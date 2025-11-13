<?php
require_once '../config.php';
require_once '../includes/functions.php';

// Read last 1000 lines of translation log
$logFile = DATA_PATH . '/translation-debug.log';
$lines = [];

if (file_exists($logFile)) {
    $file = new SplFileObject($logFile);
    $file->seek(PHP_INT_MAX);
    $totalLines = $file->key();

    // Get last 1000 lines
    $startLine = max(0, $totalLines - 1000);
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
    echo "No translation log entries found.\n";
    echo "Log file: $logFile\n";
} else {
    echo "=== TRANSLATION LOG (last " . count($lines) . " entries) ===\n\n";
    foreach ($lines as $line) {
        echo $line . "\n";
    }
}
?>
