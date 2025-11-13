<?php
/**
 * Client-Side Translation System
 * Traduzioni gestite completamente dal browser - nessun timeout PHP!
 */
require_once '../config.php';

// Load products.json per contare i prodotti (pubblico - quello usato dal frontend)
$productsFile = PUBLIC_JSON_PATH;
$totalProducts = 0;
if (file_exists($productsFile)) {
    $productsData = json_decode(file_get_contents($productsFile), true);
    // Check both "products" and "prodotti" keys
    if (isset($productsData['products'])) {
        $totalProducts = count($productsData['products']);
    } elseif (isset($productsData['prodotti'])) {
        $totalProducts = count($productsData['prodotti']);
    }
}

$pageTitle = 'Traduzioni Client-Side';
include '../includes/header.php';
?>

<style>
.translation-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.control-panel {
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 30px;
}

.control-panel h2 {
    margin-top: 0;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
}

.status-idle { background: #95a5a6; color: white; }
.status-running { background: #3498db; color: white; animation: pulse 2s infinite; }
.status-completed { background: #27ae60; color: white; }
.status-stopped { background: #e74c3c; color: white; }
.status-error { background: #e67e22; color: white; }

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.language-selector {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.language-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: #2c3e50;
    font-weight: 500;
}

.language-checkbox:hover {
    background: #e9ecef;
}

.language-checkbox input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.progress-section {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 30px;
}

.progress-bar-container {
    width: 100%;
    height: 30px;
    background: #ecf0f1;
    border-radius: 15px;
    overflow: hidden;
    margin: 15px 0;
    position: relative;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #3498db, #2ecc71);
    transition: width 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 14px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.stat-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.stat-value {
    font-size: 32px;
    font-weight: bold;
    color: #2c3e50;
    margin: 10px 0;
}

.stat-label {
    font-size: 14px;
    color: #7f8c8d;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.log-section {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 20px;
    border-radius: 12px;
    max-height: 500px;
    overflow-y: auto;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    line-height: 1.6;
}

.log-entry {
    padding: 4px 0;
    border-bottom: 1px solid #2d2d2d;
}

.log-time {
    color: #858585;
    margin-right: 10px;
}

.log-success { color: #4ec9b0; }
.log-skip { color: #569cd6; }
.log-error { color: #f48771; }
.log-info { color: #dcdcaa; }

.btn {
    padding: 12px 30px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-primary {
    background: #3498db;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-danger {
    background: #e74c3c;
    color: white;
}

.btn-danger:hover:not(:disabled) {
    background: #c0392b;
}

.btn-secondary {
    background: #95a5a6;
    color: white;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.controls {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

.option-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 15px;
    background: #f8f9fa;
    border-radius: 8px;
    cursor: pointer;
    color: #2c3e50;
    font-weight: 500;
}

.current-item {
    background: #fff3cd;
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #ffc107;
    margin: 15px 0;
    font-weight: 600;
}
</style>

<div class="translation-container">
    <div class="control-panel">
        <h2>
            🌍 Traduzione Client-Side
            <span id="statusBadge" class="status-badge status-idle">PRONTO</span>
        </h2>

        <p style="color: #7f8c8d; margin: 10px 0 20px 0;">
            ✨ <strong>Nuovo sistema:</strong> Traduzioni gestite dal browser, nessun timeout PHP!
            Stop immediato, feedback real-time, riprendibile in qualsiasi momento.
        </p>

        <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <strong>📊 Prodotti totali:</strong> <span style="color: #2980b9; font-size: 18px; font-weight: bold;"><?php echo $totalProducts; ?></span>
        </div>

        <h3 style="margin-top: 25px;">Seleziona Lingue</h3>
        <div class="language-selector">
            <label class="language-checkbox">
                <input type="checkbox" value="en" checked>
                <span>🇬🇧 English</span>
            </label>
            <label class="language-checkbox">
                <input type="checkbox" value="de" checked>
                <span>🇩🇪 German</span>
            </label>
            <label class="language-checkbox">
                <input type="checkbox" value="fr" checked>
                <span>🇫🇷 French</span>
            </label>
            <label class="language-checkbox">
                <input type="checkbox" value="es" checked>
                <span>🇪🇸 Spanish</span>
            </label>
            <label class="language-checkbox">
                <input type="checkbox" value="pt" checked>
                <span>🇵🇹 Portuguese</span>
            </label>
            <label class="language-checkbox">
                <input type="checkbox" value="hr">
                <span>🇭🇷 Croatian</span>
            </label>
            <label class="language-checkbox">
                <input type="checkbox" value="sl">
                <span>🇸🇮 Slovenian</span>
            </label>
            <label class="language-checkbox">
                <input type="checkbox" value="el">
                <span>🇬🇷 Greek</span>
            </label>
        </div>

        <div style="margin: 20px 0;">
            <label class="option-checkbox">
                <input type="checkbox" id="forceRetranslate">
                <span>🔄 Forza ritraduzione (anche prodotti già tradotti)</span>
            </label>
        </div>

        <div class="controls">
            <button id="btnStart" class="btn btn-primary" onclick="startTranslation()">
                ▶️ Avvia Traduzione
            </button>
            <button id="btnStop" class="btn btn-danger" onclick="stopTranslation()" disabled>
                ⏹️ Stop
            </button>
            <button id="btnReset" class="btn btn-secondary" onclick="resetProgress()">
                🔄 Reset
            </button>
        </div>
    </div>

    <div class="progress-section">
        <h3>Progresso Traduzione</h3>

        <div id="currentItem" class="current-item" style="display: none;">
            🔄 Traduco: <span id="currentItemText"></span>
        </div>

        <div class="progress-bar-container">
            <div id="progressBar" class="progress-bar" style="width: 0%;">
                <span id="progressText">0%</span>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Tradotti</div>
                <div class="stat-value" id="statTranslated">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Skipped</div>
                <div class="stat-value" id="statSkipped">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Errori</div>
                <div class="stat-value" id="statErrors">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">API Calls</div>
                <div class="stat-value" id="statApiCalls">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Tempo Medio</div>
                <div class="stat-value" id="statAvgTime">-</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Tempo Totale</div>
                <div class="stat-value" id="statTotalTime">-</div>
            </div>
        </div>
    </div>

    <div class="log-section" id="logSection">
        <div class="log-entry">
            <span class="log-time">[<?php echo date('H:i:s'); ?>]</span>
            <span class="log-info">Sistema pronto. Seleziona le lingue e avvia la traduzione.</span>
        </div>
    </div>
</div>

<script>
// State
let isRunning = false;
let shouldStop = false;
let stats = {
    translated: 0,
    skipped: 0,
    errors: 0,
    apiCalls: 0,
    totalDuration: 0,
    startTime: null
};
let products = [];
let selectedLanguages = [];
let currentLangIndex = 0;
let currentProductIndex = 0;

// Load products on page load
addLog('🔄 Caricamento prodotti in corso...', 'info');

// Add cache-bust timestamp to avoid getting cached data
const cacheBust = new Date().getTime();
fetch('/admin/api/get-products-v2.php?_=' + cacheBust)
    .then(res => {
        addLog('📡 Risposta API ricevuta (HTTP ' + res.status + ')', 'info');
        return res.json();
    })
    .then(data => {
        console.log('API response:', data); // Debug console

        if (data.success) {
            products = data.products || [];
            addLog('✅ Caricati ' + products.length + ' prodotti', 'success');

            if (products.length > 0) {
                addLog('📋 Primo prodotto: ' + products[0].codice, 'info');
            }
        } else {
            addLog('❌ Errore API: ' + (data.error || 'Unknown error'), 'error');
            if (data.available_keys) {
                addLog('🔍 Chiavi disponibili: ' + data.available_keys.join(', '), 'info');
            }
        }
    })
    .catch(err => {
        addLog('❌ Errore caricamento prodotti: ' + err.message, 'error');
        console.error('Fetch error:', err);
    });

function getSelectedLanguages() {
    const checkboxes = document.querySelectorAll('.language-checkbox input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function addLog(message, type = 'info') {
    const logSection = document.getElementById('logSection');
    const time = new Date().toLocaleTimeString('it-IT');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span><span class="log-${type}">${message}</span>`;
    logSection.appendChild(entry);
    logSection.scrollTop = logSection.scrollHeight;
}

function updateStatus(status) {
    const badge = document.getElementById('statusBadge');
    badge.className = 'status-badge status-' + status;
    badge.textContent = status.toUpperCase();
}

function updateProgress() {
    const totalItems = products.length * selectedLanguages.length;
    const completedItems = (currentLangIndex * products.length) + currentProductIndex;
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    document.getElementById('progressBar').style.width = percentage + '%';
    document.getElementById('progressText').textContent = percentage + '%';
}

function updateStats() {
    document.getElementById('statTranslated').textContent = stats.translated;
    document.getElementById('statSkipped').textContent = stats.skipped;
    document.getElementById('statErrors').textContent = stats.errors;
    document.getElementById('statApiCalls').textContent = stats.apiCalls;

    if (stats.apiCalls > 0) {
        const avgTime = Math.round(stats.totalDuration / stats.apiCalls);
        document.getElementById('statAvgTime').textContent = avgTime + 'ms';
    }

    if (stats.startTime) {
        const elapsed = Math.round((Date.now() - stats.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('statTotalTime').textContent = `${minutes}m ${seconds}s`;
    }
}

function showCurrentItem(codice, lang) {
    const elem = document.getElementById('currentItem');
    const text = document.getElementById('currentItemText');
    text.textContent = `${codice} → ${lang.toUpperCase()}`;
    elem.style.display = 'block';
}

function hideCurrentItem() {
    document.getElementById('currentItem').style.display = 'none';
}

async function translateSingleProduct(codice, lang, retryCount = 0) {
    const force = document.getElementById('forceRetranslate').checked;
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds

    try {
        const response = await fetch('/admin/api/translate-single.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codice, lang, force })
        });

        const data = await response.json();

        if (!response.ok) {
            // Check if it's a 529 Overloaded error
            if (response.status === 500 && data.httpCode === 529) {
                if (retryCount < maxRetries) {
                    addLog(`⏳ Claude sovraccarico, riprovo tra 5s... (tentativo ${retryCount + 1}/${maxRetries})`, 'info');
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    return translateSingleProduct(codice, lang, retryCount + 1);
                } else {
                    addLog(`❌ Claude sovraccarico dopo ${maxRetries} tentativi, salto ${codice}`, 'error');
                }
            }

            // Attach full response to error for debugging
            const error = new Error(data.error || 'API error');
            error.response = data;
            error.httpCode = response.status;
            throw error;
        }

        return data;
    } catch (error) {
        // If it's a JSON parse error or network error, log it
        if (!error.response) {
            console.error('Network or parse error:', error);
        }
        throw error;
    }
}

async function startTranslation() {
    if (isRunning) return;

    selectedLanguages = getSelectedLanguages();

    if (selectedLanguages.length === 0) {
        alert('Seleziona almeno una lingua!');
        return;
    }

    console.log('Products array:', products); // Debug
    addLog('🔍 Verifica prodotti: ' + products.length + ' in memoria', 'info');

    if (products.length === 0) {
        alert('Nessun prodotto caricato! Ricarica la pagina o controlla la console.');
        addLog('❌ Array prodotti vuoto!', 'error');
        return;
    }

    // Reset state
    isRunning = true;
    shouldStop = false;
    stats = {
        translated: 0,
        skipped: 0,
        errors: 0,
        apiCalls: 0,
        totalDuration: 0,
        startTime: Date.now()
    };
    currentLangIndex = 0;
    currentProductIndex = 0;

    // Update UI
    document.getElementById('btnStart').disabled = true;
    document.getElementById('btnStop').disabled = false;
    updateStatus('running');

    addLog(`🚀 Avvio traduzione per ${selectedLanguages.length} lingue × ${products.length} prodotti = ${selectedLanguages.length * products.length} traduzioni`, 'info');

    // Start translation loop
    await translationLoop();
}

async function translationLoop() {
    // Loop through languages
    for (currentLangIndex = 0; currentLangIndex < selectedLanguages.length; currentLangIndex++) {
        if (shouldStop) break;

        const lang = selectedLanguages[currentLangIndex];
        addLog(`\n📌 Inizio traduzione lingua: ${lang.toUpperCase()}`, 'info');

        // Loop through products
        for (currentProductIndex = 0; currentProductIndex < products.length; currentProductIndex++) {
            if (shouldStop) break;

            const product = products[currentProductIndex];
            showCurrentItem(product.codice, lang);
            updateProgress();

            try {
                const result = await translateSingleProduct(product.codice, lang);

                if (result.skipped) {
                    stats.skipped++;
                    // Non logghiamo ogni skip per evitare spam
                    if (stats.skipped % 10 === 1) {
                        addLog(`⏭️  Skipped ${product.codice} (già tradotto)`, 'skip');
                    }
                } else {
                    stats.translated++;
                    stats.apiCalls++;
                    stats.totalDuration += result.duration_ms || 0;
                    addLog(`✅ ${product.codice} → ${lang.toUpperCase()} (${result.duration_ms}ms)`, 'success');
                }

                updateStats();

            } catch (error) {
                stats.errors++;
                // Show detailed error message
                const errorMsg = error.response ? JSON.stringify(error.response) : error.message;
                addLog(`❌ Errore ${product.codice} → ${lang}: ${errorMsg}`, 'error');
                console.error('Translation error details:', error);
                updateStats();

                // Se troppi errori consecutivi, ferma
                if (stats.errors >= 5 && stats.errors > stats.translated) {
                    addLog('🚨 Troppi errori, processo fermato', 'error');
                    shouldStop = true;
                    break;
                }
            }
        }

        if (!shouldStop) {
            addLog(`✅ Completata lingua ${lang.toUpperCase()}: ${stats.translated} tradotti, ${stats.skipped} skipped`, 'success');
        }
    }

    // Finish
    finishTranslation();
}

function finishTranslation() {
    isRunning = false;
    hideCurrentItem();
    updateProgress();

    document.getElementById('btnStart').disabled = false;
    document.getElementById('btnStop').disabled = true;

    if (shouldStop) {
        updateStatus('stopped');
        addLog('\n⏹️  Traduzione fermata dall\'utente', 'info');
    } else {
        updateStatus('completed');
        addLog('\n🎉 Traduzione completata!', 'success');
    }

    addLog(`\n📊 RIEPILOGO: ${stats.translated} tradotti, ${stats.skipped} skipped, ${stats.errors} errori, ${stats.apiCalls} API calls`, 'info');
}

function stopTranslation() {
    if (!isRunning) return;

    shouldStop = true;
    addLog('⏸️  Stop richiesto, attendo completamento richiesta corrente...', 'info');
    document.getElementById('btnStop').disabled = true;
}

function resetProgress() {
    if (isRunning) {
        if (!confirm('Traduzione in corso. Vuoi fermarla e resettare?')) {
            return;
        }
        stopTranslation();
    }

    stats = {
        translated: 0,
        skipped: 0,
        errors: 0,
        apiCalls: 0,
        totalDuration: 0,
        startTime: null
    };
    currentLangIndex = 0;
    currentProductIndex = 0;

    updateStats();
    updateProgress();
    updateStatus('idle');
    hideCurrentItem();

    document.getElementById('logSection').innerHTML = '';
    addLog('Sistema resettato. Pronto per nuova traduzione.', 'info');
}

// Update stats timer
setInterval(() => {
    if (isRunning) {
        updateStats();
    }
}, 1000);
</script>

<?php include '../includes/footer.php'; ?>
