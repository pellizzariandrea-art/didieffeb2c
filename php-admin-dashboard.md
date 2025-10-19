# 🚀 ADMIN DASHBOARD PHP - SITEGROUND

## 📋 OVERVIEW

Sistema Admin in **PHP puro** per Siteground che:
- Si connette a MySQL locale (nessun problema IP)
- Mappa colonne DB → JSON con attributi dinamici
- Genera `products.json` pubblico
- UI moderna e semplice
- Zero dipendenze esterne

---

## 📁 STRUTTURA FILE

```
/public_html/admin/
├── index.php                   # Dashboard home
├── config.php                  # Configurazione DB
├── pages/
│   ├── connection.php         # Step 1: Test connessione
│   ├── mapping.php            # Step 2: Mapping campi
│   ├── preview.php            # Step 3: Preview JSON
│   └── export.php             # Step 4: Export
├── includes/
│   ├── header.php             # Header HTML
│   ├── footer.php             # Footer HTML
│   └── functions.php          # Funzioni PHP
├── assets/
│   ├── style.css              # CSS
│   └── script.js              # JavaScript
├── data/
│   ├── db-config.json         # Config DB salvata
│   └── mapping-config.json    # Mapping salvato
└── .htaccess                  # Protezione cartella

/public_html/data/
└── products.json              # JSON generato (pubblico)
```

---

## 🔧 FILE 1: config.php

```php
<?php
// config.php - Configurazione base
session_start();

// Percorsi
define('BASE_PATH', __DIR__);
define('DATA_PATH', BASE_PATH . '/data');
define('PUBLIC_JSON_PATH', dirname(BASE_PATH) . '/data/products.json');

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
    return null;
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
```

---

## 🔧 FILE 2: includes/functions.php

```php
<?php
// includes/functions.php - Funzioni database e trasformazioni

// Connessione database
function connectDB($config) {
    try {
        $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset=utf8mb4";
        $pdo = new PDO($dsn, $config['username'], $config['password']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        throw new Exception("Errore connessione: " . $e->getMessage());
    }
}

// Test connessione
function testConnection($config) {
    try {
        $pdo = connectDB($config);
        return ['success' => true, 'message' => 'Connessione riuscita!'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// Lista tabelle
function getTables($config) {
    $pdo = connectDB($config);
    $stmt = $pdo->query("SHOW TABLES");
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

// Colonne tabella
function getTableColumns($config, $table) {
    $pdo = connectDB($config);
    $stmt = $pdo->query("SHOW COLUMNS FROM `$table`");
    $columns = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $columns[] = [
            'name' => $row['Field'],
            'type' => $row['Type'],
            'nullable' => $row['Null'] === 'YES'
        ];
    }
    
    return $columns;
}

// Fetch prodotti
function fetchProducts($config, $limit = null) {
    $pdo = connectDB($config);
    $table = $config['table'];
    
    $sql = "SELECT * FROM `$table`";
    if ($limit) {
        $sql .= " LIMIT " . intval($limit);
    }
    
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Applica trasformazione
function applyTransform($value, $transform) {
    if (empty($transform) || $value === null) {
        return $value;
    }
    
    switch ($transform) {
        case 'parseFloat':
            return floatval($value);
        case 'parseInt':
            return intval($value);
        case 'toUpperCase':
            return strtoupper($value);
        case 'toLowerCase':
            return strtolower($value);
        case 'trim':
            return trim($value);
        default:
            return $value;
    }
}

// Trasforma riga
function transformRow($row, $mappings) {
    $product = ['attributi' => []];
    
    foreach ($mappings as $mapping) {
        $dbColumn = $mapping['dbColumn'];
        $value = isset($row[$dbColumn]) ? $row[$dbColumn] : null;
        
        // Applica trasformazione
        if (!empty($mapping['transform'])) {
            $value = applyTransform($value, $mapping['transform']);
        }
        
        // Assegna al campo giusto
        if ($mapping['isAttribute'] && !empty($mapping['attributeName'])) {
            $product['attributi'][$mapping['attributeName']] = $value;
        } else {
            $product[$mapping['targetField']] = $value;
        }
    }
    
    return $product;
}

// Genera JSON completo
function generateProductsJSON($config, $mappings) {
    $rows = fetchProducts($config);
    $products = [];
    
    foreach ($rows as $row) {
        $products[] = transformRow($row, $mappings);
    }
    
    $output = [
        'prodotti' => $products,
        'generated_at' => date('c'),
        'total' => count($products),
        'source' => [
            'database' => $config['database'],
            'table' => $config['table']
        ]
    ];
    
    return $output;
}

// Salva JSON pubblico
function savePublicJSON($jsonData) {
    $json = json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    file_put_contents(PUBLIC_JSON_PATH, $json);
    
    // Crea .htaccess per CORS
    $htaccess = dirname(PUBLIC_JSON_PATH) . '/.htaccess';
    if (!file_exists($htaccess)) {
        $htaccessContent = <<<EOT
Header set Access-Control-Allow-Origin "*"
Header set Content-Type "application/json"
<Files "products.json">
    Require all granted
</Files>
EOT;
        file_put_contents($htaccess, $htaccessContent);
    }
    
    return true;
}
?>
```

