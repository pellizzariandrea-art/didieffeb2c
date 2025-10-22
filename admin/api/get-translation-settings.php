<?php
// admin/api/get-translation-settings.php - Get Translation Settings
header('Content-Type: application/json');

// Include config and functions
$configPath = __DIR__ . '/../config.php';
if (file_exists($configPath)) {
    require_once $configPath;
}

require_once __DIR__ . '/../includes/functions.php';

try {
    $settings = loadTranslationSettings();

    echo json_encode([
        'success' => true,
        'settings' => $settings
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
