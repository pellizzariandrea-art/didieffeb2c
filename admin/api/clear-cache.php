<?php
/**
 * Clear OPcache
 */

$result = [];

// Clear OPcache
if (function_exists('opcache_reset')) {
    opcache_reset();
    $result['opcache'] = 'cleared';
} else {
    $result['opcache'] = 'not available';
}

// Clear realpath cache
clearstatcache(true);
$result['statcache'] = 'cleared';

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'cache_cleared' => $result,
    'timestamp' => date('Y-m-d H:i:s')
], JSON_PRETTY_PRINT);
