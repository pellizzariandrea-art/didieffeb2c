<?php
header('Content-Type: text/plain; charset=utf-8');

$logFile = dirname(__DIR__) . '/data/translation-extreme-debug.txt';

if (file_exists($logFile)) {
    echo file_get_contents($logFile);
} else {
    echo "Log file non trovato: $logFile\n";
}
