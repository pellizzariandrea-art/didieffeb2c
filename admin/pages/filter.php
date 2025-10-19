<?php
require_once '../config.php';
require_once '../includes/functions.php';

$dbConfig = loadDBConfig();
$mappingConfig = loadMappingConfig();

if (!$dbConfig || !$mappingConfig) {
    header('Location: /admin/pages/connection.php');
    exit;
}

// Carica colonne (include JOIN se configurati)
try {
    $columns = getTableColumns($dbConfig, null);
} catch (Exception $e) {
    // Fallback: se non c'è configurazione tabelle, redirect
    header('Location: /admin/pages/tables.php');
    exit;
}

$filters = loadFilterConfig();

// API per ottenere valori distinct (AJAX)
if (isset($_GET['action']) && $_GET['action'] === 'get_distinct_values' && !empty($_GET['column'])) {
    $column = $_GET['column'];

    try {
        $values = getDistinctValues($dbConfig, $dbConfig['table'], $column);
        // Limita a 30 valori per performance
        $values = array_slice($values, 0, 30);

        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'values' => $values,
            'total' => count($values)
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

$message = '';
$messageType = '';
$showPreview = isset($_GET['preview']) && $_GET['preview'] === '1';

// Salva filtri
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'save_filters') {
        $newFilters = [];

        if (!empty($_POST['filter_column'])) {
            // Riorganizza gli array per evitare problemi con indici sfasati
            $postColumns = array_values($_POST['filter_column']);
            $operators = array_values($_POST['filter_operator']);
            $values = isset($_POST['filter_value']) ? array_values($_POST['filter_value']) : [];
            $logics = isset($_POST['filter_logic']) ? array_values($_POST['filter_logic']) : [];

            // IMPORTANTE: Gli input disabilitati non vengono inviati, quindi values può avere meno elementi
            $valueIndex = 0;

            foreach ($postColumns as $index => $column) {
                if (!empty($column) && !empty($operators[$index])) {
                    $operator = $operators[$index];

                    // Se l'operatore NON richiede un valore, usa stringa vuota
                    if ($operator === 'is_empty' || $operator === 'is_not_empty') {
                        $value = '';
                    } else {
                        // Altrimenti prendi il valore dal contatore valueIndex
                        $value = $values[$valueIndex] ?? '';
                        $valueIndex++;
                    }

                    $filter = [
                        'column' => $column,
                        'operator' => $operator,
                        'value' => $value,
                        'logic' => $logics[$index] ?? 'AND'
                    ];
                    $newFilters[] = $filter;
                }
            }
        }

        try {
            saveFilterConfig($newFilters);
            $filters = $newFilters;
            logActivity("Filtri salvati: " . count($filters) . " condizioni");

            $messageType = 'success';
            $message = "✓ Filtri salvati con successo! I filtri verranno applicati automaticamente durante l'export.";
        } catch (Exception $e) {
            $messageType = 'error';
            $message = "Errore nel salvataggio dei filtri: " . $e->getMessage();
            error_log("Filter save error: " . $e->getMessage());
        }
    } elseif ($_POST['action'] === 'clear_filters') {
        saveFilterConfig([]);
        $filters = [];
        $messageType = 'success';
        $message = "✓ Filtri rimossi";
    }
}

// Applica filtri per anteprima (solo se richiesto)
$totalProducts = 0;
$filteredProducts = [];
$filteredCount = 0;

if ($showPreview) {
    try {
        $totalProducts = countProductsWithFilters($dbConfig, []);
        $filteredCount = countProductsWithFilters($dbConfig, $filters);
        $rawProducts = fetchProductsWithFilters($dbConfig, $filters, 100); // Max 100 per anteprima

        // Trasforma prodotti
        foreach ($rawProducts as $row) {
            $filteredProducts[] = transformRow($row, $mappingConfig);
        }

        // Arrotonda tutti i float a 2 decimali
        $filteredProducts = roundFloatsRecursive($filteredProducts, 2);
    } catch (Exception $e) {
        $messageType = 'error';
        $message = "Errore applicazione filtri: " . $e->getMessage();
    }
}

