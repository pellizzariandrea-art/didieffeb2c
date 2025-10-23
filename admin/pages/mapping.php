<?php
require_once '../config.php';
require_once '../includes/functions.php';

$dbConfig = loadDBConfig();
if (!$dbConfig) {
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

$savedMapping = loadMappingConfig();

// Pre-carica valori salvati per i campi base
$savedFields = [];
if ($savedMapping) {
    foreach ($savedMapping as $mapping) {
        if (!$mapping['isAttribute']) {
            $savedFields[$mapping['targetField']] = $mapping;
        }
    }
}

$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mappings = [];

    // Campi obbligatori
    if (!empty($_POST['field_codice'])) {
        $mappings[] = [
            'dbColumn' => $_POST['field_codice'],
            'targetField' => 'codice',
            'isAttribute' => false,
            'transform' => $_POST['transform_codice'] ?? ''
        ];
    }

    if (!empty($_POST['field_nome'])) {
        $mappings[] = [
            'dbColumn' => $_POST['field_nome'],
            'targetField' => 'nome',
            'isAttribute' => false,
            'transform' => $_POST['transform_nome'] ?? ''
        ];
    }

    if (!empty($_POST['field_descrizione'])) {
        $mapping = [
            'dbColumn' => $_POST['field_descrizione'],
            'targetField' => 'descrizione',
            'isAttribute' => false,
            'transform' => $_POST['transform_descrizione'] ?? ''
        ];

        // Flag per generazione automatica da attributi
        if (isset($_POST['descrizione_genera_attributi']) && $_POST['descrizione_genera_attributi'] === '1') {
            $mapping['generateFromAttributes'] = true;
        }

        $mappings[] = $mapping;
    }

    if (!empty($_POST['field_prezzo'])) {
        $mappings[] = [
            'dbColumn' => $_POST['field_prezzo'],
            'targetField' => 'prezzo',
            'isAttribute' => false,
            'transform' => 'parseFloat'
        ];
    }

    if (!empty($_POST['field_immagine'])) {
        $mappings[] = [
            'dbColumn' => $_POST['field_immagine'],
            'targetField' => 'immagine',
            'isAttribute' => false,
            'transform' => $_POST['transform_immagine'] ?? ''
        ];
    }

    // Attributi dinamici
    if (!empty($_POST['attr_column'])) {
        foreach ($_POST['attr_column'] as $index => $column) {
            if (!empty($column) && !empty($_POST['attr_name'][$index])) {
                $mapping = [
                    'dbColumn' => $column,
                    'targetField' => 'attributi',
                    'isAttribute' => true,
                    'attributeName' => $_POST['attr_name'][$index]
                ];

                // Controlla se è un attributo booleano
                $isBool = isset($_POST['attr_is_boolean'][$index]) && $_POST['attr_is_boolean'][$index] === '1';

                if ($isBool) {
                    $mapping['isBoolean'] = true;
                    $mapping['transform'] = '';

                    // Salva mappatura booleana se presente
                    if (!empty($_POST['bool_map_' . $index])) {
                        $boolMap = [];
                        $boolMapData = json_decode($_POST['bool_map_' . $index], true);
                        if (is_array($boolMapData)) {
                            $boolMap = $boolMapData;
                        }
                        $mapping['booleanMap'] = $boolMap;
                    }
                } else {
                    $mapping['isBoolean'] = false;
                    $mapping['transform'] = $_POST['attr_transform'][$index] ?? '';
                }

                // Flag per usare attributo nella descrizione generata
                if (isset($_POST['attr_use_in_desc'][$index]) && $_POST['attr_use_in_desc'][$index] === '1') {
                    $mapping['useInDescription'] = true;
                }

                // Flag per usare attributo nelle gallery prodotti correlati
                if (isset($_POST['attr_use_for_gallery'][$index]) && $_POST['attr_use_for_gallery'][$index] === '1') {
                    $mapping['useForGallery'] = true;
                }

                $mappings[] = $mapping;
            }
        }
    }

    saveMappingConfig($mappings);
    logActivity("Mapping salvato con " . count($mappings) . " campi");

    // Ricarica il mapping salvato
    $savedMapping = loadMappingConfig();
    $savedFields = [];
    if ($savedMapping) {
        foreach ($savedMapping as $mapping) {
            if (!$mapping['isAttribute']) {
                $savedFields[$mapping['targetField']] = $mapping;
            }
        }
    }

    $messageType = 'success';
    $message = "✓ Mapping salvato con successo! " . count($mappings) . " campi configurati.";
}

