<?php
require_once '../config.php';
require_once '../includes/functions.php';

$dbConfig = loadDBConfig();
if (!$dbConfig) {
    header('Location: /admin/pages/connection.php');
    exit;
}

// API per ottenere colonne di una tabella (AJAX)
if (isset($_GET['action']) && $_GET['action'] === 'get_columns' && !empty($_GET['table'])) {
    $tableName = $_GET['table'];

    try {
        $columns = getTableColumns($dbConfig, $tableName);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'columns' => $columns,
            'total' => count($columns)
        ]);
        exit;
    } catch (Exception $e) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
        exit;
    }
}

// API per testare JOIN (AJAX)
if (isset($_POST['action']) && $_POST['action'] === 'test_join') {
    header('Content-Type: application/json');

    $mainTable = $_POST['main_table'] ?? '';

    if (empty($mainTable)) {
        echo json_encode([
            'success' => false,
            'error' => 'Devi selezionare una tabella principale'
        ]);
        exit;
    }

    $joins = [];

    // Processa i JOIN dal POST
    if (!empty($_POST['join_table'])) {
        foreach ($_POST['join_table'] as $index => $joinTable) {
            if (!empty($joinTable) && !empty($_POST['join_on'][$index])) {
                // Se alias è vuoto, usa il nome della tabella
                $alias = (!empty($_POST['join_alias'][$index])) ? $_POST['join_alias'][$index] : $joinTable;

                $joins[] = [
                    'table' => $joinTable,
                    'alias' => $alias,
                    'type' => $_POST['join_type'][$index] ?? 'LEFT',
                    'on' => $_POST['join_on'][$index]
                ];
            }
        }
    }

    $testConfig = [
        'mainTable' => $mainTable,
        'joins' => $joins
    ];

    try {
        // Costruisci e testa la query
        $sql = buildSelectQuery($testConfig, '', 3);

        $pdo = connectDB($dbConfig);
        $stmt = $pdo->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Conta il totale senza LIMIT
        $countSql = buildSelectQuery($testConfig, '', null);
        $countSql = "SELECT COUNT(*) as total FROM ($countSql) as subquery";
        $countStmt = $pdo->query($countSql);
        $totalRows = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        echo json_encode([
            'success' => true,
            'totalRows' => $totalRows,
            'previewRows' => count($rows),
            'preview' => $rows,
            'sql' => $sql
        ]);
        exit;
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'sql' => $sql ?? 'Query non costruita'
        ]);
        exit;
    }
}

$tables = getTables($dbConfig);
$tableConfig = loadTableConfig();

$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mainTable = $_POST['main_table'] ?? '';

    if (empty($mainTable)) {
        $messageType = 'error';
        $message = "Devi selezionare una tabella principale!";
    } else {
        $joins = [];

        // Processa i JOIN
        if (!empty($_POST['join_table'])) {
            foreach ($_POST['join_table'] as $index => $joinTable) {
                if (!empty($joinTable) && !empty($_POST['join_on'][$index])) {
                    // Se alias è vuoto, usa il nome della tabella
                    $alias = (!empty($_POST['join_alias'][$index])) ? $_POST['join_alias'][$index] : $joinTable;

                    $joins[] = [
                        'table' => $joinTable,
                        'alias' => $alias,
                        'type' => $_POST['join_type'][$index] ?? 'LEFT',
                        'on' => $_POST['join_on'][$index]
                    ];
                }
            }
        }

        $config = [
            'mainTable' => $mainTable,
            'joins' => $joins
        ];

        try {
            saveTableConfig($config);
            $tableConfig = $config;
            logActivity("Configurazione tabelle salvata: $mainTable con " . count($joins) . " JOIN");

            $messageType = 'success';
            $message = "✓ Configurazione salvata! Tabella principale: $mainTable, JOIN: " . count($joins);
        } catch (Exception $e) {
            $messageType = 'error';
            $message = "Errore nel salvataggio: " . $e->getMessage();
        }
    }
}

include '../includes/header.php';
?>

<style>
/* Fix dropdown options styling */
select {
    width: 100%;
    padding: 12px;
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: #fff !important;
    font-size: 16px;
}

