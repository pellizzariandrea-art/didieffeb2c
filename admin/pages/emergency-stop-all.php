<?php
require_once '../config.php';

echo "<h2>🛑 Emergency Stop - Ferma TUTTO</h2>";

// 1. Ferma translation state
$translationStateFile = DATA_PATH . '/translation-state.json';
if (file_exists($translationStateFile)) {
    $state = json_decode(file_get_contents($translationStateFile), true);
    $state['status'] = 'stopped';
    file_put_contents($translationStateFile, json_encode($state, JSON_PRETTY_PRINT));
    echo "✅ Translation state → STOPPED<br>";
} else {
    echo "⚪ Translation state file not found<br>";
}

// 2. Ferma export state
$exportStateFile = DATA_PATH . '/export-v2-state.json';
if (file_exists($exportStateFile)) {
    $state = json_decode(file_get_contents($exportStateFile), true);
    $state['status'] = 'stopped';
    file_put_contents($exportStateFile, json_encode($state, JSON_PRETTY_PRINT));
    echo "✅ Export state → STOPPED<br>";
} else {
    echo "⚪ Export state file not found<br>";
}

// 3. Rimuovi eventuali lock file
$lockFiles = [
    DATA_PATH . '/translation.lock',
    DATA_PATH . '/export.lock',
    DATA_PATH . '/export-v2.lock'
];

foreach ($lockFiles as $lockFile) {
    if (file_exists($lockFile)) {
        unlink($lockFile);
        echo "✅ Removed lock file: " . basename($lockFile) . "<br>";
    }
}

echo "<br><strong>🎯 TUTTO FERMATO!</strong><br><br>";

echo "Ora puoi:<br>";
echo "• <a href='translate-products.php'>Aprire translate-products.php</a><br>";
echo "• <a href='export-v2.php'>Aprire export-v2.php</a><br>";
echo "<br>";
echo "<strong>⚠️ Se il server è ancora lento, contatta l'hosting per riavviare PHP-FPM</strong>";