include '../includes/header.php';
?>

<style>
.attribute-row {
    position: relative;
}

.attribute-controls {
    position: absolute;
    top: 15px;
    right: 15px;
    display: flex;
    gap: 6px;
    z-index: 10;
    align-items: center;
}

.remove-attr-btn {
    background: rgba(244, 67, 54, 0.2);
    border: 1px solid rgba(244, 67, 54, 0.5);
    color: #f44336;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
    transition: all 0.2s;
}

.remove-attr-btn:hover {
    background: rgba(244, 67, 54, 0.4);
    transform: translateY(-1px);
}

.move-attr-btn {
    background: rgba(102, 126, 234, 0.2);
    border: 1px solid rgba(102, 126, 234, 0.5);
    color: #667eea;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    line-height: 1;
    min-width: 32px;
    transition: all 0.2s;
}

.move-attr-btn:hover:not(:disabled) {
    background: rgba(102, 126, 234, 0.4);
    transform: translateY(-1px);
}

.move-attr-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
}

.attribute-row label {
    font-size: 13px;
    white-space: nowrap;
}

.attribute-row input[type="checkbox"] {
    margin-right: 5px;
    cursor: pointer;
}

.boolean-mapper {
    display: none;
    margin-top: 15px;
    padding: 15px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.boolean-mapper.active {
    display: block;
}

.boolean-value-row {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.boolean-value-row code {
    flex: 1;
    color: #fff;
    background: rgba(0, 0, 0, 0.3);
    padding: 5px 10px;
    border-radius: 5px;
}

.boolean-radios {
    display: flex;
    gap: 15px;
}

.boolean-radios label {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    color: #a0a0b8;
}

.boolean-radios input[type="radio"] {
    width: auto;
}

.load-values-btn {
    background: rgba(102, 126, 234, 0.3);
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid rgba(102, 126, 234, 0.5);
    color: #667eea;
    cursor: pointer;
    font-size: 14px;
}

.load-values-btn:hover {
    background: rgba(102, 126, 234, 0.5);
}

.load-values-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>

<div class="card">
    <h2>Step 2: Mapping Campi</h2>
    <p>Mappa le colonne del database ai campi del JSON. Colonne disponibili nella tabella <strong><?php echo htmlspecialchars($dbConfig['table']); ?></strong>:</p>

    <?php if ($message): ?>
        <div class="alert alert-<?php echo $messageType; ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <form method="POST" id="mapping-form">
        <h3 style="margin-top: 30px; color: #667eea;">Campi Obbligatori</h3>

        <!-- Codice -->
        <div class="mapping-row">
            <div>
                <label>Colonna DB → Codice Prodotto</label>
                <select name="field_codice" required>
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo htmlspecialchars($col['name']); ?>"
                            <?php echo (isset($savedFields['codice']) && $savedFields['codice']['dbColumn'] === $col['name']) ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($col['name']); ?> (<?php echo htmlspecialchars($col['type']); ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div style="text-align: center; padding-top: 25px;">→</div>
            <div style="padding-top: 25px;">
                <strong>codice</strong>
            </div>
            <div>
                <label>Trasformazione</label>
                <select name="transform_codice">
                    <option value="">Nessuna</option>
                    <option value="trim" <?php echo (isset($savedFields['codice']) && ($savedFields['codice']['transform'] ?? '') === 'trim') ? 'selected' : ''; ?>>Trim</option>
                    <option value="toUpperCase" <?php echo (isset($savedFields['codice']) && ($savedFields['codice']['transform'] ?? '') === 'toUpperCase') ? 'selected' : ''; ?>>MAIUSCOLO</option>
                </select>
            </div>
        </div>

        <!-- Nome -->
        <div class="mapping-row">
            <div>
                <label>Colonna DB → Nome Prodotto</label>
                <select name="field_nome" required>
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo htmlspecialchars($col['name']); ?>"
                            <?php echo (isset($savedFields['nome']) && $savedFields['nome']['dbColumn'] === $col['name']) ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($col['name']); ?> (<?php echo htmlspecialchars($col['type']); ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div style="text-align: center; padding-top: 25px;">→</div>
            <div style="padding-top: 25px;">
                <strong>nome</strong>
            </div>
            <div>
                <label>Trasformazione</label>
                <select name="transform_nome">
                    <option value="">Nessuna</option>
                    <option value="trim" <?php echo (isset($savedFields['nome']) && ($savedFields['nome']['transform'] ?? '') === 'trim') ? 'selected' : ''; ?>>Trim</option>
                </select>
            </div>
        </div>

        <!-- Descrizione -->
        <div class="mapping-row" style="grid-template-columns: 2fr 1fr 2fr 2fr 1fr 1fr;">
            <div>
                <label>Colonna DB → Descrizione</label>
                <select name="field_descrizione" required>
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo htmlspecialchars($col['name']); ?>"
                            <?php echo (isset($savedFields['descrizione']) && $savedFields['descrizione']['dbColumn'] === $col['name']) ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($col['name']); ?> (<?php echo htmlspecialchars($col['type']); ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div style="text-align: center; padding-top: 25px;">→</div>
            <div style="padding-top: 25px;">
                <strong>descrizione</strong>
            </div>
            <div>
                <label>Trasformazione</label>
                <select name="transform_descrizione">
                    <option value="">Nessuna</option>
                    <option value="trim" <?php echo (isset($savedFields['descrizione']) && ($savedFields['descrizione']['transform'] ?? '') === 'trim') ? 'selected' : ''; ?>>Trim</option>
                </select>
            </div>
            <div style="padding-top: 25px;">
                <label style="display: flex; align-items: center; gap: 8px; color: #667eea; cursor: pointer;">
                    <input type="checkbox" name="descrizione_genera_attributi" value="1"
                        <?php echo (isset($savedFields['descrizione']) && !empty($savedFields['descrizione']['generateFromAttributes'])) ? 'checked' : ''; ?>>
                    🤖 Genera da Attributi
                </label>
                <p style="font-size: 11px; color: #a0a0b8; margin-top: 5px; line-height: 1.3;">
                    Concatena nome + attributi selezionati
                </p>
            </div>
        </div>

        <!-- Prezzo -->
        <div class="mapping-row">
            <div>
                <label>Colonna DB → Prezzo</label>
                <select name="field_prezzo" required>
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo htmlspecialchars($col['name']); ?>"
                            <?php echo (isset($savedFields['prezzo']) && $savedFields['prezzo']['dbColumn'] === $col['name']) ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($col['name']); ?> (<?php echo htmlspecialchars($col['type']); ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div style="text-align: center; padding-top: 25px;">→</div>
            <div style="padding-top: 25px;">
                <strong>prezzo</strong>
            </div>
            <div style="padding-top: 25px;">
                <span class="badge badge-success">parseFloat (2 decimali)</span>
            </div>
        </div>

        <!-- Immagine -->
        <div class="mapping-row">
            <div>
                <label>Colonna DB → Immagine (opzionale)</label>
                <select name="field_immagine">
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo htmlspecialchars($col['name']); ?>"
                            <?php echo (isset($savedFields['immagine']) && $savedFields['immagine']['dbColumn'] === $col['name']) ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($col['name']); ?> (<?php echo htmlspecialchars($col['type']); ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div style="text-align: center; padding-top: 25px;">→</div>
            <div style="padding-top: 25px;">
                <strong>immagine</strong>
            </div>
            <div>
                <label>Trasformazione</label>
                <select name="transform_immagine">
                    <option value="">Nessuna</option>
                    <option value="trim" <?php echo (isset($savedFields['immagine']) && ($savedFields['immagine']['transform'] ?? '') === 'trim') ? 'selected' : ''; ?>>Trim</option>
                </select>
            </div>
        </div>

        <h3 style="margin-top: 40px; color: #764ba2;">Attributi Dinamici</h3>
        <p style="color: #a0a0b8; margin-bottom: 20px;">Aggiungi attributi personalizzati (serie, materiale, colore, ecc.). Gli attributi booleani sono utili per campi SI/NO, S/N, X/vuoto...</p>

        <div id="attributi-container">
            <?php
            // Se esiste un mapping salvato, mostra gli attributi salvati
            $savedAttributes = [];
            if ($savedMapping) {
                foreach ($savedMapping as $mapping) {
                    if ($mapping['isAttribute']) {
                        $savedAttributes[] = $mapping;
                    }
                }
            }

            // Mostra solo gli attributi salvati (nessun minimo)
            $attrCount = count($savedAttributes);

            if ($attrCount === 0):
            ?>
                <p style="color: #a0a0b8; padding: 20px; text-align: center; background: rgba(255, 255, 255, 0.05); border-radius: 10px; margin-bottom: 15px;">
                    📝 Nessun attributo configurato. Clicca "+ Aggiungi Attributo" per iniziare.
                </p>
            <?php
            endif;

            for ($i = 0; $i < $attrCount; $i++):
                $attr = $savedAttributes[$i] ?? null;
                $isBoolean = $attr && !empty($attr['isBoolean']);
            ?>
            <div class="attribute-row" data-index="<?php echo $i; ?>">
                <div class="attribute-controls">
                    <button type="button" class="move-attr-btn move-up" title="Sposta su">↑</button>
                    <button type="button" class="move-attr-btn move-down" title="Sposta giù">↓</button>
                    <button type="button" class="remove-attr-btn" data-remove-index="<?php echo $i; ?>">🗑️ Rimuovi</button>
                </div>
                <div style="padding: 20px 180px 20px 20px; background: rgba(118, 75, 162, 0.1); border-radius: 10px; margin-bottom: 15px;">
                    <div style="display: grid; grid-template-columns: 2fr 2fr 2fr 1.2fr 1.2fr; gap: 12px; align-items: end;">
                        <div>
                            <label>Colonna DB</label>
                            <select name="attr_column[]" class="attr-column-select">
                                <option value="">-- Seleziona --</option>
                                <?php foreach ($columns as $col): ?>
                                    <option value="<?php echo htmlspecialchars($col['name']); ?>"
                                        <?php echo ($attr && $attr['dbColumn'] === $col['name']) ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($col['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div>
                            <label>Nome Attributo</label>
                            <input type="text" name="attr_name[]" placeholder="es: materiale" class="attr-name-input"
                                value="<?php echo $attr ? htmlspecialchars($attr['attributeName']) : ''; ?>">
                        </div>
                        <div class="transform-select-container">
                            <label>Trasformazione</label>
                            <select name="attr_transform[]" class="attr-transform-select" <?php echo $isBoolean ? 'disabled' : ''; ?>>
                                <option value="">Nessuna</option>
                                <option value="trim" <?php echo ($attr && !$isBoolean && ($attr['transform'] ?? '') === 'trim') ? 'selected' : ''; ?>>Trim</option>
                                <option value="parseFloat" <?php echo ($attr && !$isBoolean && ($attr['transform'] ?? '') === 'parseFloat') ? 'selected' : ''; ?>>Numero Decimale</option>
                                <option value="parseInt" <?php echo ($attr && !$isBoolean && ($attr['transform'] ?? '') === 'parseInt') ? 'selected' : ''; ?>>Numero Intero</option>
                            </select>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                                <input type="hidden" name="attr_is_boolean[]" value="<?php echo $isBoolean ? '1' : '0'; ?>" class="bool-hidden">
                                <input type="checkbox" value="1" class="bool-checkbox"
                                    <?php echo $isBoolean ? 'checked' : ''; ?>
                                    onchange="this.previousElementSibling.value = this.checked ? '1' : '0'"
                                    style="margin: 0;">
                                <span>Booleano</span>
                            </label>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: #667eea;">
                                <input type="hidden" name="attr_use_in_desc[]" value="<?php echo ($attr && !empty($attr['useInDescription'])) ? '1' : '0'; ?>" class="desc-hidden">
                                <input type="checkbox" value="1" class="desc-checkbox"
                                    <?php echo ($attr && !empty($attr['useInDescription'])) ? 'checked' : ''; ?>
                                    onchange="this.previousElementSibling.value = this.checked ? '1' : '0'"
                                    style="margin: 0;">
                                <span>📝 Descrizione</span>
                            </label>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: #10b981;">
                                <input type="hidden" name="attr_use_for_gallery[]" value="<?php echo ($attr && !empty($attr['useForGallery'])) ? '1' : '0'; ?>" class="gallery-hidden">
                                <input type="checkbox" value="1" class="gallery-checkbox"
                                    <?php echo ($attr && !empty($attr['useForGallery'])) ? 'checked' : ''; ?>
                                    onchange="updateGalleryCheckboxes(this)"
                                    style="margin: 0;">
                                <span>🎨 Gallery</span>
                            </label>
                        </div>
                    </div>

                    <!-- Area mappatura booleana -->
                    <div class="boolean-mapper <?php echo $isBoolean ? 'active' : ''; ?>">
                        <button type="button" class="load-values-btn" onclick="loadDistinctValues(<?php echo $i; ?>)">
                            Carica Valori dal DB
                        </button>
                        <div class="values-container" style="margin-top: 15px;"></div>
                        <input type="hidden" name="bool_map_<?php echo $i; ?>" class="bool-map-input"
                            value='<?php echo $attr && !empty($attr['booleanMap']) ? json_encode($attr['booleanMap']) : '{}'; ?>'>
                    </div>
                </div>
            </div>
            <?php endfor; ?>
        </div>

        <button type="button" onclick="aggiungiAttributo()" class="btn btn-secondary">
            + Aggiungi Attributo
        </button>

        <div style="margin-top: 30px;">
            <button type="submit" class="btn">💾 Salva Mapping</button>
            <a href="/admin/pages/preview.php" class="btn btn-secondary" style="margin-left: 10px;">Anteprima →</a>
        </div>
    </form>
</div>

<script>
let attrCounter = <?php echo $attrCount; ?>;

// Funzione per limitare a max 2 checkbox Gallery selezionati
function updateGalleryCheckboxes(changedCheckbox) {
    const hiddenInput = changedCheckbox.previousElementSibling;
    hiddenInput.value = changedCheckbox.checked ? '1' : '0';

    // Conta quanti checkbox Gallery sono selezionati
    const galleryCheckboxes = document.querySelectorAll('.gallery-checkbox');
    const checkedCount = Array.from(galleryCheckboxes).filter(cb => cb.checked).length;

    // Se più di 2, deseleziona l'ultimo
    if (checkedCount > 2) {
        changedCheckbox.checked = false;
        hiddenInput.value = '0';
        alert('⚠️ Puoi selezionare massimo 2 attributi per le gallery prodotti correlati');
    }
}

// Event delegation per rimozione attributi
document.addEventListener('click', function(e) {
    // Rimozione
    if (e.target.classList.contains('remove-attr-btn') || e.target.closest('.remove-attr-btn')) {
        const btn = e.target.classList.contains('remove-attr-btn') ? e.target : e.target.closest('.remove-attr-btn');
        const index = btn.getAttribute('data-remove-index');

        console.log('Rimozione attributo index:', index);

        const row = document.querySelector(`.attribute-row[data-index="${index}"]`);
        console.log('Row trovata:', row);

        if (row) {
            row.remove();
            console.log('Attributo rimosso con successo');
            updateMoveButtons();
        } else {
            console.error('Riga non trovata per index:', index);
        }
    }

    // Sposta su
    if (e.target.classList.contains('move-up')) {
        const row = e.target.closest('.attribute-row');
        const prevRow = row.previousElementSibling;

        // Salta il messaggio "nessun attributo" se presente
        if (prevRow && prevRow.classList.contains('attribute-row')) {
            row.parentNode.insertBefore(row, prevRow);
            updateMoveButtons();
        }
    }

    // Sposta giù
    if (e.target.classList.contains('move-down')) {
        const row = e.target.closest('.attribute-row');
        const nextRow = row.nextElementSibling;

        if (nextRow && nextRow.classList.contains('attribute-row')) {
            row.parentNode.insertBefore(nextRow, row);
            updateMoveButtons();
        }
    }
});

// Aggiorna stato pulsanti sposta (disabilita se primo/ultimo)
// E aggiorna gli indici di TUTTE le righe per evitare problemi con bool_map
function updateMoveButtons() {
    const container = document.getElementById('attributi-container');
    const rows = container.querySelectorAll('.attribute-row');

    rows.forEach((row, newIndex) => {
        const oldIndex = row.getAttribute('data-index');
        const moveUpBtn = row.querySelector('.move-up');
        const moveDownBtn = row.querySelector('.move-down');

        // Disabilita "su" se è il primo
        if (moveUpBtn) {
            moveUpBtn.disabled = (newIndex === 0);
        }

        // Disabilita "giù" se è l'ultimo
        if (moveDownBtn) {
            moveDownBtn.disabled = (newIndex === rows.length - 1);
        }

        // ⚠️ FIX: Aggiorna data-index per mantenere consistenza
        if (oldIndex !== newIndex.toString()) {
            row.setAttribute('data-index', newIndex);

            // Aggiorna pulsante rimuovi
            const removeBtn = row.querySelector('.remove-attr-btn');
            if (removeBtn) {
                removeBtn.setAttribute('data-remove-index', newIndex);
            }

            // Aggiorna campo bool_map_X
            const boolMapInput = row.querySelector('.bool-map-input');
            if (boolMapInput) {
                boolMapInput.name = `bool_map_${newIndex}`;
            }

            // Aggiorna onclick del pulsante "Carica Valori"
            const loadBtn = row.querySelector('.load-values-btn');
            if (loadBtn) {
                loadBtn.setAttribute('onclick', `loadDistinctValues(${newIndex})`);
            }

            // Aggiorna tutti i radio button nel mapper booleano
            const radios = row.querySelectorAll('.boolean-value-row input[type="radio"]');
            radios.forEach(radio => {
                const oldName = radio.name;
                // Sostituisci bool_VECCHIOINDEX_ con bool_NUOVOINDEX_
                const newName = oldName.replace(`bool_${oldIndex}_`, `bool_${newIndex}_`);
                radio.name = newName;

                // Aggiorna anche onchange
                radio.setAttribute('onchange', `updateBooleanMap(${newIndex})`);
            });
        }
    });
}

// Toggle mappatura booleana
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('bool-checkbox')) {
        const row = e.target.closest('.attribute-row');
        const mapper = row.querySelector('.boolean-mapper');
        const transformSelect = row.querySelector('.attr-transform-select');
        const hiddenInput = e.target.previousElementSibling;

        // Aggiorna hidden input
        hiddenInput.value = e.target.checked ? '1' : '0';

        if (e.target.checked) {
            mapper.classList.add('active');
            transformSelect.disabled = true;
            transformSelect.value = '';
        } else {
            mapper.classList.remove('active');
            transformSelect.disabled = false;
            row.querySelector('.bool-map-input').value = '{}';
            row.querySelector('.values-container').innerHTML = '';
        }
    }
});

// Carica valori distinct
async function loadDistinctValues(index) {
    const row = document.querySelector(`[data-index="${index}"]`);
    const column = row.querySelector('.attr-column-select').value;
    const btn = row.querySelector('.load-values-btn');
    const container = row.querySelector('.values-container');

    if (!column) {
        alert('Seleziona prima una colonna DB');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Caricamento...';

    try {
        const formData = new FormData();
        formData.append('column', column);

        const response = await fetch('/admin/api/get-distinct-values.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Errore durante il caricamento');
        }

        // Carica mappatura salvata se esiste
        const savedMap = JSON.parse(row.querySelector('.bool-map-input').value || '{}');

        // Mostra valori
        container.innerHTML = `
            <p style="color: #a0a0b8; font-size: 13px; margin-bottom: 10px;">
                Trovati ${data.count} valori distinct. Assegna vero/falso per ogni valore:
            </p>
            ${data.values.map(value => {
                const displayValue = value === '' ? '(vuoto)' : value;
                const savedValue = savedMap[value];
                const trueChecked = savedValue === 'true' ? 'checked' : '';
                const falseChecked = savedValue === 'false' ? 'checked' : '';

                return `
                <div class="boolean-value-row">
                    <code>${escapeHtml(displayValue)}</code>
                    <div class="boolean-radios">
                        <label>
                            <input type="radio" name="bool_${index}_${escapeHtml(value)}"
                                value="true" ${trueChecked}
                                onchange="updateBooleanMap(${index})">
                            VERO
                        </label>
                        <label>
                            <input type="radio" name="bool_${index}_${escapeHtml(value)}"
                                value="false" ${falseChecked}
                                onchange="updateBooleanMap(${index})">
                            FALSO
                        </label>
                    </div>
                </div>
                `;
            }).join('')}
        `;

    } catch (error) {
        alert('Errore: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Ricarica Valori';
    }
}

// Aggiorna mappatura booleana
function updateBooleanMap(index) {
    const row = document.querySelector(`[data-index="${index}"]`);
    const radios = row.querySelectorAll('.boolean-value-row input[type="radio"]:checked');
    const map = {};

    radios.forEach(radio => {
        const name = radio.name;
        const value = name.replace(`bool_${index}_`, '');
        map[value] = radio.value;
    });

    row.querySelector('.bool-map-input').value = JSON.stringify(map);
}

// Escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Aggiungi attributo
function aggiungiAttributo() {
    const container = document.getElementById('attributi-container');

    // Rimuovi messaggio "nessun attributo" se presente
    const emptyMessage = container.querySelector('p');
    if (emptyMessage) {
        emptyMessage.remove();
    }

    const index = attrCounter++;

    const newRow = document.createElement('div');
    newRow.className = 'attribute-row';
    newRow.dataset.index = index;
    newRow.innerHTML = `
        <div class="attribute-controls">
            <button type="button" class="move-attr-btn move-up" title="Sposta su">↑</button>
            <button type="button" class="move-attr-btn move-down" title="Sposta giù">↓</button>
            <button type="button" class="remove-attr-btn" data-remove-index="${index}">🗑️ Rimuovi</button>
        </div>
        <div style="padding: 20px 180px 20px 20px; background: rgba(118, 75, 162, 0.1); border-radius: 10px; margin-bottom: 15px;">
            <div style="display: grid; grid-template-columns: 2fr 2fr 2fr 1.2fr 1.2fr; gap: 12px; align-items: end;">
                <div>
                    <label>Colonna DB</label>
                    <select name="attr_column[]" class="attr-column-select">
                        <option value="">-- Seleziona --</option>
                        <?php foreach ($columns as $col): ?>
                            <option value="<?php echo htmlspecialchars($col['name']); ?>">
                                <?php echo htmlspecialchars($col['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label>Nome Attributo</label>
                    <input type="text" name="attr_name[]" placeholder="es: materiale" class="attr-name-input">
                </div>
                <div class="transform-select-container">
                    <label>Trasformazione</label>
                    <select name="attr_transform[]" class="attr-transform-select">
                        <option value="">Nessuna</option>
                        <option value="trim">Trim</option>
                        <option value="parseFloat">Numero Decimale</option>
                        <option value="parseInt">Numero Intero</option>
                    </select>
                </div>
                <div style="display: flex; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <input type="hidden" name="attr_is_boolean[]" value="0" class="bool-hidden">
                        <input type="checkbox" value="1" class="bool-checkbox"
                            onchange="this.previousElementSibling.value = this.checked ? '1' : '0'"
                            style="margin: 0;">
                        <span>Booleano</span>
                    </label>
                </div>
                <div style="display: flex; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: #667eea;">
                        <input type="hidden" name="attr_use_in_desc[]" value="0" class="desc-hidden">
                        <input type="checkbox" value="1" class="desc-checkbox"
                            onchange="this.previousElementSibling.value = this.checked ? '1' : '0'"
                            style="margin: 0;">
                        <span>📝 Descrizione</span>
                    </label>
                </div>
                <div style="display: flex; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: #10b981;">
                        <input type="hidden" name="attr_use_for_gallery[]" value="0" class="gallery-hidden">
                        <input type="checkbox" value="1" class="gallery-checkbox"
                            onchange="updateGalleryCheckboxes(this)"
                            style="margin: 0;">
                        <span>🎨 Gallery</span>
                    </label>
                </div>
            </div>
            <div class="boolean-mapper">
                <button type="button" class="load-values-btn" onclick="loadDistinctValues(${index})">
                    Carica Valori dal DB
                </button>
                <div class="values-container" style="margin-top: 15px;"></div>
                <input type="hidden" name="bool_map_${index}" class="bool-map-input" value="{}">
            </div>
        </div>
    `;

    container.appendChild(newRow);
    updateMoveButtons();
}

// Inizializza pulsanti al caricamento della pagina
document.addEventListener('DOMContentLoaded', function() {
    updateMoveButtons();

    // Auto-carica valori booleani per campi già configurati
    document.querySelectorAll('.attribute-row').forEach(row => {
        const isBoolean = row.querySelector('.bool-checkbox').checked;
        const column = row.querySelector('.attr-column-select').value;
        const boolMapInput = row.querySelector('.bool-map-input');
        const savedMap = JSON.parse(boolMapInput.value || '{}');

        // Se è booleano, ha una colonna selezionata, e non ha mappatura salvata, carica automaticamente
        if (isBoolean && column) {
            const index = row.getAttribute('data-index');
            // Se ha già una mappatura salvata (non vuota), mostrala
            if (Object.keys(savedMap).length > 0) {
                displaySavedBooleanMap(index, savedMap);
            }
        }
    });
});

// Mostra mappatura booleana salvata senza ricaricare dal DB
function displaySavedBooleanMap(index, savedMap) {
    const row = document.querySelector(`[data-index="${index}"]`);
    const container = row.querySelector('.values-container');

    const html = `
        <p style="color: #a0a0b8; font-size: 13px; margin-bottom: 10px;">
            Mappatura salvata (${Object.keys(savedMap).length} valori). Clicca "Carica Valori dal DB" per aggiornare.
        </p>
        ${Object.entries(savedMap).map(([value, boolValue]) => {
            const displayValue = value === '' ? '(vuoto)' : value;
            const trueChecked = boolValue === 'true' ? 'checked' : '';
            const falseChecked = boolValue === 'false' ? 'checked' : '';

            return `
            <div class="boolean-value-row">
                <code>${escapeHtml(displayValue)}</code>
                <div class="boolean-radios">
                    <label>
                        <input type="radio" name="bool_${index}_${escapeHtml(value)}"
                            value="true" ${trueChecked}
                            onchange="updateBooleanMap(${index})">
                        VERO
                    </label>
                    <label>
                        <input type="radio" name="bool_${index}_${escapeHtml(value)}"
                            value="false" ${falseChecked}
                            onchange="updateBooleanMap(${index})">
                        FALSO
                    </label>
                </div>
            </div>
            `;
        }).join('')}
    `;

    container.innerHTML = html;
}
</script>

<?php include '../includes/footer.php'; ?>
