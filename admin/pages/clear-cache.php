<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== CLEARING PHP CACHE ===\n\n";

// Clear OPcache
if (function_exists('opcache_reset')) {
    $result = opcache_reset();
    echo "OPcache reset: " . ($result ? "SUCCESS" : "FAILED") . "\n";
} else {
    echo "OPcache not available\n";
}

// Clear realpath cache
clearstatcache(true);
echo "Realpath cache cleared\n";

echo "\nDone! Now check the file version again.\n";
?>
