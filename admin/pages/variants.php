<?php
require_once '../config.php';
require_once '../includes/functions.php';

$dbConfig = loadDBConfig();
$mappingConfig = loadMappingConfig();

if (!$dbConfig || !$mappingConfig) {
    header('Location: /admin/pages/connection.php');
    exit;
}

// Carica colonne database
try {
    $columns = getTableColumns($dbConfig, null);
} catch (Exception $e) {
    header('Location: /admin/pages/tables.php');
    exit;
}

// Carica attributi dal mapping
$availableAttributes = [];
foreach ($mappingConfig as $mapping) {
    if ($mapping['isAttribute'] && !empty($mapping['attributeName'])) {
        $availableAttributes[] = [
            'name' => $mapping['attributeName'],
            'isBoolean' => !empty($mapping['isBoolean'])
        ];
    }
}

$variantConfig = loadVariantConfig();
$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $config = [
            'enabled' => isset($_POST['enabled']),
            'groupByField' => trim($_POST['group_by_field'] ?? ''),
            'orderByField' => trim($_POST['order_by_field'] ?? '')
        ];

        if ($config['enabled']) {
            if (empty($config['groupByField'])) {
                throw new Exception('Il campo aggregatore varianti è obbligatorio.');
            }
        }

        // Qualificatori di variante
        $qualifiers = [];
        if (!empty($_POST['qualifiers'])) {
            foreach ($_POST['qualifiers'] as $qualifierName) {
                // Trova l'attributo per determinare il tipo
                $isBoolean = false;
                foreach ($availableAttributes as $attr) {
                    if ($attr['name'] === $qualifierName) {
                        $isBoolean = $attr['isBoolean'];
                        break;
                    }
                }

                $qualifiers[] = [
                    'attributeName' => $qualifierName,
                    'type' => $isBoolean ? 'boolean' : 'text'
                ];
            }
        }

        $config['qualifiers'] = $qualifiers;

        // Salva il qualificatore da usare come colonna
        $config['columnQualifier'] = trim($_POST['column_qualifier'] ?? '');

        // Salva l'ordine dei qualificatori per le righe
        $rowOrder = [];
        if (!empty($_POST['row_order'])) {
            $rowOrder = array_filter(array_map('trim', explode(',', $_POST['row_order'])));
        }
        $config['rowQualifiersOrder'] = $rowOrder;

        // Salva i campi da mostrare nel catalogo stampato
        $printCatalogFields = [];
        if (!empty($_POST['print_catalog_fields'])) {
            $printCatalogFields = $_POST['print_catalog_fields'];
        }
        $config['printCatalogFields'] = $printCatalogFields;

        saveVariantConfig($config);
        $variantConfig = $config;

        $message = '✓ Configurazione varianti salvata con successo!';
        $messageType = 'success';

        logActivity("Configurazione varianti salvata: " . count($qualifiers) . " qualificatori");

    } catch (Exception $e) {
        $message = 'Errore: ' . $e->getMessage();
        $messageType = 'error';
    }
}

include '../includes/header.php';
?>

