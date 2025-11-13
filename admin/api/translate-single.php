<?php
/**
 * API endpoint for translating a single product in a single language
 * Client-side translation system - no timeouts!
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

// Load config
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/functions.php';

// Load translation settings
$settingsFile = DATA_PATH . '/translation-settings.json';
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
$codice = $input['codice'] ?? '';
$targetLang = $input['lang'] ?? '';
$force = $input['force'] ?? false;

if (empty($codice) || empty($targetLang)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing codice or lang']);
    exit;
}

// Language names mapping
$languageNames = [
    'en' => 'English',
    'de' => 'German',
    'fr' => 'French',
    'es' => 'Spanish',
    'pt' => 'Portuguese',
    'hr' => 'Croatian',
    'sl' => 'Slovenian',
    'el' => 'Greek'
];

$targetLangName = $languageNames[$targetLang] ?? $targetLang;

// Load products.json (pubblico - quello usato dal frontend)
$productsFile = PUBLIC_JSON_PATH;
if (!file_exists($productsFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'products.json not found']);
    exit;
}

$productsData = json_decode(file_get_contents($productsFile), true);

// Check both "products" (English) and "prodotti" (Italian) keys
$productsArray = null;
$productsKey = null;
if (isset($productsData['products'])) {
    $productsArray = &$productsData['products'];
    $productsKey = 'products';
} elseif (isset($productsData['prodotti'])) {
    $productsArray = &$productsData['prodotti'];
    $productsKey = 'prodotti';
}

if (!$productsData || !$productsArray) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Invalid products.json format - no products/prodotti key']);
    exit;
}

// Find product by codice
$productIndex = -1;
foreach ($productsArray as $index => $product) {
    if ($product['codice'] === $codice) {
        $productIndex = $index;
        break;
    }
}

if ($productIndex === -1) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => "Product $codice not found"]);
    exit;
}

$product = &$productsArray[$productIndex];

// Check if already translated (unless force=true)
$alreadyTranslated = !empty($product['nome'][$targetLang]) && !empty($product['descrizione'][$targetLang]);

if ($alreadyTranslated && !$force) {
    // Skip - already translated
    echo json_encode([
        'success' => true,
        'skipped' => true,
        'codice' => $codice,
        'lang' => $targetLang,
        'nome' => $product['nome'][$targetLang],
        'descrizione' => $product['descrizione'][$targetLang]
    ]);
    exit;
}

// Get Italian text (source)
$nomeIT = $product['nome']['it'] ?? '';
$descrizioneIT = $product['descrizione']['it'] ?? '';

if (empty($nomeIT)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Product has no Italian nome']);
    exit;
}

// Prepare translation prompt
$prompt = "You are a professional translator for an e-commerce catalog of hardware products (handles, knobs, accessories).

Translate the following product information from Italian to $targetLangName.

IMPORTANT RULES:
1. Translate naturally and professionally
2. Keep technical terms consistent with industry standards
3. Maintain the same tone and style
4. Do NOT add explanations or notes
5. Return ONLY the translations in this exact JSON format:

{
  \"nome\": \"translated product name\",
  \"descrizione\": \"translated product description\"
}

PRODUCT TO TRANSLATE:

Nome (IT): $nomeIT
Descrizione (IT): $descrizioneIT";

// Use translation_model from settings (or fallback to legacy 'model' key)
$translationModel = $settings['translation_model'] ?? $settings['model'] ?? 'claude-haiku-4-5-20251001';

$claudeRequest = [
    'model' => $translationModel,
    'max_tokens' => 2048,
    'messages' => [
        [
            'role' => 'user',
            'content' => $prompt
        ]
    ]
];

// Call Claude API
$startTime = microtime(true);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30); // 30s timeout per richiesta
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: ' . $apiKey,
    'anthropic-version: 2023-06-01'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($claudeRequest));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

$duration = round((microtime(true) - $startTime) * 1000); // ms

if ($httpCode !== 200) {
    error_log("Claude API error for $codice: HTTP $httpCode - $response");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Translation API error',
        'httpCode' => $httpCode,
        'curlError' => $curlError,
        'details' => $response
    ]);
    exit;
}

$claudeResponse = json_decode($response, true);

if (!isset($claudeResponse['content'][0]['text'])) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid response from Claude API'
    ]);
    exit;
}

$translatedText = $claudeResponse['content'][0]['text'];

// Extract JSON from response (Claude might wrap it in markdown)
$jsonMatch = preg_match('/\{[\s\S]*\}/', $translatedText, $matches);
if (!$jsonMatch) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Could not extract JSON from Claude response',
        'response' => $translatedText
    ]);
    exit;
}

$translation = json_decode($matches[0], true);

if (!$translation || !isset($translation['nome']) || !isset($translation['descrizione'])) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid translation format',
        'response' => $translatedText
    ]);
    exit;
}

// Save translation to product
$product['nome'][$targetLang] = $translation['nome'];
$product['descrizione'][$targetLang] = $translation['descrizione'];

// Translate attributi (like old system - uses cache!)
if (isset($product['attributi']) && is_array($product['attributi'])) {
    foreach ($product['attributi'] as $attrKey => $attrValue) {
        // Only translate if it's a multilingual array with Italian text
        if (is_array($attrValue) && isset($attrValue['it']) && !empty($attrValue['it'])) {
            // Skip if already translated (unless force=true)
            if (!$force && !empty($product['attributi'][$attrKey][$targetLang])) {
                continue;
            }

            try {
                // Use translateText with cache (same as old system)
                $translatedAttr = translateText($attrValue['it'], $targetLang, $apiKey);
                $product['attributi'][$attrKey][$targetLang] = $translatedAttr;
            } catch (Exception $e) {
                // Log error but continue with other attributes
                error_log("Error translating attribute $attrKey for $codice: " . $e->getMessage());
            }
        }
    }
}

// Translate caratteristiche (like old system - uses cache!)
if (isset($product['caratteristiche']) && is_array($product['caratteristiche'])) {
    foreach ($product['caratteristiche'] as $charIndex => $char) {
        // Translate nome
        if (!empty($char['nome']['it'])) {
            if ($force || empty($product['caratteristiche'][$charIndex]['nome'][$targetLang])) {
                try {
                    $translatedNome = translateText($char['nome']['it'], $targetLang, $apiKey);
                    $product['caratteristiche'][$charIndex]['nome'][$targetLang] = $translatedNome;
                } catch (Exception $e) {
                    error_log("Error translating caratteristica nome for $codice: " . $e->getMessage());
                }
            }
        }

        // Translate valore
        if (!empty($char['valore']['it'])) {
            if ($force || empty($product['caratteristiche'][$charIndex]['valore'][$targetLang])) {
                try {
                    $translatedValore = translateText($char['valore']['it'], $targetLang, $apiKey);
                    $product['caratteristiche'][$charIndex]['valore'][$targetLang] = $translatedValore;
                } catch (Exception $e) {
                    error_log("Error translating caratteristica valore for $codice: " . $e->getMessage());
                }
            }
        }
    }
}

// Update the main array (reference should already update it, but be explicit)
$productsData[$productsKey][$productIndex] = $product;

// Save products.json
$saveSuccess = file_put_contents($productsFile, json_encode($productsData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

if ($saveSuccess === false) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to save products.json'
    ]);
    exit;
}

// Flush translation cache to disk (save all new translations)
flushTranslationCache();

// Return success
echo json_encode([
    'success' => true,
    'skipped' => false,
    'codice' => $codice,
    'lang' => $targetLang,
    'nome' => $translation['nome'],
    'descrizione' => $translation['descrizione'],
    'duration_ms' => $duration,
    'api_calls' => 1
]);
