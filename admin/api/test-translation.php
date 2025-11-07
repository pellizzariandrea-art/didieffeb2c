<?php
// Test minimo per debug
header('Content-Type: application/json');

echo json_encode([
    'success' => true,
    'message' => 'Endpoint raggiungibile!',
    'timestamp' => date('Y-m-d H:i:s')
]);
