<?php
// admin/pages/check-wizard-file.php - Diagnostic tool to verify wizard-builder.php content
echo "<!DOCTYPE html>";
echo "<html><head><meta charset='UTF-8'><title>Wizard File Check</title></head><body>";
echo "<h1>Wizard Builder File Check</h1>";
echo "<pre>";

$file = __DIR__ . '/wizard-builder.php';
echo "Looking for: $file\n\n";

if (file_exists($file)) {
    echo "✓ File EXISTS\n";
    echo "File size: " . filesize($file) . " bytes\n";
    echo "Last modified: " . date("Y-m-d H:i:s", filemtime($file)) . "\n\n";

    $lines = file($file);
    echo "Total lines: " . count($lines) . "\n\n";
    echo "========================================\n";
    echo "First 25 lines of wizard-builder.php:\n";
    echo "========================================\n\n";

    for ($i = 0; $i < min(25, count($lines)); $i++) {
        printf("%3d: %s", $i + 1, htmlspecialchars($lines[$i]));
    }

    echo "\n========================================\n";
    echo "File starts with '<?php': " . (strpos($lines[0], '<?php') !== false ? 'YES ✓' : 'NO ✗') . "\n";
    echo "Contains 'require_once': " . (strpos(file_get_contents($file), 'require_once') !== false ? 'YES ✓' : 'NO ✗') . "\n";
    echo "Contains 'BASE_PATH': " . (strpos(file_get_contents($file), 'BASE_PATH') !== false ? 'YES ✓' : 'NO ✗') . "\n";
    echo "Contains 'No direct script': " . (strpos(file_get_contents($file), 'No direct script') !== false ? 'YES (OLD VERSION!) ✗' : 'NO ✓') . "\n";
} else {
    echo "✗ File NOT FOUND!\n";
    echo "\nDirectory contents:\n";
    $dir = __DIR__;
    $files = scandir($dir);
    foreach ($files as $f) {
        if ($f != '.' && $f != '..') {
            echo "  - $f\n";
        }
    }
}

echo "</pre>";
echo "</body></html>";
?>
