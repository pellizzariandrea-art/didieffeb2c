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
            flex-wrap: wrap;
            gap: 20px;
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
            flex-wrap: wrap;
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

        .card h3 {
            margin-bottom: 15px;
            color: #764ba2;
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

        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                align-items: flex-start;
            }

            .mapping-row {
                grid-template-columns: 1fr;
                gap: 15px;
            }

            .nav {
                width: 100%;
            }

            .nav a {
                flex: 1;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Admin Dashboard - E-Commerce AI</h1>
            <div class="nav">
                <a href="/admin/index.php" <?php if(basename($_SERVER['PHP_SELF']) == 'index.php') echo 'class="active"'; ?>>Home</a>
                <a href="/admin/pages/connection.php" <?php if(basename($_SERVER['PHP_SELF']) == 'connection.php') echo 'class="active"'; ?>>Connessione</a>
                <a href="/admin/pages/tables.php" <?php if(basename($_SERVER['PHP_SELF']) == 'tables.php') echo 'class="active"'; ?>>📋 Tabelle</a>
                <a href="/admin/pages/mapping.php" <?php if(basename($_SERVER['PHP_SELF']) == 'mapping.php') echo 'class="active"'; ?>>Mapping</a>
                <a href="/admin/pages/filter.php" <?php if(basename($_SERVER['PHP_SELF']) == 'filter.php') echo 'class="active"'; ?>>🔍 Filtri</a>
                <a href="/admin/pages/preview.php" <?php if(basename($_SERVER['PHP_SELF']) == 'preview.php') echo 'class="active"'; ?>>Preview</a>
                <a href="/admin/pages/export.php" <?php if(basename($_SERVER['PHP_SELF']) == 'export.php') echo 'class="active"'; ?>>Export</a>
                <a href="/admin/pages/export-v2.php" <?php if(basename($_SERVER['PHP_SELF']) == 'export-v2.php') echo 'class="active"'; ?>>🚀 Export v2</a>
                <a href="/admin/pages/settings.php" <?php if(basename($_SERVER['PHP_SELF']) == 'settings.php') echo 'class="active"'; ?>>⚙️ Settings</a>
                <a href="/admin/pages/ai-descriptions.php" <?php if(basename($_SERVER['PHP_SELF']) == 'ai-descriptions.php') echo 'class="active"'; ?>>🤖 Descrizioni AI</a>
                <a href="/admin/pages/images.php" <?php if(basename($_SERVER['PHP_SELF']) == 'images.php') echo 'class="active"'; ?>>🖼️ Immagini</a>
                <a href="/admin/pages/resources.php" <?php if(basename($_SERVER['PHP_SELF']) == 'resources.php') echo 'class="active"'; ?>>📦 Risorse</a>
                <a href="/admin/pages/variants.php" <?php if(basename($_SERVER['PHP_SELF']) == 'variants.php') echo 'class="active"'; ?>>🔀 Varianti</a>
                <a href="/admin/pages/ecommerce-config.php" <?php if(basename($_SERVER['PHP_SELF']) == 'ecommerce-config.php') echo 'class="active"'; ?>>🛒 E-Commerce</a>
                <a href="/admin/pages/wizard-builder.php" <?php if(basename($_SERVER['PHP_SELF']) == 'wizard-builder.php') echo 'class="active"'; ?>>✨ Wizard Builder</a>
                <a href="/admin/pages/test-ecommerce.php" <?php if(basename($_SERVER['PHP_SELF']) == 'test-ecommerce.php') echo 'class="active"'; ?>>🛍️ Test E-Commerce</a>
                <a href="/admin/pages/test-product.php" <?php if(basename($_SERVER['PHP_SELF']) == 'test-product.php') echo 'class="active"'; ?>>🧪 Test Prodotto</a>
                <a href="/admin/pages/debug-product.php" <?php if(basename($_SERVER['PHP_SELF']) == 'debug-product.php') echo 'class="active"'; ?>>🔍 Debug Ricerca</a>
                <a href="/admin/pages/test-translation.php" <?php if(basename($_SERVER['PHP_SELF']) == 'test-translation.php') echo 'class="active"'; ?>>🔧 Test API</a>
                <a href="/admin/pages/logs.php" <?php if(basename($_SERVER['PHP_SELF']) == 'logs.php') echo 'class="active"'; ?>>📋 Log</a>
            </div>
        </div>