select option {
    background: #1a1a2e !important;
    color: #fff !important;
    padding: 10px;
}

select option:hover,
select option:checked {
    background: #667eea !important;
    color: #fff !important;
}

input[type="text"] {
    width: 100%;
    padding: 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: #fff;
    font-size: 16px;
}

input[type="text"]:focus,
select:focus {
    outline: none;
    border-color: #667eea;
}

.join-row {
    position: relative;
    padding: 20px;
    padding-right: 70px;
    background: rgba(118, 75, 162, 0.1);
    border-radius: 10px;
    margin-bottom: 15px;
}

.join-controls {
    position: absolute;
    top: 15px;
    right: 15px;
}

.remove-join-btn {
    background: rgba(244, 67, 54, 0.2);
    border: 1px solid rgba(244, 67, 54, 0.5);
    color: #f44336;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
}

.remove-join-btn:hover {
    background: rgba(244, 67, 54, 0.4);
}

.join-grid {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 3fr;
    gap: 15px;
    align-items: end;
}

@media (max-width: 768px) {
    .join-grid {
        grid-template-columns: 1fr;
    }
}

.table-columns {
    background: rgba(0, 0, 0, 0.2);
    padding: 15px;
    border-radius: 8px;
    border-left: 3px solid #667eea;
}

.table-columns h4 {
    color: #667eea;
    font-size: 13px;
    margin-bottom: 10px;
}

.columns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
}

.column-item {
    background: rgba(102, 126, 234, 0.1);
    padding: 6px 10px;
    border-radius: 5px;
    font-size: 12px;
    color: #fff;
    font-family: 'Courier New', monospace;
}

.column-type {
    color: #a0a0b8;
    font-size: 10px;
    margin-left: 5px;
}
</style>

<div class="card">
    <h2>Step 1.5: Configurazione Tabelle</h2>
    <p style="color: #a0a0b8;">Seleziona la tabella principale e configura eventuali JOIN per accedere a campi di altre tabelle (es: immagini, EAN, ecc.)</p>

    <?php if ($message): ?>
        <div class="alert alert-<?php echo $messageType; ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>
</div>

