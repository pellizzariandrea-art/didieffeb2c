<?php
require_once '../config.php';
require_once '../includes/functions.php';

$translationSettings = loadTranslationSettings();
$testResult = null;
$logContent = '';

// Carica log errori se esiste
$logFile = DATA_PATH . '/translation-errors.log';
if (file_exists($logFile)) {
    $logContent = file_get_contents($logFile);
    // Mostra solo le ultime 50 righe
    $lines = explode("\n", $logContent);
    $logContent = implode("\n", array_slice($lines, -50));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'test_translation') {
        $testText = $_POST['test_text'] ?? 'Ciao mondo';
        $testLang = $_POST['test_lang'] ?? 'en';

        $startTime = microtime(true);
        $translation = translateText($testText, $testLang, $translationSettings['api_key']);
        $endTime = microtime(true);
        $duration = round(($endTime - $startTime) * 1000, 2);

        $testResult = [
            'original' => $testText,
            'translation' => $translation,
            'lang' => $testLang,
            'duration' => $duration,
            'success' => $translation !== $testText
        ];
    } elseif ($_POST['action'] === 'clear_log') {
        if (file_exists($logFile)) {
            unlink($logFile);
            $logContent = '';
        }
        $message = 'Log svuotato con successo';
    } elseif ($_POST['action'] === 'clear_cache') {
        $cacheFile = DATA_PATH . '/translation-cache.json';
        if (file_exists($cacheFile)) {
            unlink($cacheFile);
        }
        $message = 'Cache traduzioni svuotata con successo';
    }
}

include '../includes/header.php';
?>

<style>
.diagnostic-box {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
}

.diagnostic-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.diagnostic-label {
    color: #a0a0b8;
    font-weight: 600;
}

.diagnostic-value {
    color: #fff;
}

.status-ok {
    color: #4caf50;
    font-weight: bold;
}

.status-error {
    color: #f44336;
    font-weight: bold;
}

.log-viewer {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 15px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    max-height: 400px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
}
</style>

<?php if (isset($message)): ?>
    <div class="alert alert-success">
        <?php echo htmlspecialchars($message); ?>
    </div>
<?php endif; ?>

<div class="card">
    <h2>🔧 Diagnostica Traduzioni</h2>
    <p style="color: #a0a0b8;">Testa la connessione API e verifica gli errori di traduzione.</p>
</div>

<div class="card">
    <h3>📊 Stato Configurazione</h3>
    <div class="diagnostic-box">
        <div class="diagnostic-row">
            <div class="diagnostic-label">Traduzioni Abilitate</div>
            <div class="diagnostic-value">
                <?php if ($translationSettings['enabled']): ?>
                    <span class="status-ok">✓ SÌ</span>
                <?php else: ?>
                    <span class="status-error">✗ NO</span>
                <?php endif; ?>
            </div>
        </div>

        <div class="diagnostic-row">
            <div class="diagnostic-label">API Key Configurata</div>
            <div class="diagnostic-value">
                <?php if (!empty($translationSettings['api_key'])): ?>
                    <span class="status-ok">✓ SÌ</span>
                    <code>(<?php echo substr($translationSettings['api_key'], 0, 12); ?>...)</code>
                <?php else: ?>
                    <span class="status-error">✗ NO - <a href="/admin/pages/settings.php" style="color: #667eea;">Configura qui</a></span>
                <?php endif; ?>
            </div>
        </div>

        <div class="diagnostic-row">
            <div class="diagnostic-label">Lingue Configurate</div>
            <div class="diagnostic-value">
                <?php foreach ($translationSettings['languages'] as $lang): ?>
                    <span class="lang-badge"><?php echo strtoupper($lang); ?></span>
                <?php endforeach; ?>
            </div>
        </div>

        <div class="diagnostic-row">
            <div class="diagnostic-label">Cache Traduzioni</div>
            <div class="diagnostic-value">
                <?php
                $cacheFile = DATA_PATH . '/translation-cache.json';
                if (file_exists($cacheFile)) {
                    $cacheSize = filesize($cacheFile);
                    $cache = json_decode(file_get_contents($cacheFile), true);
                    $cacheCount = count($cache ?? []);
                    echo "<span class=\"status-ok\">{$cacheCount} traduzioni in cache</span> ";
                    echo "(" . round($cacheSize / 1024, 2) . " KB)";
                } else {
                    echo "<span style=\"color: #a0a0b8;\">Nessuna cache</span>";
                }
                ?>
            </div>
        </div>
    </div>
