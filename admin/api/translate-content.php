<?php
/**
 * API endpoint for translating content using Claude AI
 * Uses translation settings from admin/data/translation-settings.json
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Load translation settings
$settingsFile = __DIR__ . '/../data/translation-settings.json';
if (!file_exists($settingsFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Translation settings not found']);
    exit;
}

$settings = json_decode(file_get_contents($settingsFile), true);
$apiKey = $settings['api_key'] ?? '';

if (empty($apiKey)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Claude API key not configured']);
    exit;
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$sourceText = $input['text'] ?? '';
$targetLanguage = $input['targetLanguage'] ?? '';
$preserveHtml = $input['preserveHtml'] ?? true;

if (empty($sourceText) || empty($targetLanguage)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing text or targetLanguage']);
    exit;
}

// Language names mapping
$languageNames = [
    'en' => 'English',
    'de' => 'German',
    'fr' => 'French',
    'es' => 'Spanish',
    'pt' => 'Portuguese',
    'it' => 'Italian'
];

$targetLangName = $languageNames[$targetLanguage] ?? $targetLanguage;

// Prepare Claude API request
$prompt = "Translate the following text from Italian to $targetLangName.";

if ($preserveHtml) {
    $prompt .= " IMPORTANT: Preserve ALL HTML tags exactly as they are (like <p>, <strong>, <br>, etc.). ";
    $prompt .= "Also preserve ALL template variables exactly as they are (like {{name}}, {{email}}, {{company}}, {{userCompany}}, etc.). ";
    $prompt .= "Only translate the actual text content between tags and outside of template variables. ";
    $prompt .= "Maintain the same structure and formatting.\n\n";
} else {
    $prompt .= "\n\n";
}

$prompt .= "Text to translate:\n\n$sourceText";

$claudeRequest = [
    'model' => 'claude-3-5-sonnet-20241022',
    'max_tokens' => 4096,
    'messages' => [
        [
            'role' => 'user',
            'content' => $prompt
        ]
    ]
];

// Call Claude API
$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: ' . $apiKey,
    'anthropic-version: 2023-06-01'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($claudeRequest));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    error_log("Claude API error: HTTP $httpCode - $response");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Translation API error',
        'details' => $response
    ]);
    exit;
}

$claudeResponse = json_decode($response, true);

if (!isset($claudeResponse['content'][0]['text'])) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid response from translation API'
    ]);
    exit;
}

$translatedText = $claudeResponse['content'][0]['text'];

// Return success
echo json_encode([
    'success' => true,
    'translatedText' => $translatedText,
    'targetLanguage' => $targetLanguage
]);
