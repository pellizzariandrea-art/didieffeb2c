<?php
// cron/auto-sync.php - Auto sync per Cron Job
// Comando Cron: */6 * * * * php /path/to/admin/cron/auto-sync.php

require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/includes/functions.php';

try {
    $dbConfig = loadDBConfig();
    $mappingConfig = loadMappingConfig();

    if (!$dbConfig || !$mappingConfig) {
        throw new Exception("Configurazione mancante");
    }

    $jsonData = generateProductsJSON($dbConfig, $mappingConfig);
    savePublicJSON($jsonData);

    logActivity("Auto-sync completato: {$jsonData['total']} prodotti");

    echo "SUCCESS: {$jsonData['total']} prodotti esportati\n";
    echo "Generated at: {$jsonData['generated_at']}\n";
} catch (Exception $e) {
    logActivity("Auto-sync ERRORE: " . $e->getMessage());
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>
