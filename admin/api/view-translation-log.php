<?php
// Visualizza il log delle traduzioni in tempo reale
header('Content-Type: text/plain; charset=utf-8');

$logFile = dirname(__DIR__) . '/data/translation-debug.txt';

if (file_exists($logFile)) {
    // Mostra le ultime 200 righe
    $lines = file($logFile);
    $lastLines = array_slice($lines, -200);
    echo implode('', $lastLines);
} else {
    echo "Log file non trovato: $logFile\n";
    echo "Nessuna traduzione è stata ancora avviata.\n";
}
