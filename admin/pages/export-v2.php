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

// Controlla se c'è un export in corso o interrotto
$exportStateFile = DATA_PATH . '/export-v2-state.json';
$hasInProgressExport = false;
$exportState = null;

if (file_exists($exportStateFile)) {
    $exportState = json_decode(file_get_contents($exportStateFile), true);
    if ($exportState && $exportState['status'] === 'in_progress') {
        $hasInProgressExport = true;
    }
}

include '../includes/header.php';
?>

<style>
.v2-badge {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    margin-left: 10px;
}

.resume-banner {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.feature-card {
    background: rgba(102, 126, 234, 0.1);
    border: 2px solid rgba(102, 126, 234, 0.3);
    border-radius: 10px;
    padding: 15px;
}

.feature-card h4 {
    color: #667eea;
    margin: 0 0 10px 0;
    font-size: 14px;
}

.feature-card p {
    color: #666;
    font-size: 13px;
    margin: 0;
}
</style>

<div class="page-header">
    <h1>
        🚀 Export Prodotti v2.0
        <span class="v2-badge">NUOVO</span>
    </h1>
    <p style="color: #a0a0b8;">Export resiliente con salvataggio incrementale e resume automatico</p>
</div>

<?php if ($hasInProgressExport): ?>
<div class="resume-banner">
    <h3 style="margin: 0 0 10px 0;">📂 Export Interrotto Trovato!</h3>
    <p style="margin: 0 0 15px 0;">
        Hai un export in corso iniziato il <?php echo date('d/m/Y H:i', $exportState['started_at'] ?? time()); ?>.
        <br>
        Prodotti completati: <strong><?php echo $exportState['completed_products'] ?? 0; ?></strong> di <strong><?php echo $exportState['total_products'] ?? '?'; ?></strong>
    </p>
    <button onclick="resumeExport()" class="btn" style="background: white; color: #f5576c; margin-right: 10px;">
        ▶️ Riprendi Export
    </button>
    <button onclick="resetExport()" class="btn" style="background: rgba(255,255,255,0.2); color: white;">
        🗑️ Ricomincia da Zero
    </button>
</div>
<?php endif; ?>

<div class="card">
    <h2>🌟 Novità della v2.0</h2>

    <div class="feature-grid">
        <div class="feature-card">
            <h4>💾 Salvataggio Incrementale</h4>
            <p>I prodotti vengono salvati ogni 50 unità. In caso di interruzione, nessun dato viene perso!</p>
        </div>

        <div class="feature-card">
            <h4>🔄 Resume Automatico</h4>
            <p>Se l'export si interrompe, puoi riprenderlo esattamente da dove si è fermato.</p>
        </div>

        <div class="feature-card">
            <h4>📊 Progress Tracking</h4>
            <p>Stato dell'export salvato in tempo reale. Sai sempre a che punto sei.</p>
        </div>

        <div class="feature-card">
            <h4>🛡️ Fault Tolerant</h4>
            <p>Errori su singoli prodotti non bloccano l'intero export. Vengono loggati e saltati.</p>
        </div>
    </div>

    <div class="form-group" style="margin-top: 30px;">
        <label>
            Limita Numero Prodotti (Opzionale)
            <?php if (!empty($filterConfig)): ?>
                <span style="color: #ff9800; font-weight: 600;">(MASSIMO)</span>
            <?php endif; ?>
        </label>
        <input type="number" id="product_limit_v2" name="product_limit" placeholder="Lascia vuoto per tutti" min="1">
        <small style="color: #a0a0b8; display: block; margin-top: 5px;">
            💡 Consiglio: Lascia vuoto per esportare tutto. Il salvataggio incrementale gestirà i timeout automaticamente.
        </small>
    </div>

    <div class="form-group" style="margin-top: 20px;">
        <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" id="skip_translations_v2" name="skip_translations" value="1" checked style="margin-right: 10px; width: 20px; height: 20px;">
            <span style="font-size: 16px;">
                ⚡ <strong>Export Veloce</strong> - Salta traduzioni (solo italiano)
            </span>
        </label>
        <small style="color: #a0a0b8; display: block; margin-top: 5px; margin-left: 30px;">
            ✅ Consigliato: Export veloce senza traduzioni, poi usa il tool "Traduci Prodotti" separato.<br>
            ⚠️ Se disattivi, l'export includerà traduzioni ma potrebbe essere più lento e soggetto a timeout.
        </small>
    </div>

    <div style="margin: 30px 0;">
        <button type="button" id="export-btn-v2" class="btn" style="font-size: 18px; padding: 20px 40px;" onclick="startExportV2()">
            🚀 Avvia Export v2.0
        </button>
        <a href="/admin/pages/translate-client.php" class="btn" style="margin-left: 10px; background: #2196F3;">
            🌍 Traduci (Client-Side) ⚡
        </a>
        <a href="/admin/pages/translate-products.php" class="btn" style="margin-left: 10px; background: #9c27b0;">
            🌐 Traduci (Server) [Legacy]
        </a>
        <a href="/admin/pages/export.php" class="btn btn-secondary" style="margin-left: 10px;">
            ← Torna a Export v1
        </a>
    </div>
</div>

<!-- Progress Container -->
<div id="progress-container-v2" style="display: none; margin-top: 30px;">
    <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">Progresso Export v2.0</h2>
            <button onclick="cancelExport()" class="btn" style="background: #f44336; padding: 8px 16px; font-size: 14px;">
                ⏹️ Interrompi
            </button>
        </div>

        <!-- Progress Bar -->
        <div style="background: #e0e0e0; border-radius: 10px; height: 40px; overflow: hidden; margin-bottom: 20px;">
            <div id="progress-bar-v2" style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: 0%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                0%
            </div>
        </div>

        <!-- Stats -->
        <div class="stats">
            <div class="stat-box">
                <div class="stat-number" id="stat-completed-v2">0</div>
                <div class="stat-label">Prodotti Completati</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" id="stat-total-v2">0</div>
                <div class="stat-label">Prodotti Totali</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" id="stat-time-v2">0s</div>
                <div class="stat-label">Tempo Trascorso</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" id="stat-chunks-v2">0</div>
                <div class="stat-label">Chunk Salvati</div>
            </div>
        </div>

        <!-- Current Product Info -->
        <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
            <div style="font-weight: bold; color: #667eea; margin-bottom: 5px;">Prodotto Corrente:</div>
            <div id="current-product-v2" style="color: #666;">In attesa...</div>
        </div>

        <!-- Log -->
        <div style="margin-top: 20px;">
            <h3>📋 Log Attività</h3>
            <div id="progress-log-v2" style="background: #1e1e1e; color: #00ff00; font-family: 'Courier New', monospace; font-size: 12px; padding: 15px; border-radius: 5px; height: 300px; overflow-y: auto;">
                <div>[<?php echo date('H:i:s'); ?>] Sistema pronto...</div>
            </div>
        </div>
    </div>
</div>

<script>
let exportStartTime = null;
let timerInterval = null;
let eventSource = null;
let retryCount = 0;
const MAX_RETRIES = 3;
let exportCompleted = false; // Flag per sapere se export è completato

function startExportV2() {
    const exportBtn = document.getElementById('export-btn-v2');
    const progressContainer = document.getElementById('progress-container-v2');
    const productLimit = document.getElementById('product_limit_v2').value;
    const skipTranslations = document.getElementById('skip_translations_v2').checked;

    // Reset flag
    exportCompleted = false;
    retryCount = 0;

    // Disabilita bottone
    exportBtn.disabled = true;
    exportBtn.style.opacity = '0.5';
    exportBtn.textContent = '⏳ Export in corso...';

    // Mostra progress
    progressContainer.style.display = 'block';

    // Start timer
    exportStartTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);

    // Costruisci URL
    let url = '/admin/pages/export-stream-v2.php';
    const params = [];
    if (productLimit) {
        params.push('limit=' + encodeURIComponent(productLimit));
    }
    if (skipTranslations) {
        params.push('skip_translations=1');
    }
    if (params.length > 0) {
        url += '?' + params.join('&');
    }

    // Connetti a SSE endpoint
    eventSource = new EventSource(url);

    eventSource.addEventListener('progress', function(e) {
        const data = JSON.parse(e.data);
        updateProgressV2(data);
    });

    eventSource.addEventListener('chunk_saved', function(e) {
        const data = JSON.parse(e.data);
        addLog('💾 Chunk salvato: ' + data.chunk_number + ' (' + data.products_in_chunk + ' prodotti)');
        document.getElementById('stat-chunks-v2').textContent = data.chunk_number;
    });

    eventSource.addEventListener('translation', function(e) {
        const data = JSON.parse(e.data);
        addLog(data.message, data.type); // 'error', 'warning', o null
    });

    eventSource.addEventListener('complete', function(e) {
        const data = JSON.parse(e.data);
        completeExportV2(data);
        eventSource.close();
    });

    eventSource.addEventListener('error', function(e) {
        handleErrorV2(e);
        eventSource.close();
    });
}

