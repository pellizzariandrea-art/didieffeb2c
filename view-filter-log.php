<?php
require_once 'config.php';

$logFile = BASE_PATH . '/filter-debug.log';

?>
<!DOCTYPE html>
<html>
<head>
    <title>Filter Debug Log</title>
    <style>
        body {
            font-family: monospace;
            background: #1a1a2e;
            color: #fff;
            padding: 20px;
        }
        pre {
            background: #0f0f1e;
            padding: 20px;
            border-radius: 10px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .btn {
            padding: 10px 20px;
            background: #667eea;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
        }
        .btn:hover {
            background: #764ba2;
        }
        .btn-danger {
            background: #f44336;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Filter Debug Log</h1>
        <div>
            <a href="/admin/pages/filter.php" class="btn">← Torna ai Filtri</a>
            <a href="?clear=1" class="btn btn-danger" onclick="return confirm('Vuoi cancellare il log?')">🗑️ Clear Log</a>
        </div>
    </div>

    <?php
    if (isset($_GET['clear'])) {
        file_put_contents($logFile, '');
        echo '<p style="color: #4caf50;">Log cancellato!</p>';
    }
    ?>

    <?php if (file_exists($logFile)): ?>
        <pre><?php echo htmlspecialchars(file_get_contents($logFile)); ?></pre>
    <?php else: ?>
        <p>Nessun log disponibile. Prova a salvare un filtro.</p>
    <?php endif; ?>
</body>
</html>
