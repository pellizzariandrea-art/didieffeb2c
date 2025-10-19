<?php
require_once '../config.php';
require_once '../includes/functions.php';

// Configuration - can be moved to a config file
$apiUrl = 'http://127.0.0.1:3007/api/logs'; // Default for local development (use 127.0.0.1 instead of localhost for Windows)
$apiToken = '6196f0e0b7c363e22a542111f19ecee718c6b1dff6eb88a8ff9e2e99097487d0'; // Must match ADMIN_API_TOKEN in Next.js

// Check if there's a saved configuration
$configFile = DATA_PATH . '/logs-config.json';
if (file_exists($configFile)) {
    $config = json_decode(file_get_contents($configFile), true);
    if ($config) {
        $apiUrl = $config['api_url'] ?? $apiUrl;
        $apiToken = $config['api_token'] ?? $apiToken;
    }
}

// Save configuration if posted
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'save_config') {
    $newConfig = [
        'api_url' => trim($_POST['api_url'] ?? ''),
        'api_token' => trim($_POST['api_token'] ?? ''),
    ];
    file_put_contents($configFile, json_encode($newConfig, JSON_PRETTY_PRINT));
    $apiUrl = $newConfig['api_url'];
    $apiToken = $newConfig['api_token'];
    $configMessage = 'Configurazione salvata con successo!';
    $configMessageType = 'success';
}

// Get filter parameters
$filterLevel = $_GET['level'] ?? 'all';
$filterComponent = $_GET['component'] ?? '';
$selectedDate = $_GET['date'] ?? date('Y-m-d');
$search = $_GET['search'] ?? '';
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$perPage = 50;

// Fetch logs from API or filesystem
$logs = [];
$logFiles = [];
$components = [];
$totalLogs = 0;
$apiError = null;

// Try local filesystem first (for development)
$localLogsDir = dirname(dirname(dirname(__DIR__))) . '/frontend/logs';

if (is_dir($localLogsDir)) {
    // Read logs directly from filesystem (local development mode)
    try {
        // Get all log files
        $files = scandir($localLogsDir);
        foreach ($files as $file) {
            if (preg_match('/^app-(\d{4}-\d{2}-\d{2})\.log$/', $file, $matches)) {
                $filePath = $localLogsDir . '/' . $file;
                $logFiles[] = [
                    'filename' => $file,
                    'date' => $matches[1],
                    'size' => filesize($filePath),
                ];
            }
        }

        // Sort by date descending
        usort($logFiles, function($a, $b) {
            return strcmp($b['date'], $a['date']);
        });

        // Find selected file
        $selectedFile = null;
        foreach ($logFiles as $lf) {
            if ($lf['date'] === $selectedDate) {
                $selectedFile = $localLogsDir . '/' . $lf['filename'];
                break;
            }
        }

        if ($selectedFile && file_exists($selectedFile)) {
            $lines = file($selectedFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

            foreach ($lines as $line) {
                $entry = json_decode($line, true);
                if ($entry) {
                    // Apply filters
                    if ($filterLevel !== 'all' && ($entry['level'] ?? '') !== $filterLevel) {
                        continue;
                    }

                    if ($filterComponent && ($entry['component'] ?? '') !== $filterComponent) {
                        continue;
                    }

                    if ($search && stripos(json_encode($entry), $search) === false) {
                        continue;
                    }

                    $logs[] = $entry;

                    if (!empty($entry['component']) && !in_array($entry['component'], $components)) {
                        $components[] = $entry['component'];
                    }
                }
            }
        }

        $totalLogs = count($logs);
        sort($components);

        // Apply pagination
        $logs = array_slice($logs, ($page - 1) * $perPage, $perPage);

    } catch (Exception $e) {
        $apiError = 'Errore lettura filesystem: ' . $e->getMessage();
    }
} else {
    // Fallback to API (for production)
    try {
        // Build API URL with parameters
        $params = http_build_query([
            'date' => $selectedDate,
            'level' => $filterLevel,
            'component' => $filterComponent,
            'search' => $search,
        ]);

        $fullUrl = $apiUrl . '?' . $params;

        // Make API request
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $fullUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiToken,
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new Exception('Errore connessione: ' . $curlError);
        }

        if ($httpCode !== 200) {
            throw new Exception('API Error (HTTP ' . $httpCode . '): ' . $response);
        }

        $data = json_decode($response, true);

        if (!$data || !$data['success']) {
            throw new Exception($data['error'] ?? 'Unknown error');
        }

        $logs = $data['logs'] ?? [];
        $logFiles = $data['files'] ?? [];
        $components = $data['components'] ?? [];
        $totalLogs = count($logs);

        // Apply pagination
        $logs = array_slice($logs, ($page - 1) * $perPage, $perPage);

    } catch (Exception $e) {
        $apiError = $e->getMessage();
    }
}