---

## 🎨 FILE 3: includes/header.php

```php
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - E-Commerce AI</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            font-size: 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .nav {
            display: flex;
            gap: 10px;
        }
        
        .nav a {
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            text-decoration: none;
            color: #fff;
            transition: all 0.3s;
        }
        
        .nav a:hover, .nav a.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 20px;
        }
        
        .card h2 {
            margin-bottom: 20px;
            color: #667eea;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #a0a0b8;
            font-size: 14px;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            color: #fff;
            font-size: 16px;
        }
        
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 10px;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .alert {
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .alert-success {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid rgba(76, 175, 80, 0.5);
            color: #4caf50;
        }
        
        .alert-error {
            background: rgba(244, 67, 54, 0.2);
            border: 1px solid rgba(244, 67, 54, 0.5);
            color: #f44336;
        }
        
        .alert-warning {
            background: rgba(255, 152, 0, 0.2);
            border: 1px solid rgba(255, 152, 0, 0.5);
            color: #ff9800;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        table th, table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        table th {
            background: rgba(102, 126, 234, 0.2);
            color: #667eea;
            font-weight: 600;
        }
        
        .mapping-row {
            display: grid;
            grid-template-columns: 2fr 1fr 2fr 2fr 1fr;
            gap: 10px;
            align-items: center;
            margin-bottom: 10px;
            padding: 15px;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 10px;
        }
        
        .mapping-row.attribute {
            background: rgba(118, 75, 162, 0.1);
        }
        
        pre {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 10px;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .stat-box {
            background: rgba(102, 126, 234, 0.1);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            color: #a0a0b8;
            margin-top: 5px;
        }
        
        .badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .badge-success {
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
        }
        
        .badge-warning {
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Admin Dashboard - E-Commerce AI</h1>
            <div class="nav">
                <a href="index.php" <?php if(basename($_SERVER['PHP_SELF']) == 'index.php') echo 'class="active"'; ?>>Home</a>
                <a href="pages/connection.php" <?php if(basename($_SERVER['PHP_SELF']) == 'connection.php') echo 'class="active"'; ?>>Connessione</a>
                <a href="pages/mapping.php" <?php if(basename($_SERVER['PHP_SELF']) == 'mapping.php') echo 'class="active"'; ?>>Mapping</a>
                <a href="pages/preview.php" <?php if(basename($_SERVER['PHP_SELF']) == 'preview.php') echo 'class="active"'; ?>>Preview</a>
                <a href="pages/export.php" <?php if(basename($_SERVER['PHP_SELF']) == 'export.php') echo 'class="active"'; ?>>Export</a>
            </div>
        </div>
```

---

## 🔧 FILE 4: includes/footer.php

```php
    </div>
</body>
</html>
```

---

## 🏠 FILE 5: index.php

