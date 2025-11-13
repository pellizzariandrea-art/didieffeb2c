<?php
// Read php_errorlog from same directory
$logFile = __DIR__ . '/php_errorlog';

header('Content-Type: text/plain; charset=utf-8');

if (!file_exists($logFile)) {
    echo "File php_errorlog non trovato in: $logFile\n";
    exit;
}

// Get last 200 lines
$lines = [];
$file = new SplFileObject($logFile);
$file->seek(PHP_INT_MAX);
$totalLines = $file->key();

$startLine = max(0, $totalLines - 200);
$file->seek($startLine);

while (!$file->eof()) {
    $line = $file->current();
    if (!empty(trim($line))) {
        $lines[] = $line;
    }
    $file->next();
}

echo "=== PHP ERROR LOG (last " . count($lines) . " entries) ===\n";
echo "File: $logFile\n";
echo "Total lines: $totalLines\n\n";

foreach ($lines as $line) {
    echo $line;
}
?>
