<?php
require_once '../config.php';
require_once '../includes/functions.php';

$dbConfig = loadDBConfig();
$mappingConfig = loadMappingConfig();
$translationSettings = loadTranslationSettings();
$filterConfig = loadFilterConfig();
$imageSettings = loadImageSettings();
$variantConfig = loadVariantConfig();
$ecommerceConfig = loadEcommerceConfig();

if (!$dbConfig || !$mappingConfig) {
    header('Location: /admin/pages/connection.php');
    exit;
}

$message = '';
$messageType = '';
$exportData = null;
$exportStats = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'export') {
        try {
            $productLimit = !empty($_POST['product_limit']) ? intval($_POST['product_limit']) : null;

            $startTime = microtime(true);

            $jsonData = generateProductsJSONMultilang($dbConfig, $mappingConfig, $translationSettings, $productLimit, $filterConfig, $imageSettings, $variantConfig, $ecommerceConfig);
            savePublicJSON($jsonData);

            $endTime = microtime(true);
            $executionTime = round($endTime - $startTime, 2);

            $exportStats = [
                'execution_time' => $executionTime,
                'product_limit' => $productLimit,
                'languages' => $jsonData['_meta']['languages'] ?? ['it']
            ];

            logActivity("Export completato: {$jsonData['total']} prodotti in {$executionTime}s");

            $messageType = 'success';
            $message = "✓ Export completato! {$jsonData['total']} prodotti generati in {$executionTime} secondi.";
            $exportData = $jsonData;
        } catch (Exception $e) {
            $messageType = 'error';
            $message = "Errore durante l'export: " . $e->getMessage();
            error_log("Export error: " . $e->getMessage());
        }
    }
}

// Carica ultimo export se esiste
if (!$exportData && file_exists(PUBLIC_JSON_PATH)) {
    $exportData = json_decode(file_get_contents(PUBLIC_JSON_PATH), true);
}

// Conta prodotti totali
$totalProducts = 0;
try {
    $pdo = connectDB($dbConfig);
    $stmt = $pdo->query("SELECT COUNT(*) FROM `{$dbConfig['table']}`");
    $totalProducts = $stmt->fetchColumn();
} catch (Exception $e) {
    $totalProducts = '?';
}

// Controlla se ci sono errori di traduzione recenti
$hasTranslationErrors = false;
$errorLogFile = DATA_PATH . '/translation-errors.log';
if (file_exists($errorLogFile)) {
    $logContent = file_get_contents($errorLogFile);
    // Controlla se ci sono errori nelle ultime 10 righe
    $lines = explode("\n", trim($logContent));
    $recentLines = array_slice($lines, -10);
    $hasTranslationErrors = !empty(array_filter($recentLines));
}

include '../includes/header.php';
?>

<style>
.info-box {
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 10px;
    padding: 15px 20px;
    margin-bottom: 20px;
}

.info-box h4 {
    color: #667eea;
    margin-bottom: 10px;
    font-size: 14px;
}

.info-box p {
    color: #a0a0b8;
    font-size: 13px;
    margin: 0;
}

.lang-badge {
    display: inline-block;
    padding: 4px 10px;
    background: rgba(102, 126, 234, 0.2);
    border-radius: 5px;
    font-size: 12px;
    margin-right: 5px;
    margin-bottom: 5px;
}
</style>

<?php if ($translationSettings['enabled']): ?>
<div class="info-box">
    <h4>🌍 Traduzioni Automatiche Attive</h4>
    <p style="margin-bottom: 10px;">
        L'export genererà contenuti multilingua in:
        <?php foreach ($translationSettings['languages'] as $lang): ?>
            <span class="lang-badge"><?php echo strtoupper($lang); ?></span>
        <?php endforeach; ?>
    </p>
    <p>
        <strong>Nota:</strong> La prima traduzione potrebbe richiedere più tempo. Le traduzioni successive sono cachate e molto più veloci.
    </p>
</div>