<div class="card">
    <form method="POST" id="tables-form">
        <h3 style="color: #667eea;">📋 Tabella Principale</h3>
        <p style="color: #a0a0b8; font-size: 13px; margin-bottom: 15px;">La tabella che contiene i prodotti principali</p>

        <div class="form-group">
            <label>Seleziona Tabella</label>
            <select name="main_table" id="main-table-select" required onchange="loadMainTableColumns()" style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 10px; color: #fff; font-size: 16px;">
                <option value="">-- Seleziona Tabella --</option>
                <?php foreach ($tables as $table): ?>
                    <option value="<?php echo htmlspecialchars($table); ?>"
                        <?php echo ($tableConfig && $tableConfig['mainTable'] === $table) ? 'selected' : ''; ?>>
                        <?php echo htmlspecialchars($table); ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>

        <div id="main-table-columns" style="margin-top: 15px;"></div>

        <h3 style="margin-top: 40px; color: #764ba2;">🔗 LEFT JOIN (Opzionali)</h3>
        <p style="color: #a0a0b8; font-size: 13px; margin-bottom: 15px;">
            Aggiungi altre tabelle per accedere a campi aggiuntivi. I campi di tutte le tabelle joindate saranno disponibili nel mapping.
        </p>

        <div id="joins-container">
            <?php
            $savedJoins = $tableConfig['joins'] ?? [];
            $joinCount = max(0, count($savedJoins));

            if ($joinCount === 0):
            ?>
                <p style="color: #a0a0b8; padding: 20px; text-align: center; background: rgba(255, 255, 255, 0.05); border-radius: 10px; margin-bottom: 15px;">
                    📝 Nessun JOIN configurato. Clicca "+ Aggiungi JOIN" per iniziare.
                </p>
            <?php
            endif;

            for ($i = 0; $i < $joinCount; $i++):
                $join = $savedJoins[$i];
            ?>
            <div class="join-row" data-index="<?php echo $i; ?>">
                <div class="join-controls">
                    <button type="button" class="remove-join-btn" data-remove-index="<?php echo $i; ?>">🗑️ Rimuovi</button>
                </div>

                <div class="join-grid">
                    <div>
                        <label>Tabella da Joinare</label>
                        <select name="join_table[]" class="join-table-select" data-index="<?php echo $i; ?>" onchange="loadJoinTableColumns(<?php echo $i; ?>)" required>
                            <option value="">-- Seleziona --</option>
                            <?php foreach ($tables as $table): ?>
                                <option value="<?php echo htmlspecialchars($table); ?>"
                                    <?php echo ($join['table'] === $table) ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($table); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div>
                        <label>Alias (soprannome tabella)</label>
                        <input type="text" name="join_alias[]" placeholder="es: img"
                            value="<?php echo htmlspecialchars($join['alias'] ?? $join['table']); ?>">
                        <small style="color: #a0a0b8; font-size: 11px; display: block; margin-top: 3px;">
                            Riferimento breve per la tabella
                        </small>
                    </div>

                    <div>
                        <label>Tipo</label>
                        <select name="join_type[]">
                            <option value="LEFT" <?php echo ($join['type'] === 'LEFT') ? 'selected' : ''; ?>>LEFT</option>
                            <option value="INNER" <?php echo ($join['type'] === 'INNER') ? 'selected' : ''; ?>>INNER</option>
                        </select>
                    </div>

                    <div>
                        <label>Condizione ON</label>
                        <input type="text" name="join_on[]" placeholder="main.campo = alias.campo" required
                            value="<?php echo htmlspecialchars($join['on']); ?>">
                    </div>
                </div>

                <div class="join-columns" id="join-columns-<?php echo $i; ?>" style="margin-top: 15px;"></div>
            </div>
            <?php endfor; ?>
        </div>

        <button type="button" onclick="aggiungiJoin()" class="btn btn-secondary" style="margin-top: 15px;">
            + Aggiungi JOIN
        </button>

        <div id="test-result" style="margin-top: 20px;"></div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <button type="button" onclick="testJoin()" class="btn btn-secondary">🔍 Verifica JOIN</button>
            <button type="submit" class="btn" style="margin-left: 10px;">💾 Salva Configurazione</button>
            <?php if ($tableConfig): ?>
                <a href="/admin/pages/mapping.php" class="btn btn-secondary" style="margin-left: 10px;">Mapping →</a>
            <?php endif; ?>
        </div>
    </form>
</div>

<?php if ($tableConfig): ?>
<div class="card">
    <h3>📊 Configurazione Attuale</h3>

    <div style="background: rgba(102, 126, 234, 0.1); padding: 20px; border-radius: 10px;">
        <p style="color: #667eea; margin-bottom: 10px;"><strong>Tabella Principale:</strong> <?php echo htmlspecialchars($tableConfig['mainTable']); ?></p>

        <?php if (!empty($tableConfig['joins'])): ?>
            <p style="color: #764ba2; margin: 15px 0 10px 0;"><strong>JOIN Configurati:</strong></p>
            <?php foreach ($tableConfig['joins'] as $join): ?>
                <div style="background: rgba(0, 0, 0, 0.2); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                    <code style="color: #fff;">
                        <?php echo strtoupper($join['type']); ?> JOIN
                        `<?php echo htmlspecialchars($join['table']); ?>`
                        AS `<?php echo htmlspecialchars($join['alias']); ?>`
                        ON <?php echo htmlspecialchars($join['on']); ?>
                    </code>
                </div>
            <?php endforeach; ?>
        <?php else: ?>
            <p style="color: #a0a0b8; margin-top: 10px;">Nessun JOIN configurato</p>
        <?php endif; ?>
    </div>

    <?php
    try {
        $columns = getTableColumns($dbConfig, null);
        ?>
        <div style="margin-top: 20px;">
            <p style="color: #667eea;"><strong>Colonne Disponibili Totali:</strong> <?php echo count($columns); ?></p>
            <p style="color: #a0a0b8; font-size: 13px;">Tutte queste colonne saranno disponibili nel mapping</p>
        </div>
    <?php
    } catch (Exception $e) {
        echo '<p style="color: #f44336;">Errore caricamento colonne: ' . htmlspecialchars($e->getMessage()) . '</p>';
    }
    ?>
