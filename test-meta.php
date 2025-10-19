<?php
// Test script per verificare la generazione _meta
require_once 'config.php';
require_once 'includes/functions.php';

header('Content-Type: application/json');

$ecommerceConfig = loadEcommerceConfig();

echo json_encode([
    'ecommerce_config_loaded' => !empty($ecommerceConfig),
    'has_filters' => !empty($ecommerceConfig['filters']),
    'filters_count' => isset($ecommerceConfig['filters']) ? count($ecommerceConfig['filters']) : 0,
    'has_categories' => !empty($ecommerceConfig['categories']),
    'categories_count' => isset($ecommerceConfig['categories']) ? count($ecommerceConfig['categories']) : 0,
    'first_filter' => isset($ecommerceConfig['filters'][0]) ? $ecommerceConfig['filters'][0] : null,
], JSON_PRETTY_PRINT);