<?php if ($hasTranslationErrors): ?>
<div class="alert alert-warning">
    <strong>⚠️ Attenzione:</strong> Rilevati errori nelle traduzioni.
    <br>
    Le traduzioni potrebbero non funzionare correttamente.
    <a href="/admin/pages/test-translation.php" style="color: #667eea; text-decoration: underline; margin-left: 10px;">
        → Vai alla diagnostica per verificare
    </a>
</div>
<?php endif; ?>
<?php endif; ?>

<?php if (!empty($filterConfig)): ?>
<div class="info-box" style="background: rgba(118, 75, 162, 0.1); border-color: rgba(118, 75, 162, 0.3);">
    <h4 style="color: #764ba2;">🔍 Filtri Attivi</h4>
    <p style="margin-bottom: 10px;">
        <strong><?php echo count($filterConfig); ?></strong> <?php echo count($filterConfig) === 1 ? 'filtro attivo' : 'filtri attivi'; ?> configurati.
        L'export includerà solo i prodotti che soddisfano questi criteri.
    </p>
    <p>
        <a href="/admin/pages/filter.php" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px; margin-top: 10px; display: inline-block;">
            ⚙️ Gestisci Filtri
        </a>
    </p>
</div>
<?php endif; ?>

<?php if ($imageSettings['enabled']): ?>
<div class="info-box" style="background: rgba(76, 175, 80, 0.1); border-color: rgba(76, 175, 80, 0.3);">
    <h4 style="color: #4caf50;">🖼️ Immagini Multiple Attive</h4>
    <p style="margin-bottom: 10px;">
        Il sistema scansionerà automaticamente il filesystem per trovare gallery immagini per ogni prodotto.
        I prodotti con più immagini avranno un array <code>"immagini"</code> nel JSON.
    </p>
    <p>
        <a href="/admin/pages/images.php" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px; margin-top: 10px; display: inline-block;">
            ⚙️ Configura Immagini
        </a>
        <a href="/admin/pages/test-product.php" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px; margin-top: 10px; margin-left: 5px; display: inline-block;">
            🧪 Test Prodotto
        </a>
    </p>
</div>
<?php endif; ?>

<?php if ($variantConfig['enabled']): ?>
<div class="info-box" style="background: rgba(153, 102, 255, 0.1); border-color: rgba(153, 102, 255, 0.3);">
    <h4 style="color: #9966ff;">🔀 Varianti Prodotto Attive</h4>
    <p style="margin-bottom: 10px;">
        I prodotti saranno raggruppati per <code><?= htmlspecialchars($variantConfig['groupByField']) ?></code>.
        Ogni gruppo avrà un prodotto master con array <code>"variants"</code> contenente tutte le varianti.
    </p>
    <?php if (!empty($variantConfig['qualifiers'])): ?>
        <p style="margin-bottom: 10px; font-size: 13px;">
            <strong>Qualificatori:</strong>
            <?php foreach ($variantConfig['qualifiers'] as $q): ?>
                <span style="display: inline-block; padding: 3px 8px; background: rgba(153, 102, 255, 0.2); border-radius: 4px; margin-right: 5px; font-size: 12px;">
                    <?= $q['type'] === 'boolean' ? '☑️' : '📝' ?> <?= htmlspecialchars($q['attributeName']) ?>
                </span>
            <?php endforeach; ?>
        </p>
    <?php endif; ?>
    <p>
        <a href="/admin/pages/variants.php" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px; margin-top: 10px; display: inline-block;">
            ⚙️ Configura Varianti
        </a>
    </p>
</div>
<?php endif; ?>

<?php
$resourceConfig = loadResourceConfig();
if (!empty($resourceConfig['enabled'])):
?>
<div class="info-box" style="background: rgba(255, 193, 7, 0.1); border-color: rgba(255, 193, 7, 0.3);">
    <h4 style="color: #ffc107;">📦 Risorse Scaricabili Attive</h4>
    <p style="margin-bottom: 10px;">
        Il sistema scansionerà automaticamente le risorse (PDF, DWG, 3D, etc.) per ogni prodotto.
        Le risorse trovate verranno incluse nell'array <code>"risorse"</code> di ogni prodotto.
    </p>
    <?php if (!empty($resourceConfig['categories'])): ?>
        <p style="margin-bottom: 10px; font-size: 13px;">
            <strong>Categorie configurate:</strong>
            <?php foreach ($resourceConfig['categories'] as $cat): ?>
                <span style="display: inline-block; padding: 3px 8px; background: rgba(255, 193, 7, 0.2); border-radius: 4px; margin-right: 5px; font-size: 12px;">
                    <?= htmlspecialchars($cat['icon']) ?> <?= htmlspecialchars($cat['name']) ?>
                </span>
            <?php endforeach; ?>
        </p>
    <?php endif; ?>
    <p>
        <a href="/admin/pages/resources.php" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px; margin-top: 10px; display: inline-block;">
            ⚙️ Configura Risorse
        </a>
    </p>
