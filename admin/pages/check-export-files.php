<?php
require_once '../config.php';

echo "<h2>Export Files Check</h2>";

// Check main products.json
$productsFile = PUBLIC_JSON_PATH;
if (file_exists($productsFile)) {
    $data = json_decode(file_get_contents($productsFile), true);
    echo "✅ <strong>products.json</strong>: " . count($data['prodotti']) . " products, " . number_format(filesize($productsFile)) . " bytes<br>";
    echo "   Last modified: " . date('Y-m-d H:i:s', filemtime($productsFile)) . "<br><br>";
}

// Check temporary file
$tempFile = PUBLIC_JSON_PATH . '.tmp';
if (file_exists($tempFile)) {
    $data = json_decode(file_get_contents($tempFile), true);
    echo "✅ <strong>products.json.tmp</strong>: " . count($data['prodotti'] ?? []) . " products, " . number_format(filesize($tempFile)) . " bytes<br>";
    echo "   Last modified: " . date('Y-m-d H:i:s', filemtime($tempFile)) . "<br><br>";
} else {
    echo "❌ products.json.tmp: NOT FOUND<br><br>";
}

// Check chunk files
$chunkPattern = DATA_PATH . '/export-v2-chunk-*.json';
$chunkFiles = glob($chunkPattern);

if (!empty($chunkFiles)) {
    echo "<strong>Chunk files found:</strong><br>";
    $totalChunkProducts = 0;
    foreach ($chunkFiles as $file) {
        $data = json_decode(file_get_contents($file), true);
        $count = is_array($data) ? count($data) : 0;
        $totalChunkProducts += $count;
        echo "  • " . basename($file) . ": $count products<br>";
    }
    echo "<br><strong>Total products in chunks: $totalChunkProducts</strong><br><br>";
} else {
    echo "❌ No chunk files found<br><br>";
}

// Check export state
$stateFile = DATA_PATH . '/export-v2-state.json';
if (file_exists($stateFile)) {
    $state = json_decode(file_get_contents($stateFile), true);
    echo "<strong>Export state:</strong><br>";
    echo "  Status: " . ($state['status'] ?? 'unknown') . "<br>";
    echo "  Total products: " . ($state['total_products'] ?? 'unknown') . "<br>";
    echo "  Completed: " . ($state['completed_products'] ?? 'unknown') . "<br>";
} else {
    echo "❌ No export state file<br>";
}
