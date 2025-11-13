<?php
require_once '../config.php';

header('Content-Type: text/plain; charset=utf-8');

$productsFile = PUBLIC_JSON_PATH;

echo "=== TEST WRITE PERMISSIONS ===\n\n";
echo "File: $productsFile\n";
echo "Exists: " . (file_exists($productsFile) ? 'YES' : 'NO') . "\n";
echo "Readable: " . (is_readable($productsFile) ? 'YES' : 'NO') . "\n";
echo "Writable: " . (is_writable($productsFile) ? 'YES' : 'NO') . "\n";
echo "Directory writable: " . (is_writable(dirname($productsFile)) ? 'YES' : 'NO') . "\n";

if (file_exists($productsFile)) {
    echo "Size: " . filesize($productsFile) . " bytes\n";
    echo "Owner: " . fileowner($productsFile) . "\n";
    echo "Permissions: " . substr(sprintf('%o', fileperms($productsFile)), -4) . "\n";
}

// Test write
echo "\n=== WRITE TEST ===\n";
$data = json_decode(file_get_contents($productsFile), true);
if ($data) {
    echo "Current products count: " . count($data['prodotti']) . "\n";

    // Try to write the same data back
    $jsonContent = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    echo "Attempting to write " . strlen($jsonContent) . " bytes...\n";

    $result = @file_put_contents($productsFile, $jsonContent);

    if ($result === false) {
        $error = error_get_last();
        echo "FAILED: " . ($error['message'] ?? 'unknown error') . "\n";
    } else {
        echo "SUCCESS: Wrote $result bytes\n";

        // Verify
        clearstatcache();
        $verify = json_decode(file_get_contents($productsFile), true);
        if ($verify && count($verify['prodotti']) === count($data['prodotti'])) {
            echo "VERIFICATION: OK - File intact\n";
        } else {
            echo "VERIFICATION: FAILED - File corrupted\n";
        }
    }
} else {
    echo "ERROR: Could not read products.json\n";
}
?>