</div>
<?php endif; ?>

<?php if (!empty($ecommerceConfig['filters']) || !empty($ecommerceConfig['categories'])): ?>
<div class="info-box" style="background: rgba(156, 39, 176, 0.1); border-color: rgba(156, 39, 176, 0.3);">
    <h4 style="color: #9c27b0;">🛒 Configurazione E-Commerce Attiva</h4>
    <p style="margin-bottom: 10px;">
        Il JSON includerà la sezione <code>_meta</code> con filtri e categorie per l'e-commerce.
        Next.js leggerà questi metadati per generare automaticamente l'interfaccia filtri e categorie.
    </p>
    <div style="display: flex; gap: 20px; margin: 15px 0;">
        <?php if (!empty($ecommerceConfig['filters'])): ?>
        <div style="flex: 1;">
            <strong style="font-size: 13px;">Filtri (<?= count($ecommerceConfig['filters']) ?>):</strong>
            <div style="margin-top: 8px; display: flex; gap: 5px; flex-wrap: wrap;">
                <?php foreach (array_slice($ecommerceConfig['filters'], 0, 5) as $filter): ?>
                    <span style="display: inline-block; padding: 3px 8px; background: rgba(156, 39, 176, 0.2); border-radius: 4px; font-size: 11px;">
                        <?= htmlspecialchars($filter['label']) ?>
                    </span>
                <?php endforeach; ?>
                <?php if (count($ecommerceConfig['filters']) > 5): ?>
                    <span style="font-size: 11px; color: #a0a0b8;">+<?= count($ecommerceConfig['filters']) - 5 ?> altri</span>
                <?php endif; ?>
            </div>
        </div>
        <?php endif; ?>

        <?php if (!empty($ecommerceConfig['categories'])): ?>
        <div style="flex: 1;">
            <strong style="font-size: 13px;">Categorie (<?= count($ecommerceConfig['categories']) ?>):</strong>
            <div style="margin-top: 8px; display: flex; gap: 5px; flex-wrap: wrap;">
                <?php foreach ($ecommerceConfig['categories'] as $cat): ?>
                    <span style="display: inline-block; padding: 3px 8px; background: rgba(156, 39, 176, 0.2); border-radius: 4px; font-size: 11px;">
                        <?= htmlspecialchars($cat['icon']) ?> <?= htmlspecialchars($cat['label']) ?>
                    </span>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>
    </div>
    <p>
        <a href="/admin/pages/ecommerce-config.php" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px; margin-top: 10px; display: inline-block;">
            ⚙️ Configura E-Commerce
        </a>
    </p>
</div>
<?php endif; ?>

