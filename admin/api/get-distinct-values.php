<?php
// api/get-distinct-values.php - Recupera valori distinct da una colonna
header('Content-Type: application/json');

require_once '../config.php';
require_once '../includes/functions.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Metodo non consentito');
    }

    $column = $_POST['column'] ?? '';

    if (empty($column)) {
        throw new Exception('Colonna non specificata');
    }

    $dbConfig = loadDBConfig();
    if (!$dbConfig) {
        throw new Exception('Configurazione database non trovata');
    }

    $values = getDistinctValues($dbConfig, $dbConfig['table'], $column);

    echo json_encode([
        'success' => true,
        'values' => $values,
        'count' => count($values)
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
