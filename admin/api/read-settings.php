<?php
/**
 * Read translation-settings.json
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config.php';

$settingsFile = DATA_PATH . '/translation-settings.json';

if (!file_exists($settingsFile)) {
    echo json_encode([
        'error' => 'File not found',
        'path' => $settingsFile
    ], JSON_PRETTY_PRINT);
    exit;
}

$content = file_get_contents($settingsFile);
$settings = json_decode($content, true);

echo json_encode([
    'file_path' => $settingsFile,
    'file_size' => filesize($settingsFile),
    'last_modified' => date('Y-m-d H:i:s', filemtime($settingsFile)),
    'settings' => $settings,
    'model_for_translations' => $settings['translation_model'] ?? $settings['model'] ?? 'NOT SET',
    'model_for_ai_descriptions' => $settings['ai_model'] ?? 'NOT SET'
], JSON_PRETTY_PRINT);