<div class="card">
    <h2>Step 4: Export JSON</h2>

    <?php if ($message): ?>
        <div class="alert alert-<?php echo $messageType; ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <form id="export-form">
        <p>Genera il file <code>products.json</code> dal database <strong><?php echo htmlspecialchars($dbConfig['database']); ?></strong>.</p>

        <div style="background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h4 style="color: #667eea; margin-bottom: 15px;">Opzioni Export</h4>

            <?php if (!empty($filterConfig)): ?>
                <div class="alert alert-warning" style="margin-bottom: 15px;">
                    ⚠️ <strong>Filtri SQL Attivi:</strong> <?= count($filterConfig) ?> <?= count($filterConfig) === 1 ? 'filtro' : 'filtri' ?> configurati.
                    <br><br>
                    <strong>Come funziona:</strong>
                    <ul style="margin: 10px 0 10px 20px; line-height: 1.8;">
                        <li>L'export include <strong>solo i prodotti che soddisfano i criteri SQL</strong></li>
                        <li>Il limite diventa un <strong>MASSIMO</strong>, non un numero esatto</li>
                        <li>Se il database contiene meno prodotti filtrati del limite → esporti meno prodotti</li>
                        <li>Se vuoi esattamente N prodotti → <strong>rimuovi i filtri</strong></li>
                    </ul>
                    <a href="/admin/pages/filter.php" style="color: #ff9800; text-decoration: underline; font-weight: 600;">→ Gestisci Filtri SQL</a>
                </div>
            <?php endif; ?>

            <div class="form-group">
                <label>
                    Limita Numero Prodotti
                    <?php if (!empty($filterConfig)): ?>
                        <span style="color: #ff9800; font-weight: 600;">(MASSIMO)</span>
                    <?php endif; ?>
                </label>
                <input type="number" id="product_limit" name="product_limit" placeholder="Lascia vuoto per tutti" min="1" max="<?php echo $totalProducts; ?>">
                <small style="color: #a0a0b8; display: block; margin-top: 5px;">
                    📊 Totale prodotti nel database: <strong><?php echo $totalProducts; ?></strong>
                    <?php if (!empty($filterConfig)): ?>
                        <br>
                        ⚠️ <strong>Con filtri attivi:</strong> Il limite è un MASSIMO. Potresti ottenere meno prodotti se pochi passano i filtri SQL.
                    <?php else: ?>
                        <br>
                        ℹ️ <strong>Senza filtri:</strong> Il limite è ESATTO. Riceverai esattamente il numero di prodotti richiesto.
                    <?php endif; ?>
                    <br>
                    💡 Consiglio: Prova prima con 5-10 prodotti per testare le traduzioni
                </small>
            </div>
        </div>

        <div style="margin: 30px 0;">
            <button type="button" id="export-btn" class="btn" style="font-size: 18px; padding: 20px 40px;" onclick="startExport()">
                🚀 Genera products.json
            </button>
            <?php if (!$translationSettings['enabled']): ?>
                <a href="/admin/pages/settings.php" class="btn btn-secondary" style="margin-left: 10px;">
                    ⚙️ Configura Traduzioni
                </a>
            <?php endif; ?>
        </div>

        <!-- Pulsanti per scaricare i log -->
        <div style="margin: 20px 0; padding: 15px; background: rgba(255, 152, 0, 0.1); border: 1px solid rgba(255, 152, 0, 0.3); border-radius: 10px;">
            <h4 style="color: #ff9800; margin-bottom: 10px; font-size: 14px;">📋 Log Debug</h4>
            <p style="color: #a0a0b8; font-size: 13px; margin-bottom: 15px;">
                Se l'export non funziona correttamente, scarica i log per vedere cosa sta succedendo:
            </p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <?php
                $debugLogPath = DATA_PATH . '/export-debug.log';
                $errorLogPath = DATA_PATH . '/export-error.log';
                ?>
                <?php if (file_exists($debugLogPath)): ?>
                    <a href="/admin/download-log.php?file=export-debug.log" class="btn btn-secondary" style="font-size: 14px; padding: 10px 20px;">
                        📥 Scarica Log Debug
                    </a>
                    <span style="color: #a0a0b8; font-size: 12px; align-self: center;">
                        (<?php echo round(filesize($debugLogPath) / 1024, 2); ?> KB)
                    </span>
                <?php else: ?>
                    <button disabled class="btn btn-secondary" style="font-size: 14px; padding: 10px 20px; opacity: 0.5; cursor: not-allowed;">
                        📥 Nessun Log Debug
                    </button>
                <?php endif; ?>

                <?php if (file_exists($errorLogPath)): ?>
                    <a href="/admin/download-log.php?file=export-error.log" class="btn" style="font-size: 14px; padding: 10px 20px; background: linear-gradient(135deg, #f44336 0%, #e91e63 100%);">
                        ⚠️ Scarica Log Errori
                    </a>
                    <span style="color: #f44336; font-size: 12px; align-self: center; font-weight: 600;">
                        (<?php echo round(filesize($errorLogPath) / 1024, 2); ?> KB)
                    </span>
                <?php else: ?>
                    <button disabled class="btn btn-secondary" style="font-size: 14px; padding: 10px 20px; opacity: 0.5; cursor: not-allowed;">
                        ⚠️ Nessun Errore
                    </button>
                <?php endif; ?>
            </div>
        </div>
    </form>

    <!-- Progress Container (nascosto inizialmente) -->
    <div id="progress-container" style="display: none; background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 10px; padding: 30px; margin-top: 30px;">
        <h3 style="color: #667eea; margin-bottom: 20px;">
            <span id="progress-icon">⏳</span> <span id="progress-phase">Elaborazione in corso...</span>
        </h3>

        <!-- Progress Bar -->
        <div style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; height: 40px; overflow: hidden; margin-bottom: 20px; position: relative;">
            <div id="progress-bar" style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: 0%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 16px;">
                <span id="progress-percent">0%</span>
            </div>
        </div>

        <!-- Progress Details -->
        <div id="progress-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">
                <div style="font-size: 12px; color: #a0a0b8; margin-bottom: 5px;">Prodotti Processati</div>
                <div style="font-size: 20px; font-weight: 600; color: #fff;">
                    <span id="progress-current">0</span> / <span id="progress-total">0</span>
                </div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">
                <div style="font-size: 12px; color: #a0a0b8; margin-bottom: 5px;">Tempo Trascorso</div>
                <div style="font-size: 20px; font-weight: 600; color: #fff;" id="progress-time">0s</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">
                <div style="font-size: 12px; color: #a0a0b8; margin-bottom: 5px;">Stato</div>
                <div style="font-size: 16px; font-weight: 600; color: #667eea;" id="progress-message">Inizializzazione...</div>
            </div>
        </div>

        <!-- Current Product Info -->
        <div id="current-product" style="background: rgba(118, 75, 162, 0.1); border: 1px solid rgba(118, 75, 162, 0.3); border-radius: 8px; padding: 15px; display: none;">
            <div style="font-size: 12px; color: #a0a0b8; margin-bottom: 8px;">Prodotto Corrente:</div>
            <div style="font-size: 16px; font-weight: 600; color: #fff;">
                <span id="current-product-code">-</span> - <span id="current-product-name">-</span>
            </div>
            <div style="font-size: 13px; color: #a0a0b8; margin-top: 8px;">
                <span id="current-product-language" style="display: none;">
                    🌍 Traduzione in <strong id="current-language">-</strong>
                </span>
                <span id="current-product-resources" style="display: none;">
                    📦 <strong id="resources-count">0</strong> risorse trovate
                </span>
            </div>
        </div>

        <!-- Log Messages -->
        <div id="progress-log" style="margin-top: 20px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 15px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; color: #a0a0b8;">
            <div style="color: #667eea;">🚀 Avvio export...</div>
        </div>
    </div>
