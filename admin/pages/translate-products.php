<?php
require_once '../config.php';
require_once '../includes/functions.php';

$productsFile = PUBLIC_JSON_PATH;  // File pubblico
$translationSettings = loadTranslationSettings();

// Analizza stato attuale products.json
$stats = [
    'file_exists' => file_exists($productsFile),
    'file_size' => 0,
    'total_products' => 0,
    'languages' => [],
    'translation_status' => []
];

if ($stats['file_exists']) {
    $stats['file_size'] = filesize($productsFile);
    $productsData = json_decode(file_get_contents($productsFile), true);

    if ($productsData && isset($productsData['prodotti']) && is_array($productsData['prodotti'])) {
        $stats['total_products'] = count($productsData['prodotti']);

        // Analizza lingue presenti
        $languageStats = [];
        foreach ($productsData['prodotti'] as $product) {
            if (isset($product['nome']) && is_array($product['nome'])) {
                foreach ($product['nome'] as $lang => $text) {
                    if (!isset($languageStats[$lang])) {
                        $languageStats[$lang] = 0;
                    }
                    if (!empty($text)) {
                        $languageStats[$lang]++;
                    }
                }
            }
        }
        $stats['languages'] = $languageStats;
    }
}

include '../includes/header.php';
?>

<style>
.translate-badge {
    background: linear-gradient(135deg, #9c27b0 0%, #e91e63 100%);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    margin-left: 10px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.stat-card {
    background: rgba(156, 39, 176, 0.1);
    border: 2px solid rgba(156, 39, 176, 0.3);
    border-radius: 10px;
    padding: 15px;
    text-align: center;
}

.stat-card .number {
    font-size: 32px;
    font-weight: bold;
    color: #9c27b0;
    margin: 10px 0;
}

.stat-card .label {
    color: #666;
    font-size: 14px;
}

.lang-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 5px;
    margin: 5px 0;
}

.lang-flag {
    font-size: 24px;
    margin-right: 10px;
}

.lang-progress {
    flex: 1;
    height: 20px;
    background: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
    margin: 0 10px;
}

.lang-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #9c27b0 0%, #e91e63 100%);
    transition: width 0.3s;
}
</style>

<div class="page-header">
    <h1>
        🌐 Traduci Prodotti
        <span class="translate-badge">POLLING</span>
    </h1>
    <p style="color: #a0a0b8;">Sistema di traduzione affidabile con polling e resume automatico</p>
</div>

<?php if (!$stats['file_exists']): ?>
<div class="card" style="background: #fff3cd; border-color: #ffc107;">
    <h3 style="color: #856404; margin: 0 0 10px 0;">⚠️ File products.json Non Trovato</h3>
    <p style="color: #856404; margin: 0;">
        Prima di tradurre, devi eseguire un export dei prodotti.
        <br>
        <a href="/admin/pages/export-v2.php" style="color: #856404; font-weight: bold;">→ Vai all'Export v2.0</a>
    </p>
</div>
<?php else: ?>

<div class="card">
    <h2>📊 Stato Attuale</h2>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="label">Prodotti Totali</div>
            <div class="number"><?php echo number_format($stats['total_products']); ?></div>
        </div>

        <div class="stat-card">
            <div class="label">Dimensione File</div>
            <div class="number"><?php echo number_format($stats['file_size'] / 1024, 0); ?> KB</div>
        </div>

        <div class="stat-card">
            <div class="label">Lingue Configurate</div>
            <div class="number"><?php echo count($translationSettings['languages']); ?></div>
        </div>
    </div>

    <h3 style="margin-top: 30px;">🌍 Stato Traduzioni</h3>

    <?php
    $langNames = [
        'it' => '🇮🇹 Italiano',
        'en' => '🇬🇧 English',
        'de' => '🇩🇪 Deutsch',
        'fr' => '🇫🇷 Français',
        'es' => '🇪🇸 Español',
        'pt' => '🇵🇹 Português',
        'hr' => '🇭🇷 Hrvatski',
        'sl' => '🇸🇮 Slovenščina',
        'el' => '🇬🇷 Ελληνικά'
    ];

    foreach ($translationSettings['languages'] as $lang):
        $count = $stats['languages'][$lang] ?? 0;
        $percent = $stats['total_products'] > 0 ? round(($count / $stats['total_products']) * 100) : 0;
        $langName = $langNames[$lang] ?? strtoupper($lang);
    ?>
    <div class="lang-status">
        <span style="min-width: 150px; font-weight: bold;"><?php echo $langName; ?></span>
        <div class="lang-progress">
            <div class="lang-progress-bar" style="width: <?php echo $percent; ?>%;"></div>
        </div>
        <span style="min-width: 100px; text-align: right; color: #666;">
            <?php echo number_format($count); ?> / <?php echo number_format($stats['total_products']); ?> (<?php echo $percent; ?>%)
        </span>
    </div>
    <?php endforeach; ?>
