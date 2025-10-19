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

        header('Location: /admin/pages/mapping.php');
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
            <input type="text" name="host" value="<?php echo htmlspecialchars($savedConfig['host'] ?? 'localhost'); ?>" required>
            <small style="color: #a0a0b8;">Su Siteground di solito è "localhost"</small>
        </div>

        <div class="form-group">
            <label>Porta</label>
            <input type="number" name="port" value="<?php echo htmlspecialchars($savedConfig['port'] ?? '3306'); ?>" required>
        </div>

        <div class="form-group">
            <label>Nome Database</label>
            <input type="text" name="database" value="<?php echo htmlspecialchars($savedConfig['database'] ?? ''); ?>" required>
        </div>

        <div class="form-group">
            <label>Username</label>
            <input type="text" name="username" value="<?php echo htmlspecialchars($savedConfig['username'] ?? ''); ?>" required>
        </div>

        <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" value="<?php echo htmlspecialchars($savedConfig['password'] ?? ''); ?>" required>
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
                    <option value="<?php echo htmlspecialchars($table); ?>" <?php echo ($savedConfig['table'] ?? '') === $table ? 'selected' : ''; ?>>
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