include '../includes/header.php';
?>

<div class="info-box" style="background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 10px; padding: 15px 20px; margin-bottom: 20px;">
    <h4 style="color: #667eea; margin-bottom: 10px; font-size: 14px;">ℹ️ Filtri e Export</h4>
    <p style="color: #a0a0b8; font-size: 13px; margin: 0;">
        I filtri configurati qui vengono applicati automaticamente all'export.
        Solo i prodotti che soddisfano tutti i criteri verranno inclusi nel file JSON finale.
    </p>
</div>

<style>
.filter-row {
    display: grid;
    grid-template-columns: 2fr 2fr 2fr 1fr 1fr;
    gap: 10px;
    align-items: end;
    margin-bottom: 15px;
    padding: 15px;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 10px;
    position: relative;
}

.remove-filter-btn {
    background: rgba(244, 67, 54, 0.3);
    border: 1px solid rgba(244, 67, 54, 0.5);
    color: #f44336;
    padding: 10px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
}

.remove-filter-btn:hover {
    background: rgba(244, 67, 54, 0.5);
}

.preview-table {
    width: 100%;
    min-width: max-content;
    border-collapse: collapse;
    margin-top: 20px;
    font-size: 13px;
}

.preview-table th {
    background: rgba(102, 126, 234, 0.3);
    padding: 12px 8px;
    text-align: left;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    user-select: none;
    position: sticky;
    top: 0;
    z-index: 10;
    min-width: 120px;
}

.preview-table th:hover {
    background: rgba(102, 126, 234, 0.4);
}

.preview-table th.sortable::after {
    content: ' ⇅';
    opacity: 0.3;
}

.preview-table th.sort-asc::after {
    content: ' ▲';
    opacity: 1;
}

.preview-table th.sort-desc::after {
    content: ' ▼';
    opacity: 1;
}

.preview-table td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 300px;
    min-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.preview-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.05);
}

.preview-container {
    max-height: 600px;
    overflow-y: auto;
    overflow-x: auto;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}

.filter-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    padding: 15px;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 10px;
}

.filter-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.filter-stat-number {
    font-size: 32px;
    font-weight: bold;
    color: #667eea;
}

.filter-stat-label {
    font-size: 13px;
    color: #a0a0b8;
    margin-top: 5px;
}

.value-preview {
    position: relative;
}

.value-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(30, 30, 50, 0.98);
    border: 1px solid rgba(102, 126, 234, 0.5);
    border-radius: 8px;
    max-height: 250px;
    overflow-y: auto;
    z-index: 1000;
    margin-top: 5px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
    display: none;
}

.value-suggestions.visible {
    display: block;
}

.value-suggestion-item {
    padding: 10px 15px;
    cursor: pointer;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 13px;
    transition: all 0.2s;
}

.value-suggestion-item:hover {
    background: rgba(102, 126, 234, 0.3);
}

.value-suggestion-item:last-child {
    border-bottom: none;
}

.value-suggestion-header {
    padding: 8px 15px;
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
    font-size: 12px;
    font-weight: 600;
    border-bottom: 1px solid rgba(102, 126, 234, 0.3);
    position: sticky;
    top: 0;
}

.value-suggestion-empty {
    padding: 15px;
    text-align: center;
    color: #a0a0b8;
    font-size: 13px;
}

.loading-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(102, 126, 234, 0.3);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    margin-left: 8px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>

<div class="card">
    <h2>Step 3: Filtri Prodotti</h2>
    <p style="color: #a0a0b8;">Configura i filtri per selezionare quali prodotti esportare. I filtri si applicano automaticamente durante l'export.</p>

    <?php if ($message): ?>
        <div class="alert alert-<?php echo $messageType; ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>
</div>