</div>

<div class="card">
    <h2>⚙️ Opzioni Traduzione</h2>

    <div class="form-group">
        <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" id="force_retranslate" value="1" style="margin-right: 10px; width: 20px; height: 20px;">
            <span style="font-size: 16px;">
                🔄 <strong>Forza Ritraduzione</strong> - Ignora cache e ritraduci tutto
            </span>
        </label>
        <small style="color: #a0a0b8; display: block; margin-top: 5px; margin-left: 30px;">
            ⚠️ Questa opzione ignorerà la cache delle traduzioni e richiederà più tempo e API calls.
        </small>
    </div>

    <div style="margin: 30px 0;">
        <button type="button" id="translate-btn" class="btn" style="font-size: 18px; padding: 20px 40px; background: #9c27b0;" onclick="startTranslation()">
            🌐 Avvia Traduzione
        </button>
        <a href="/admin/pages/export-v2.php" class="btn btn-secondary" style="margin-left: 10px;">
            ← Torna all'Export
        </a>
    </div>
</div>

<!-- Progress Container -->
<div id="progress-container" style="display: none; margin-top: 30px;">
    <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">Progresso Traduzioni</h2>
            <button onclick="stopTranslation()" class="btn" style="background: #f44336; padding: 8px 16px; font-size: 14px;">
                ⏹️ Interrompi
            </button>
        </div>

        <!-- Progress Bar -->
        <div style="background: #e0e0e0; border-radius: 10px; height: 40px; overflow: hidden; margin-bottom: 20px;">
            <div id="progress-bar" style="background: linear-gradient(90deg, #9c27b0 0%, #e91e63 100%); height: 100%; width: 0%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                0%
            </div>
        </div>

        <!-- Stats -->
        <div class="stats">
            <div class="stat-box">
                <div class="stat-number" id="stat-completed">0</div>
                <div class="stat-label">Prodotti Tradotti</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" id="stat-total">0</div>
                <div class="stat-label">Totale Prodotti</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" id="stat-time">0s</div>
                <div class="stat-label">Tempo Trascorso</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" id="stat-api-calls">0</div>
                <div class="stat-label">API Calls</div>
            </div>
        </div>

        <!-- Current Language & Product Info -->
        <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <div style="font-weight: bold; color: #9c27b0; margin-bottom: 5px;">Lingua Corrente:</div>
                    <div id="current-language" style="color: #666; font-size: 18px;">In attesa...</div>
                    <div id="language-progress" style="color: #999; font-size: 12px; margin-top: 3px;"></div>
                </div>
                <div>
                    <div style="font-weight: bold; color: #9c27b0; margin-bottom: 5px;">Prodotto Corrente:</div>
                    <div id="current-product" style="color: #666;">In attesa...</div>
                </div>
            </div>
        </div>

        <!-- Log -->
        <div style="margin-top: 20px;">
            <h3>📋 Log Attività</h3>
            <div id="progress-log" style="background: #1e1e1e; color: #00ff00; font-family: 'Courier New', monospace; font-size: 12px; padding: 15px; border-radius: 5px; height: 300px; overflow-y: auto;">
                <div id="log-first">[<?php echo date('H:i:s'); ?>] Sistema pronto...</div>
            </div>
        </div>
    </div>
