<?php
// admin/api/save-wizard-config.php - Save Wizard Configuration
header('Content-Type: application/json');

// Include config
$configPath = __DIR__ . '/../config.php';
if (file_exists($configPath)) {
    require_once $configPath;
}

// Path to wizard config
$wizardConfigPath = __DIR__ . '/../data/wizard-config.json';

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $config = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    // Validate required fields
    if (!isset($config['steps']) || !is_array($config['steps'])) {
        throw new Exception('Invalid configuration: missing steps array');
    }

    // Ensure version and lastUpdated
    if (!isset($config['version'])) {
        $config['version'] = '1.0.0';
    }
    $config['lastUpdated'] = date('Y-m-d');

    // Save configuration
    $result = file_put_contents(
        $wizardConfigPath,
        json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );

    if ($result === false) {
        throw new Exception('Failed to write configuration file');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Configuration saved successfully',
        'path' => $wizardConfigPath
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
