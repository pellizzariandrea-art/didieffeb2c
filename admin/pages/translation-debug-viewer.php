<?php
require_once '../config.php';

$logFile = DATA_PATH . '/translation-debug.log';

header('Content-Type: text/plain; charset=utf-8');

if (!file_exists($logFile)) {
    echo "File di log non trovato: $logFile\n";
    echo "Il log verrà creato quando la funzione translateText() viene chiamata.\n";
    exit;
}

// Get last 1000 lines
$lines = [];
$file = new SplFileObject($logFile);
$file->seek(PHP_INT_MAX);
$totalLines = $file->key();

$startLine = max(0, $totalLines - 1000);
$file->seek($startLine);

while (!$file->eof()) {
    $line = $file->current();
    if (!empty(trim($line))) {
        $lines[] = $line;
    }
    $file->next();
}

echo "=== TRANSLATION DEBUG LOG (last " . count($lines) . " entries) ===\n";
echo "File: $logFile\n";
echo "Total lines: $totalLines\n";
echo "File size: " . number_format(filesize($logFile) / 1024, 2) . " KB\n\n";

foreach ($lines as $line) {
    echo $line;
}
?>
