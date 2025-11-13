<?php
require_once '../config.php';

$stateFile = DATA_PATH . '/translation-state.json';

if (file_exists($stateFile)) {
    $state = json_decode(file_get_contents($stateFile), true);
    $state['status'] = 'stopped';
    file_put_contents($stateFile, json_encode($state, JSON_PRETTY_PRINT));
    echo "Translation process stopped. State file updated.<br>";
    echo "<a href='translate-products.php'>Go to translate-products.php</a>";
} else {
    echo "No state file found. Process is not running.";
}