```php
<?php
require_once 'config.php';
require_once 'includes/functions.php';
include 'includes/header.php';

$dbConfig = loadDBConfig();
$mappingConfig = loadMappingConfig();
?>

<div class="card">
    <h2>Dashboard Overview</h2>
    
    <div class="stats">
        <div class="stat-box">
            <div class="stat-number">
                <?php echo $dbConfig ? '✓' : '✗'; ?>
            </div>
            <div class="stat-label">Database Configurato</div>
        </div>
        
        <div class="stat-box">
            <div class="stat-number">
                <?php echo $mappingConfig ? count($mappingConfig) : '0'; ?>
            </div>
            <div class="stat-label">Campi Mappati</div>
        </div>
        
        <div class="stat-box">
            <div class="stat-number">
                <?php 
                if (file_exists(PUBLIC_JSON_PATH)) {
                    $json = json_decode(file_get_contents(PUBLIC_JSON_PATH), true);
                    echo isset($json['total']) ? $json['total'] : '0';
                } else {
                    echo '0';
                }
                ?>
            </div>
            <div class="stat-label">Prodotti Esportati</div>
        </div>
        
        <div class="stat-box">
            <div class="stat-number">
                <?php 
                if (file_exists(PUBLIC_JSON_PATH)) {
                    $json = json_decode(file_get_contents(PUBLIC_JSON_PATH), true);
                    if (isset($json['generated_at'])) {
                        $date = new DateTime($json['generated_at']);
                        echo $date->format('d/m');
                    } else {
                        echo '-';
                    }
                } else {
                    echo '-';
                }
                ?>
            </div>
            <div class="stat-label">Ultimo Export</div>
        </div>
    </div>
</div>

<div class="card">
    <h2>Quick Actions</h2>
    
    <?php if (!$dbConfig): ?>
        <div class="alert alert-warning">
            ⚠️ Devi prima configurare la connessione al database
        </div>
        <a href="pages/connection.php" class="btn">Configura Database</a>
    <?php elseif (!$mappingConfig): ?>
        <div class="alert alert-warning">
            ⚠️ Devi mappare i campi del database
        </div>
        <a href="pages/mapping.php" class="btn">Configura Mapping</a>
    <?php else: ?>
        <div class="alert alert-success">
            ✓ Sistema configurato correttamente!
        </div>
        <a href="pages/export.php" class="btn">Genera JSON Prodotti</a>
        <a href="pages/preview.php" class="btn btn-secondary">Preview Dati</a>
    <?php endif; ?>
</div>

<?php if (file_exists(PUBLIC_JSON_PATH)): ?>
<div class="card">
    <h2>JSON Pubblico</h2>
    <p>Il file JSON è accessibile pubblicamente a questo URL:</p>
    <pre><?php 
    $domain = $_SERVER['HTTP_HOST'];
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    echo "$protocol://$domain/data/products.json"; 
    ?></pre>
    <a href="/data/products.json" target="_blank" class="btn">Visualizza JSON</a>
</div>
<?php endif; ?>

<?php include 'includes/footer.php'; ?>
```

---

## 🔧 FILE 6: pages/connection.php