<div class="card">
    <h3>⚙️ Configurazione Filtri</h3>

    <form method="POST" id="filter-form">
        <input type="hidden" name="action" value="save_filters">

        <div id="filters-container">
            <?php
            $filterCount = max(1, count($filters));
            for ($i = 0; $i < $filterCount; $i++):
                $filter = $filters[$i] ?? null;
            ?>
            <div class="filter-row" data-index="<?php echo $i; ?>">
                <div>
                    <label>Campo</label>
                    <select name="filter_column[]" class="filter-column" required>
                        <option value="">-- Seleziona Campo --</option>
                        <?php foreach ($columns as $col): ?>
                            <option value="<?php echo htmlspecialchars($col['name']); ?>"
                                <?php echo ($filter && $filter['column'] === $col['name']) ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($col['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div>
                    <label>Operatore</label>
                    <select name="filter_operator[]" class="filter-operator" required onchange="toggleValueInput(<?php echo $i; ?>)">
                        <option value="">-- Seleziona --</option>
                        <option value="equals" <?php echo ($filter && $filter['operator'] === 'equals') ? 'selected' : ''; ?>>Uguale a</option>
                        <option value="not_equals" <?php echo ($filter && $filter['operator'] === 'not_equals') ? 'selected' : ''; ?>>Diverso da</option>
                        <option value="contains" <?php echo ($filter && $filter['operator'] === 'contains') ? 'selected' : ''; ?>>Contiene</option>
                        <option value="not_contains" <?php echo ($filter && $filter['operator'] === 'not_contains') ? 'selected' : ''; ?>>Non contiene</option>
                        <option value="starts_with" <?php echo ($filter && $filter['operator'] === 'starts_with') ? 'selected' : ''; ?>>Inizia con</option>
                        <option value="ends_with" <?php echo ($filter && $filter['operator'] === 'ends_with') ? 'selected' : ''; ?>>Finisce con</option>
                        <option value="is_empty" <?php echo ($filter && $filter['operator'] === 'is_empty') ? 'selected' : ''; ?>>È vuoto</option>
                        <option value="is_not_empty" <?php echo ($filter && $filter['operator'] === 'is_not_empty') ? 'selected' : ''; ?>>Non è vuoto</option>
                        <option value="greater_than" <?php echo ($filter && $filter['operator'] === 'greater_than') ? 'selected' : ''; ?>>Maggiore di</option>
                        <option value="less_than" <?php echo ($filter && $filter['operator'] === 'less_than') ? 'selected' : ''; ?>>Minore di</option>
                        <option value="greater_equal" <?php echo ($filter && $filter['operator'] === 'greater_equal') ? 'selected' : ''; ?>>Maggiore o uguale</option>
                        <option value="less_equal" <?php echo ($filter && $filter['operator'] === 'less_equal') ? 'selected' : ''; ?>>Minore o uguale</option>
                    </select>
                </div>

                <div class="value-preview">
                    <label>Valore <span class="value-loading" style="display: none;"><span class="loading-spinner"></span></span></label>
                    <input type="text" name="filter_value[]" class="filter-value" placeholder="valore..."
                        value="<?php echo $filter ? htmlspecialchars($filter['value']) : ''; ?>"
                        <?php echo ($filter && in_array($filter['operator'], ['is_empty', 'is_not_empty'])) ? 'disabled' : ''; ?>
                        onfocus="showValueSuggestions(<?php echo $i; ?>)"
                        oninput="filterSuggestions(<?php echo $i; ?>)">
                    <div class="value-suggestions" id="suggestions-<?php echo $i; ?>"></div>
                </div>

                <div>
                    <label>Logica</label>
                    <select name="filter_logic[]">
                        <option value="AND" <?php echo (!$filter || $filter['logic'] === 'AND') ? 'selected' : ''; ?>>AND</option>
                        <option value="OR" <?php echo ($filter && $filter['logic'] === 'OR') ? 'selected' : ''; ?>>OR</option>
                    </select>
                    <small style="color: #a0a0b8; font-size: 11px; display: block; margin-top: 3px;">
                        <?php echo $i === 0 ? '(primo filtro)' : 'con precedente'; ?>
                    </small>
                </div>

                <div>
                    <label>&nbsp;</label>
                    <button type="button" class="remove-filter-btn" onclick="removeFilter(<?php echo $i; ?>)">🗑️</button>
                </div>
            </div>
            <?php endfor; ?>
        </div>

        <div style="margin-top: 20px;">
            <button type="button" onclick="addFilter()" class="btn btn-secondary">➕ Aggiungi Filtro</button>
            <button type="submit" class="btn" style="margin-left: 10px;">💾 Salva Filtri</button>
            <?php if (!empty($filters)): ?>
                <a href="?preview=1" class="btn" style="margin-left: 10px; background: rgba(102, 126, 234, 0.3);">🔄 Aggiorna Anteprima</a>
            <?php endif; ?>
        </div>
    </form>

    <?php if (!empty($filters)): ?>
        <form method="POST" style="display: inline-block; margin-top: 20px;">
            <input type="hidden" name="action" value="clear_filters">
            <button type="submit" class="btn btn-secondary">🗑️ Rimuovi Tutti i Filtri</button>
        </form>
    <?php endif; ?>
</div>

<?php if (!empty($filters) && !$showPreview): ?>
<div class="card" style="background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.3);">
    <p style="text-align: center; margin: 0; color: #667eea;">
        ℹ️ Filtri salvati! Clicca su <strong>"🔄 Aggiorna Anteprima"</strong> per vedere i risultati.
    </p>
</div>
<?php endif; ?>

<?php if ($showPreview && (!empty($filters) || $filteredCount > 0)): ?>
<div class="card" id="preview-section">
    <h3>📊 Risultati Filtri</h3>

    <?php if (!empty($filters)): ?>
    <div style="background: rgba(118, 75, 162, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
        <h4 style="color: #764ba2; margin-bottom: 10px;">🔍 Query SQL Generata</h4>
        <pre style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; font-size: 12px; overflow-x: auto; margin: 0; white-space: pre-wrap; word-wrap: break-word;"><?php
        $params = [];
        $whereClause = buildFilterSQL($filters, $params);

        // Sostituisci i placeholder con i valori reali
        $displayQuery = "SELECT * FROM `{$dbConfig['table']}`" . $whereClause;
        foreach ($params as $placeholder => $value) {
            // Escapa il valore per SQL (aggiungi apici se è stringa)
            if ($value === '' || $value === null) {
                $displayValue = "''";
            } else {
                $displayValue = "'" . addslashes($value) . "'";
            }
            $displayQuery = str_replace($placeholder, $displayValue, $displayQuery);
        }

        // Formatta la query per renderla più leggibile
        $displayQuery = str_replace(' WHERE ', "\nWHERE\n  ", $displayQuery);
        $displayQuery = str_replace(' AND ', "\n  AND ", $displayQuery);
        $displayQuery = str_replace(' OR ', "\n      OR ", $displayQuery);

        echo htmlspecialchars($displayQuery);
        ?></pre>
        <p style="color: #a0a0b8; font-size: 12px; margin-top: 10px; margin-bottom: 0;">
            💡 <strong>Logica:</strong> Gli OR vengono raggruppati tra parentesi ( ). Gli AND separano i gruppi.
        </p>
    </div>
    <?php endif; ?>

    <div class="filter-stats">
        <div class="filter-stat">
            <div class="filter-stat-number"><?php echo $totalProducts; ?></div>
            <div class="filter-stat-label">Totale Prodotti</div>
        </div>
        <div class="filter-stat">
            <div class="filter-stat-number">→</div>
            <div class="filter-stat-label">Filtrati</div>
        </div>
        <div class="filter-stat">
            <div class="filter-stat-number"><?php echo $filteredCount; ?></div>
            <div class="filter-stat-label">Prodotti Selezionati</div>
        </div>
        <div class="filter-stat">
            <div class="filter-stat-number"><?php echo $totalProducts > 0 ? round(($filteredCount / $totalProducts) * 100) : 0; ?>%</div>
            <div class="filter-stat-label">Percentuale</div>
        </div>
    </div>

    <?php if (!empty($filteredProducts)): ?>
    <div class="preview-container">
        <table class="preview-table" id="preview-table">
            <thead>
                <tr>
                    <?php
                    // Estrai tutte le colonne possibili dai prodotti
                    $allColumns = ['codice', 'nome', 'descrizione', 'prezzo', 'immagine'];
                    if (!empty($filteredProducts[0]['attributi'])) {
                        $allColumns = array_merge($allColumns, array_keys($filteredProducts[0]['attributi']));
                    }
                    foreach ($allColumns as $col):
                        if ($col === 'attributi') continue;
                    ?>
                        <th class="sortable" onclick="sortTable('<?php echo htmlspecialchars($col); ?>')">
                            <?php echo htmlspecialchars(ucfirst($col)); ?>
                        </th>
                    <?php endforeach; ?>
                </tr>
            </thead>
            <tbody>
                <?php foreach (array_slice($filteredProducts, 0, 100) as $product): ?>
                <tr>
                    <?php foreach ($allColumns as $col):
                        if ($col === 'attributi') continue;

                        $value = '';
                        if (isset($product[$col])) {
                            $value = is_array($product[$col]) ? json_encode($product[$col]) : $product[$col];
                        } elseif (isset($product['attributi'][$col])) {
                            $attrValue = $product['attributi'][$col];
                            $value = is_bool($attrValue) ? ($attrValue ? 'true' : 'false') : $attrValue;
                        }
                    ?>
                        <td title="<?php echo htmlspecialchars($value); ?>">
                            <?php echo htmlspecialchars(substr($value, 0, 100)); ?>
                        </td>
                    <?php endforeach; ?>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <p style="color: #a0a0b8; margin-top: 15px; font-size: 13px;">
        Mostrando i primi <?php echo min(100, count($filteredProducts)); ?> di <?php echo $filteredCount; ?> prodotti.
        Clicca sulle intestazioni delle colonne per ordinare.
    </p>
    <?php endif; ?>
</div>
<?php endif; ?>

<div class="card">
    <a href="/admin/pages/mapping.php" class="btn btn-secondary">← Mapping</a>
    <a href="/admin/pages/preview.php" class="btn" style="margin-left: 10px;">Preview →</a>
    <a href="/admin/pages/export.php" class="btn" style="margin-left: 10px;">🚀 Export →</a>
</div>

<script>
let filterCounter = <?php echo $filterCount; ?>;

// Aggiungi filtro
function addFilter() {
    const container = document.getElementById('filters-container');
    const index = filterCounter++;

    const newRow = document.createElement('div');
    newRow.className = 'filter-row';
    newRow.dataset.index = index;
    newRow.innerHTML = `
        <div>
            <label>Campo</label>
            <select name="filter_column[]" class="filter-column" required>
                <option value="">-- Seleziona Campo --</option>
                <?php foreach ($columns as $col): ?>
                    <option value="<?php echo htmlspecialchars($col['name']); ?>">
                        <?php echo htmlspecialchars($col['name']); ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>
        <div>
            <label>Operatore</label>
            <select name="filter_operator[]" class="filter-operator" required onchange="toggleValueInput(${index})">
                <option value="">-- Seleziona --</option>
                <option value="equals">Uguale a</option>
                <option value="not_equals">Diverso da</option>
                <option value="contains">Contiene</option>
                <option value="not_contains">Non contiene</option>
                <option value="starts_with">Inizia con</option>
                <option value="ends_with">Finisce con</option>
                <option value="is_empty">È vuoto</option>
                <option value="is_not_empty">Non è vuoto</option>
                <option value="greater_than">Maggiore di</option>
                <option value="less_than">Minore di</option>
                <option value="greater_equal">Maggiore o uguale</option>
                <option value="less_equal">Minore o uguale</option>
            </select>
        </div>
        <div class="value-preview">
            <label>Valore <span class="value-loading" style="display: none;"><span class="loading-spinner"></span></span></label>
            <input type="text" name="filter_value[]" class="filter-value" placeholder="valore..."
                onfocus="showValueSuggestions(${index})"
                oninput="filterSuggestions(${index})">
            <div class="value-suggestions" id="suggestions-${index}"></div>
        </div>
        <div>
            <label>Logica</label>
            <select name="filter_logic[]">
                <option value="AND">AND</option>
                <option value="OR">OR</option>
            </select>
            <small style="color: #a0a0b8; font-size: 11px; display: block; margin-top: 3px;">con precedente</small>
        </div>
        <div>
            <label>&nbsp;</label>
            <button type="button" class="remove-filter-btn" onclick="removeFilter(${index})">🗑️</button>
        </div>
    `;

    container.appendChild(newRow);
}

// Rimuovi filtro
function removeFilter(index) {
    const row = document.querySelector(`[data-index="${index}"]`);
    if (row) {
        row.remove();
    }
}

// Toggle input valore basato su operatore
function toggleValueInput(index) {
    const row = document.querySelector(`[data-index="${index}"]`);
    if (!row) return;

    const operator = row.querySelector('.filter-operator').value;
    const valueInput = row.querySelector('.filter-value');

    if (operator === 'is_empty' || operator === 'is_not_empty') {
        valueInput.disabled = true;
        valueInput.value = '';
    } else {
        valueInput.disabled = false;
    }
}

// Ordinamento tabella
let currentSort = { column: null, direction: 'asc' };

function sortTable(column) {
    const table = document.getElementById('preview-table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const headers = Array.from(table.querySelectorAll('th'));

    // Trova l'indice della colonna
    const columnIndex = headers.findIndex(th => th.textContent.toLowerCase().includes(column.toLowerCase()));
    if (columnIndex === -1) return;

    // Determina direzione ordinamento
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // Ordina righe
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex]?.textContent || '';
        const bValue = b.cells[columnIndex]?.textContent || '';

        // Prova a confrontare come numeri
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);

        let comparison = 0;
        if (!isNaN(aNum) && !isNaN(bNum)) {
            comparison = aNum - bNum;
        } else {
            comparison = aValue.localeCompare(bValue);
        }

        return currentSort.direction === 'asc' ? comparison : -comparison;
    });

    // Rimuovi classi ordinamento precedenti
    headers.forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });

    // Aggiungi classe al header corrente
    headers[columnIndex].classList.add(`sort-${currentSort.direction}`);

    // Riordina DOM
    rows.forEach(row => tbody.appendChild(row));
}