</div>
<?php endif; ?>

<script>
let joinCounter = <?php echo $joinCount; ?>;

// Rimuovi JOIN
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-join-btn')) {
        const index = e.target.getAttribute('data-remove-index');
        const row = document.querySelector(`.join-row[data-index="${index}"]`);
        if (row) {
            row.remove();

            // Rimuovi messaggio "nessun join" se presente
            const emptyMessage = document.querySelector('#joins-container > p');
            if (emptyMessage) {
                emptyMessage.remove();
            }
        }
    }
});

// Aggiungi JOIN
function aggiungiJoin() {
    const container = document.getElementById('joins-container');

    // Rimuovi messaggio "nessun join" se presente
    const emptyMessage = container.querySelector('p');
    if (emptyMessage) {
        emptyMessage.remove();
    }

    const index = joinCounter++;

    const newRow = document.createElement('div');
    newRow.className = 'join-row';
    newRow.dataset.index = index;
    newRow.innerHTML = `
        <div class="join-controls">
            <button type="button" class="remove-join-btn" data-remove-index="${index}">🗑️ Rimuovi</button>
        </div>

        <div class="join-grid">
            <div>
                <label>Tabella da Joinare</label>
                <select name="join_table[]" class="join-table-select" data-index="${index}" onchange="loadJoinTableColumns(${index})" required>
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($tables as $table): ?>
                        <option value="<?php echo htmlspecialchars($table); ?>">
                            <?php echo htmlspecialchars($table); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div>
                <label>Alias (soprannome tabella)</label>
                <input type="text" name="join_alias[]" placeholder="es: img">
                <small style="color: #a0a0b8; font-size: 11px; display: block; margin-top: 3px;">
                    Riferimento breve per la tabella
                </small>
            </div>

            <div>
                <label>Tipo</label>
                <select name="join_type[]">
                    <option value="LEFT">LEFT</option>
                    <option value="INNER">INNER</option>
                </select>
            </div>

            <div>
                <label>Condizione ON</label>
                <input type="text" name="join_on[]" placeholder="main.campo = alias.campo" required>
            </div>
        </div>

        <div class="join-columns" id="join-columns-${index}" style="margin-top: 15px;"></div>
    `;

    container.appendChild(newRow);
}

