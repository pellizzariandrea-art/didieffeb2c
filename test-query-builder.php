<?php
// test-query-builder.php - Simula la costruzione della query senza eseguirla
require_once 'config.php';
require_once 'includes/functions.php';

echo "<h1>Test Query Builder</h1>\n\n";

// Carica configurazioni
$dbConfig = loadDBConfig();
$filterConfig = loadFilterConfig();
$tableConfig = loadTableConfig();

echo "<h2>Configurazione Filtri:</h2>\n";
echo "<pre>" . json_encode($filterConfig, JSON_PRETTY_PRINT) . "</pre>\n\n";

echo "<h2>Configurazione Tabelle:</h2>\n";
echo "<pre>" . json_encode($tableConfig, JSON_PRETTY_PRINT) . "</pre>\n\n";

// Simula costruzione WHERE clause
$params = [];
$whereClause = buildFilterSQL($filterConfig, $params);

echo "<h2>WHERE Clause Generata:</h2>\n";
echo "<pre>" . htmlspecialchars($whereClause) . "</pre>\n\n";

echo "<h2>Parametri Preparati:</h2>\n";
echo "<pre>" . json_encode($params, JSON_PRETTY_PRINT) . "</pre>\n\n";

// Costruisci query completa
if ($tableConfig) {
    $sql = buildSelectQuery($tableConfig, $whereClause, 10);
    echo "<h2>Query SQL Completa (LIMIT 10):</h2>\n";
    echo "<pre>" . htmlspecialchars($sql) . "</pre>\n\n";
} else {
    echo "<p style='color: red;'>ERRORE: Table config non trovata!</p>\n";
}

// Test formatColumnName() con vari input
echo "<h2>Test formatColumnName():</h2>\n";
$testColumns = [
    'codice',
    'Pos. Assoluto',
    'cod_con_img.default_image',
    'Pubblica in web'
];

echo "<table border='1' cellpadding='5'>\n";
echo "<tr><th>Input</th><th>Output</th></tr>\n";
foreach ($testColumns as $col) {
    $formatted = formatColumnName($col);
    echo "<tr><td>" . htmlspecialchars($col) . "</td><td>" . htmlspecialchars($formatted) . "</td></tr>\n";
}
echo "</table>\n";
