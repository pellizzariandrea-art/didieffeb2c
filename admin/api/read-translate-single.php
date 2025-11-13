<?php
/**
 * Read translate-single.php and show model configuration
 */

header('Content-Type: text/plain');

$file = __DIR__ . '/translate-single.php';
$content = file_get_contents($file);

echo "=== TRANSLATE-SINGLE.PHP CONTENT CHECK ===\n\n";
echo "File: $file\n";
echo "Size: " . filesize($file) . " bytes\n";
echo "Modified: " . date('Y-m-d H:i:s', filemtime($file)) . "\n\n";

echo "=== SEARCHING FOR MODEL CONFIGURATION ===\n\n";

// Find model line
$lines = explode("\n", $content);
$modelLine = null;
$lineNum = 0;

foreach ($lines as $i => $line) {
    if (strpos($line, "'model'") !== false || strpos($line, 'translation_model') !== false) {
        echo "Line " . ($i + 1) . ": " . trim($line) . "\n";
    }
    if (strpos($line, 'claude-3-5-sonnet-20241022') !== false) {
        echo "\n*** FOUND OLD MODEL on line " . ($i + 1) . " ***\n";
        echo "Line: " . trim($line) . "\n";
    }
}

echo "\n=== CHECKING FOR SPECIFIC STRINGS ===\n\n";
echo "Contains 'claude-3-5-sonnet-20241022': " . (strpos($content, 'claude-3-5-sonnet-20241022') !== false ? 'YES (OLD!)' : 'no') . "\n";
echo "Contains 'claude-haiku-4-5-20251001': " . (strpos($content, 'claude-haiku-4-5-20251001') !== false ? 'YES' : 'no') . "\n";
echo "Contains 'translation_model': " . (strpos($content, 'translation_model') !== false ? 'YES (NEW!)' : 'no') . "\n";
echo "Contains '\$settings['model']': " . (strpos($content, "\$settings['model']") !== false ? 'YES' : 'no') . "\n";