```php
<?php
require_once '../config.php';
require_once '../includes/functions.php';

$message = '';
$messageType = '';
$tables = [];

// Carica config esistente
$savedConfig = loadDBConfig();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action']) && $_POST['action'] === 'test') {
        // Test connessione
        $config = [
            'host' => $_POST['host'],
            'port' => $_POST['port'],
            'database' => $_POST['database'],
            'username' => $_POST['username'],
            'password' => $_POST['password']
        ];
        
        $result = testConnection($config);
        
        if ($result['success']) {
            $messageType = 'success';
            $message = $result['message'];
            $tables = getTables($config);
            
            // Salva config temporanea in sessione
            $_SESSION['temp_db_config'] = $config;
        } else {
            $messageType = 'error';
            $message = $result['message'];
        }
    }
    
    if (isset($_POST['action']) && $_POST['action'] === 'save') {
        // Salva configurazione finale
        $config = $_SESSION['temp_db_config'];
        $config['table'] = $_POST['table'];
        
        saveDBConfig($config);
        logActivity("Configurazione database salvata per tabella: {$config['table']}");
        
        header('Location: mapping.php');
        exit;
    }
}

include '../includes/header.php';
?>

<div class="card">
    <h2>Step 1: Connessione Database</h2>
    
    <?php if ($message): ?>
        <div class="alert alert-<?php echo $messageType; ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>
    
    <form method="POST">
        <input type="hidden" name="action" value="test">
        
        <div class="form-group">
            <label>Host Database</label>
            <input type="text" name="host" value="<?php echo $savedConfig['host'] ?? 'localhost'; ?>" required>
            <small style="color: #a0a0b8;">Su Siteground di solito è "localhost"</small>
        </div>
        
        <div class="form-group">
            <label>Porta</label>
            <input type="number" name="port" value="<?php echo $savedConfig['port'] ?? '3306'; ?>" required>
        </div>
        
        <div class="form-group">
            <label>Nome Database</label>
            <input type="text" name="database" value="<?php echo $savedConfig['database'] ?? ''; ?>" required>
        </div>
        
        <div class="form-group">
            <label>Username</label>
            <input type="text" name="username" value="<?php echo $savedConfig['username'] ?? ''; ?>" required>
        </div>
        
        <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" value="<?php echo $savedConfig['password'] ?? ''; ?>" required>
        </div>
        
        <button type="submit" class="btn">Test Connessione</button>
    </form>
</div>

<?php if (!empty($tables)): ?>
<div class="card">
    <h2>Seleziona Tabella Prodotti</h2>
    
    <form method="POST">
        <input type="hidden" name="action" value="save">
        
        <div class="form-group">
            <label>Tabella</label>
            <select name="table" required>
                <option value="">-- Seleziona tabella --</option>
                <?php foreach ($tables as $table): ?>
                    <option value="<?php echo htmlspecialchars($table); ?>">
                        <?php echo htmlspecialchars($table); ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>
        
        <button type="submit" class="btn">Salva e Continua →</button>
    </form>
</div>
<?php endif; ?>

<?php include '../includes/footer.php'; ?>
```

---

## 🔧 FILE 7: pages/mapping.php

