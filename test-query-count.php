<?php
// test-query-count.php - Testa la query e conta i risultati
require_once 'config.php';
require_once 'includes/functions.php';

echo "<h1>Test Query Count</h1>\n\n";

// Carica configurazioni
$dbConfig = loadDBConfig();
$tableConfig = loadTableConfig();
$pdo = connectDB($dbConfig);

// Test 1: Conta TUTTI i record senza filtri
$sql1 = "SELECT COUNT(*) FROM `V_B2B_EXPORT_CATALOGO_NEW`
         INNER JOIN `cod_con_img` AS `cod_con_img`
         ON V_B2B_EXPORT_CATALOGO_NEW.codice=cod_con_img.codice_ok";

$count1 = $pdo->query($sql1)->fetchColumn();
echo "<h2>Test 1: Tutti i prodotti con JOIN</h2>\n";
echo "<p><strong>$count1</strong> prodotti</p>\n\n";

// Test 2: Con filtro Pos. Assoluto e Pubblica in web
$sql2 = "SELECT COUNT(*) FROM `V_B2B_EXPORT_CATALOGO_NEW`
         INNER JOIN `cod_con_img` AS `cod_con_img`
         ON V_B2B_EXPORT_CATALOGO_NEW.codice=cod_con_img.codice_ok
         WHERE `Pos. Assoluto` != '999999' AND `Pubblica in web` = 'S'";

$count2 = $pdo->query($sql2)->fetchColumn();
echo "<h2>Test 2: Con filtri base (no default_image)</h2>\n";
echo "<p><strong>$count2</strong> prodotti</p>\n\n";

// Test 3: Conta prodotti con default_image NOT NULL
$sql3 = "SELECT COUNT(*) FROM `V_B2B_EXPORT_CATALOGO_NEW`
         INNER JOIN `cod_con_img` AS `cod_con_img`
         ON V_B2B_EXPORT_CATALOGO_NEW.codice=cod_con_img.codice_ok
         WHERE `cod_con_img`.`default_image` IS NOT NULL";

$count3 = $pdo->query($sql3)->fetchColumn();
echo "<h2>Test 3: Solo con default_image IS NOT NULL</h2>\n";
echo "<p><strong>$count3</strong> prodotti</p>\n\n";

// Test 4: Conta prodotti con default_image NOT NULL AND != ''
$sql4 = "SELECT COUNT(*) FROM `V_B2B_EXPORT_CATALOGO_NEW`
         INNER JOIN `cod_con_img` AS `cod_con_img`
         ON V_B2B_EXPORT_CATALOGO_NEW.codice=cod_con_img.codice_ok
         WHERE `cod_con_img`.`default_image` IS NOT NULL
         AND `cod_con_img`.`default_image` != ''";

$count4 = $pdo->query($sql4)->fetchColumn();
echo "<h2>Test 4: Con default_image IS NOT NULL AND != ''</h2>\n";
echo "<p><strong>$count4</strong> prodotti</p>\n\n";

// Test 5: Query completa con TUTTI i filtri
$sql5 = "SELECT COUNT(*) FROM `V_B2B_EXPORT_CATALOGO_NEW`
         INNER JOIN `cod_con_img` AS `cod_con_img`
         ON V_B2B_EXPORT_CATALOGO_NEW.codice=cod_con_img.codice_ok
         WHERE `Pos. Assoluto` != '999999'
         AND `Pubblica in web` = 'S'
         AND (`cod_con_img`.`default_image` IS NOT NULL AND `cod_con_img`.`default_image` != '')";

$count5 = $pdo->query($sql5)->fetchColumn();
echo "<h2>Test 5: Query completa (tutti i filtri)</h2>\n";
echo "<p><strong>$count5</strong> prodotti</p>\n\n";

// Test 6: Mostra alcuni valori di default_image
$sql6 = "SELECT `cod_con_img`.`default_image`, COUNT(*) as count
         FROM `cod_con_img`
         GROUP BY `cod_con_img`.`default_image`
         ORDER BY count DESC
         LIMIT 10";

echo "<h2>Test 6: Valori di default_image (top 10)</h2>\n";
echo "<table border='1' cellpadding='5'>\n";
echo "<tr><th>default_image</th><th>Count</th></tr>\n";

$stmt = $pdo->query($sql6);
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $val = $row['default_image'] === null ? '(NULL)' : ($row['default_image'] === '' ? '(EMPTY STRING)' : htmlspecialchars($row['default_image']));
    echo "<tr><td>$val</td><td>{$row['count']}</td></tr>\n";
}
echo "</table>\n\n";

// Test 7: Mostra 5 esempi di prodotti con immagine
$sql7 = "SELECT V_B2B_EXPORT_CATALOGO_NEW.codice, `cod_con_img`.`default_image`
         FROM `V_B2B_EXPORT_CATALOGO_NEW`
         INNER JOIN `cod_con_img` AS `cod_con_img`
         ON V_B2B_EXPORT_CATALOGO_NEW.codice=cod_con_img.codice_ok
         WHERE `cod_con_img`.`default_image` IS NOT NULL
         AND `cod_con_img`.`default_image` != ''
         LIMIT 5";

echo "<h2>Test 7: Esempi di prodotti con immagine (5)</h2>\n";
echo "<table border='1' cellpadding='5'>\n";
echo "<tr><th>Codice</th><th>default_image</th></tr>\n";

$stmt = $pdo->query($sql7);
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "<tr><td>{$row['codice']}</td><td>" . htmlspecialchars($row['default_image']) . "</td></tr>\n";
}
echo "</table>\n";
