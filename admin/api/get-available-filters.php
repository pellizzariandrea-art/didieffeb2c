<?php
// admin/api/get-available-filters.php - Get Available Filters from Products
header('Content-Type: application/json');

// Include config
$configPath = __DIR__ . '/../config.php';
if (file_exists($configPath)) {
    require_once $configPath;
}

try {
    // Path to products JSON
    $jsonPath = PUBLIC_JSON_PATH;

    if (!file_exists($jsonPath)) {
        throw new Exception('Products JSON file not found');
    }

    $jsonContent = file_get_contents($jsonPath);
    $jsonData = json_decode($jsonContent, true);

    if (!$jsonData) {
        throw new Exception('Invalid JSON data');
    }

    // Support both "products" and "prodotti" keys
    $productsKey = isset($jsonData['products']) ? 'products' : (isset($jsonData['prodotti']) ? 'prodotti' : null);

    if (!$productsKey) {
        throw new Exception('No products found in JSON');
    }

    $products = $jsonData[$productsKey];

    // Extract all unique attribute keys from products
    $attributeKeys = [];
    $attributeStats = [];

    foreach ($products as $product) {
        if (!isset($product['attributi']) || !is_array($product['attributi'])) {
            continue;
        }

        foreach ($product['attributi'] as $attrKey => $attrValue) {
            if (!isset($attributeKeys[$attrKey])) {
                $attributeKeys[$attrKey] = true;
                $attributeStats[$attrKey] = [
                    'count' => 0,
                    'sampleValues' => []
                ];
            }

            // Count products with this attribute
            $attributeStats[$attrKey]['count']++;

            // Collect sample values (max 5)
            if (count($attributeStats[$attrKey]['sampleValues']) < 5) {
                $value = null;

                if (is_array($attrValue)) {
                    // Handle new structure with label/value
                    if (isset($attrValue['value'])) {
                        $valueData = $attrValue['value'];
                        if (is_array($valueData) && isset($valueData['it'])) {
                            $value = $valueData['it'];
                        } else if (!is_bool($valueData)) {
                            $value = (string)$valueData;
                        }
                    }
                } else if (!is_bool($attrValue) && $attrValue !== null && $attrValue !== '') {
                    $value = (string)$attrValue;
                }

                if ($value && !in_array($value, $attributeStats[$attrKey]['sampleValues'])) {
                    $attributeStats[$attrKey]['sampleValues'][] = $value;
                }
            }
        }
    }

    // Convert to array and sort by usage count
    $filters = [];
    foreach ($attributeKeys as $key => $v) {
        $stats = $attributeStats[$key];

        // Skip filters with no real values
        if (empty($stats['sampleValues'])) {
            continue;
        }

        $filters[] = [
            'key' => $key,
            'productCount' => $stats['count'],
            'sampleValues' => $stats['sampleValues'],
            'valueCount' => count($stats['sampleValues'])
        ];
    }

    // Sort by product count (most used first)
    usort($filters, function($a, $b) {
        return $b['productCount'] - $a['productCount'];
    });

    echo json_encode([
        'success' => true,
        'filters' => $filters,
        'totalFilters' => count($filters),
        'totalProducts' => count($products)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