include '../includes/header.php';
?>

<!-- Configuration Modal (hidden by default) -->
<div id="configModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; padding: 20px; overflow-y: auto;">
    <div class="card" style="max-width: 600px; margin: 50px auto;">
        <h2>⚙️ Configurazione API Log</h2>

        <?php if (isset($configMessage)): ?>
            <div class="alert alert-<?php echo $configMessageType; ?>">
                <?php echo htmlspecialchars($configMessage); ?>
            </div>
        <?php endif; ?>

        <form method="POST">
            <input type="hidden" name="action" value="save_config">

            <div class="form-group">
                <label>🌐 URL API Next.js</label>
                <input type="text" name="api_url" value="<?php echo htmlspecialchars($apiUrl); ?>"
                       placeholder="http://localhost:3000/api/logs" required>
                <small style="color: #a0a0b8; display: block; margin-top: 5px;">
                    Locale: <code>http://localhost:3000/api/logs</code><br>
                    Produzione: <code>https://tuodominio.com/api/logs</code>
                </small>
            </div>

            <div class="form-group">
                <label>🔑 Token API</label>
                <input type="password" name="api_token" value="<?php echo htmlspecialchars($apiToken); ?>"
                       placeholder="your-secret-token-here" required>
                <small style="color: #a0a0b8; display: block; margin-top: 5px;">
                    Deve corrispondere a <code>ADMIN_API_TOKEN</code> nelle variabili d'ambiente del Next.js
                </small>
            </div>

            <div style="display: flex; gap: 10px;">
                <button type="submit" class="btn">💾 Salva Configurazione</button>
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('configModal').style.display='none'">
                    Annulla
                </button>
            </div>
        </form>
    </div>
</div>