// Inizializza toggle per filtri esistenti
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.filter-row').forEach((row, index) => {
        toggleValueInput(index);
    });

    // Scroll automatico all'anteprima se presente
    <?php if ($showPreview): ?>
    setTimeout(function() {
        const previewSection = document.getElementById('preview-section');
        if (previewSection) {
            previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);
    <?php endif; ?>
});

// ============== GESTIONE SUGGERIMENTI VALORI ==============

// Cache per i valori caricati
const valuesCache = {};

// Carica valori distinct per un campo
async function loadDistinctValues(column, rowIndex) {
    // Se già in cache, usa quello
    if (valuesCache[column]) {
        return valuesCache[column];
    }

    const row = document.querySelector(`[data-index="${rowIndex}"]`);
    const loadingSpinner = row.querySelector('.value-loading');

    if (loadingSpinner) {
        loadingSpinner.style.display = 'inline';
    }

    try {
        const response = await fetch(`?action=get_distinct_values&column=${encodeURIComponent(column)}`);
        const data = await response.json();

        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }

        if (data.success) {
            valuesCache[column] = data.values;
            return data.values;
        } else {
            console.error('Error loading values:', data.error);
            return [];
        }
    } catch (error) {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        console.error('Error loading values:', error);
        return [];
    }
}

