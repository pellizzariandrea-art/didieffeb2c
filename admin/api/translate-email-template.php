<?php
// admin/api/translate-email-template.php
// Endpoint per tradurre template email usando Claude AI

// Error reporting
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Leggi il body della richiesta
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception('Invalid JSON input');
    }

    $sourceSubject = $data['sourceSubject'] ?? '';
    $sourceBody = $data['sourceBody'] ?? '';
    $targetLanguages = $data['targetLanguages'] ?? [];

    if (empty($sourceSubject) || empty($sourceBody)) {
        throw new Exception('Subject e body sono obbligatori');
    }

    if (empty($targetLanguages)) {
        throw new Exception('Nessuna lingua target specificata');
    }

    // Carica settings direttamente dal JSON
    $dataPath = __DIR__ . '/../data';
    $settingsFile = $dataPath . '/translation-settings.json';

    if (!file_exists($settingsFile)) {
        throw new Exception('File translation-settings.json non trovato: ' . $settingsFile);
    }

    $settings = json_decode(file_get_contents($settingsFile), true);

    if (!$settings) {
        throw new Exception('Impossibile leggere translation-settings.json');
    }

    $apiKey = $settings['api_key'] ?? '';

    if (empty($apiKey)) {
        throw new Exception('API key non configurata in translation-settings.json');
    }

    $translations = [];

    $languageNames = [
        'en' => 'English',
        'de' => 'German (Deutsch)',
        'fr' => 'French (Français)',
        'es' => 'Spanish (Español)',
        'pt' => 'Portuguese (Português)',
        'hr' => 'Croatian (Hrvatski)',
        'sl' => 'Slovenian (Slovenščina)',
        'el' => 'Greek (Ελληνικά)',
    ];

    // Traduci per ogni lingua target
    foreach ($targetLanguages as $lang) {
        if ($lang === 'it') continue; // Skip italiano

        $languageName = $languageNames[$lang] ?? $lang;

        $prompt = "You are a professional translator specializing in email translations for e-commerce.

Translate the following email template from Italian to {$languageName}.

IMPORTANT INSTRUCTIONS:
1. Keep ALL variables in the exact format {{variableName}} unchanged
2. Maintain HTML tags exactly as they are
3. Preserve the professional and friendly tone
4. Adapt cultural nuances appropriately for {$languageName}

SOURCE EMAIL (Italian):
Subject: {$sourceSubject}

Body:
{$sourceBody}

Please provide the translation in this EXACT format:
SUBJECT: [translated subject here]
BODY: [translated body here]

Do not add any explanations or comments, just the translation.";

        // Usa translateText esistente ma con un prompt customizzato
        $url = 'https://api.anthropic.com/v1/messages';

        $postData = [
            'model' => $settings['translation_model'] ?? 'claude-haiku-4-5-20251001',
            'max_tokens' => 1500,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'x-api-key: ' . $apiKey,
            'anthropic-version: 2023-06-01'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Translation API error for {$lang}: " . $response);
            // Fallback: copia l'originale
            $translations[$lang] = [
                'subject' => $sourceSubject,
                'body' => $sourceBody
            ];
            continue;
        }

        $result = json_decode($response, true);
        $translatedText = $result['content'][0]['text'] ?? '';

        // Parse la risposta
        preg_match('/SUBJECT:\s*(.+?)(?=\nBODY:)/s', $translatedText, $subjectMatch);
        preg_match('/BODY:\s*(.+)$/s', $translatedText, $bodyMatch);

        if ($subjectMatch && $bodyMatch) {
            $translations[$lang] = [
                'subject' => trim($subjectMatch[1]),
                'body' => trim($bodyMatch[1])
            ];
        } else {
            // Fallback
            $translations[$lang] = [
                'subject' => $sourceSubject,
                'body' => $sourceBody
            ];
        }

        // Small delay per evitare rate limiting
        usleep(200000); // 200ms
    }

    echo json_encode([
        'success' => true,
        'translations' => $translations
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