<div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
            <h2>📋 Visualizzatore Log Applicazione</h2>
            <p style="color: #a0a0b8;">Visualizza e filtra i log dell'applicazione frontend tramite API.</p>
        </div>
        <button class="btn btn-secondary" onclick="document.getElementById('configModal').style.display='block'">
            ⚙️ Configura
        </button>
    </div>

    <?php if ($apiError): ?>
        <div class="alert alert-error">
            ❌ <strong>Errore connessione API:</strong> <?php echo htmlspecialchars($apiError); ?>
            <br><br>
            <button class="btn" onclick="document.getElementById('configModal').style.display='block'">
                Configura connessione
            </button>
        </div>
    <?php elseif (empty($logFiles)): ?>
        <div class="alert alert-warning">
            ⚠️ Nessun file di log trovato sul server Next.js
        </div>
    <?php else: ?>
        <!-- Statistics -->
        <div class="stats" style="margin-bottom: 30px;">
            <div class="stat-box">
                <div class="stat-number"><?php echo count($logFiles); ?></div>
                <div class="stat-label">File di Log</div>
            </div>
            <div class="stat-box">
                <div class="stat-number"><?php echo $totalLogs; ?></div>
                <div class="stat-label">Entries (filtrate)</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">
                    <?php
                    $totalSize = array_sum(array_column($logFiles, 'size'));
                    echo $totalSize < 1024 ? $totalSize . ' B' :
                         ($totalSize < 1048576 ? round($totalSize / 1024, 1) . ' KB' :
                          round($totalSize / 1048576, 1) . ' MB');
                    ?>
                </div>
                <div class="stat-label">Dimensione Totale</div>
            </div>
            <div class="stat-box">
                <div class="stat-number"><?php echo count($components); ?></div>
                <div class="stat-label">Componenti</div>
            </div>
        </div>

        <!-- Filters -->
        <form method="GET" style="background: rgba(102, 126, 234, 0.05); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <!-- Date selector -->
                <div class="form-group" style="margin-bottom: 0;">
                    <label>📅 Data Log</label>
                    <select name="date" onchange="this.form.submit()">
                        <?php foreach ($logFiles as $logFile): ?>
                            <option value="<?php echo $logFile['date']; ?>" <?php echo $logFile['date'] === $selectedDate ? 'selected' : ''; ?>>
                                <?php echo $logFile['date']; ?> (<?php echo round($logFile['size'] / 1024, 1); ?> KB)
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <!-- Level filter -->
                <div class="form-group" style="margin-bottom: 0;">
                    <label>🎯 Livello</label>
                    <select name="level" onchange="this.form.submit()">
                        <option value="all" <?php echo $filterLevel === 'all' ? 'selected' : ''; ?>>Tutti</option>
                        <option value="info" <?php echo $filterLevel === 'info' ? 'selected' : ''; ?>>ℹ️ Info</option>
                        <option value="warn" <?php echo $filterLevel === 'warn' ? 'selected' : ''; ?>>⚠️ Warning</option>
                        <option value="error" <?php echo $filterLevel === 'error' ? 'selected' : ''; ?>>❌ Error</option>
                        <option value="debug" <?php echo $filterLevel === 'debug' ? 'selected' : ''; ?>>🔍 Debug</option>
                    </select>
                </div>

                <!-- Component filter -->
                <div class="form-group" style="margin-bottom: 0;">
                    <label>📦 Componente</label>
                    <select name="component" onchange="this.form.submit()">
                        <option value="">Tutti</option>
                        <?php foreach ($components as $comp): ?>
                            <option value="<?php echo htmlspecialchars($comp); ?>" <?php echo $comp === $filterComponent ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($comp); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <!-- Search -->
                <div class="form-group" style="margin-bottom: 0;">
                    <label>🔍 Cerca</label>
                    <input type="text" name="search" value="<?php echo htmlspecialchars($search); ?>"
                           placeholder="Cerca nel log...">
                </div>
            </div>

            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button type="submit" class="btn">Filtra</button>
                <a href="logs.php" class="btn btn-secondary">Reset Filtri</a>
            </div>
        </form>

        <!-- Logs table -->
        <?php if (empty($logs)): ?>
            <div class="alert alert-warning">
                ℹ️ Nessun log trovato con i filtri selezionati.
            </div>
        <?php else: ?>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 180px;">Timestamp</th>
                            <th style="width: 80px;">Livello</th>
                            <th style="width: 150px;">Componente</th>
                            <th>Messaggio</th>
                            <th style="width: 100px;">Dati</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($logs as $log): ?>
                            <?php
                            $levelColors = [
                                'info' => '#4caf50',
                                'warn' => '#ff9800',
                                'error' => '#f44336',
                                'debug' => '#667eea'
                            ];
                            $levelIcons = [
                                'info' => 'ℹ️',
                                'warn' => '⚠️',
                                'error' => '❌',
                                'debug' => '🔍'
                            ];
                            $level = $log['level'] ?? 'info';
                            $color = $levelColors[$level] ?? '#a0a0b8';
                            $icon = $levelIcons[$level] ?? '📝';

                            // Format timestamp
                            $timestamp = $log['timestamp'] ?? '';
                            if ($timestamp) {
                                $dt = new DateTime($timestamp);
                                $timestamp = $dt->format('H:i:s');
                            }
                            ?>
                            <tr style="border-left: 3px solid <?php echo $color; ?>;">
                                <td style="font-family: monospace; font-size: 13px; color: #a0a0b8;">
                                    <?php echo htmlspecialchars($timestamp); ?>
                                </td>
                                <td>
                                    <span class="badge" style="background: rgba(<?php
                                        echo $level === 'error' ? '244, 67, 54' :
                                             ($level === 'warn' ? '255, 152, 0' :
                                              ($level === 'debug' ? '102, 126, 234' : '76, 175, 80'));
                                    ?>, 0.2); color: <?php echo $color; ?>;">
                                        <?php echo $icon . ' ' . strtoupper($level); ?>
                                    </span>
                                </td>
                                <td style="font-weight: 600; color: #667eea;">
                                    <?php echo htmlspecialchars($log['component'] ?? '-'); ?>
                                </td>
                                <td style="color: #e0e0f0;">
                                    <?php echo htmlspecialchars($log['message'] ?? ''); ?>
                                </td>
                                <td>
                                    <?php if (!empty($log['data'])): ?>
                                        <button
                                            onclick="alert(<?php echo htmlspecialchars(json_encode(json_encode($log['data'], JSON_PRETTY_PRINT))); ?>)"
                                            class="btn btn-secondary"
                                            style="padding: 5px 10px; font-size: 12px;">
                                            Vedi
                                        </button>
                                    <?php else: ?>
                                        <span style="color: #a0a0b8;">-</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <?php
            $totalPages = ceil($totalLogs / $perPage);
            if ($totalPages > 1):
            ?>
                <div style="margin-top: 20px; text-align: center;">
                    <div style="display: inline-flex; gap: 5px;">
                        <?php if ($page > 1): ?>
                            <a href="?date=<?php echo urlencode($selectedDate); ?>&level=<?php echo urlencode($filterLevel); ?>&component=<?php echo urlencode($filterComponent); ?>&search=<?php echo urlencode($search); ?>&page=<?php echo $page - 1; ?>"
                               class="btn btn-secondary">« Precedente</a>
                        <?php endif; ?>

                        <span style="padding: 12px 20px; color: #a0a0b8;">
                            Pagina <?php echo $page; ?> di <?php echo $totalPages; ?>
                        </span>

                        <?php if ($page < $totalPages): ?>
                            <a href="?date=<?php echo urlencode($selectedDate); ?>&level=<?php echo urlencode($filterLevel); ?>&component=<?php echo urlencode($filterComponent); ?>&search=<?php echo urlencode($search); ?>&page=<?php echo $page + 1; ?>"
                               class="btn btn-secondary">Successiva »</a>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    <?php endif; ?>