// Mostra suggerimenti
async function showValueSuggestions(rowIndex) {
    const row = document.querySelector(`[data-index="${rowIndex}"]`);
    if (!row) return;

    const columnSelect = row.querySelector('.filter-column');
    const valueInput = row.querySelector('.filter-value');
    const suggestionsDiv = row.querySelector('.value-suggestions');

    if (!columnSelect.value || valueInput.disabled) {
        suggestionsDiv.classList.remove('visible');
        return;
    }

    const column = columnSelect.value;
    const values = await loadDistinctValues(column, rowIndex);

    renderSuggestions(rowIndex, values);
}

// Renderizza suggerimenti
function renderSuggestions(rowIndex, values, filterText = '') {
    const row = document.querySelector(`[data-index="${rowIndex}"]`);
    if (!row) return;

    const suggestionsDiv = row.querySelector('.value-suggestions');

    // Filtra valori se c'è testo di ricerca
    let filteredValues = values;
    if (filterText) {
        const searchLower = filterText.toLowerCase();
        filteredValues = values.filter(v =>
            String(v).toLowerCase().includes(searchLower)
        );
    }

    if (filteredValues.length === 0) {
        suggestionsDiv.innerHTML = '<div class="value-suggestion-empty">Nessun valore trovato</div>';
        suggestionsDiv.classList.add('visible');
        return;
    }

    const totalText = values.length > 30 ? ' (primi 30)' : '';
    let html = `<div class="value-suggestion-header">📋 Valori disponibili${totalText}</div>`;

    filteredValues.forEach(value => {
        const displayValue = value === '' || value === null ? '(vuoto)' : value;
        const escapedValue = String(value).replace(/'/g, "\\'").replace(/"/g, '&quot;');
        html += `<div class="value-suggestion-item" onclick="selectValue(${rowIndex}, '${escapedValue}')">${displayValue}</div>`;
    });

    suggestionsDiv.innerHTML = html;
    suggestionsDiv.classList.add('visible');
}

