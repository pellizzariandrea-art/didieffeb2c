<?php
require_once '../config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

$logFile = DATA_PATH . '/php-errors.log';

try {
    if (file_exists($logFile)) {
        unlink($logFile);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Log PHP personalizzato cancellato con successo'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