</div>

<script>
let exportStartTime = null;
let timerInterval = null;
let logPollingInterval = null;
let lastLogLineCount = 0;

function startExport() {
    const exportBtn = document.getElementById('export-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressLog = document.getElementById('progress-log');
    const productLimit = document.getElementById('product_limit').value;

    // Disabilita bottone
    exportBtn.disabled = true;
    exportBtn.style.opacity = '0.5';
    exportBtn.textContent = '⏳ Export in corso...';

    // Mostra progress container
    progressContainer.style.display = 'block';
    progressLog.innerHTML = '<div style="color: #667eea;">🚀 Avvio export...</div>';

    // Avvia timer
    exportStartTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);

    // Avvia polling del log in tempo reale
    lastLogLineCount = 0;
    logPollingInterval = setInterval(updateLogFromFile, 2000);
    updateLogFromFile(); // Prima chiamata immediata

    // Costruisci URL con parametri
    let url = '/admin/pages/export-stream.php';
    if (productLimit) {
        url += '?limit=' + encodeURIComponent(productLimit);
    }

    // Connetti a SSE endpoint
    const eventSource = new EventSource(url);

    eventSource.addEventListener('progress', function(e) {
        const data = JSON.parse(e.data);
        updateProgress(data);
    });

    eventSource.addEventListener('complete', function(e) {
        const data = JSON.parse(e.data);
        completeExport(data);
        eventSource.close();
        // Stop log polling
        if (logPollingInterval) {
            clearInterval(logPollingInterval);
            logPollingInterval = null;
        }
    });

    eventSource.addEventListener('error', function(e) {
        const errorMsg = e.data ? JSON.parse(e.data).message : 'Errore di connessione';
        handleExportError(errorMsg);
        eventSource.close();
        // Stop log polling
        if (logPollingInterval) {
            clearInterval(logPollingInterval);
            logPollingInterval = null;
        }
    });
}

