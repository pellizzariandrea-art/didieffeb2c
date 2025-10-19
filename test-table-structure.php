<?php
// test-table-structure.php - Mostra la struttura della tabella cod_con_img
require_once 'config.php';
require_once 'includes/functions.php';

echo "<h1>Struttura Tabella cod_con_img</h1>\n\n";

$dbConfig = loadDBConfig();
$pdo = connectDB($dbConfig);

// Mostra colonne della tabella
$sql = "SHOW COLUMNS FROM `cod_con_img`";
$stmt = $pdo->query($sql);

echo "<h2>Colonne disponibili:</h2>\n";
echo "<table border='1' cellpadding='5'>\n";
echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>\n";

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "<tr>";
    echo "<td><strong>" . htmlspecialchars($row['Field']) . "</strong></td>";
    echo "<td>" . htmlspecialchars($row['Type']) . "</td>";
    echo "<td>" . htmlspecialchars($row['Null']) . "</td>";
    echo "<td>" . htmlspecialchars($row['Key']) . "</td>";
    echo "<td>" . htmlspecialchars($row['Default'] ?? '(NULL)') . "</td>";
    echo "<td>" . htmlspecialchars($row['Extra']) . "</td>";
    echo "</tr>\n";
}
echo "</table>\n\n";

// Mostra alcuni record di esempio
$sql2 = "SELECT * FROM `cod_con_img` LIMIT 5";
$stmt2 = $pdo->query($sql2);

echo "<h2>Esempio di 5 record:</h2>\n";
echo "<table border='1' cellpadding='5'>\n";

// Header
$first = true;
while ($row = $stmt2->fetch(PDO::FETCH_ASSOC)) {
    if ($first) {
        echo "<tr>";
        foreach (array_keys($row) as $col) {
            echo "<th>" . htmlspecialchars($col) . "</th>";
        }
        echo "</tr>\n";
        $first = false;
    }

    echo "<tr>";
    foreach ($row as $val) {
        $display = $val === null ? '<em>(NULL)</em>' : htmlspecialchars($val);
        echo "<td>$display</td>";
    }
    echo "</tr>\n";
}
echo "</table>\n";