function resumeExport() {
    addLog('▶️ Ripresa export dal punto di interruzione...');
    startExportV2();
}

function resetExport() {
    if (confirm('Sei sicuro di voler eliminare lo stato dell\'export e ricominciare da zero?')) {
        fetch('/admin/pages/export-reset-v2.php', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                }
            });
    }
}

function cancelExport() {
    if (eventSource) {
        eventSource.close();
    }
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    addLog('⏹️ Export interrotto dall\'utente');
    document.getElementById('export-btn-v2').disabled = false;
    document.getElementById('export-btn-v2').style.opacity = '1';
    document.getElementById('export-btn-v2').textContent = '🚀 Avvia Export v2.0';
}

function updateProgressV2(data) {
    const percent = data.percent || 0;
    const progressBar = document.getElementById('progress-bar-v2');
    progressBar.style.width = percent + '%';
    progressBar.textContent = Math.round(percent) + '%';

    document.getElementById('stat-completed-v2').textContent = data.current || 0;
    document.getElementById('stat-total-v2').textContent = data.total || 0;

    if (data.product) {
        document.getElementById('current-product-v2').textContent =
            data.product.codice + ' - ' + data.product.nome + (data.language ? ' [' + data.language + ']' : '');
    }

    addLog(data.message || 'Progresso...');

    // Se vediamo il messaggio finale, sappiamo che export sta per completare
    if (data.message && data.message.includes('File pubblico aggiornato con successo')) {
        addLog('⏳ Attendo evento di completamento...');
        // Dopo 2 secondi, se non abbiamo ricevuto 'complete', assumiamo completamento
        setTimeout(() => {
            if (!exportCompleted) {
                addLog('✅ Export completato (verificato da progress)');
                exportCompleted = true;
                // Simula completeExportV2 per stats finali
                if (timerInterval) {
                    clearInterval(timerInterval);
                }
                document.getElementById('progress-bar-v2').style.background = 'linear-gradient(90deg, #4caf50 0%, #45a049 100%)';
                setTimeout(() => location.reload(), 2000);
            }
        }, 2000);
    }
}

