<?php
require_once '../config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

$logFile = DATA_PATH . '/php-errors.log';

try {
    if (!file_exists($logFile)) {
        echo json_encode([
            'success' => true,
            'log' => null,
            'message' => 'Nessun log PHP personalizzato disponibile. Verrà creato al prossimo export.'
        ]);
        exit;
    }

    $log = file_get_contents($logFile);
    $lineCount = substr_count($log, "\n");

    echo json_encode([
        'success' => true,
        'log' => $log,
        'size' => filesize($logFile),
        'lines' => $lineCount,
        'path' => $logFile
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
