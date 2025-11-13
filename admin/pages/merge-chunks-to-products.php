<?php
require_once '../config.php';

echo "<h2>Merge Chunk Files to products.json</h2>";

// Find all chunk files
$chunkPattern = DATA_PATH . '/export-v2-chunk-*.json';
$chunkFiles = glob($chunkPattern);

if (empty($chunkFiles)) {
    die("❌ No chunk files found!");
}

sort($chunkFiles); // Sort by chunk number

echo "Found " . count($chunkFiles) . " chunk files<br>";

// Load all products from chunks
$allProducts = [];
foreach ($chunkFiles as $file) {
    $chunkData = json_decode(file_get_contents($file), true);
    if (is_array($chunkData)) {
        $allProducts = array_merge($allProducts, $chunkData);
        echo "✓ Loaded " . basename($file) . ": " . count($chunkData) . " products<br>";
    }
}

echo "<br><strong>Total products loaded: " . count($allProducts) . "</strong><br><br>";

// Load existing products.json to get metadata
$productsFile = PUBLIC_JSON_PATH;
$existingData = json_decode(file_get_contents($productsFile), true);

// Create new JSON structure
$newJsonData = [
    'prodotti' => $allProducts,
    'generated_at' => date('c'),
    'total' => count($allProducts),
    'source' => $existingData['source'] ?? [
        'database' => 'web2023_didieffeb2b',
        'table' => 'prodotti'
    ],
    '_meta' => $existingData['_meta'] ?? []
];

// Save to products.json
$jsonContent = json_encode($newJsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
file_put_contents($productsFile, $jsonContent);

echo "✅ <strong>products.json saved successfully!</strong><br>";
echo "File size: " . number_format(strlen($jsonContent)) . " bytes<br>";
echo "Products count: " . count($allProducts) . "<br>";
echo "<br>";
echo "<a href='check-products-count.php'>Verify products count</a><br>";
echo "<a href='translate-products.php'>Go to translate-products</a>";
