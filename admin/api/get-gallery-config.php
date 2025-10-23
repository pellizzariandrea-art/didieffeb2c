<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';
require_once '../includes/functions.php';

try {
    // Carica configurazione mapping
    $mappingConfig = loadMappingConfig();

    if (!$mappingConfig) {
        echo json_encode([
            'success' => false,
            'error' => 'Mapping configuration not found'
        ]);
        exit;
    }

    // Estrai solo gli attributi con useForGallery = true
    $galleryAttributes = [];

    foreach ($mappingConfig as $mapping) {
        if ($mapping['isAttribute'] && !empty($mapping['useForGallery'])) {
            $galleryAttributes[] = [
                'name' => $mapping['attributeName'],
                'dbColumn' => $mapping['dbColumn'] ?? '',
                'isBoolean' => $mapping['isBoolean'] ?? false,
                'transform' => $mapping['transform'] ?? ''
            ];
        }
    }

    // Limita a max 2 attributi
    $galleryAttributes = array_slice($galleryAttributes, 0, 2);

    echo json_encode([
        'success' => true,
        'galleryAttributes' => $galleryAttributes,
        'count' => count($galleryAttributes)
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