// Seleziona un valore dai suggerimenti
function selectValue(rowIndex, value) {
    const row = document.querySelector(`[data-index="${rowIndex}"]`);
    if (!row) return;

    const valueInput = row.querySelector('.filter-value');
    const suggestionsDiv = row.querySelector('.value-suggestions');

    valueInput.value = value;
    suggestionsDiv.classList.remove('visible');
}

// Filtra suggerimenti mentre l'utente digita
async function filterSuggestions(rowIndex) {
    const row = document.querySelector(`[data-index="${rowIndex}"]`);
    if (!row) return;

    const columnSelect = row.querySelector('.filter-column');
    const valueInput = row.querySelector('.filter-value');
    const suggestionsDiv = row.querySelector('.value-suggestions');

    if (!columnSelect.value || valueInput.disabled) {
        suggestionsDiv.classList.remove('visible');
        return;
    }

    const column = columnSelect.value;
    const filterText = valueInput.value;

    // Carica valori se non in cache
    const values = await loadDistinctValues(column, rowIndex);

    // Renderizza con filtro
    renderSuggestions(rowIndex, values, filterText);
}

// Chiudi suggerimenti quando clicchi fuori
document.addEventListener('click', function(e) {
    if (!e.target.closest('.value-preview')) {
        document.querySelectorAll('.value-suggestions').forEach(div => {
            div.classList.remove('visible');
        });
    }
});

// Aggiorna suggerimenti quando cambia il campo
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('filter-column')) {
        const row = e.target.closest('.filter-row');
        if (row) {
            const index = parseInt(row.dataset.index);
            const valueInput = row.querySelector('.filter-value');

            // Pulisci il valore quando cambi campo
            valueInput.value = '';

            // Carica i nuovi valori in background
            const column = e.target.value;
            if (column) {
                loadDistinctValues(column, index);
            }
        }
    }
});
</script>

<?php include '../includes/footer.php'; ?>