```php
<?php
require_once '../config.php';
require_once '../includes/functions.php';

$dbConfig = loadDBConfig();
if (!$dbConfig) {
    header('Location: connection.php');
    exit;
}

$columns = getTableColumns($dbConfig, $dbConfig['table']);
$savedMapping = loadMappingConfig();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mappings = [];
    
    // Campi obbligatori
    if (!empty($_POST['field_codice'])) {
        $mappings[] = [
            'dbColumn' => $_POST['field_codice'],
            'targetField' => 'codice',
            'isAttribute' => false,
            'transform' => $_POST['transform_codice'] ?? ''
        ];
    }
    
    if (!empty($_POST['field_descrizione'])) {
        $mappings[] = [
            'dbColumn' => $_POST['field_descrizione'],
            'targetField' => 'descrizione',
            'isAttribute' => false,
            'transform' => $_POST['transform_descrizione'] ?? ''
        ];
    }
    
    if (!empty($_POST['field_prezzo'])) {
        $mappings[] = [
            'dbColumn' => $_POST['field_prezzo'],
            'targetField' => 'prezzo',
            'isAttribute' => false,
            'transform' => 'parseFloat'
        ];
    }
    
    if (!empty($_POST['field_immagine'])) {
        $mappings[] = [
            'dbColumn' => $_POST['field_immagine'],
            'targetField' => 'immagine',
            'isAttribute' => false,
            'transform' => $_POST['transform_immagine'] ?? ''
        ];
    }
    
    // Attributi dinamici
    if (!empty($_POST['attr_column'])) {
        foreach ($_POST['attr_column'] as $index => $column) {
            if (!empty($column) && !empty($_POST['attr_name'][$index])) {
                $mappings[] = [
                    'dbColumn' => $column,
                    'targetField' => 'attributi',
                    'isAttribute' => true,
                    'attributeName' => $_POST['attr_name'][$index],
                    'transform' => $_POST['attr_transform'][$index] ?? ''
                ];
            }
        }
    }
    
    saveMappingConfig($mappings);
    logActivity("Mapping salvato con " . count($mappings) . " campi");
    
    header('Location: preview.php');
    exit;
}

include '../includes/header.php';
?>

<div class="card">
    <h2>Step 2: Mapping Campi</h2>
    <p>Mappa le colonne del database ai campi del JSON</p>
    
    <form method="POST">
        <h3 style="margin-top: 30px; color: #667eea;">Campi Obbligatori</h3>
        
        <div class="mapping-row">
            <div>
                <label>Colonna DB → Codice Prodotto</label>
                <select name="field_codice" required>
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo $col['name']; ?>" 
                            <?php if (isset($savedMapping[0]) && $savedMapping[0]['dbColumn'] == $col['name']) echo 'selected'; ?>>
                            <?php echo $col['name']; ?> (<?php echo $col['type']; ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div style="text-align: center; padding-top: 25px;">→</div>
            <div style="padding-top: 25px;">
                <strong>codice</strong>
            </div>
            <div>
                <label>Trasformazione</label>
                <select name="transform_descrizione">
                    <option value="">Nessuna</option>
                    <option value="trim">Trim</option>
                </select>
            </div>
        </div>
        
        <div class="mapping-row">
            <div>
                <label>Colonna DB → Prezzo</label>
                <select name="field_prezzo" required>
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo $col['name']; ?>">
                            <?php echo $col['name']; ?> (<?php echo $col['type']; ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div style="text-align: center; padding-top: 25px;">→</div>
            <div style="padding-top: 25px;">
                <strong>prezzo</strong>
            </div>
            <div style="padding-top: 25px;">
                <span class="badge badge-success">parseFloat</span>
            </div>
        </div>
        
        <div class="mapping-row">
            <div>
                <label>Colonna DB → Immagine (opzionale)</label>
                <select name="field_immagine">
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo $col['name']; ?>">
                            <?php echo $col['name']; ?> (<?php echo $col['type']; ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div style="text-align: center; padding-top: 25px;">→</div>
            <div style="padding-top: 25px;">
                <strong>immagine</strong>
            </div>
            <div>
                <label>Trasformazione</label>
                <select name="transform_immagine">
                    <option value="">Nessuna</option>
                    <option value="trim">Trim</option>
                </select>
            </div>
        </div>
        
        <h3 style="margin-top: 40px; color: #764ba2;">Attributi Dinamici</h3>
        <p style="color: #a0a0b8; margin-bottom: 20px;">Aggiungi tutti gli attributi che vuoi (serie, materiale, colore, ecc.)</p>
        
        <div id="attributi-container">
            <div class="mapping-row attribute">
                <div>
                    <label>Colonna DB</label>
                    <select name="attr_column[]">
                        <option value="">-- Seleziona --</option>
                        <?php foreach ($columns as $col): ?>
                            <option value="<?php echo $col['name']; ?>">
                                <?php echo $col['name']; ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div style="text-align: center; padding-top: 25px;">→</div>
                <div>
                    <label>Nome Attributo</label>
                    <input type="text" name="attr_name[]" placeholder="es: materiale">
                </div>
                <div>
                    <label>Trasformazione</label>
                    <select name="attr_transform[]">
                        <option value="">Nessuna</option>
                        <option value="trim">Trim</option>
                        <option value="parseFloat">Numero</option>
                    </select>
                </div>
                <div></div>
            </div>
        </div>
        
        <button type="button" onclick="aggiungiAttributo()" class="btn btn-secondary">
            + Aggiungi Attributo
        </button>
        
        <div style="margin-top: 30px;">
            <button type="submit" class="btn">Salva Mapping e Continua →</button>
        </div>
    </form>
</div>

<script>
function aggiungiAttributo() {
    const container = document.getElementById('attributi-container');
    const nuovaRiga = container.querySelector('.mapping-row').cloneNode(true);
    
    // Reset values
    nuovaRiga.querySelectorAll('select, input').forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
    });
    
    container.appendChild(nuovaRiga);
}
</script>

<?php include '../includes/footer.php'; ?>
```

---

## 🔧 FILE 8: pages/preview.php

