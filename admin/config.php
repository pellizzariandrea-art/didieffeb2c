<?php
// config.php - Configurazione base
ob_start(); // Cattura eventuali output indesiderati
session_start();

// Percorsi
define('BASE_PATH', __DIR__);
define('DATA_PATH', BASE_PATH . '/data');
define('PUBLIC_JSON_PATH', dirname(BASE_PATH) . '/data/products.json');
define('ADMIN_URL', '/admin/');

// Configurazione Database SiteGround
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'dbepwcaa7nyeyf');
define('DB_USER', 'ux6inage91l33');
define('DB_PASS', 'fbksamt3tdo9');
define('DB_TABLE', 'V_B2B_EXPORT_CATALOGO_NEW');

// Crea cartelle se non esistono
if (!file_exists(DATA_PATH)) {
    mkdir(DATA_PATH, 0755, true);
}

if (!file_exists(dirname(PUBLIC_JSON_PATH))) {
    mkdir(dirname(PUBLIC_JSON_PATH), 0755, true);
}

// Carica configurazione DB salvata
function loadDBConfig() {
    $configFile = DATA_PATH . '/db-config.json';
    if (file_exists($configFile)) {
        return json_decode(file_get_contents($configFile), true);
    }

    // Ritorna config di default se non esiste
    return [
        'host' => DB_HOST,
        'port' => DB_PORT,
        'database' => DB_NAME,
        'username' => DB_USER,
        'password' => DB_PASS,
        'table' => DB_TABLE
    ];
}

// Salva configurazione DB
function saveDBConfig($config) {
    $configFile = DATA_PATH . '/db-config.json';
    file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
}

// Carica mapping salvato
function loadMappingConfig() {
    $mappingFile = DATA_PATH . '/mapping-config.json';
    if (file_exists($mappingFile)) {
        return json_decode(file_get_contents($mappingFile), true);
    }
    return null;
}

// Salva mapping
function saveMappingConfig($mapping) {
    $mappingFile = DATA_PATH . '/mapping-config.json';
    file_put_contents($mappingFile, json_encode($mapping, JSON_PRETTY_PRINT));
}

// Funzione di log
function logActivity($message) {
    $logFile = DATA_PATH . '/activity.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}
?>
