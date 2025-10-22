<?php
// Test file to debug wizard-builder access
echo "<h1>Test Wizard Access</h1>";
echo "<pre>";

// Test 1: Check if config.php exists
echo "1. Config path: " . realpath('../config.php') . "\n";
echo "   Exists: " . (file_exists('../config.php') ? 'YES' : 'NO') . "\n\n";

// Test 2: Check if functions.php exists
echo "2. Functions path: " . realpath('../includes/functions.php') . "\n";
echo "   Exists: " . (file_exists('../includes/functions.php') ? 'YES' : 'NO') . "\n\n";

// Test 3: Try to include config
try {
    require_once '../config.php';
    echo "3. Config loaded: SUCCESS\n";
    echo "   BASE_PATH defined: " . (defined('BASE_PATH') ? 'YES' : 'NO') . "\n\n";
} catch (Exception $e) {
    echo "3. Config load FAILED: " . $e->getMessage() . "\n\n";
}

// Test 4: Try to include functions
try {
    require_once '../includes/functions.php';
    echo "4. Functions loaded: SUCCESS\n\n";
} catch (Exception $e) {
    echo "4. Functions load FAILED: " . $e->getMessage() . "\n\n";
}

// Test 5: Show current directory
echo "5. Current directory: " . __DIR__ . "\n";
echo "   File: " . __FILE__ . "\n\n";

// Test 6: List parent directory
echo "6. Parent directory contents:\n";
$parent = dirname(__DIR__);
if (is_dir($parent)) {
    $files = scandir($parent);
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            echo "   - $file\n";
        }
    }
}

echo "</pre>";
?>
