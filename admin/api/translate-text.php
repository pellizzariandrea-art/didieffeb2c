<?php
// admin/api/translate-text.php - Translate a single text
header('Content-Type: application/json');

// Include config and functions
$configPath = __DIR__ . '/../config.php';
if (file_exists($configPath)) {
    require_once $configPath;
}

require_once __DIR__ . '/../includes/functions.php';

try {
    // Get JSON input
    $input = file_get_contents('php://input');

    // Debug: log what we received
    error_log("Translate API received: " . $input);

    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        // Return more detailed error
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid JSON: ' . json_last_error_msg(),
            'received' => substr($input, 0, 200), // First 200 chars for debug
            'length' => strlen($input)
        ]);
        exit;
    }

    $text = $data['text'] ?? '';
    $targetLanguage = $data['target_language'] ?? '';

    if (empty($text)) {
        throw new Exception('Missing text parameter');
    }

    if (empty($targetLanguage)) {
        throw new Exception('Missing target_language parameter');
    }

    // Get translation settings
    $translationSettings = getTranslationSettings();

    if (empty($translationSettings['enabled'])) {
        throw new Exception('Translation is disabled in settings');
    }

    $apiKey = $translationSettings['api_key'] ?? '';
    if (empty($apiKey)) {
        throw new Exception('No API key configured for translation');
    }

    // Check cache first
    $cached = getTranslationCache($text, $targetLanguage);
    if ($cached) {
        echo json_encode([
            'success' => true,
            'translation' => $cached,
            'cached' => true
        ]);
        exit;
    }

    // Translate
    $translated = translateText($text, $targetLanguage, $apiKey);

    if ($translated && $translated !== $text) {
        // Save to cache
        saveTranslationCache($text, $targetLanguage, $translated);

        echo json_encode([
            'success' => true,
            'translation' => $translated,
            'cached' => false
        ]);
    } else {
        throw new Exception('Translation failed or returned same text');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