<div class="container">
    <div class="header-section">
        <div>
            <h1>🔀 Varianti Prodotto</h1>
            <p class="subtitle">Configura il sistema di raggruppamento varianti per e-commerce</p>
        </div>
        <a href="<?= ADMIN_URL ?>" class="btn btn-secondary">← Dashboard</a>
    </div>

    <?php if ($message): ?>
        <div class="alert alert-<?= $messageType ?>">
            <?= htmlspecialchars($message) ?>
        </div>
    <?php endif; ?>

    <!-- Info Box -->
    <div class="info-box">
        <h3>ℹ️ Come Funziona il Sistema Varianti</h3>
        <ol style="margin: 15px 0 0 20px; line-height: 1.8;">
            <li><strong>Aggregatore:</strong> Campo database che raggruppa le varianti (es: <code>pos assoluto</code>)</li>
            <li><strong>Ordinamento:</strong> Campo che definisce l'ordine delle varianti nel gruppo (es: <code>ord in tabella</code>)</li>
            <li><strong>Qualificatori:</strong> Attributi che distinguono le varianti (es: Colore, Taglia, Materiale)</li>
            <li><strong>Prodotto Master:</strong> Il primo prodotto del gruppo (ordinato) diventa il principale</li>
            <li><strong>Output JSON:</strong> Un oggetto con array <code>variants</code> contenente tutte le varianti</li>
        </ol>
        <p style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px;">
            <strong>💡 Esempio:</strong> Prodotti con stesso "pos assoluto" (es: 12345) ma diversi per Colore/Taglia verranno aggregati in un unico prodotto con griglia di selezione varianti.
        </p>
    </div>

    <!-- Form Configurazione -->
    <div class="card">
        <h2>⚙️ Configurazione Base</h2>

        <form method="POST" class="form">
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" name="enabled" <?= !empty($variantConfig['enabled']) ? 'checked' : '' ?>>
                    Abilita sistema varianti prodotto
                </label>
                <small>Se disabilitato, ogni prodotto sarà esportato separatamente senza raggruppamenti</small>
            </div>

            <div class="form-group">
                <label for="group_by_field">Campo Aggregatore Varianti *</label>
                <select name="group_by_field" id="group_by_field" class="form-control" required>
                    <option value="">-- Seleziona Campo --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?= htmlspecialchars($col['name']) ?>"
                            <?= (isset($variantConfig['groupByField']) && $variantConfig['groupByField'] === $col['name']) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($col['name']) ?> (<?= htmlspecialchars($col['type']) ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
                <small>Campo database che identifica il gruppo di varianti (es: "pos assoluto")</small>
            </div>

            <div class="form-group">
                <label for="order_by_field">Campo Ordinamento Varianti (opzionale)</label>
                <select name="order_by_field" id="order_by_field" class="form-control">
                    <option value="">-- Nessun ordinamento specifico --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?= htmlspecialchars($col['name']) ?>"
                            <?= (isset($variantConfig['orderByField']) && $variantConfig['orderByField'] === $col['name']) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($col['name']) ?> (<?= htmlspecialchars($col['type']) ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
                <small>Campo che definisce l'ordine delle varianti nel gruppo (es: "ord in tabella")</small>
            </div>

            <h3 style="margin-top: 30px; color: #667eea;">Qualificatori di Variante</h3>
            <p style="color: #a0a0b8; margin-bottom: 20px;">
                Seleziona quali attributi rappresentano le differenze tra varianti.
                Gli attributi booleani e testuali sono automaticamente riconosciuti dal mapping.
            </p>

            <?php if (empty($availableAttributes)): ?>
                <div class="alert alert-warning">
                    ⚠️ Nessun attributo configurato nel mapping.
                    <a href="/admin/pages/mapping.php" style="color: #667eea; text-decoration: underline;">
                        Vai al Mapping per configurare gli attributi
                    </a>
                </div>
            <?php else: ?>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
                    <?php
                    $selectedQualifiers = [];
                    if (!empty($variantConfig['qualifiers'])) {
                        foreach ($variantConfig['qualifiers'] as $q) {
                            $selectedQualifiers[] = $q['attributeName'];
                        }
                    }

                    foreach ($availableAttributes as $attr):
                        $isSelected = in_array($attr['name'], $selectedQualifiers);
                        $typeIcon = $attr['isBoolean'] ? '☑️' : '📝';
                        $typeLabel = $attr['isBoolean'] ? 'Booleano' : 'Testo';
                    ?>
                        <label style="display: flex; align-items: center; gap: 10px; padding: 15px; background: rgba(102, 126, 234, 0.1); border-radius: 10px; cursor: pointer; border: 2px solid <?= $isSelected ? '#667eea' : 'transparent' ?>;">
                            <input type="checkbox" name="qualifiers[]" value="<?= htmlspecialchars($attr['name']) ?>"
                                <?= $isSelected ? 'checked' : '' ?>
                                style="width: 20px; height: 20px; cursor: pointer;">
                            <div>
                                <div style="font-weight: bold; color: #fff;">
                                    <?= $typeIcon ?> <?= htmlspecialchars($attr['name']) ?>
                                </div>
                                <div style="font-size: 12px; color: #a0a0b8;">
                                    Tipo: <?= $typeLabel ?>
                                </div>
                            </div>
                        </label>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <!-- Layout Griglia Catalogo -->
            <h3 style="margin-top: 40px; color: #667eea;">📊 Layout Griglia Catalogo</h3>
            <p style="color: #a0a0b8; margin-bottom: 20px;">
                Definisci come devono essere organizzate le varianti nella griglia del catalogo stampato.
            </p>

            <div class="form-group">
                <label for="column_qualifier">Qualificatore per Colonne</label>
                <select name="column_qualifier" id="column_qualifier" class="form-control">
                    <option value="">-- Automatico (qualificatore con più valori) --</option>
                    <?php
                    // Mostra solo qualificatori testuali (non booleani)
                    if (!empty($variantConfig['qualifiers'])) {
                        foreach ($variantConfig['qualifiers'] as $q) {
                            if ($q['type'] !== 'boolean') {
                                $selected = (!empty($variantConfig['columnQualifier']) && $variantConfig['columnQualifier'] === $q['attributeName']) ? 'selected' : '';
                                echo '<option value="' . htmlspecialchars($q['attributeName']) . '" ' . $selected . '>' . htmlspecialchars($q['attributeName']) . '</option>';
                            }
                        }
                    }
                    ?>
                </select>
                <small>Scegli quale qualificatore diventa colonne nella griglia. Gli altri qualificatori diventeranno righe (i booleani restano sempre indicatori).</small>
            </div>

            <div class="form-group" style="margin-top: 25px;">
                <label>Ordinamento Righe</label>
                <p style="font-size: 13px; color: #a0a0b8; margin-bottom: 15px;">
                    Definisci l'ordine in cui i qualificatori (che non sono colonne) appariranno come righe nella griglia.
                </p>
                <div id="row-order-container" style="min-height: 50px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 2px dashed rgba(255,255,255,0.2);">
                    <!-- Verrà popolato dinamicamente via JavaScript -->
                </div>
                <input type="hidden" name="row_order" id="row_order" value="">
                <small style="display: block; margin-top: 10px; color: #a0a0b8;">
                    💡 Usa le frecce per riordinare i qualificatori. L'ordine qui definito sarà usato per le righe della griglia.
                </small>
            </div>

            <!-- Campi Catalogo Stampato -->
            <h3 style="margin-top: 40px; color: #667eea;">📋 Campi Descrittivi per Catalogo Stampato</h3>
            <p style="color: #a0a0b8; margin-bottom: 20px;">
                Seleziona quali attributi (non-varianti) mostrare nell'header del catalogo stampato quando sono comuni a tutte le varianti,
                o nelle celle quando variano tra le varianti.
            </p>

            <?php if (empty($availableAttributes)): ?>
                <div class="alert alert-warning">
                    ⚠️ Nessun attributo disponibile.
                </div>
            <?php else: ?>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
                    <?php
                    $selectedPrintFields = [];
                    if (!empty($variantConfig['printCatalogFields'])) {
                        $selectedPrintFields = $variantConfig['printCatalogFields'];
                    }

                    // Mostra tutti gli attributi che NON sono qualificatori di variante
                    $qualifierNames = [];
                    if (!empty($variantConfig['qualifiers'])) {
                        foreach ($variantConfig['qualifiers'] as $q) {
                            $qualifierNames[] = $q['attributeName'];
                        }
                    }

                    foreach ($availableAttributes as $attr):
                        // Skippa i qualificatori (sono già gestiti nella griglia)
                        if (in_array($attr['name'], $qualifierNames)) {
                            continue;
                        }

                        $isSelected = in_array($attr['name'], $selectedPrintFields);
                        $typeIcon = $attr['isBoolean'] ? '☑️' : '📝';
                        $typeLabel = $attr['isBoolean'] ? 'Booleano' : 'Testo';
                    ?>
                        <label style="display: flex; align-items: center; gap: 10px; padding: 15px; background: rgba(118, 75, 162, 0.1); border-radius: 10px; cursor: pointer; border: 2px solid <?= $isSelected ? '#764ba2' : 'transparent' ?>;">
                            <input type="checkbox" name="print_catalog_fields[]" value="<?= htmlspecialchars($attr['name']) ?>"
                                <?= $isSelected ? 'checked' : '' ?>
                                style="width: 20px; height: 20px; cursor: pointer;">
                            <div>
                                <div style="font-weight: bold; color: #fff;">
                                    <?= $typeIcon ?> <?= htmlspecialchars($attr['name']) ?>
                                </div>
                                <div style="font-size: 12px; color: #a0a0b8;">
                                    Tipo: <?= $typeLabel ?>
                                </div>
                            </div>
                        </label>
                    <?php endforeach; ?>
                </div>
                <small style="display: block; margin-top: 15px; color: #a0a0b8;">
                    💡 <strong>Esempio:</strong> "Confezione", "Serie", "Applicazione su" - campi che descrivono il prodotto ma non sono varianti.
                    Se un campo ha lo stesso valore in tutte le varianti, apparirà nell'header. Se varia, apparirà nelle celle della griglia.
                </small>
            <?php endif; ?>

            <div style="margin-top: 30px;">
                <button type="submit" class="btn btn-primary">💾 Salva Configurazione</button>
            </div>
        </form>
    </div>

    <!-- Esempio Output -->
    <?php if (!empty($variantConfig['enabled']) && !empty($variantConfig['qualifiers'])): ?>
    <div class="card">
        <h2>📄 Esempio Output JSON</h2>
        <p style="color: #a0a0b8; margin-bottom: 15px;">
            Con questa configurazione, i prodotti saranno esportati con la seguente struttura:
        </p>
        <pre style="background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 10px; overflow-x: auto; font-size: 13px; line-height: 1.6;">{
  "codice": "PROD-MASTER",
  "nome": "Nome Prodotto (dal primo del gruppo)",
  "descrizione": "...",
  "prezzo": 49.90,
  "immagine": "url immagine master",
  "immagini": ["gallery master"],
  "variantGroupId": "<?= htmlspecialchars($variantConfig['groupByField']) ?>",
  "isVariantGroup": true,
  "variants": [
    {
      "codice": "PROD-001",
      "variantOrder": 1,
      "qualifiers": {
<?php foreach ($variantConfig['qualifiers'] as $idx => $q): ?>
        "<?= htmlspecialchars($q['attributeName']) ?>": "<?= $q['type'] === 'boolean' ? 'true/false' : 'valore' ?>"<?= $idx < count($variantConfig['qualifiers']) - 1 ? ',' : '' ?>

<?php endforeach; ?>
      },
      "prezzo": 49.90,
      "immagine": "url immagine variante",
      "immagini": ["gallery variante"],
      "attributi": { ... }
    },
    {
      "codice": "PROD-002",
      "variantOrder": 2,
      "qualifiers": { ... },
      "prezzo": 52.90,
      "immagine": "...",
      "immagini": ["..."]
    }
  ],
  "attributi": { ... }
}</pre>
    </div>
    <?php endif; ?>

    <!-- Stato Configurazione -->
    <div class="card">
        <h2>📊 Stato Configurazione</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8; width: 220px;"><strong>Sistema Varianti:</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;">
                    <?php if (!empty($variantConfig['enabled'])): ?>
                        <span style="color: #28a745; font-weight: bold; font-size: 15px;">✅ Abilitato</span>
                    <?php else: ?>
                        <span style="color: #6c757d; font-size: 15px;">❌ Disabilitato</span>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;"><strong>Campo Aggregatore:</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8; font-family: monospace; font-size: 13px;">
                    <?= !empty($variantConfig['groupByField']) ? htmlspecialchars($variantConfig['groupByField']) : '<em style="color: #999;">Non configurato</em>' ?>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;"><strong>Campo Ordinamento:</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8; font-family: monospace; font-size: 13px;">
                    <?= !empty($variantConfig['orderByField']) ? htmlspecialchars($variantConfig['orderByField']) : '<em style="color: #999;">Nessun ordinamento</em>' ?>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;"><strong>Qualificatori:</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;">
                    <?php if (!empty($variantConfig['qualifiers'])): ?>
                        <?php foreach ($variantConfig['qualifiers'] as $q): ?>
                            <span style="display: inline-block; padding: 5px 12px; background: rgba(102, 126, 234, 0.2); border-radius: 5px; margin-right: 8px; margin-bottom: 5px; font-size: 13px;">
                                <?= $q['type'] === 'boolean' ? '☑️' : '📝' ?> <?= htmlspecialchars($q['attributeName']) ?>
                            </span>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <em style="color: #999;">Nessun qualificatore selezionato</em>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;"><strong>Layout Griglia:</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;">
                    <?php if (!empty($variantConfig['columnQualifier'])): ?>
                        <span style="display: inline-block; padding: 5px 12px; background: rgba(40, 167, 69, 0.2); border-radius: 5px; font-size: 13px; font-weight: 600; color: #28a745;">
                            📊 Colonne: <?= htmlspecialchars($variantConfig['columnQualifier']) ?>
                        </span>
                    <?php else: ?>
                        <em style="color: #999;">Automatico (qualificatore con più valori)</em>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;"><strong>Ordine Righe:</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;">
                    <?php if (!empty($variantConfig['rowQualifiersOrder'])): ?>
                        <?php foreach ($variantConfig['rowQualifiersOrder'] as $idx => $rowQ): ?>
                            <span style="display: inline-block; padding: 5px 12px; background: rgba(118, 75, 162, 0.2); border-radius: 5px; margin-right: 5px; margin-bottom: 5px; font-size: 13px; color: #fff;">
                                <?= $idx + 1 ?>. <?= htmlspecialchars($rowQ) ?>
                            </span>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <em style="color: #999;">Ordine automatico</em>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px;"><strong>Campi Catalogo Stampato:</strong></td>
                <td style="padding: 12px;">
                    <?php if (!empty($variantConfig['printCatalogFields'])): ?>
                        <?php foreach ($variantConfig['printCatalogFields'] as $field): ?>
                            <span style="display: inline-block; padding: 5px 12px; background: rgba(118, 75, 162, 0.2); border-radius: 5px; margin-right: 8px; margin-bottom: 5px; font-size: 13px; color: #fff;">
                                📋 <?= htmlspecialchars($field) ?>
                            </span>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <em style="color: #999;">Nessun campo configurato</em>
                    <?php endif; ?>
                </td>
            </tr>
        </table>

        <?php if ($variantConfig['enabled']): ?>
        <div style="margin-top: 20px; padding: 15px; background: rgba(102, 126, 234, 0.1); border-radius: 8px;">
            <p style="margin: 0; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">🧪</span>
                <span>Vuoi testare come apparirà un prodotto con varianti? Usa la pagina
                    <a href="preview.php" style="color: #667eea; font-weight: bold; text-decoration: none;">Preview</a>
                </span>
            </p>
        </div>
        <?php endif; ?>
    </div>
</div>

<style>
.header-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30px;
    flex-wrap: wrap;
    gap: 20px;
}

.header-section h1 {
    font-size: 32px;
    margin-bottom: 10px;
}

.subtitle {
    font-size: 16px;
    color: #a0a0b8;
    margin-top: 5px;
}

.info-box {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 25px;
    border-radius: 12px;
    margin-bottom: 30px;
}

.info-box h3 {
    margin-top: 0;
    color: white;
}

.info-box ol {
    margin: 15px 0 0 20px;
    line-height: 1.8;
}

.info-box code {
    background: rgba(255,255,255,0.2);
    padding: 3px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
}

select option {
    background: #2a2a3e;
    color: #fff;
}

select optgroup {
    background: #1a1a2e;
    color: #667eea;
    font-weight: bold;
}

.row-order-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 15px;
    background: rgba(102, 126, 234, 0.15);
    border-radius: 8px;
    margin-bottom: 8px;
    border: 1px solid rgba(102, 126, 234, 0.3);
}