</div>

<?php endif; ?>

<script>
let translationStartTime = null;
let timerInterval = null;
let pollingInterval = null;
let isTranslating = false;
let consecutiveErrors = 0;
let consecutive504Errors = 0;
let maxConsecutiveErrors = 10;  // Altri errori
let max504Errors = 30;  // 504 sono temporanei, retry più volte

// Al caricamento della pagina, verifica e ferma eventuali processi attivi
window.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Controllo processi attivi...');

    // Verifica lo stato corrente
    fetch('translate-process.php?action=status')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'translating') {
                console.log('⚠️ Trovato processo attivo, fermo automaticamente...');

                // Ferma il processo
                fetch('translate-process.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: 'action=stop'
                })
                .then(response => response.json())
                .then(stopData => {
                    if (stopData.success) {
                        console.log('✅ Processo precedente fermato correttamente');
                    } else {
                        console.warn('⚠️ Errore nel fermare il processo precedente');
                    }
                })
                .catch(error => {
                    console.error('❌ Errore chiamata stop:', error);
                });
            } else {
                console.log('✅ Nessun processo attivo');
            }
        })
        .catch(error => {
            console.error('❌ Errore controllo stato:', error);
        });
});

function startTranslation() {
    const translateBtn = document.getElementById('translate-btn');
    const progressContainer = document.getElementById('progress-container');
    const forceRetranslate = document.getElementById('force_retranslate').checked;

    // Disabilita bottone
    translateBtn.disabled = true;
    translateBtn.style.opacity = '0.5';
    translateBtn.textContent = '⏳ Traduzione in corso...';

    // Mostra progress
    progressContainer.style.display = 'block';

    // Start timer
    translationStartTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);

    isTranslating = true;
    completionMessageShown = false; // Reset flag per nuova traduzione
    consecutiveErrors = 0; // Reset contatori errori
    consecutive504Errors = 0;

    addLog('🔄 Connessione a translate-process.php...');

    // Avvia processo di traduzione
    fetch('/admin/pages/translate-process.php?action=start' + (forceRetranslate ? '&force=1' : ''))
        .then(response => {
            addLog('📡 Risposta ricevuta, status: ' + response.status);
            if (!response.ok) {
                addLog('❌ HTTP Error: ' + response.status + ' ' + response.statusText, 'error');
                throw new Error('HTTP ' + response.status);
            }
            return response.text();
        })
        .then(text => {
            addLog('📄 Risposta raw: ' + text.substring(0, 200));
            try {
                const data = JSON.parse(text);
                if (data.success) {
                    addLog('✅ Processo di traduzione avviato');
                    addLog('📊 Totale prodotti: ' + data.total_products);
                    document.getElementById('stat-total').textContent = data.total_products;

                    // Avvia polling ogni 2 secondi (ridotto da 500ms per evitare sovraccarico server)
                    pollingInterval = setInterval(pollStatus, 2000);
                } else {
                    addLog('❌ Errore avvio: ' + (data.error || 'Errore sconosciuto'), 'error');
                    stopTranslation();
                }
            } catch (e) {
                addLog('❌ Errore parsing JSON: ' + e.message, 'error');
                addLog('📄 Risposta completa: ' + text, 'error');
                stopTranslation();
            }
        })
        .catch(error => {
            addLog('❌ Errore fetch: ' + error.message, 'error');
            stopTranslation();
        });
}