// Funzione per aggiornare il log leggendo il file export-debug.log
function updateLogFromFile() {
    fetch('/admin/pages/get-export-log.php?lines=20')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.lines && data.lines.length > 0) {
                const progressLog = document.getElementById('progress-log');

                // Mostra solo le nuove righe (dopo lastLogLineCount)
                if (data.total_lines > lastLogLineCount) {
                    const newLines = data.lines.slice(-(data.total_lines - lastLogLineCount));

                    newLines.forEach(line => {
                        const lineDiv = document.createElement('div');
                        lineDiv.style.marginBottom = '3px';
                        lineDiv.style.color = '#a0a0b8';

                        // Colora le righe in base al contenuto
                        if (line.includes('ERROR') || line.includes('Failed')) {
                            lineDiv.style.color = '#ff5252';
                        } else if (line.includes('SUCCESS') || line.includes('completata')) {
                            lineDiv.style.color = '#4caf50';
                        } else if (line.includes('START') || line.includes('Inizio')) {
                            lineDiv.style.color = '#667eea';
                        }

                        lineDiv.textContent = line;
                        progressLog.appendChild(lineDiv);
                    });

                    // Auto-scroll
                    progressLog.scrollTop = progressLog.scrollHeight;
                    lastLogLineCount = data.total_lines;
                }
            }
        })
        .catch(err => {
            console.error('Error fetching log:', err);
        });
}

