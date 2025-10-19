<?php
require_once '../config.php';
require_once '../includes/functions.php';

$dbConfig = loadDBConfig();
if (!$dbConfig) {
    header('Location: /admin/pages/connection.php');
    exit;
}

$columns = getTableColumns($dbConfig, $dbConfig['table']);
$savedMapping = loadMappingConfig();

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

    if (!empty($_POST['field_descrizione'])) {
        $mappings[] = [
            'dbColumn' => $_POST['field_descrizione'],
            'targetField' => 'descrizione',
            'isAttribute' => false,
            'transform' => $_POST['transform_descrizione'] ?? ''
        ];
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

                $mappings[] = $mapping;
            }
        }
    }

    saveMappingConfig($mappings);
    logActivity("Mapping salvato con " . count($mappings) . " campi");

    header('Location: /admin/pages/preview.php');
    exit;
}

include '../includes/header.php';
?>

<div class="card">
    <h2>Step 2: Mapping Campi</h2>
    <p>Mappa le colonne del database ai campi del JSON. Colonne disponibili nella tabella <strong><?php echo htmlspecialchars($dbConfig['table']); ?></strong>:</p>

    <form method="POST">
        <h3 style="margin-top: 30px; color: #667eea;">Campi Obbligatori</h3>

        <div class="mapping-row">
            <div>
                <label>Colonna DB → Codice Prodotto</label>
                <select name="field_codice" required>
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo htmlspecialchars($col['name']); ?>">
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
                    <option value="trim">Trim</option>
                    <option value="toUpperCase">MAIUSCOLO</option>
                </select>
            </div>
        </div>

        <div class="mapping-row">
            <div>
                <label>Colonna DB → Descrizione</label>
                <select name="field_descrizione" required>
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo htmlspecialchars($col['name']); ?>">
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
                    <option value="trim">Trim</option>
                </select>
            </div>
        </div>

        <div class="mapping-row">
            <div>
                <label>Colonna DB → Prezzo</label>
                <select name="field_prezzo" required>
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo htmlspecialchars($col['name']); ?>">
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
                <span class="badge badge-success">parseFloat</span>
            </div>
        </div>

        <div class="mapping-row">
            <div>
                <label>Colonna DB → Immagine (opzionale)</label>
                <select name="field_immagine">
                    <option value="">-- Seleziona --</option>
                    <?php foreach ($columns as $col): ?>
                        <option value="<?php echo htmlspecialchars($col['name']); ?>">
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
                    <option value="trim">Trim</option>
                </select>
            </div>
        </div>

        <h3 style="margin-top: 40px; color: #764ba2;">Attributi Dinamici</h3>
        <p style="color: #a0a0b8; margin-bottom: 20px;">Aggiungi tutti gli attributi che vuoi (serie, materiale, colore, dimensione, peso, ecc.)</p>

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

            // Mostra almeno 3 righe (o gli attributi salvati se esistono)
            $attrCount = max(3, count($savedAttributes));
            for ($i = 0; $i < $attrCount; $i++):
                $attr = $savedAttributes[$i] ?? null;
            ?>
            <div class="mapping-row attribute">
                <div>
                    <label>Colonna DB</label>
                    <select name="attr_column[]">
                        <option value="">-- Seleziona --</option>
                        <?php foreach ($columns as $col): ?>
                            <option value="<?php echo htmlspecialchars($col['name']); ?>"
                                <?php echo ($attr && $attr['dbColumn'] === $col['name']) ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($col['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div style="text-align: center; padding-top: 25px;">→</div>
                <div>
                    <label>Nome Attributo</label>
                    <input type="text" name="attr_name[]" placeholder="es: materiale"
                        value="<?php echo $attr ? htmlspecialchars($attr['attributeName']) : ''; ?>">
                </div>
                <div>
                    <label>Trasformazione</label>
                    <select name="attr_transform[]">
                        <option value="">Nessuna</option>
                        <option value="trim" <?php echo ($attr && ($attr['transform'] ?? '') === 'trim') ? 'selected' : ''; ?>>Trim</option>
                        <option value="parseFloat" <?php echo ($attr && ($attr['transform'] ?? '') === 'parseFloat') ? 'selected' : ''; ?>>Numero Decimale</option>
                        <option value="parseInt" <?php echo ($attr && ($attr['transform'] ?? '') === 'parseInt') ? 'selected' : ''; ?>>Numero Intero</option>
                    </select>
                </div>
                <div></div>
            </div>
            <?php endfor; ?>
        </div>

        <button type="button" onclick="aggiungiAttributo()" class="btn btn-secondary">
            + Aggiungi Attributo
        </button>

        <div style="margin-top: 30px;">
            <button type="submit" class="btn">Salva Mapping e Continua →</button>
        </div>
    </form>
</div>

<script>
function aggiungiAttributo() {
    const container = document.getElementById('attributi-container');
    const nuovaRiga = document.createElement('div');
    nuovaRiga.className = 'mapping-row attribute';
    nuovaRiga.innerHTML = `
        <div>
            <label>Colonna DB</label>
            <select name="attr_column[]">
                <option value="">-- Seleziona --</option>
                <?php foreach ($columns as $col): ?>
                    <option value="<?php echo htmlspecialchars($col['name']); ?>">
                        <?php echo htmlspecialchars($col['name']); ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>
        <div style="text-align: center; padding-top: 25px;">→</div>
        <div>
            <label>Nome Attributo</label>
            <input type="text" name="attr_name[]" placeholder="es: materiale">
        </div>
        <div>
            <label>Trasformazione</label>
            <select name="attr_transform[]">
                <option value="">Nessuna</option>
                <option value="trim">Trim</option>
                <option value="parseFloat">Numero Decimale</option>
                <option value="parseInt">Numero Intero</option>
            </select>
        </div>
        <div></div>
    `;
    container.appendChild(nuovaRiga);
}
</script>

<?php include '../includes/footer.php'; ?>
