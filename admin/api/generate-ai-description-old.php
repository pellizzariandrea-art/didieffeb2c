<?php
// Abilita error reporting per debug
error_reporting(E_ALL);
ini_set('display_errors', 0); // Non mostrare errori nel browser
ini_set('log_errors', 1);

require_once '../config.php';
require_once '../includes/functions.php';

// Abilita CORS per permettere richieste dal frontend
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

// Carica settings
$settingsFile = DATA_PATH . '/translation-settings.json';
if (!file_exists($settingsFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Settings not configured']);
    exit;
}

$settings = json_decode(file_get_contents($settingsFile), true);

if (!$settings['ai_description_enabled']) {
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

// Path alla cartella delle descrizioni AI nel frontend
$frontendAIDir = dirname(dirname(__DIR__)) . '/frontend/public/ai-descriptions';
$aiDescriptionFile = $frontendAIDir . '/' . $productCode . '.json';

// Crea la cartella se non esiste
if (!file_exists($frontendAIDir)) {
    mkdir($frontendAIDir, 0755, true);
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
        // Se ha meno di 30 giorni, usala
        if ($age < (30 * 24 * 60 * 60)) {
            echo json_encode([
                'success' => true,
                'description' => $cachedDescription['html'],
                'cached' => true,
                'age_days' => round($age / (24 * 60 * 60))
            ]);
            exit;
        }
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

// Chiama API Claude
$response = callClaudeAPI($settings['api_key'], $prompt);

if (!$response || !isset($response['content'][0]['text'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to generate AI description']);
    exit;
}

$aiDescription = trim($response['content'][0]['text']);

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

logActivity("Generata descrizione AI per prodotto {$productCode} in lingua {$language}");

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
        'line' => $e->getLine()
    ]);
}
