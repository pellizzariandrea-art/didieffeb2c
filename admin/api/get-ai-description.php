<?php
// API per leggere descrizioni AI esistenti
// Se auto_generate=true e descrizione non esiste, la genera automaticamente

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Abilita CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Gestisci preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verifica metodo GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Leggi parametri
    $productCode = $_GET['code'] ?? '';
    $language = $_GET['lang'] ?? 'it';
    $autoGenerate = isset($_GET['auto_generate']) && $_GET['auto_generate'] === 'true';

    if (empty($productCode)) {
        http_response_code(400);
        echo json_encode(['error' => 'Product code is required']);
        exit;
    }

    // Path alla cartella delle descrizioni AI
    $dataPath = dirname(dirname(__DIR__)) . '/admin/data';
    $aiDescriptionsDir = $dataPath . '/ai-descriptions';
    $aiDescriptionFile = $aiDescriptionsDir . '/' . $productCode . '.json';

    // Se il file esiste, leggi la descrizione
    if (file_exists($aiDescriptionFile)) {
        $aiDescriptions = json_decode(file_get_contents($aiDescriptionFile), true) ?? [];

        // Se richiesto "all", ritorna tutte le lingue
        if ($language === 'all') {
            echo json_encode([
                'success' => true,
                'data' => $aiDescriptions
            ]);
            exit;
        }

        if (isset($aiDescriptions[$language])) {
            $cachedDescription = $aiDescriptions[$language];
            if (isset($cachedDescription['html'])) {
                echo json_encode([
                    'success' => true,
                    'description' => $cachedDescription['html'],
                    'cached' => true,
                    'manually_edited' => $cachedDescription['manually_edited'] ?? false,
                    'generated_at' => $cachedDescription['generated_at'] ?? null,
                    'age_days' => isset($cachedDescription['timestamp'])
                        ? round((time() - $cachedDescription['timestamp']) / (24 * 60 * 60))
                        : null
                ]);
                exit;
            }
        }
    }

    // Se non esiste e auto_generate è disabilitato, ritorna not found
    if (!$autoGenerate) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Description not found',
            'auto_generate' => false
        ]);
        exit;
    }

    // Auto-generate: descrizione non esiste, ma abbiamo bisogno dei dati prodotto
    // In questo caso, ritorniamo un messaggio che indica al frontend di chiamare generate
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'Description not found',
        'auto_generate' => true,
        'message' => 'Call generate-ai-description.php with product data'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