function pollStatus() {
    if (!isTranslating) {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        return;
    }

    fetch('/admin/pages/translate-process.php?action=status')
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            // Verifica che sia JSON prima di parsare
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Risposta non JSON (probabilmente errore PHP)');
            }
            return response.text();
        })
        .then(text => {
            try {
                const data = JSON.parse(text);
                // Reset TUTTI i contatori errori su successo
                consecutiveErrors = 0;
                consecutive504Errors = 0;

                if (data.status === 'running') {
                    updateProgress(data);
                } else if (data.status === 'completed') {
                    completeTranslation(data);
                } else if (data.status === 'stopped') {
                    // Processo fermato dall'utente
                    addLog('⏸️ Traduzione fermata dall\'utente', 'warning');
                    isTranslating = false;
                    if (pollingInterval) {
                        clearInterval(pollingInterval);
                    }
                    if (timerInterval) {
                        clearInterval(timerInterval);
                    }
                    document.getElementById('translate-btn').disabled = false;
                    document.getElementById('translate-btn').style.opacity = '1';
                    document.getElementById('translate-btn').textContent = '▶️ Riprendi Traduzione';
                } else if (data.status === 'error') {
                    addLog('❌ ERRORE: ' + data.error, 'error');
                    addLog('💡 Dettagli: ' + (data.details || 'Nessun dettaglio disponibile'), 'error');
                    stopTranslation();
                } else if (data.status === 'idle') {
                    addLog('⚠️ Warning: processo idle, riavvio...', 'warning');
                    stopTranslation();
                }
            } catch (e) {
                consecutiveErrors++;
                if (consecutiveErrors >= maxConsecutiveErrors) {
                    addLog('❌ Troppi errori consecutivi (' + consecutiveErrors + '), processo interrotto', 'error');
                    addLog('📄 Ultima risposta: ' + text.substring(0, 200), 'error');
                    stopTranslation();
                } else {
                    addLog('⚠️ Errore parsing (#' + consecutiveErrors + '): ' + e.message, 'warning');
                }
            }
        })
        .catch(error => {
            consecutiveErrors++;

            // Gestione specifica per errore 502
            if (error.message.includes('502')) {
                if (consecutiveErrors >= maxConsecutiveErrors) {
                    addLog('❌ Troppi errori 502 (' + consecutiveErrors + '), server sovraccarico. Processo interrotto.', 'error');
                    stopTranslation();
                } else if (consecutiveErrors === 1 || consecutiveErrors % 5 === 0) {
                    addLog('⚠️ Server sovraccarico (502), riprovo... (#' + consecutiveErrors + ')', 'warning');
                }
            } else if (error.message.includes('504')) {
                // 504 = Gateway Timeout - temporaneo, retry più volte
                consecutive504Errors++;
                if (consecutive504Errors >= max504Errors) {
                    addLog('❌ Troppi timeout 504 (' + consecutive504Errors + '), server troppo lento. Processo interrotto.', 'error');
                    addLog('💡 Suggerimento: Riduci il batch size o riprova più tardi', 'warning');
                    stopTranslation();
                } else if (consecutive504Errors === 1 || consecutive504Errors % 10 === 0) {
                    // Mostra solo primo errore e poi ogni 10
                    addLog('⚠️ Timeout server (504), riprovo... (#' + consecutive504Errors + '/' + max504Errors + ')', 'warning');
                }
            } else {
                // Altri errori di rete
                if (consecutiveErrors >= maxConsecutiveErrors) {
                    addLog('❌ Troppi errori di rete (' + consecutiveErrors + '), processo interrotto', 'error');
                    stopTranslation();
                } else if (consecutiveErrors === 1 || consecutiveErrors % 3 === 0) {
                    addLog('⚠️ Errore rete (#' + consecutiveErrors + '): ' + error.message, 'warning');
                }
            }
            // Il polling continuerà automaticamente al prossimo intervallo se non fermato
        });
}

let isStopping = false; // Flag per evitare loop