.row-order-item .item-name {
    flex: 1;
    font-weight: 600;
    color: #fff;
}

.row-order-item .item-controls {
    display: flex;
    gap: 5px;
}

.row-order-item button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    color: #fff;
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.row-order-item button:hover:not(:disabled) {
    background: rgba(102, 126, 234, 0.3);
}

.row-order-item button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}
</style>

<script>
// Configurazione PHP passata a JavaScript
const variantConfig = <?= json_encode($variantConfig) ?>;
const availableAttributes = <?= json_encode($availableAttributes) ?>;

// Stato corrente
let rowQualifiers = [];

function initializeRowOrder() {
    updateRowQualifiers();
    renderRowOrder();

    // Listener per cambio qualificatori selezionati
    document.querySelectorAll('input[name="qualifiers[]"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateRowQualifiers();
            renderRowOrder();
        });
    });

    // Listener per cambio colonna
    document.getElementById('column_qualifier').addEventListener('change', () => {
        updateRowQualifiers();
        renderRowOrder();
    });
}

function updateRowQualifiers() {
    const selectedQualifiers = Array.from(document.querySelectorAll('input[name="qualifiers[]"]:checked'))
        .map(cb => cb.value);

    const columnQualifier = document.getElementById('column_qualifier').value;

    // Filtra: solo qualificatori testuali (non booleani) che non sono il columnQualifier
    const textQualifiers = selectedQualifiers.filter(q => {
        const attr = availableAttributes.find(a => a.name === q);
        return attr && !attr.isBoolean && q !== columnQualifier;
    });

    // Mantieni l'ordine esistente se possibile
    const existingOrder = variantConfig.rowQualifiersOrder || [];

    // Prima aggiungi quelli già ordinati che sono ancora validi
    rowQualifiers = existingOrder.filter(q => textQualifiers.includes(q));

    // Poi aggiungi i nuovi che non erano nell'ordine precedente
    textQualifiers.forEach(q => {
        if (!rowQualifiers.includes(q)) {
            rowQualifiers.push(q);
        }
    });
}

