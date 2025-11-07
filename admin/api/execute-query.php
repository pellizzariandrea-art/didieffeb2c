<?php
// execute-query.php
// Generic query executor with security and validation

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Carica configurazione database
require_once '../config.php';

// Carica configurazione query
$configPath = __DIR__ . '/../data/query-config.json';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Query config not found']);
    exit;
}

$queryConfig = json_decode(file_get_contents($configPath), true);

// Leggi input
$input = json_decode(file_get_contents('php://input'), true);
$querySlug = $input['query'] ?? null;
$params = $input['params'] ?? [];

// Validazione query slug
if (!$querySlug || !isset($queryConfig[$querySlug])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid query slug']);
    exit;
}

$queryDef = $queryConfig[$querySlug];

// Carica config DB (usa funzione dal config.php)
$dbConfig = loadDBConfig();

// Connessione MySQL usando credenziali dal config
$db = new mysqli(
    $dbConfig['host'],
    $dbConfig['username'],
    $dbConfig['password'],
    $dbConfig['database'],
    intval($dbConfig['port'] ?? 3306)
);

if ($db->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Imposta charset
$db->set_charset('utf8mb4');

// Prepara parametri con validazione e defaults
$validatedParams = [];
$bindTypes = '';
$bindValues = [];

foreach ($queryDef['params'] as $paramName => $paramDef) {
    $value = $params[$paramName] ?? $paramDef['default'] ?? null;

    // Verifica required
    if ($paramDef['required'] && $value === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "Missing required parameter: $paramName"]);
        $db->close();
        exit;
    }

    // Validazione tipo
    switch ($paramDef['type']) {
        case 'int':
            $value = (int)$value;
            $bindTypes .= 'i';
            break;
        case 'float':
            $value = (float)$value;
            $bindTypes .= 'd';
            break;
        case 'date':
            // Valida formato data YYYY-MM-DD
            if ($value && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                $value = $paramDef['default'] ?? date('Y-m-d');
            }
            $bindTypes .= 's';
            break;
        case 'string':
        default:
            $value = (string)$value;
            $bindTypes .= 's';
    }

    $validatedParams[$paramName] = $value;
    $bindValues[] = $value;
}

// Sostituisci named params (:paramName) con ? per prepared statement
$sql = $queryDef['sql'];
foreach ($validatedParams as $name => $value) {
    $sql = str_replace(":$name", '?', $sql);
}

// Esegui query preparata
$stmt = $db->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Query preparation failed',
        'details' => $db->error
    ]);
    $db->close();
    exit;
}

// Bind parametri
if (count($bindValues) > 0) {
    $stmt->bind_param($bindTypes, ...$bindValues);
}

// Esegui
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Query execution failed',
        'details' => $stmt->error
    ]);
    $stmt->close();
    $db->close();
    exit;
}

$result = $stmt->get_result();

// Fetch risultati
$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

// Log query execution (opzionale)
logActivity("Query executed: $querySlug by API");

// Risposta
echo json_encode([
    'success' => true,
    'query' => $querySlug,
    'data' => $rows,
    'count' => count($rows)
]);

$stmt->close();
$db->close();
?>
