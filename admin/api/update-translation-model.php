<?php
/**
 * Update translation-settings.json with correct model
 */

require_once __DIR__ . '/../config.php';

$settingsFile = DATA_PATH . '/translation-settings.json';

if (!file_exists($settingsFile)) {
    die(json_encode(['error' => 'Settings file not found']));
}

$settings = json_decode(file_get_contents($settingsFile), true);

// Backup old values
$oldModel = $settings['model'] ?? 'not set';
$oldTranslationModel = $settings['translation_model'] ?? 'not set';
$oldAiModel = $settings['ai_model'] ?? 'not set';

// Update with correct models
$settings['translation_model'] = 'claude-haiku-4-5-20251001'; // Fast & cheap for translations
$settings['ai_model'] = 'claude-3-sonnet-20240229'; // Keep Sonnet for AI descriptions
$settings['model'] = 'claude-3-sonnet-20240229'; // Legacy key (for compatibility)

// Save
$saved = file_put_contents($settingsFile, json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

header('Content-Type: application/json');
echo json_encode([
    'success' => $saved !== false,
    'file' => $settingsFile,
    'bytes_written' => $saved,
    'old_values' => [
        'model' => $oldModel,
        'translation_model' => $oldTranslationModel,
        'ai_model' => $oldAiModel
    ],
    'new_values' => [
        'model' => $settings['model'],
        'translation_model' => $settings['translation_model'],
        'ai_model' => $settings['ai_model']
    ],
    'timestamp' => date('Y-m-d H:i:s')
], JSON_PRETTY_PRINT);
