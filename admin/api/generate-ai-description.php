<?php
// Versione standalone per testing - senza dipendenze da config.php e functions.php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Abilita CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Gestisci preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verifica metodo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Leggi input JSON
    $input = json_decode(file_get_contents('php://input'), true);
    $productCode = $input['code'] ?? '';
    $language = $input['language'] ?? 'it';
    $productData = $input['productData'] ?? null;

    if (empty($productCode)) {
        http_response_code(400);
        echo json_encode(['error' => 'Product code is required']);
        exit;
    }

    if (!$productData) {
        http_response_code(400);
        echo json_encode(['error' => 'Product data is required']);
        exit;
    }

    // Definisci path manualmente
    $dataPath = dirname(dirname(__DIR__)) . '/admin/data';
    $aiDescriptionsDir = $dataPath . '/ai-descriptions';

    // Carica settings
    $settingsFile = $dataPath . '/translation-settings.json';
    if (!file_exists($settingsFile)) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Settings not configured',
            'path_checked' => $settingsFile
        ]);
        exit;
    }

    $settings = json_decode(file_get_contents($settingsFile), true);

    if (!isset($settings['ai_description_enabled']) || !$settings['ai_description_enabled']) {
        http_response_code(400);
        echo json_encode(['error' => 'AI descriptions are not enabled']);
        exit;
    }

    if (empty($settings['api_key'])) {
        http_response_code(500);
        echo json_encode(['error' => 'API key not configured']);
        exit;
    }

    if (empty($settings['ai_description_prompt'])) {
        http_response_code(500);
        echo json_encode(['error' => 'AI prompt not configured']);
        exit;
    }

    // Default model se non configurato
    $aiModel = $settings['ai_model'] ?? 'claude-sonnet-4-5-20250929';

    // Path alla cartella delle descrizioni AI
    $aiDescriptionFile = $aiDescriptionsDir . '/' . $productCode . '.json';

    // Crea la cartella se non esiste
    if (!file_exists($aiDescriptionsDir)) {
        mkdir($aiDescriptionsDir, 0755, true);
    }

    // Controlla se esiste già una descrizione AI salvata per questa lingua
    $aiDescriptions = [];
    if (file_exists($aiDescriptionFile)) {
        $aiDescriptions = json_decode(file_get_contents($aiDescriptionFile), true) ?? [];
    }

    if (isset($aiDescriptions[$language])) {
        $cachedDescription = $aiDescriptions[$language];
        if (isset($cachedDescription['html']) && isset($cachedDescription['timestamp'])) {
            $age = time() - $cachedDescription['timestamp'];
            // Cache infinita - nessuna scadenza
            echo json_encode([
                'success' => true,
                'description' => $cachedDescription['html'],
                'cached' => true,
                'age_days' => round($age / (24 * 60 * 60))
            ]);
            exit;
        }
    }

    // Usa i dati del prodotto ricevuti dal frontend (già tradotti)
    $promptData = [
        'codice' => $productData['codice'] ?? '',
        'nome' => $productData['nome'] ?? '',
        'descrizione' => $productData['descrizione'] ?? '',
        'immagine' => $productData['immagine'] ?? '',
        'serie' => $productData['serie'] ?? '',
        'materiale' => $productData['materiale'] ?? '',
        'colore' => $productData['colore'] ?? '',
        'categoria' => $productData['categoria'] ?? '',
        'tipologia' => $productData['tipologia'] ?? '',
        'lingua' => $language
    ];

    // Sostituisci le variabili nel prompt
    $prompt = $settings['ai_description_prompt'];
    foreach ($promptData as $key => $value) {
        $prompt = str_replace('{' . $key . '}', $value, $prompt);
    }

    // Chiama API Claude (funzione inline)
    function callClaudeAPI($apiKey, $prompt, $model) {
        $ch = curl_init('https://api.anthropic.com/v1/messages');

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'x-api-key: ' . $apiKey,
            'anthropic-version: 2023-06-01'
        ]);

        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'model' => $model,
            'max_tokens' => 4096,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ]
        ]));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        return [
            'response' => $response,
            'httpCode' => $httpCode,
            'curlError' => $curlError
        ];
    }

    $apiResult = callClaudeAPI($settings['api_key'], $prompt, $aiModel);

    // Debug dettagliato
    if ($apiResult['httpCode'] !== 200) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Claude API call failed',
            'http_code' => $apiResult['httpCode'],
            'curl_error' => $apiResult['curlError'],
            'api_response' => substr($apiResult['response'], 0, 500) // primi 500 caratteri
        ]);
        exit;
    }

    $response = json_decode($apiResult['response'], true);

    if (!$response || !isset($response['content'][0]['text'])) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Invalid API response format',
            'response_snippet' => substr($apiResult['response'], 0, 500)
        ]);
        exit;
    }

    $aiDescription = trim($response['content'][0]['text']);

    // Rimuovi markdown code fences e quotes se presenti
    // Claude a volte ritorna il contenuto tra triple backticks o quotes
    $aiDescription = preg_replace('/^```html\s*/i', '', $aiDescription);
    $aiDescription = preg_replace('/^```\s*/i', '', $aiDescription);
    $aiDescription = preg_replace('/\s*```$/', '', $aiDescription);

    // Rimuovi quotes iniziali e finali se presenti
    $aiDescription = preg_replace('/^"html\s*/i', '', $aiDescription);
    $aiDescription = preg_replace('/^"\s*/', '', $aiDescription);
    $aiDescription = preg_replace('/\s*"$/', '', $aiDescription);
    $aiDescription = trim($aiDescription);

    // Salva la descrizione nel file JSON del prodotto
    $aiDescriptions[$language] = [
        'html' => $aiDescription,
        'timestamp' => time(),
        'generated_at' => date('Y-m-d H:i:s')
    ];

    // Scrivi il file JSON
    file_put_contents(
        $aiDescriptionFile,
        json_encode($aiDescriptions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );

    echo json_encode([
        'success' => true,
        'description' => $aiDescription,
        'cached' => false
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}
