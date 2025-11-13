<?php
require_once '../config.php';

$stateFile = DATA_PATH . '/translation-state.json';

echo "<!DOCTYPE html>";
echo "<html><head><title>Emergency Stop</title>";
echo "<style>
body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
.container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.success { color: #4caf50; font-size: 24px; font-weight: bold; }
.warning { color: #ff9800; font-size: 18px; }
.info { color: #666; margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px; }
.btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; }
.btn:hover { background: #1976D2; }
</style>";
echo "</head><body>";
echo "<div class='container'>";

echo "<h1>🚨 Emergency Stop - Sistema Traduzione</h1>";

if (file_exists($stateFile)) {
    $state = json_decode(file_get_contents($stateFile), true);

    if ($state) {
        $oldStatus = $state['status'];
        $state['status'] = 'stopped';

        $bytesWritten = file_put_contents($stateFile, json_encode($state, JSON_PRETTY_PRINT));

        if ($bytesWritten !== false) {
            echo "<p class='success'>✅ PROCESSO FERMATO CON SUCCESSO!</p>";
            echo "<div class='info'>";
            echo "<strong>Status precedente:</strong> {$oldStatus}<br>";
            echo "<strong>Status nuovo:</strong> stopped<br>";
            echo "<strong>Lingua corrente:</strong> " . strtoupper($state['current_language'] ?? 'N/A') . "<br>";
            echo "<strong>Prodotti processati:</strong> {$state['current_product_index']}/{$state['total_products']}<br>";
            echo "<strong>API calls:</strong> {$state['api_calls']}<br>";
            echo "</div>";

            echo "<p class='warning'>⏳ Il batch corrente potrebbe continuare per 30-60 secondi prima di fermarsi completamente.</p>";
        } else {
            echo "<p class='warning'>❌ ERRORE: Impossibile scrivere il file di stato!</p>";
        }
    } else {
        echo "<p class='warning'>⚠️ File di stato presente ma non valido (JSON corrotto)</p>";
    }
} else {
    echo "<p class='warning'>⚠️ Nessun processo di traduzione attivo (file di stato non trovato)</p>";
}

echo "<a href='/admin/pages/translate-products.php' class='btn'>← Torna alla Traduzione</a>";
echo "</div>";
echo "</body></html>";
?>
