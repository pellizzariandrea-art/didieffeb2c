<?php
/**
 * Check version of translate-single.php
 */

header('Content-Type: application/json');

$file = __DIR__ . '/translate-single.php';
$content = file_get_contents($file);

// Find the model line
preg_match("/'model' => (.+),/", $content, $matches);

echo json_encode([
    'file' => $file,
    'file_exists' => file_exists($file),
    'file_size' => filesize($file),
    'last_modified' => date('Y-m-d H:i:s', filemtime($file)),
    'model_line_found' => isset($matches[1]) ? $matches[1] : 'not found',
    'contains_old_model' => strpos($content, 'claude-3-5-sonnet-20241022') !== false ? 'YES - OLD VERSION!' : 'no',
    'contains_settings_model' => strpos($content, "\$settings['model']") !== false ? 'YES - NEW VERSION' : 'no'
], JSON_PRETTY_PRINT);