</div>

<div class="card">
    <h3>🧪 Test Traduzione</h3>
    <form method="POST">
        <input type="hidden" name="action" value="test_translation">

        <div class="form-group">
            <label>Testo da Tradurre (Italiano)</label>
            <input type="text" name="test_text" value="<?php echo isset($_POST['test_text']) ? htmlspecialchars($_POST['test_text']) : 'Ciao mondo'; ?>" required>
        </div>

        <div class="form-group">
            <label>Lingua Target</label>
            <select name="test_lang">
                <option value="en" <?php echo (isset($_POST['test_lang']) && $_POST['test_lang'] === 'en') ? 'selected' : ''; ?>>English</option>
                <option value="de" <?php echo (isset($_POST['test_lang']) && $_POST['test_lang'] === 'de') ? 'selected' : ''; ?>>Deutsch</option>
                <option value="fr" <?php echo (isset($_POST['test_lang']) && $_POST['test_lang'] === 'fr') ? 'selected' : ''; ?>>Français</option>
                <option value="es" <?php echo (isset($_POST['test_lang']) && $_POST['test_lang'] === 'es') ? 'selected' : ''; ?>>Español</option>
                <option value="pt" <?php echo (isset($_POST['test_lang']) && $_POST['test_lang'] === 'pt') ? 'selected' : ''; ?>>Português</option>
            </select>
        </div>

        <button type="submit" class="btn">🚀 Testa Traduzione</button>
    </form>

    <?php if ($testResult): ?>
        <div style="margin-top: 30px;">
            <h4>Risultato Test:</h4>
            <div class="diagnostic-box">
                <div class="diagnostic-row">
                    <div class="diagnostic-label">Testo Originale</div>
                    <div class="diagnostic-value"><?php echo htmlspecialchars($testResult['original']); ?></div>
                </div>

                <div class="diagnostic-row">
                    <div class="diagnostic-label">Traduzione</div>
                    <div class="diagnostic-value">
                        <?php if ($testResult['success']): ?>
                            <span class="status-ok"><?php echo htmlspecialchars($testResult['translation']); ?></span>
                        <?php else: ?>
                            <span class="status-error"><?php echo htmlspecialchars($testResult['translation']); ?></span>
                            <br><small>⚠️ La traduzione è identica all'originale - verifica il log errori sotto</small>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="diagnostic-row">
                    <div class="diagnostic-label">Lingua Target</div>
                    <div class="diagnostic-value"><?php echo strtoupper($testResult['lang']); ?></div>
                </div>

                <div class="diagnostic-row">
                    <div class="diagnostic-label">Tempo Esecuzione</div>
                    <div class="diagnostic-value"><?php echo $testResult['duration']; ?> ms</div>
                </div>

                <div class="diagnostic-row">
                    <div class="diagnostic-label">Esito</div>
                    <div class="diagnostic-value">
                        <?php if ($testResult['success']): ?>
                            <span class="status-ok">✓ SUCCESSO</span>
                        <?php else: ?>
                            <span class="status-error">✗ FALLITO</span>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>

<div class="card">
    <h3>📋 Log Errori (ultimi 50 record)</h3>

    <?php if (!empty($logContent)): ?>
        <div class="log-viewer"><?php echo htmlspecialchars($logContent); ?></div>

        <div style="margin-top: 20px;">
            <form method="POST" style="display: inline;">
                <input type="hidden" name="action" value="clear_log">
                <button type="submit" class="btn btn-secondary">🗑️ Svuota Log</button>
            </form>
        </div>
    <?php else: ?>
        <div class="alert alert-success">
            ✓ Nessun errore registrato
        </div>
    <?php endif; ?>
</div>

<div class="card">
    <h3>⚙️ Azioni</h3>
    <form method="POST" style="display: inline-block; margin-right: 10px;">
        <input type="hidden" name="action" value="clear_cache">
        <button type="submit" class="btn btn-secondary">🔄 Svuota Cache Traduzioni</button>
    </form>

    <a href="/admin/pages/settings.php" class="btn btn-secondary">⚙️ Impostazioni Traduzioni</a>
    <a href="/admin/pages/export.php" class="btn">← Torna all'Export</a>
</div>

<?php include '../includes/footer.php'; ?>
