<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$configFile = __DIR__ . '/../data/email-config.json';

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['base64'])) {
        throw new Exception('Base64 data is required');
    }

    $base64 = $data['base64'];

    // Validate base64 format
    if (!preg_match('/^data:image\/(png|jpeg|jpg);base64,/', $base64)) {
        throw new Exception('Invalid image format. Only PNG and JPG are supported');
    }

    // Load existing config
    if (!file_exists($configFile)) {
        throw new Exception('Configuration file not found');
    }

    $config = json_decode(file_get_contents($configFile), true);
    if (!$config) {
        throw new Exception('Failed to parse configuration file');
    }

    // Extract image type and data
    preg_match('/^data:image\/(png|jpeg|jpg);base64,/', $base64, $matches);
    $imageType = $matches[1];

    // Add logo to config
    $config['logo'] = [
        'base64' => $base64,
        'type' => $imageType,
        'uploadedAt' => date('Y-m-d H:i:s')
    ];

    // Save config
    if (!file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT))) {
        throw new Exception('Failed to save configuration');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Logo uploaded successfully'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
