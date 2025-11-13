<?php
// Test traduzione singolo prodotto
require_once '../config.php';
require_once '../includes/functions.php';

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Traduzioni</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1e1e1e; color: #00ff00; }
        .success { color: #00ff00; }
        .error { color: #ff6b6b; }
        .warning { color: #ffa726; }
        .info { color: #64b5f6; }
        .timing { color: #ffeb3b; }
        pre { background: #2d2d2d; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🧪 Test Traduzioni Prodotto</h1>
    <hr>

<?php

$startTime = microtime(true);

echo "<div class='info'>📋 Caricamento configurazioni...</div>\n";
flush();

$translationSettings = loadTranslationSettings();
$dbConfig = loadDBConfig();
$mappingConfig = loadMappingConfig();

if (empty($translationSettings['api_key'])) {
    echo "<div class='error'>❌ API Key non configurata!</div>\n";
    exit;
}

echo "<div class='success'>✅ API Key trovata: " . substr($translationSettings['api_key'], 0, 10) . "...</div>\n";
echo "<div class='info'>🌍 Lingue configurate: " . implode(', ', $translationSettings['languages']) . "</div>\n";
echo "<div class='info'>🤖 Modello: " . ($translationSettings['translation_model'] ?? 'claude-haiku-4-5-20251001') . "</div>\n";
flush();

echo "<hr>\n";
echo "<div class='info'>📦 Fetch prodotto di test dal database...</div>\n";
flush();

// Fetch un singolo prodotto
$rows = fetchProducts($dbConfig, 1);

if (empty($rows)) {
    echo "<div class='error'>❌ Nessun prodotto trovato nel database!</div>\n";
    exit;
}

$row = $rows[0];
$product = transformRow($row, $mappingConfig);

echo "<div class='success'>✅ Prodotto caricato:</div>\n";
echo "<pre>";
echo "Codice: " . ($product['codice'] ?? 'N/A') . "\n";
echo "Nome: " . ($product['nome'] ?? 'N/A') . "\n";
echo "Descrizione: " . substr($product['descrizione'] ?? 'N/A', 0, 100) . "...\n";
echo "</pre>\n";
flush();

echo "<hr>\n";
echo "<h2>🌐 Test Traduzioni</h2>\n";

$languages = $translationSettings['languages'];
$apiKey = $translationSettings['api_key'];

$testText = $product['nome'] ?? 'Prodotto di test';

echo "<div class='info'>📝 Testo da tradurre: <strong>" . htmlspecialchars($testText) . "</strong></div>\n";
echo "<br>\n";
flush();

$totalTime = 0;
$successCount = 0;
$errorCount = 0;

foreach ($languages as $lang) {
    if ($lang === 'it') continue; // Skip italiano

    echo "<div class='info'>🔄 Traduzione in <strong>" . strtoupper($lang) . "</strong>...</div>\n";
    flush();

    $langStartTime = microtime(true);

    try {
        $translation = translateText($testText, $lang, $apiKey);
        $langDuration = round((microtime(true) - $langStartTime) * 1000);
        $totalTime += $langDuration;

        if ($translation === $testText) {
            echo "<div class='warning'>⚠️ Traduzione fallita (testo invariato)</div>\n";
            $errorCount++;
        } else {
            echo "<div class='success'>✅ Successo (" . $langDuration . "ms): " . htmlspecialchars($translation) . "</div>\n";
            $successCount++;
        }
    } catch (Exception $e) {
        $langDuration = round((microtime(true) - $langStartTime) * 1000);
        $totalTime += $langDuration;
        echo "<div class='error'>❌ Errore (" . $langDuration . "ms): " . htmlspecialchars($e->getMessage()) . "</div>\n";
        $errorCount++;
    }

    echo "<br>\n";
    flush();
}

$totalDuration = round((microtime(true) - $startTime) * 1000);

echo "<hr>\n";
echo "<h2>📊 Risultati</h2>\n";
echo "<div class='timing'>⏱️ Tempo totale: " . $totalDuration . "ms</div>\n";
echo "<div class='timing'>⏱️ Tempo API: " . $totalTime . "ms</div>\n";
echo "<div class='success'>✅ Traduzioni riuscite: " . $successCount . "</div>\n";
echo "<div class='error'>❌ Traduzioni fallite: " . $errorCount . "</div>\n";

if ($successCount > 0) {
    echo "<br><div class='success'>🎉 Test superato! Le traduzioni funzionano correttamente.</div>\n";
} else {
    echo "<br><div class='error'>💥 Test fallito! Tutte le traduzioni hanno problemi.</div>\n";
}

echo "<hr>\n";
echo "<div class='info'>🔍 Per vedere i log dettagliati:</div>\n";
echo "<div class='info'>- <a href='fatal-errors-log.php' style='color: #64b5f6;'>Fatal Errors Log</a></div>\n";
echo "<div class='info'>- File: admin/data/translation-debug.log</div>\n";

?>

<hr>
<a href="export-v2.php" style="color: #64b5f6;">← Torna all'export</a>

</body>
</html>
