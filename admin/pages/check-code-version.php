<?php
header('Content-Type: text/plain; charset=utf-8');

$file = __DIR__ . '/translate-process.php';

echo "=== CODE VERSION CHECK ===\n\n";
echo "File: $file\n";
echo "Exists: " . (file_exists($file) ? 'YES' : 'NO') . "\n";
echo "Size: " . filesize($file) . " bytes\n";
echo "Modified: " . date('Y-m-d H:i:s', filemtime($file)) . "\n\n";

$content = file_get_contents($file);

// Check for specific markers
$checks = [
    'Has "File operation details"' => strpos($content, 'File operation details') !== false,
    'Has "writing directly to products.json"' => strpos($content, 'writing directly to products.json') !== false,
    'Has old copy() method' => strpos($content, 'copy($productsTmp, $productsFile)') !== false,
    'Has file_put_contents($productsFile)' => strpos($content, 'file_put_contents($productsFile, $jsonContent)') !== false,
];

echo "=== CODE CHECKS ===\n";
foreach ($checks as $check => $result) {
    echo "$check: " . ($result ? 'YES ✓' : 'NO ✗') . "\n";
}

echo "\n=== FINAL SAVE SECTION ===\n";
// Extract the final save section
if (preg_match('/Check if completed.*?(\$state\[.status.\] = .completed.)/s', $content, $match)) {
    $section = substr($match[0], 0, 500);
    echo $section . "\n...\n";
} else {
    echo "Could not extract final save section\n";
}
?>