function renderRowOrder() {
    const container = document.getElementById('row-order-container');

    if (rowQualifiers.length === 0) {
        container.innerHTML = '<p style="color: #a0a0b8; margin: 0; text-align: center;">Nessun qualificatore disponibile per le righe. Seleziona almeno 2 qualificatori testuali.</p>';
        document.getElementById('row_order').value = '';
        return;
    }

    container.innerHTML = '';

    rowQualifiers.forEach((qualifier, index) => {
        const item = document.createElement('div');
        item.className = 'row-order-item';
        item.innerHTML = `
            <span class="item-name">📝 ${qualifier}</span>
            <div class="item-controls">
                <button type="button" onclick="moveUp(${index})" ${index === 0 ? 'disabled' : ''}>▲</button>
                <button type="button" onclick="moveDown(${index})" ${index === rowQualifiers.length - 1 ? 'disabled' : ''}>▼</button>
            </div>
        `;
        container.appendChild(item);
    });

    // Aggiorna il campo hidden
    document.getElementById('row_order').value = rowQualifiers.join(',');
}

function moveUp(index) {
    if (index === 0) return;
    [rowQualifiers[index], rowQualifiers[index - 1]] = [rowQualifiers[index - 1], rowQualifiers[index]];
    renderRowOrder();
}

function moveDown(index) {
    if (index === rowQualifiers.length - 1) return;
    [rowQualifiers[index], rowQualifiers[index + 1]] = [rowQualifiers[index + 1], rowQualifiers[index]];
    renderRowOrder();
}

// Inizializza al caricamento della pagina
document.addEventListener('DOMContentLoaded', initializeRowOrder);
</script>

<?php include '../includes/footer.php'; ?>