```php
<?php
require_once '../config.php';
require_once '../includes/functions.php';

$dbConfig = loadDBConfig();
$mappingConfig = loadMappingConfig();

if (!$dbConfig || !$mappingConfig) {
    header('Location: connection.php');
    exit;
}

// Preview primi 5 prodotti
$rows = fetchProducts($dbConfig, 5);
$previewProducts = [];

foreach ($rows as $row) {
    $previewProducts[] = transformRow($row, $mappingConfig);
}

include '../includes/header.php';
?>

<div class="card">
    <h2>Step 3: Preview Dati</h2>
    <p>Anteprima dei primi 5 prodotti convertiti in JSON</p>
    
    <div class="stats">
        <div class="stat-box">
            <div class="stat-number"><?php echo count($mappingConfig); ?></div>
            <div class="stat-label">Campi Mappati</div>
        </div>
        
        <div class="stat-box">
            <div class="stat-number">
                <?php 
                $attrCount = count(array_filter($mappingConfig, function($m) {
                    return $m['isAttribute'];
                }));
                echo $attrCount;
                ?>
            </div>
            <div class="stat-label">Attributi Dinamici</div>
        </div>
        
        <div class="stat-box">
            <div class="stat-number">
                <?php 
                try {
                    $pdo = connectDB($dbConfig);
                    $stmt = $pdo->query("SELECT COUNT(*) FROM `{$dbConfig['table']}`");
                    echo $stmt->fetchColumn();
                } catch (Exception $e) {
                    echo '?';
                }
                ?>
            </div>
            <div class="stat-label">Totale Prodotti DB</div>
        </div>
    </div>
</div>

<div class="card">
    <h3>Preview JSON (primi 5 prodotti)</h3>
    <pre><?php echo json_encode($previewProducts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE); ?></pre>
</div>

<div class="card">
    <h3>Struttura Mapping</h3>
    <table>
        <thead>
            <tr>
                <th>Colonna DB</th>
                <th>Campo JSON</th>
                <th>Tipo</th>
                <th>Trasformazione</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($mappingConfig as $mapping): ?>
                <tr>
                    <td><code><?php echo htmlspecialchars($mapping['dbColumn']); ?></code></td>
                    <td>
                        <?php if ($mapping['isAttribute']): ?>
                            <span class="badge badge-warning">
                                attributi.<?php echo htmlspecialchars($mapping['attributeName']); ?>
                            </span>
                        <?php else: ?>
                            <strong><?php echo htmlspecialchars($mapping['targetField']); ?></strong>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php echo $mapping['isAttribute'] ? 'Attributo' : 'Campo Base'; ?>
                    </td>
                    <td>
                        <?php echo $mapping['transform'] ?: '-'; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<div class="card">
    <a href="mapping.php" class="btn btn-secondary">← Modifica Mapping</a>
    <a href="export.php" class="btn">Procedi all'Export →</a>
</div>

<?php include '../includes/footer.php'; ?>
```

---

## 🔧 FILE 9: pages/export.php

