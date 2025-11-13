<?php
/**
 * Check what model will be used
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config.php';

$settingsFile = DATA_PATH . '/translation-settings.json';
$settings = json_decode(file_get_contents($settingsFile), true);

$modelToUse = $settings['model'] ?? 'claude-3-sonnet-20240229';

echo json_encode([
    'settings_file' => $settingsFile,
    'settings' => $settings,
    'model_that_will_be_used' => $modelToUse,
    'api_key_length' => strlen($settings['api_key'] ?? ''),
    'timestamp' => date('Y-m-d H:i:s')
], JSON_PRETTY_PRINT);
