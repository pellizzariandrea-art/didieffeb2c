<?php
require_once '../config.php';
header('Content-Type: text/plain; charset=utf-8');

$logFile = DATA_PATH . '/translation-process.log';

if (!file_exists($logFile)) {
    echo "Log file not found\n";
    exit;
}

// Get last 1000 lines to find version markers
$lines = file($logFile);
$lastLines = array_slice($lines, -1000);

echo "=== SEARCHING FOR VERSION MARKERS ===\n\n";

$versionFound = false;
$lastVersion = null;
$lastVersionTime = null;

foreach ($lastLines as $line) {
    if (strpos($line, 'FILE VERSION') !== false) {
        $versionFound = true;
        $lastVersion = $line;
        $lastVersionTime = substr($line, 1, 19); // Extract timestamp
        echo $line;
    }
}

echo "\n=== SUMMARY ===\n";
if ($versionFound) {
    echo "✅ Version markers found!\n";
    echo "Last version logged: $lastVersion";
    echo "Time: $lastVersionTime\n";
} else {
    echo "❌ No version markers found in last 1000 log lines\n";
    echo "This suggests the OLD version (before version logging) was used\n";
}

echo "\n=== MOST RECENT ACTIVITY ===\n";
$recent = array_slice($lines, -50);
foreach ($recent as $line) {
    if (strpos($line, 'Loading products') !== false ||
        strpos($line, 'FILE VERSION') !== false ||
        strpos($line, 'Final save') !== false ||
        strpos($line, 'File written') !== false ||
        strpos($line, 'All translations completed') !== false) {
        echo $line;
    }
}
?>