// Carica colonne tabella principale
async function loadMainTableColumns() {
    const select = document.getElementById('main-table-select');
    const container = document.getElementById('main-table-columns');
    const tableName = select.value;

    if (!tableName) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = '<p style="color: #a0a0b8;">Caricamento colonne...</p>';

    try {
        const response = await fetch(`?action=get_columns&table=${encodeURIComponent(tableName)}`);
        const data = await response.json();

        if (data.success) {
            displayColumns(container, tableName, data.columns);
        } else {
            container.innerHTML = `<p style="color: #f44336;">Errore: ${data.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = `<p style="color: #f44336;">Errore caricamento: ${error.message}</p>`;
    }
}

// Carica colonne tabella JOIN
async function loadJoinTableColumns(index) {
    const row = document.querySelector(`.join-row[data-index="${index}"]`);
    if (!row) return;

    const select = row.querySelector('.join-table-select');
    const container = document.getElementById(`join-columns-${index}`);
    const tableName = select.value;

    if (!tableName) {
        if (container) container.innerHTML = '';
        return;
    }

    if (container) {
        container.innerHTML = '<p style="color: #a0a0b8;">Caricamento colonne...</p>';
    }

    try {
        const response = await fetch(`?action=get_columns&table=${encodeURIComponent(tableName)}`);
        const data = await response.json();

        if (data.success && container) {
            displayColumns(container, tableName, data.columns);
        } else if (container) {
            container.innerHTML = `<p style="color: #f44336;">Errore: ${data.error}</p>`;
        }
    } catch (error) {
        if (container) {
            container.innerHTML = `<p style="color: #f44336;">Errore caricamento: ${error.message}</p>`;
        }
    }
}

// Mostra colonne nel container
function displayColumns(container, tableName, columns) {
    let html = '<div class="table-columns">';
    html += `<h4>📋 Colonne di "${tableName}" (${columns.length})</h4>`;
    html += '<div class="columns-grid">';

    columns.forEach(col => {
        html += `<div class="column-item">
            ${col.name}
            <span class="column-type">${col.type}</span>
        </div>`;
    });

    html += '</div></div>';
    container.innerHTML = html;
}

// Carica colonne al caricamento pagina se tabella già selezionata
document.addEventListener('DOMContentLoaded', function() {
    const mainSelect = document.getElementById('main-table-select');
    if (mainSelect && mainSelect.value) {
        loadMainTableColumns();
    }

    // Carica colonne JOIN esistenti
    document.querySelectorAll('.join-table-select').forEach(select => {
        if (select.value) {
            const index = select.getAttribute('data-index');
            if (index) {
                loadJoinTableColumns(parseInt(index));
            }
        }
    });
});

// Testa la configurazione JOIN
async function testJoin() {
    const resultDiv = document.getElementById('test-result');
    const form = document.getElementById('tables-form');
    const formData = new FormData(form);
    formData.append('action', 'test_join');

    resultDiv.innerHTML = '<div style="padding: 15px; background: rgba(102, 126, 234, 0.1); border-radius: 10px; color: #a0a0b8;">⏳ Verifica in corso...</div>';

    try {
        const response = await fetch('', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            let html = '<div style="padding: 20px; background: rgba(76, 175, 80, 0.2); border: 1px solid rgba(76, 175, 80, 0.5); border-radius: 10px;">';
            html += '<h4 style="color: #4caf50; margin-bottom: 10px;">✓ JOIN Verificato con Successo!</h4>';
            html += `<p style="color: #fff; margin-bottom: 10px;"><strong>Righe totali estratte:</strong> ${data.totalRows}</p>`;
            html += `<p style="color: #a0a0b8; font-size: 13px; margin-bottom: 15px;">Preview dei primi ${data.previewRows} record estratti correttamente.</p>`;

            if (data.previewRows > 0) {
                html += '<details style="margin-top: 10px;"><summary style="color: #4caf50; cursor: pointer;">📋 Vedi Query SQL</summary>';
                html += `<pre style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 12px; overflow-x: auto;">${escapeHtml(data.sql)}</pre>`;
                html += '</details>';

                html += '<details style="margin-top: 10px;"><summary style="color: #4caf50; cursor: pointer;">🔍 Vedi Preview Dati (primi 3 record)</summary>';
                html += '<pre style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 11px; overflow-x: auto;">';
                html += JSON.stringify(data.preview, null, 2);
                html += '</pre></details>';
            }

            html += '</div>';
            resultDiv.innerHTML = html;
        } else {
            let html = '<div style="padding: 20px; background: rgba(244, 67, 54, 0.2); border: 1px solid rgba(244, 67, 54, 0.5); border-radius: 10px;">';
            html += '<h4 style="color: #f44336; margin-bottom: 10px;">✗ Errore nella Verifica JOIN</h4>';
            html += `<p style="color: #fff; margin-bottom: 10px;"><strong>Errore SQL:</strong></p>`;
            html += `<pre style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px; color: #f44336; font-size: 12px; white-space: pre-wrap;">${escapeHtml(data.error)}</pre>`;

            if (data.sql) {
                html += '<details style="margin-top: 10px;"><summary style="color: #f44336; cursor: pointer;">📋 Vedi Query SQL</summary>';
                html += `<pre style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 12px; overflow-x: auto;">${escapeHtml(data.sql)}</pre>`;
                html += '</details>';
            }

            html += '<p style="color: #a0a0b8; font-size: 13px; margin-top: 15px;">💡 Controlla la sintassi della condizione ON e verifica che i campi esistano nelle tabelle.</p>';
            html += '</div>';
            resultDiv.innerHTML = html;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div style="padding: 15px; background: rgba(244, 67, 54, 0.2); border: 1px solid rgba(244, 67, 54, 0.5); border-radius: 10px; color: #f44336;">✗ Errore di rete: ${escapeHtml(error.message)}</div>`;
    }

    // Scrolla al risultato
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Helper per escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
</script>

<?php include '../includes/footer.php'; ?>
