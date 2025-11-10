<?php
// config.example.php - Template di configurazione
// ⚠️ COPIA QUESTO FILE COME config.php E MODIFICA LE CREDENZIALI
// ⚠️ NON COMMITTARE config.php SU GIT!

ob_start(); // Cattura eventuali output indesiderati
session_start();

// Percorsi
define('BASE_PATH', __DIR__);
define('DATA_PATH', BASE_PATH . '/data');
define('PUBLIC_JSON_PATH', dirname(BASE_PATH) . '/data/products.json');
define('ADMIN_URL', '/admin/');

// ============================================================
// CONFIGURAZIONE DATABASE SITEGROUND
// ============================================================
// ⚠️ MODIFICA QUESTI VALORI CON LE TUE CREDENZIALI SITEGROUND
// Trovi le credenziali su: Site Tools → MySQL → phpMyAdmin

define('DB_HOST', 'localhost');              // Di solito 'localhost' su SiteGround
define('DB_PORT', '3306');                   // Porta standard MySQL
define('DB_NAME', 'dbepwcaa7nyeyf');         // ← MODIFICA: Il nome del tuo database
define('DB_USER', 'ux6inage91l33');          // ← MODIFICA: Il tuo username database
define('DB_PASS', 'fbksamt3tdo9');           // ← MODIFICA: La tua password database
define('DB_TABLE', 'V_B2B_EXPORT_CATALOGO_NEW'); // Nome tabella view

// ============================================================
// CONFIGURAZIONE AMBIENTE
// ============================================================
define('ENVIRONMENT', 'production'); // 'development' o 'production'

// Error reporting (cambia in development per debug)
if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// ============================================================
// CREAZIONE CARTELLE
// ============================================================
// Crea cartelle se non esistono
if (!file_exists(DATA_PATH)) {
    mkdir(DATA_PATH, 0755, true);
}

if (!file_exists(dirname(PUBLIC_JSON_PATH))) {
    mkdir(dirname(PUBLIC_JSON_PATH), 0755, true);
}

// ============================================================
// FUNZIONI DATABASE
// ============================================================

/**
 * Carica configurazione DB salvata
 */
function loadDBConfig() {
    $configFile = DATA_PATH . '/db-config.json';
    if (file_exists($configFile)) {
        return json_decode(file_get_contents($configFile), true);
    }
    return [
        'host' => DB_HOST,
        'port' => DB_PORT,
        'dbname' => DB_NAME,
        'username' => DB_USER,
        'password' => DB_PASS,
        'table' => DB_TABLE
    ];
}

/**
 * Connessione database
 */
function getDBConnection() {
    $config = loadDBConfig();
    try {
        $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['dbname']};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        return new PDO($dsn, $config['username'], $config['password'], $options);
    } catch (PDOException $e) {
        error_log("Database connection error: " . $e->getMessage());
        throw new Exception("Errore di connessione al database");
    }
}

// ============================================================
// FUNZIONI UTILITY
// ============================================================

/**
 * Logga attività admin
 */
function logActivity($message) {
    $logFile = DATA_PATH . '/activity.log';
    $timestamp = date('Y-m-d H:i:s');
    $user = $_SESSION['admin_user'] ?? 'guest';
    $entry = "[$timestamp] [$user] $message\n";
    file_put_contents($logFile, $entry, FILE_APPEND);
}

/**
 * Verifica autenticazione
 */
function requireAuth() {
    if (!isset($_SESSION['admin_authenticated']) || $_SESSION['admin_authenticated'] !== true) {
        header('Location: /admin/');
        exit;
    }
}

/**
 * Escape output HTML
 */
function e($string) {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

/**
 * Ritorna base URL
 */
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    return $protocol . '://' . $host;
}
