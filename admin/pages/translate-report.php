<?php
// admin/pages/translate-report.php
// Generates UI translations for a report using AI

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Gestisci preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['slug'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Report slug is required']);
    exit;
}

$slug = $input['slug'];

// Load report config
$configFile = __DIR__ . '/../data/report-config.json';
if (!file_exists($configFile)) {
    http_response_code(404);
    echo json_encode(['error' => 'Report config file not found']);
    exit;
}

$configs = json_decode(file_get_contents($configFile), true);
if (!isset($configs[$slug])) {
    http_response_code(404);
    echo json_encode(['error' => "Report '$slug' not found"]);
    exit;
}

$reportConfig = $configs[$slug];

// Prepare data for AI translation
$dataToTranslate = [
    'title' => $reportConfig['title'],
    'description' => $reportConfig['description'] ?? '',
    'columns' => [],
    'filters' => [],
    'grouping' => [],
];

// Extract column labels
foreach ($reportConfig['columns'] as $column) {
    $dataToTranslate['columns'][$column['field']] = $column['label'];
}

// Extract filter labels
if (isset($reportConfig['filters'])) {
    foreach ($reportConfig['filters'] as $filter) {
        $dataToTranslate['filters'][$filter['field']] = $filter['label'];
    }
}

// Extract grouping labels
if (isset($reportConfig['grouping'])) {
    foreach ($reportConfig['grouping'] as $group) {
        $dataToTranslate['grouping'][$group['field']] = $group['label'];
    }
}

// AI Prompt for translation
$prompt = <<<PROMPT
Traduci i seguenti testi UI di un report aziendale in 6 lingue: italiano (IT), inglese (EN), tedesco (DE), francese (FR), spagnolo (ES), portoghese (PT).

IMPORTANTE:
- Traduci solo i TESTI, non i nomi dei campi (field names)
- Mantieni lo stesso tono formale/professionale
- Se un testo è già in italiano, traducilo nelle altre lingue
- Per termini tecnici, usa la traduzione standard del settore

INPUT:
```json
" . json_encode($dataToTranslate, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "
```

Rispondi SOLO con un oggetto JSON in questo formato esatto:
```json
{
  "title": {
    "it": "Titolo Italiano",
    "en": "English Title",
    "de": "Deutscher Titel",
    "fr": "Titre Français",
    "es": "Título Español",
    "pt": "Título Português"
  },
  "description": {
    "it": "Descrizione italiana",
    "en": "English description",
    "de": "Deutsche Beschreibung",
    "fr": "Description française",
    "es": "Descripción española",
    "pt": "Descrição portuguesa"
  },
  "columns": {
    "field_name": {
      "it": "Label Italiano",
      "en": "English Label",
      "de": "Deutsche Label",
      "fr": "Label Français",
      "es": "Etiqueta Española",
      "pt": "Rótulo Português"
    }
  },
  "filters": {
    "filter_field": {
      "it": "Label Filtro",
      "en": "Filter Label",
      "de": "Filter Label",
      "fr": "Label Filtre",
      "es": "Etiqueta Filtro",
      "pt": "Rótulo Filtro"
    }
  },
  "grouping": {
    "group_field": {
      "it": "Label Raggruppamento",
      "en": "Grouping Label",
      "de": "Gruppierung Label",
      "fr": "Label Groupement",
      "es": "Etiqueta Agrupación",
      "pt": "Rótulo Agrupamento"
    }
  }
}
```

NON aggiungere note, spiegazioni o altro testo. Solo il JSON.
PROMPT;

// Load settings
$dataPath = dirname(__DIR__) . '/data';
$settingsFile = $dataPath . '/translation-settings.json';

if (!file_exists($settingsFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Settings not configured']);
    exit;
}

$settings = json_decode(file_get_contents($settingsFile), true);

if (empty($settings['api_key'])) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'API key not configured']);
    exit;
}

$aiModel = $settings['ai_model'] ?? 'claude-sonnet-4-5-20250929';

// Funzione per chiamare Claude API
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

    if ($curlError) {
        throw new Exception('CURL Error: ' . $curlError);
    }

    if ($httpCode !== 200) {
        throw new Exception('API Error (HTTP ' . $httpCode . '): ' . $response);
    }

    return $response;
}

try {
    // Call Claude AI
    $response = callClaudeAPI($settings['api_key'], $prompt, $aiModel);

    // Parse Claude API response
    $apiResponse = json_decode($response, true);

    if (!isset($apiResponse['content'][0]['text'])) {
        throw new Exception('Invalid API response structure');
    }

    $aiText = $apiResponse['content'][0]['text'];

    // Extract JSON from response
    $jsonMatch = [];
    if (preg_match('/```json\s*(.*?)\s*```/s', $aiText, $jsonMatch)) {
        $jsonText = $jsonMatch[1];
    } else {
        $jsonText = $aiText;
    }

    $translations = json_decode($jsonText, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON response from AI: ' . json_last_error_msg());
    }

    // Validate structure
    if (!isset($translations['title']) || !isset($translations['columns'])) {
        throw new Exception('Invalid translation structure');
    }

    echo json_encode([
        'success' => true,
        'translations' => $translations,
        'slug' => $slug,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
?>