function updateProgress(data) {
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const progressCurrent = document.getElementById('progress-current');
    const progressTotal = document.getElementById('progress-total');
    const progressMessage = document.getElementById('progress-message');
    const progressPhase = document.getElementById('progress-phase');
    const progressIcon = document.getElementById('progress-icon');
    const currentProduct = document.getElementById('current-product');
    const progressLog = document.getElementById('progress-log');

    // Update progress bar
    progressBar.style.width = data.percent + '%';
    progressPercent.textContent = data.percent + '%';

    // Update counts
    progressCurrent.textContent = data.current || 0;
    progressTotal.textContent = data.total || 0;

    // Update message
    progressMessage.textContent = data.message || 'In elaborazione...';

    // Update phase icon and title
    const phaseIcons = {
        'loading': '📥',
        'transform': '⚙️',
        'variants': '🔀',
        'translation': '🌍',
        'metadata': '📊',
        'saving': '💾'
    };
    const phaseTitles = {
        'loading': 'Caricamento Dati',
        'transform': 'Trasformazione Prodotti',
        'variants': 'Raggruppamento Varianti',
        'translation': 'Traduzione Contenuti',
        'metadata': 'Generazione Metadati',
        'saving': 'Salvataggio File'
    };
    progressIcon.textContent = phaseIcons[data.phase] || '⏳';
    progressPhase.textContent = phaseTitles[data.phase] || 'Elaborazione in corso...';

    // Show current product info
    if (data.product) {
        currentProduct.style.display = 'block';
        document.getElementById('current-product-code').textContent = data.product.codice || '-';
        document.getElementById('current-product-name').textContent = data.product.nome || '-';

        // Show language if translating
        const langSpan = document.getElementById('current-product-language');
        if (data.language) {
            langSpan.style.display = 'inline';
            document.getElementById('current-language').textContent = data.language;
        } else {
            langSpan.style.display = 'none';
        }

        // Show resources if found
        const resSpan = document.getElementById('current-product-resources');
        if (data.resources) {
            resSpan.style.display = 'inline';
            document.getElementById('resources-count').textContent = data.resources;
        } else {
            resSpan.style.display = 'none';
        }
    } else {
        currentProduct.style.display = 'none';
    }

    // Add to log
    const logEntry = document.createElement('div');
    logEntry.style.color = data.percent === 100 ? '#4caf50' : '#a0a0b8';
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${data.message}`;
    progressLog.appendChild(logEntry);
    progressLog.scrollTop = progressLog.scrollHeight;
}

function completeExport(data) {
    clearInterval(timerInterval);

    const exportBtn = document.getElementById('export-btn');
    const progressIcon = document.getElementById('progress-icon');
    const progressPhase = document.getElementById('progress-phase');
    const progressMessage = document.getElementById('progress-message');
    const progressLog = document.getElementById('progress-log');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const currentProduct = document.getElementById('current-product');

    // Update UI
    progressIcon.textContent = '✅';
    progressPhase.textContent = 'Export Completato!';
    progressMessage.innerHTML = `<span style="color: #4caf50;">${data.message}</span>`;
    progressBar.style.width = '100%';
    progressBar.style.background = 'linear-gradient(90deg, #4caf50 0%, #45a049 100%)';
    progressPercent.textContent = '100%';

    // Hide current product info
    currentProduct.style.display = 'none';

    // Add separator in log
    const separator = document.createElement('div');
    separator.style.borderTop = '1px solid rgba(255, 255, 255, 0.2)';
    separator.style.margin = '15px 0';
    progressLog.appendChild(separator);

    // Add success log
    const logEntry = document.createElement('div');
    logEntry.style.color = '#4caf50';
    logEntry.style.fontWeight = '600';
    logEntry.style.fontSize = '14px';
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ✅ Export completato con successo!`;
    progressLog.appendChild(logEntry);

    // Add stats
    if (data.stats) {
        const statsEntry = document.createElement('div');
        statsEntry.style.color = '#667eea';
        statsEntry.style.marginTop = '10px';
        statsEntry.style.padding = '10px';
        statsEntry.style.background = 'rgba(102, 126, 234, 0.1)';
        statsEntry.style.borderRadius = '5px';
        statsEntry.style.fontSize = '13px';
        statsEntry.innerHTML = `
            <strong>📊 Statistiche Export:</strong><br>
            • Prodotti esportati: <strong>${data.stats.total_products}</strong><br>
            • Tempo esecuzione: <strong>${data.stats.execution_time}s</strong><br>
            • Lingue: <strong>${data.stats.languages.map(l => l.toUpperCase()).join(', ')}</strong><br>
            • Dimensione file: <strong>${(data.stats.file_size / 1024).toFixed(2)} KB</strong>
        `;
        progressLog.appendChild(statsEntry);
    }

    progressLog.scrollTop = progressLog.scrollHeight;

    // Re-enable button
    exportBtn.disabled = false;
    exportBtn.style.opacity = '1';
    exportBtn.textContent = '🚀 Genera products.json';

    // NON ricaricare la pagina - mantieni il log visibile
    // L'utente può vedere tutto quello che è successo
}

