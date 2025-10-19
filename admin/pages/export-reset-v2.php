<?php
// export-reset-v2.php - Reset export v2 state and chunks

require_once '../config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

try {
    // Delete state file
    $stateFile = DATA_PATH . '/export-v2-state.json';
    if (file_exists($stateFile)) {
        unlink($stateFile);
    }

    // Delete all chunk files
    $chunkFiles = glob(DATA_PATH . '/export-v2-chunk-*.json');
    foreach ($chunkFiles as $chunkFile) {
        unlink($chunkFile);
    }

    logActivity("Export v2 state reset - " . count($chunkFiles) . " chunks eliminati");

    echo json_encode([
        'success' => true,
        'message' => 'Export v2 state reset completato',
        'chunks_deleted' => count($chunkFiles)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