</div>

<?php if (!empty($logFiles)): ?>
<div class="card">
    <h3>📊 File di Log Disponibili</h3>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Dimensione</th>
                <th>Azioni</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach (array_slice($logFiles, 0, 10) as $logFile): ?>
                <tr>
                    <td style="font-family: monospace;">
                        <?php echo $logFile['date']; ?>
                        <?php if ($logFile['date'] === date('Y-m-d')): ?>
                            <span class="badge badge-success">Oggi</span>
                        <?php endif; ?>
                    </td>
                    <td><?php echo round($logFile['size'] / 1024, 1); ?> KB</td>
                    <td>
                        <a href="?date=<?php echo urlencode($logFile['date']); ?>" class="btn btn-secondary" style="padding: 5px 15px; font-size: 12px;">
                            Visualizza
                        </a>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <?php if (count($logFiles) > 10): ?>
        <p style="color: #a0a0b8; margin-top: 15px; text-align: center;">
            Mostrati i 10 file più recenti. Totale: <?php echo count($logFiles); ?> file.
        </p>
    <?php endif; ?>
</div>
<?php endif; ?>

<div class="card">
    <h3>ℹ️ Informazioni</h3>
    <ul style="color: #a0a0b8; line-height: 2;">
        <li>🌐 API Server: <code style="color: #667eea;"><?php echo htmlspecialchars($apiUrl); ?></code></li>
        <li>🔄 I log vengono ruotati automaticamente ogni giorno</li>
        <li>🗑️ I log più vecchi di 30 giorni vengono eliminati automaticamente</li>
        <li>📝 Formato: JSON (una entry per riga)</li>
        <li>🎯 Livelli disponibili: info, warn, error, debug</li>
        <li>🔒 Autenticazione: Bearer Token</li>
    </ul>
</div>

<?php include '../includes/footer.php'; ?>
