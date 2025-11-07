<?php
require_once '../config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

try {
    // Prova a trovare il log PHP in varie posizioni comuni
    $possibleLocations = [
        ini_get('error_log'), // Configurazione PHP
        '/var/log/php-error.log',
        '/var/log/php_errors.log',
        '/var/log/apache2/error.log',
        '/var/log/httpd/error_log',
        $_SERVER['DOCUMENT_ROOT'] . '/error_log',
        $_SERVER['DOCUMENT_ROOT'] . '/../logs/error_log',
        dirname($_SERVER['DOCUMENT_ROOT']) . '/logs/error_log',
    ];

    $logFile = null;
    $logSource = null;

    // Cerca il primo file che esiste ed è leggibile
    foreach ($possibleLocations as $location) {
        if ($location && file_exists($location) && is_readable($location)) {
            $logFile = $location;
            $logSource = $location;
            break;
        }
    }

    if (!$logFile) {
        echo json_encode([
            'success' => false,
            'error' => 'Log PHP non trovato. Posizioni cercate: ' . implode(', ', array_filter($possibleLocations)),
            'php_error_log_setting' => ini_get('error_log')
        ]);
        exit;
    }

    // Leggi solo le ultime N righe (per non sovraccaricare)
    $maxLines = 500;
    $lines = [];

    $file = new SplFileObject($logFile, 'r');
    $file->seek(PHP_INT_MAX);
    $lastLine = $file->key();

    $startLine = max(0, $lastLine - $maxLines);
    $file->seek($startLine);

    while (!$file->eof()) {
        $line = $file->current();
        if ($line) {
            $lines[] = $line;
        }
        $file->next();
    }

    $log = implode('', $lines);

    echo json_encode([
        'success' => true,
        'log' => $log,
        'source' => $logSource,
        'size' => filesize($logFile),
        'lines_shown' => count($lines),
        'total_lines' => $lastLine + 1
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