```php
<?php
require_once '../config.php';
require_once '../includes/functions.php';

$dbConfig = loadDBConfig();
$mappingConfig = loadMappingConfig();

if (!$dbConfig || !$mappingConfig) {
    header('Location: connection.php');
    exit;
}

$message = '';
$messageType = '';
$exportData = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'export') {
        try {
            $jsonData = generateProductsJSON($dbConfig, $mappingConfig);
            savePublicJSON($jsonData);
            
            logActivity("Export completato: {$jsonData['total']} prodotti");
            
            $messageType = 'success';
            $message = "✓ Export completato! {$jsonData['total']} prodotti generati.";
            $exportData = $jsonData;
        } catch (Exception $e) {
            $messageType = 'error';
            $message = "Errore durante l'export: " . $e->getMessage();
        }
    }
}

// Carica ultimo export se esiste
if (!$exportData && file_exists(PUBLIC_JSON_PATH)) {
    $exportData = json_decode(file_get_contents(PUBLIC_JSON_PATH), true);
}

include '../includes/header.php';
?>

<div class="card">
    <h2>Step 4: Export JSON</h2>
    
    <?php if ($message): ?>
        <div class="alert alert-<?php echo $messageType; ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>
    
    <form method="POST">
        <input type="hidden" name="action" value="export">
        
        <p>Genera il file <code>products.json</code> pubblico con tutti i prodotti dal database.</p>
        
        <div style="margin: 30px 0;">
            <button type="submit" class="btn" style="font-size: 18px; padding: 20px 40px;">
                🚀 Genera products.json
            </button>
        </div>
    </form>
</div>

<?php if ($exportData): ?>
<div class="card">
    <h3>Ultimo Export</h3>
    
    <div class="stats">
        <div class="stat-box">
            <div class="stat-number"><?php echo $exportData['total']; ?></div>
            <div class="stat-label">Prodotti Esportati</div>
        </div>
        
        <div class="stat-box">
            <div class="stat-number">
                <?php 
                $date = new DateTime($exportData['generated_at']);
                echo $date->format('d/m/Y');
                ?>
            </div>
            <div class="stat-label">Data</div>
        </div>
        
        <div class="stat-box">
            <div class="stat-number">
                <?php 
                $date = new DateTime($exportData['generated_at']);
                echo $date->format('H:i');
                ?>
            </div>
            <div class="stat-label">Ora</div>
        </div>
        
        <div class="stat-box">
            <div class="stat-number">
                <?php 
                $size = filesize(PUBLIC_JSON_PATH);
                echo round($size / 1024, 2) . ' KB';
                ?>
            </div>
            <div class="stat-label">Dimensione File</div>
        </div>
    </div>
    
    <h4 style="margin-top: 30px;">URL Pubblico</h4>
    <p>Il file JSON è accessibile a questo indirizzo:</p>
    <pre><?php 
    $domain = $_SERVER['HTTP_HOST'];
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $jsonUrl = "$protocol://$domain/data/products.json";
    echo $jsonUrl;
    ?></pre>
    
    <a href="<?php echo $jsonUrl; ?>" target="_blank" class="btn">Visualizza JSON</a>
    <a href="<?php echo $jsonUrl; ?>" download class="btn btn-secondary">Download JSON</a>
</div>

<div class="card">
    <h3>Esempio Utilizzo</h3>
    <p>Nel tuo e-commerce su Vercel, usa questo URL per caricare i prodotti:</p>
    <pre>// lib/db/products.ts
const PRODUCTS_URL = '<?php echo $jsonUrl; ?>';

export async function getAllProducts() {
  const response = await fetch(PRODUCTS_URL, {
    next: { revalidate: 300 } // Cache 5 minuti
  });
  const json = await response.json();
  return json.prodotti;
}</pre>
</div>
<?php endif; ?>

<div class="card">
    <h3>Sync Automatico</h3>
    <p>Puoi automatizzare l'export creando un Cron Job su Siteground:</p>
    <pre>*/6 * * * * /usr/bin/php <?php echo BASE_PATH; ?>/cron/auto-sync.php</pre>
    <p style="color: #a0a0b8; margin-top: 10px;">
        Questo rigenera il JSON ogni 6 ore automaticamente.
    </p>
</div>

<?php include '../includes/footer.php'; ?>
```

---

## 🔧 FILE 10: .htaccess (protezione admin)

```apache
# /public_html/admin/.htaccess
# Protezione base admin

AuthType Basic
AuthName "Admin Area"
AuthUserFile /home/tuousername/.htpasswd
Require valid-user

# Oppure protezione IP
# <RequireAny>
#     Require ip 123.456.789.0
#     Require ip 987.654.321.0
# </RequireAny>

# PHP settings
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value max_execution_time 300
```

---

## 🔧 FILE 11: cron/auto-sync.php (opzionale)

```php
<?php
// cron/auto-sync.php - Auto sync per Cron Job

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
} catch (Exception $e) {
    logActivity("Auto-sync ERRORE: " . $e->getMessage());
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>
```

---

## 📤 GUIDA UPLOAD FTP

### **File da Caricare su Siteground:**