function handleExportError(errorMsg) {
    clearInterval(timerInterval);

    const exportBtn = document.getElementById('export-btn');
    const progressIcon = document.getElementById('progress-icon');
    const progressPhase = document.getElementById('progress-phase');
    const progressMessage = document.getElementById('progress-message');
    const progressLog = document.getElementById('progress-log');

    // Update UI
    progressIcon.textContent = '❌';
    progressPhase.textContent = 'Errore Export';
    progressMessage.innerHTML = `<span style="color: #f44336;">${errorMsg}</span>`;

    // Add error log
    const logEntry = document.createElement('div');
    logEntry.style.color = '#f44336';
    logEntry.style.fontWeight = '600';
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ❌ Errore: ${errorMsg}`;
    progressLog.appendChild(logEntry);
    progressLog.scrollTop = progressLog.scrollHeight;

    // Re-enable button
    exportBtn.disabled = false;
    exportBtn.style.opacity = '1';
    exportBtn.textContent = '🚀 Genera products.json';
}

function updateTimer() {
    if (!exportStartTime) return;

    const elapsed = Math.floor((Date.now() - exportStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    document.getElementById('progress-time').textContent = timeStr;
}
</script>

<?php if ($exportStats): ?>
<div class="card">
    <h3>📊 Statistiche Export</h3>
    <div class="stats">
        <div class="stat-box">
            <div class="stat-number"><?php echo $exportStats['execution_time']; ?>s</div>
            <div class="stat-label">Tempo Esecuzione</div>
        </div>
        <div class="stat-box">
            <div class="stat-number"><?php echo count($exportStats['languages']); ?></div>
            <div class="stat-label">Lingue Generate</div>
        </div>
        <div class="stat-box">
            <div class="stat-number"><?php echo $exportStats['product_limit'] ?: 'Tutti'; ?></div>
            <div class="stat-label">Prodotti Esportati</div>
        </div>
    </div>
</div>
<?php endif; ?>

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

    <?php if (isset($exportData['_meta']['languages'])): ?>
        <div style="margin-top: 20px;">
            <strong>Lingue disponibili:</strong>
            <?php foreach ($exportData['_meta']['languages'] as $lang): ?>
                <span class="lang-badge"><?php echo strtoupper($lang); ?></span>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <h4 style="margin-top: 30px;">URL Pubblico</h4>
    <p>Il file JSON è accessibile a questo indirizzo:</p>
    <pre><?php
    $domain = $_SERVER['HTTP_HOST'];
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $jsonUrl = "$protocol://$domain/data/products.json";
    echo $jsonUrl;
    ?></pre>

    <a href="<?php echo $jsonUrl; ?>" target="_blank" class="btn">Visualizza JSON</a>
    <a href="<?php echo $jsonUrl; ?>" download class="btn btn-secondary" style="margin-left: 10px;">Download JSON</a>
</div>

<div class="card">
    <h3>Esempio Utilizzo nel tuo E-Commerce</h3>
    <p>Nel tuo e-commerce Next.js su Vercel, usa questo URL per caricare i prodotti:</p>
    <pre>// lib/db/products.ts
const PRODUCTS_URL = '<?php echo $jsonUrl; ?>';

export async function getAllProducts() {
  const response = await fetch(PRODUCTS_URL, {
    next: { revalidate: 300 } // Cache 5 minuti
  });
  const json = await response.json();
  return json.prodotti;
}

// Per accedere ai nomi tradotti
const currentLang = 'en'; // o 'it', 'de', etc.
product.nome[currentLang] // Nome tradotto
product.descrizione[currentLang] // Descrizione tradotta</pre>
</div>

<div class="card">
    <h3>Preview Primo Prodotto</h3>
    <pre><?php
    if (!empty($exportData['prodotti'])) {
        ini_set('serialize_precision', 14);
        $previewJson = json_encode($exportData['prodotti'][0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $previewJson = forceDecimalsInJSON($previewJson, 2);
        echo $previewJson;
    }
    ?></pre>
</div>
<?php endif; ?>

<div class="card">
    <h3>Sync Automatico (Opzionale)</h3>
    <p>Puoi automatizzare l'export creando un Cron Job su Siteground che esegue:</p>
    <pre>*/6 * * * * php <?php echo BASE_PATH; ?>/cron/auto-sync.php</pre>
    <p style="color: #a0a0b8; margin-top: 10px;">
        Questo rigenera il JSON ogni 6 ore automaticamente.
    </p>
</div>

<div class="card" style="background: rgba(102, 126, 234, 0.1);">
    <h3>📋 Istruzioni Rapide</h3>
    <ol style="color: #fff; line-height: 1.8;">
        <li>Configura le traduzioni in <a href="/admin/pages/settings.php" style="color: #667eea;">Settings</a> (se necessario)</li>
        <li>Per test: Limita a 5-10 prodotti</li>
        <li>Clicca "Genera products.json"</li>
        <li>Verifica il JSON generato nella preview</li>
        <li>Usa l'URL pubblico nel tuo e-commerce Next.js</li>
    </ol>
</div>

<?php include '../includes/footer.php'; ?>