function stopTranslation() {
    // Evita chiamate multiple
    if (isStopping) {
        return;
    }
    isStopping = true;

    // STOP IMMEDIATO del polling
    isTranslating = false;

    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    addLog('🛑 Interruzione in corso...', 'warning');

    // Invia richiesta al server per fermare il processo
    fetch('translate-process.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=stop'
    })
    .then(response => {
        // Verifica che sia JSON prima di parsare
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Risposta non JSON durante stop');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            addLog('✅ Traduzione interrotta correttamente', 'success');
        } else {
            addLog('⚠️ Errore durante interruzione: ' + (data.error || 'Unknown'), 'warning');
        }
    })
    .catch(error => {
        // Non mostrare errore se il messaggio contiene "DOCTYPE" (già gestito)
        if (!error.message.includes('DOCTYPE')) {
            addLog('⚠️ Errore richiesta stop: ' + error.message, 'warning');
        }
    })
    .finally(() => {
        // Reset flag dopo 2 secondi
        setTimeout(() => {
            isStopping = false;
        }, 2000);
    });

    document.getElementById('translate-btn').disabled = false;
    document.getElementById('translate-btn').style.opacity = '1';
    document.getElementById('translate-btn').textContent = '▶️ Riprendi Traduzione';

    // NON nascondere il progress container per vedere gli errori
    // document.getElementById('progress-container').style.display = 'none';
}

function updateProgress(data) {
    const percent = data.percent || 0;
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = percent + '%';
    progressBar.textContent = Math.round(percent) + '%';

    document.getElementById('stat-completed').textContent = data.completed || 0;
    document.getElementById('stat-total').textContent = data.total || 0;
    document.getElementById('stat-api-calls').textContent = data.api_calls || 0;

    // NEW v3.0: Show current language
    if (data.current_language) {
        document.getElementById('current-language').textContent = '🌍 ' + data.current_language;
    }

    // NEW v3.0: Show language progress
    if (data.current_language_progress) {
        const langProg = data.current_language_progress;
        document.getElementById('language-progress').textContent =
            langProg.completed + '/' + langProg.total + ' prodotti (' + langProg.percent + '%)';
    }

    // NEW v3.0: Show languages completed
    if (data.languages_progress) {
        const langsProg = data.languages_progress;
        // Could add a visual indicator for language progress here
    }

    if (data.current_product) {
        const langTag = data.current_product.language ? ' [' + data.current_product.language + ']' : '';
        document.getElementById('current-product').textContent =
            data.current_product.codice + ' - ' + data.current_product.nome + langTag;
    }

    if (data.log && data.log.length > 0) {
        data.log.forEach(logEntry => {
            addLog(logEntry.message, logEntry.type);
        });
    }
}

let completionMessageShown = false;

function completeTranslation(data) {
    // Evita di mostrare il messaggio più volte
    if (completionMessageShown) {
        return;
    }
    completionMessageShown = true;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }

    isTranslating = false;

    document.getElementById('progress-bar').style.background = 'linear-gradient(90deg, #4caf50 0%, #45a049 100%)';
    addLog('✅ Traduzione completata con successo!');
    addLog('📊 Totale prodotti: ' + data.stats.total_products);
    addLog('🌍 Totale lingue: ' + data.stats.total_languages);
    addLog('⚡ Totale API calls: ' + data.stats.api_calls);
    addLog('⏱️ Tempo totale: ' + data.stats.execution_time + 's');
    addLog('');
    addLog('🔄 Puoi avviare una nuova traduzione quando vuoi, o chiudere questa pagina.');

    // Riabilita pulsante per permettere nuova traduzione
    document.getElementById('translate-btn').disabled = false;
    document.getElementById('translate-btn').style.opacity = '1';
    document.getElementById('translate-btn').textContent = '▶️ Avvia Nuova Traduzione';
}

function updateTimer() {
    if (!translationStartTime) return;
    const elapsed = Math.floor((Date.now() - translationStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('stat-time').textContent =
        (minutes > 0 ? minutes + 'm ' : '') + seconds + 's';
}

function addLog(message, type) {
    const log = document.getElementById('progress-log');
    const timestamp = new Date().toLocaleTimeString('it-IT');
    const entry = document.createElement('div');
    entry.textContent = '[' + timestamp + '] ' + message;

    // Colora in base al tipo
    if (type === 'error') {
        entry.style.color = '#ff6b6b';
        entry.style.fontWeight = 'bold';
    } else if (type === 'warning') {
        entry.style.color = '#ffa726';
    } else if (type === 'success') {
        entry.style.color = '#4caf50';
    }

    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}
</script>

<?php include '../includes/footer.php'; ?>