```
/public_html/
├── admin/                      ← Carica tutta la cartella
│   ├── index.php
│   ├── config.php
│   ├── .htaccess
│   ├── pages/
│   │   ├── connection.php
│   │   ├── mapping.php
│   │   ├── preview.php
│   │   └── export.php
│   ├── includes/
│   │   ├── header.php
│   │   ├── footer.php
│   │   └── functions.php
│   ├── data/                   ← Crea cartella vuota
│   └── cron/
│       └── auto-sync.php
│
└── data/                       ← Crea cartella vuota
    └── .htaccess               ← CORS headers
```

### **Passi Upload:**

1. **Connetti FTP**
   - Host: `ftp.tuodominio.it`
   - User: il tuo user Siteground
   - Password: la tua password

2. **Crea Cartelle**
   ```
   /public_html/admin/
   /public_html/data/
   ```

3. **Upload Files**
   - Usa FileZilla o File Manager Siteground
   - Carica tutti i file PHP

4. **Permessi**
   ```
   chmod 755 /public_html/admin/
   chmod 755 /public_html/data/
   chmod 644 tutti i file .php
   ```

5. **Crea .htaccess per CORS**
   ```apache
   # /public_html/data/.htaccess
   Header set Access-Control-Allow-Origin "*"
   Header set Content-Type "application/json"
   <Files "products.json">
       Require all granted
   </Files>
   ```

---

## 🔐 PROTEZIONE ADMIN

### **Opzione 1: Password HTTP (Raccomandato)**

```bash
# Via SSH o cPanel "Password Protect Directories"
htpasswd -c /home/tuousername/.htpasswd admin
# Inserisci password

# Nel .htaccess admin già configurato
```

### **Opzione 2: Protezione IP**

Modifica `.htaccess`:
```apache
<RequireAny>
    Require ip TUO_IP_CASA
    Require ip TUO_IP_UFFICIO
</RequireAny>
```

---

## 🎯 ACCESSO ADMIN

Una volta caricato:

```
URL Admin: https://tuodominio.it/admin/
URL JSON:  https://tuodominio.it/data/products.json
```

---

## ✅ CHECKLIST INSTALLAZIONE

- [ ] Crea cartelle su Siteground via FTP
- [ ] Upload tutti i file PHP
- [ ] Crea cartella `/data/` pubblica
- [ ] Upload `.htaccess` per CORS
- [ ] Test accesso admin: `tuodominio.it/admin/`
- [ ] Configura protezione password
- [ ] Test connessione database
- [ ] Mappa campi
- [ ] Genera primo JSON
- [ ] Verifica JSON pubblico accessibile
- [ ] Setup Cron Job (opzionale)

---

## 🐛 TROUBLESHOOTING

### Errore: "Can't connect to MySQL"
```
- Verifica credenziali database
- Usa "localhost" come host
- Check user ha permessi su database
```

### Errore: "Permission denied"
```bash
# Via SSH o File Manager
chmod 755 /public_html/admin/data/
chmod 755 /public_html/data/
```

### JSON non accessibile
```
- Verifica .htaccess in /data/
- Check permessi file (644)
- Prova URL diretto nel browser
```

### Errore PHP
```
- Verifica versione PHP (minimo 7.4)
- Attiva display_errors per debug
- Check error_log Siteground
```

---

## 🚀 PROSSIMO STEP

Una volta che l'admin funziona:

1. **Genera products.json**
2. **Verifica accessibile**: `tuodominio.it/data/products.json`
3. **Usa URL in E-Commerce Vercel**

Vuoi che ti aggiorni il documento Claude Code con questa architettura PHP? 🎯
                <select name="transform_codice">
                    <option value="">Nessuna</option>
                    <option value="trim">Trim</option>
                    <option value="toUpperCase">MAIUSCOLO</option>
                </select>
            </div>
        </div>
        
        <div class="mapping-row">
            <div>
                <label>Colonna DB → Descrizione</label>
                <select name="field_descrizione" required>
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo $col['name']; ?>">
                            <?php echo $col['name']; ?> (<?php echo $col['type']; ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div style="text-align: center; padding-top: 25px;">→</div>
            <div style="padding-top: 25px;">
                <strong>descrizione</strong>
            </div>
            <div>
                <label>Trasformazione</label>