function completeExportV2(data) {
    exportCompleted = true; // Setta flag per ignorare errori di chiusura

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    document.getElementById('progress-bar-v2').style.background = 'linear-gradient(90deg, #4caf50 0%, #45a049 100%)';
    addLog('✅ Export completato con successo!');
    addLog('📊 Totale prodotti: ' + data.stats.total_products);
    addLog('⏱️ Tempo totale: ' + data.stats.execution_time + 's');
    addLog('📦 File size: ' + (data.stats.file_size / 1024).toFixed(2) + ' KB');
    addLog('');
    addLog('🔄 Puoi riavviare un nuovo export quando vuoi, o chiudere questa pagina.');

    // Riabilita il pulsante export dopo completamento
    document.getElementById('export-btn-v2').disabled = false;
    document.getElementById('export-btn-v2').style.opacity = '1';
    document.getElementById('export-btn-v2').textContent = '🚀 Avvia Nuovo Export';
}

function handleErrorV2(error) {
    // Se export è completato, ignora errori di chiusura connessione
    if (exportCompleted) {
        addLog('🔌 Connessione chiusa dopo completamento (normale)');
        return;
    }

    // Log dettagliato dell'errore
    const errorDetails = {
        type: error.type || 'unknown',
        target_readyState: eventSource ? eventSource.readyState : 'no eventSource',
        message: error.message || 'Nessun messaggio',
        timeStamp: error.timeStamp || Date.now()
    };

    const readyStates = {
        0: 'CONNECTING',
        1: 'OPEN',
        2: 'CLOSED'
    };

    const stateText = readyStates[errorDetails.target_readyState] || errorDetails.target_readyState;

    addLog('❌ Errore SSE: ' + JSON.stringify(errorDetails));
    addLog('📡 Stato connessione: ' + stateText);

    // Verifica se possiamo fare retry automatico
    if (retryCount < MAX_RETRIES) {
        retryCount++;
        const retryDelay = 3; // secondi
        addLog('🔄 Retry automatico ' + retryCount + '/' + MAX_RETRIES + ' tra ' + retryDelay + ' secondi...');

        setTimeout(function() {
            addLog('▶️ Riconnessione automatica in corso...');
            resumeExport();
        }, retryDelay * 1000);
    } else {
        // Max retry raggiunto
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        addLog('⚠️ Raggiunto limite di retry (' + MAX_RETRIES + ')');
        addLog('💡 Clicca "Riprendi" per continuare manualmente');
        document.getElementById('export-btn-v2').disabled = false;
        document.getElementById('export-btn-v2').style.opacity = '1';
        document.getElementById('export-btn-v2').textContent = '▶️ Riprendi Export';
    }
}

function updateTimer() {
    if (!exportStartTime) return;
    const elapsed = Math.floor((Date.now() - exportStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('stat-time-v2').textContent =
        (minutes > 0 ? minutes + 'm ' : '') + seconds + 's';
}

function addLog(message, type) {
    const log = document.getElementById('progress-log-v2');
    const timestamp = new Date().toLocaleTimeString('it-IT');
    const entry = document.createElement('div');
    entry.textContent = '[' + timestamp + '] ' + message;

    // Colora in base al tipo
    if (type === 'error') {
        entry.style.color = '#ff6b6b'; // Rosso per errori
        entry.style.fontWeight = 'bold';
    } else if (type === 'warning') {
        entry.style.color = '#ffa726'; // Arancione per warning (API lente)
        entry.style.fontWeight = 'bold';
    }

    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}
</script>

<?php include '../includes/footer.php'; ?>
