<?php
header('Content-Type: text/plain; charset=utf-8');

$baseDir = __DIR__;

// Files to check
$filesToCheck = [
    // Pages
    'pages/translate-process.php',
    'pages/translate-products.php',
    'pages/export-stream-v2.php',
    'pages/export-v2.php',

    // Includes
    'includes/functions.php',
    'includes/config.php'
];

echo "=== FILE SYNCHRONIZATION CHECK ===\n";
echo "Base directory: $baseDir\n";
echo "Checking " . count($filesToCheck) . " files...\n\n";

$issues = [];

foreach ($filesToCheck as $relPath) {
    $fullPath = dirname($baseDir) . '/' . $relPath;

    if (!file_exists($fullPath)) {
        echo "❌ MISSING: $relPath\n";
        $issues[] = $relPath;
        continue;
    }

    $size = filesize($fullPath);
    $modified = date('Y-m-d H:i:s', filemtime($fullPath));

    echo "✓ $relPath\n";
    echo "  Size: $size bytes\n";
    echo "  Modified: $modified\n\n";
}

echo "\n=== SUMMARY ===\n";
if (empty($issues)) {
    echo "All files present on server.\n";
} else {
    echo "Missing files: " . count($issues) . "\n";
    foreach ($issues as $file) {
        echo "  - $file\n";
    }
}

echo "\n=== KEY FILES TO VERIFY ===\n";
echo "translate-process.php should be ~20,541 bytes (with debug)\n";
echo "If it's 20,018 bytes, it's the OLD version!\n";
?>
