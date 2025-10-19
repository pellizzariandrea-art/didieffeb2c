<?php
require_once '../config.php';
require_once '../includes/functions.php';

$message = '';
$messageType = '';

// Carica configurazioni esistenti
$ecommerceConfig = loadEcommerceConfig();
if (!$ecommerceConfig) {
    $ecommerceConfig = [
        'filters' => [],
        'categories' => []
    ];
}

// Carica mapping per ottenere gli attributi disponibili
$mappingConfig = loadMappingConfig();
$availableAttributes = [];

// Aggiungi campo base "prezzo" come filtrabile
$availableAttributes[] = [
    'field' => 'prezzo',
    'sourceColumn' => 'prezzo (campo base)',
    'type' => 'numeric'
];

if ($mappingConfig) {
    foreach ($mappingConfig as $mapping) {
        // Solo attributi (non campi base come codice, nome, etc.)
        if (!empty($mapping['isAttribute']) && !empty($mapping['attributeName'])) {
            $availableAttributes[] = [
                'field' => $mapping['attributeName'],
                'sourceColumn' => $mapping['dbColumn'],
                'type' => !empty($mapping['isBoolean']) ? 'boolean' : 'text'
            ];
        }
    }
}

// Gestisci upload immagine categoria
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'upload_category_image') {
    header('Content-Type: application/json');

    try {
        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'error' => 'Errore durante upload file']);
            exit;
        }

        $file = $_FILES['image'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!in_array($file['type'], $allowedTypes)) {
            echo json_encode(['success' => false, 'error' => 'Tipo file non supportato']);
            exit;
        }

        // Crea cartella se non esiste
        $uploadDir = DATA_PATH . '/category_icon';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Mantieni nome file originale (sanitizzato)
        $originalName = pathinfo($file['name'], PATHINFO_FILENAME);
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        // Rimuovi caratteri speciali e spazi
        $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $originalName);
        $filename = $safeName . '.' . $extension;
        $targetPath = $uploadDir . '/' . $filename;

        // Sposta file
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $url = 'https://shop.didieffeb2b.com/admin/data/category_icon/' . $filename;
            echo json_encode(['success' => true, 'url' => $url, 'filename' => $filename]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Impossibile salvare il file']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// Salva configurazione
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $config = [
            'filters' => [],
            'categories' => []
        ];

        // Processa i filtri
        if (!empty($_POST['filters'])) {
            foreach ($_POST['filters'] as $field => $filter) {
                if (!empty($filter['enabled'])) {
                    $config['filters'][] = [
                        'field' => $field,
                        'enabled' => true,
                        'type' => $filter['type'] ?? 'select',
                        'label' => $filter['label'] ?? $field,
                        'order' => (int)($filter['order'] ?? 99)
                    ];
                }
            }
        }

        // Processa le categorie
        if (!empty($_POST['categories'])) {
            foreach ($_POST['categories'] as $field => $category) {
                if (!empty($category['enabled'])) {
                    $config['categories'][] = [
                        'field' => $field,
                        'enabled' => true,
                        'label' => $category['label'] ?? $field,
                        'icon' => $category['icon'] ?? '📦',
                        'image' => $category['image'] ?? '', // NUOVO: Campo immagine
                        'color' => $category['color'] ?? '#667eea',
                        'description' => $category['description'] ?? ''
                    ];
                }
            }
        }

        if (saveEcommerceConfig($config)) {
            $message = 'Configurazione e-commerce salvata con successo!';
            $messageType = 'success';
            $ecommerceConfig = $config;
        } else {
            $message = 'Errore nel salvataggio della configurazione';
            $messageType = 'error';
        }
    } catch (Exception $e) {
        $message = 'Errore: ' . $e->getMessage();
        $messageType = 'error';
    }
}

// Crea array associativo per accesso rapido alla configurazione esistente
$existingFilters = [];
foreach ($ecommerceConfig['filters'] ?? [] as $filter) {
    $existingFilters[$filter['field']] = $filter;
}

$existingCategories = [];
foreach ($ecommerceConfig['categories'] ?? [] as $category) {
    $existingCategories[$category['field']] = $category;
}

// Carica valori reali dagli attributi per la preview
$previewData = [];
if (!empty($ecommerceConfig['filters']) || !empty($ecommerceConfig['categories'])) {
    try {
        $dbConfig = loadDBConfig();
        $pdo = connectDB($dbConfig);

        // Fetch alcuni prodotti per preview (max 100)
        $rows = fetchProducts($dbConfig, 100);
        $products = [];

        if ($mappingConfig) {
            foreach ($rows as $row) {
                $products[] = transformRow($row, $mappingConfig);
            }
        }

        // Estrai valori unici per ogni filtro configurato
        foreach ($ecommerceConfig['filters'] ?? [] as $filter) {
            $field = $filter['field'];
            $values = [];

            if ($field === 'prezzo') {
                // Per il prezzo, calcola min/max
                $prices = array_column($products, 'prezzo');
                if (!empty($prices)) {
                    $previewData[$field] = [
                        'type' => 'range',
                        'min' => min($prices),
                        'max' => max($prices)
                    ];
                }
            } else {
                // Per gli attributi, estrai valori unici
                foreach ($products as $product) {
                    if (isset($product['attributi'][$field])) {
                        $val = $product['attributi'][$field];
                        if ($val !== null && $val !== '' && !in_array($val, $values)) {
                            $values[] = $val;
                        }
                    }
                }

                if (!empty($values)) {
                    // Limita a max 5 valori per la preview
                    $values = array_slice($values, 0, 5);
                    $previewData[$field] = [
                        'type' => 'options',
                        'values' => $values
                    ];
                }
            }
        }

        // Calcola conteggi per categorie booleane
        foreach ($ecommerceConfig['categories'] ?? [] as $category) {
            $field = $category['field'];
            $count = 0;

            foreach ($products as $product) {
                if (isset($product['attributi'][$field])) {
                    $val = $product['attributi'][$field];
                    if ($val === true || $val === 'true' || $val === 1 || $val === '1') {
                        $count++;
                    }
                }
            }

            $previewData[$field] = [
                'type' => 'category',
                'count' => $count
            ];
        }
    } catch (Exception $e) {
        // Ignora errori silently
    }
}

include '../includes/header.php';
?>

<style>
/* Fix per dropdown select - rendi visibili le opzioni */
select option {
    background-color: #2a2a3e !important;
    color: #ffffff !important;
    padding: 8px !important;
}

select option:hover,
select option:focus,
select option:checked {
    background-color: #667eea !important;
    color: #ffffff !important;
}

/* Fix per Safari/Chrome */
select {
    appearance: menulist !important;
    -webkit-appearance: menulist !important;
    -moz-appearance: menulist !important;
}
</style>

<div class="card">
    <h2>🛒 Configurazione E-Commerce</h2>
    <p style="color: #a0a0b8; margin-bottom: 20px;">
        Configura quali attributi mappati devono apparire come filtri sidebar e categorie homepage nell'e-commerce.
        La configurazione verrà inclusa nella sezione <code>_meta</code> del JSON esportato.
    </p>

    <?php if ($message): ?>
        <div class="alert alert-<?= $messageType ?>">
            <?= htmlspecialchars($message) ?>
        </div>
    <?php endif; ?>

    <?php if (empty($availableAttributes)): ?>
        <div class="alert alert-warning">
            ⚠️ Nessun attributo mappato trovato. Vai prima alla pagina <a href="mapping.php" style="color: #ff9800; text-decoration: underline;">Mapping</a> per mappare gli attributi del database.
        </div>
    <?php else: ?>

    <form method="POST" class="form">

        <!-- SEZIONE FILTRI SIDEBAR -->
        <div style="margin-bottom: 50px;">
            <h3 style="color: #667eea; display: flex; align-items: center; gap: 10px;">
                🔍 Filtri Sidebar
                <span style="font-size: 14px; font-weight: normal; color: #a0a0b8;">
                    (Tutti gli attributi disponibili)
                </span>
            </h3>
            <p style="color: #a0a0b8; margin-bottom: 20px;">
                Seleziona quali attributi devono apparire come filtri nella sidebar dell'e-commerce.
            </p>

            <div style="margin-bottom: 20px;">
                <?php foreach ($availableAttributes as $attr): ?>
                    <?php
                        $field = $attr['field'];
                        $isEnabled = isset($existingFilters[$field]) && $existingFilters[$field]['enabled'];
                        $filterType = $existingFilters[$field]['type'] ?? 'select';
                        $filterLabel = $existingFilters[$field]['label'] ?? $field;
                        $filterOrder = $existingFilters[$field]['order'] ?? 99;
                    ?>
                    <div style="background: rgba(102, 126, 234, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 15px;">
                        <div style="display: grid; grid-template-columns: 40px 2fr 1fr 1fr 100px; gap: 15px; align-items: center;">
                            <!-- Checkbox Abilita -->
                            <div>
                                <input type="checkbox"
                                       name="filters[<?= htmlspecialchars($field) ?>][enabled]"
                                       value="1"
                                       <?= $isEnabled ? 'checked' : '' ?>
                                       style="width: 20px; height: 20px; cursor: pointer;"
                                       onchange="toggleFilterRow(this)">
                            </div>

                            <!-- Campo Attributo -->
                            <div>
                                <div style="font-weight: 600; color: #fff; font-size: 16px;">
                                    <?= htmlspecialchars($field) ?>
                                </div>
                                <div style="font-size: 12px; color: #a0a0b8; margin-top: 3px;">
                                    Colonna: <code><?= htmlspecialchars($attr['sourceColumn']) ?></code>
                                    • Tipo: <?= htmlspecialchars($attr['type']) ?>
                                </div>
                            </div>

                            <!-- Tipo Filtro -->
                            <div class="form-group" style="margin-bottom: 0;">
                                <label style="font-size: 12px;">Tipo Filtro</label>
                                <select name="filters[<?= htmlspecialchars($field) ?>][type]"
                                        style="padding: 8px; font-size: 14px;"
                                        <?= !$isEnabled ? 'disabled' : '' ?>>
                                    <option value="select" <?= $filterType === 'select' ? 'selected' : '' ?>>Select (Dropdown)</option>
                                    <option value="checkbox" <?= $filterType === 'checkbox' ? 'selected' : '' ?>>Checkbox (Multi-selezione)</option>
                                    <option value="tags" <?= $filterType === 'tags' ? 'selected' : '' ?>>Tags (Chip)</option>
                                    <option value="range" <?= $filterType === 'range' ? 'selected' : '' ?>>Range (Min-Max)</option>
                                </select>
                            </div>

                            <!-- Label Personalizzata -->
                            <div class="form-group" style="margin-bottom: 0;">
                                <label style="font-size: 12px;">Label</label>
                                <input type="text"
                                       name="filters[<?= htmlspecialchars($field) ?>][label]"
                                       value="<?= htmlspecialchars($filterLabel) ?>"
                                       placeholder="<?= htmlspecialchars($field) ?>"
                                       style="padding: 8px; font-size: 14px;"
                                       <?= !$isEnabled ? 'disabled' : '' ?>>
                            </div>

                            <!-- Ordine -->
                            <div class="form-group" style="margin-bottom: 0;">
                                <label style="font-size: 12px;">Ordine</label>
                                <input type="number"
                                       name="filters[<?= htmlspecialchars($field) ?>][order]"
                                       value="<?= htmlspecialchars($filterOrder) ?>"
                                       min="1"
                                       max="999"
                                       style="padding: 8px; font-size: 14px;"
                                       <?= !$isEnabled ? 'disabled' : '' ?>>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- SEZIONE CATEGORIE HOMEPAGE -->
        <div style="margin-bottom: 50px;">
            <h3 style="color: #764ba2; display: flex; align-items: center; gap: 10px;">
                🏠 Categorie Homepage
                <span style="font-size: 14px; font-weight: normal; color: #a0a0b8;">
                    (Solo attributi booleani S/N)
                </span>
            </h3>
            <p style="color: #a0a0b8; margin-bottom: 20px;">
                Seleziona quali attributi booleani devono apparire come pulsanti categoria nella homepage.
                Questi diventeranno i "macroragruppatori" con icona, colore e descrizione.
            </p>

            <?php
            $booleanAttributes = array_filter($availableAttributes, function($attr) {
                return $attr['type'] === 'boolean';
            });
            ?>

            <?php if (empty($booleanAttributes)): ?>
                <div class="alert alert-warning">
                    ℹ️ Nessun attributo booleano trovato. Nel mapping, assicurati di impostare il tipo dati come "boolean" per gli attributi S/N.
                </div>
            <?php else: ?>
                <div style="margin-bottom: 20px;">
                    <?php foreach ($booleanAttributes as $attr): ?>
                        <?php
                            $field = $attr['field'];
                            $isEnabled = isset($existingCategories[$field]) && $existingCategories[$field]['enabled'];
                            $catLabel = $existingCategories[$field]['label'] ?? $field;
                            $catIcon = $existingCategories[$field]['icon'] ?? '📦';
                            $catImage = $existingCategories[$field]['image'] ?? ''; // NUOVO
                            $catColor = $existingCategories[$field]['color'] ?? '#667eea';
                            $catDescription = $existingCategories[$field]['description'] ?? '';
                        ?>
                        <div style="background: rgba(118, 75, 162, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 15px;">
                            <!-- Prima riga: Checkbox, Nome, Label, Icona, Colore -->
                            <div style="display: grid; grid-template-columns: 40px 2fr 1fr 80px 120px; gap: 15px; align-items: center; margin-bottom: 15px;">
                                <!-- Checkbox Abilita -->
                                <div>
                                    <input type="checkbox"
                                           name="categories[<?= htmlspecialchars($field) ?>][enabled]"
                                           value="1"
                                           <?= $isEnabled ? 'checked' : '' ?>
                                           style="width: 20px; height: 20px; cursor: pointer;"
                                           onchange="toggleCategoryRow(this)">
                                </div>

                                <!-- Campo Attributo -->
                                <div>
                                    <div style="font-weight: 600; color: #fff; font-size: 16px;">
                                        <?= htmlspecialchars($field) ?>
                                    </div>
                                    <div style="font-size: 12px; color: #a0a0b8; margin-top: 3px;">
                                        Colonna: <code><?= htmlspecialchars($attr['sourceColumn']) ?></code>
                                    </div>
                                </div>

                                <!-- Label -->
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label style="font-size: 12px;">Label</label>
                                    <input type="text"
                                           name="categories[<?= htmlspecialchars($field) ?>][label]"
                                           value="<?= htmlspecialchars($catLabel) ?>"
                                           placeholder="<?= htmlspecialchars($field) ?>"
                                           style="padding: 8px; font-size: 14px;"
                                           <?= !$isEnabled ? 'disabled' : '' ?>>
                                </div>

                                <!-- Icona -->
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label style="font-size: 12px;">Icona</label>
                                    <input type="text"
                                           name="categories[<?= htmlspecialchars($field) ?>][icon]"
                                           value="<?= htmlspecialchars($catIcon) ?>"
                                           placeholder="📦"
                                           style="padding: 8px; font-size: 24px; text-align: center;"
                                           <?= !$isEnabled ? 'disabled' : '' ?>>
                                </div>

                                <!-- Colore -->
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label style="font-size: 12px;">Colore</label>
                                    <input type="color"
                                           name="categories[<?= htmlspecialchars($field) ?>][color]"
                                           value="<?= htmlspecialchars($catColor) ?>"
                                           style="padding: 4px; height: 40px; cursor: pointer;"
                                           <?= !$isEnabled ? 'disabled' : '' ?>>
                                </div>
                            </div>

                            <!-- Seconda riga: URL Immagine e Descrizione -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <!-- URL Immagine -->
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label style="font-size: 12px;">🖼️ Immagine Categoria (opzionale)</label>

                                    <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 8px;">
                                        <!-- Grid immagini disponibili -->
                                        <div style="flex: 1; max-height: 200px; overflow-y: auto; border: 2px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px;">
                                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px;">
                                                <?php
                                                $iconPath = DATA_PATH . '/category_icon';
                                                $iconUrl = 'https://shop.didieffeb2b.com/admin/data/category_icon';
                                                if (is_dir($iconPath)) {
                                                    $images = glob($iconPath . '/*.{jpg,jpeg,png,gif,JPG,JPEG,PNG,GIF}', GLOB_BRACE);
                                                    foreach ($images as $imagePath) {
                                                        $filename = basename($imagePath);
                                                        $fullUrl = $iconUrl . '/' . $filename;
                                                        $isSelected = ($catImage === $fullUrl);
                                                        $borderStyle = $isSelected ? 'border: 3px solid #667eea;' : 'border: 2px solid rgba(255,255,255,0.2);';
                                                        ?>
                                                        <div onclick="selectCategoryImage('<?= htmlspecialchars($fullUrl) ?>', '<?= htmlspecialchars($field) ?>', this)"
                                                             style="cursor: pointer; position: relative; <?= $isSelected ? 'opacity: 1;' : '' ?>">
                                                            <img src="<?= htmlspecialchars($fullUrl) ?>"
                                                                 style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; <?= $borderStyle ?> transition: all 0.2s;">
                                                            <?php if ($isSelected): ?>
                                                                <div style="position: absolute; top: -5px; right: -5px; background: #667eea; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">✓</div>
                                                            <?php endif; ?>
                                                            <div style="font-size: 10px; color: #a0a0b8; margin-top: 4px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                                                 title="<?= htmlspecialchars($filename) ?>">
                                                                <?= htmlspecialchars(substr($filename, 0, 15)) ?><?= strlen($filename) > 15 ? '...' : '' ?>
                                                            </div>
                                                        </div>
                                                        <?php
                                                    }
                                                }
                                                ?>
                                            </div>
                                        </div>

                                        <!-- Upload button -->
                                        <button type="button"
                                                onclick="document.getElementById('upload-<?= htmlspecialchars($field) ?>').click()"
                                                style="padding: 8px 16px; background: rgba(102, 126, 234, 0.3); border: 2px solid #667eea; border-radius: 8px; color: #fff; cursor: pointer; white-space: nowrap;"
                                                <?= !$isEnabled ? 'disabled' : '' ?>>
                                            📤 Upload
                                        </button>
                                        <input type="file"
                                               id="upload-<?= htmlspecialchars($field) ?>"
                                               accept="image/*"
                                               style="display: none;"
                                               onchange="uploadCategoryImage(this, '<?= htmlspecialchars($field) ?>')"
                                               <?= !$isEnabled ? 'disabled' : '' ?>>
                                    </div>

                                    <!-- Campo hidden per URL finale -->
                                    <input type="hidden"
                                           id="image-url-<?= htmlspecialchars($field) ?>"
                                           name="categories[<?= htmlspecialchars($field) ?>][image]"
                                           value="<?= htmlspecialchars($catImage) ?>">

                                    <!-- Anteprima immagine -->
                                    <div id="preview-<?= htmlspecialchars($field) ?>" style="margin-top: 8px;">
                                        <?php if ($catImage): ?>
                                            <img src="<?= htmlspecialchars($catImage) ?>"
                                                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; border: 3px solid #667eea;">
                                        <?php endif; ?>
                                    </div>

                                    <small style="color: #a0a0b8; font-size: 11px; display: block; margin-top: 4px;">
                                        Immagine circolare mostrata al posto dell'icona
                                    </small>
                                </div>

                                <!-- Descrizione -->
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label style="font-size: 12px;">Descrizione</label>
                                    <input type="text"
                                           name="categories[<?= htmlspecialchars($field) ?>][description]"
                                           value="<?= htmlspecialchars($catDescription) ?>"
                                           placeholder="Breve descrizione..."
                                           style="padding: 8px; font-size: 14px;"
                                           <?= !$isEnabled ? 'disabled' : '' ?>>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>

        <!-- Pulsante Salva -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
            <button type="submit" class="btn">💾 Salva Configurazione E-Commerce</button>
        </div>
    </form>

    <?php endif; ?>

    <!-- Info Box - Come Funziona -->
    <div style="margin-top: 40px; padding: 20px; background: rgba(102, 126, 234, 0.1); border-radius: 10px; border-left: 4px solid #667eea;">
        <h3 style="color: #667eea; margin-top: 0;">💡 Come Funziona</h3>
        <ul style="color: #a0a0b8; line-height: 1.8; margin-left: 20px;">
            <li>Prima mappa tutti gli attributi nella pagina <strong>Mapping</strong></li>
            <li>Qui selezioni quali attributi diventano <strong>filtri</strong> e quali <strong>categorie</strong></li>
            <li>I filtri appariranno nella sidebar dell'e-commerce per filtrare i prodotti</li>
            <li>Le categorie appariranno come pulsanti nella homepage per accesso rapido</li>
            <li>La configurazione viene salvata nella sezione <code>_meta</code> del JSON esportato</li>
            <li>L'e-commerce Next.js legge <code>_meta</code> e genera automaticamente UI e filtri</li>
        </ul>
    </div>

    <!-- Esempio JSON _meta -->
    <div style="margin-top: 20px; padding: 20px; background: rgba(118, 75, 162, 0.1); border-radius: 10px; border-left: 4px solid #764ba2;">
        <h3 style="color: #764ba2; margin-top: 0;">📄 Esempio JSON con _meta</h3>
        <p style="color: #a0a0b8; margin-bottom: 15px;">
            Quando esporti i prodotti, il JSON includerà una sezione <code>_meta</code> così strutturata:
        </p>
        <pre style="font-size: 12px;">{
  "_meta": {
    "filters": [
      {
        "field": "Materiale",
        "type": "select",
        "label": "Materiale",
        "order": 1,
        "options": ["Ottone", "Ferro", "Acciaio"]
      },
      {
        "field": "prezzo",
        "type": "range",
        "label": "Fascia di Prezzo",
        "order": 2,
        "min": 10.00,
        "max": 250.00
      }
    ],
    "categories": [
      {
        "field": "Per Esterno",
        "label": "Prodotti per Esterno",
        "icon": "🏡",
        "color": "#4caf50",
        "description": "Ideali per uso outdoor",
        "count": 245
      }
    ]
  },
  "prodotti": [ ... ]
}</pre>
    </div>

    <!-- Preview E-Commerce -->
    <?php if (!empty($ecommerceConfig['filters']) || !empty($ecommerceConfig['categories'])): ?>
    <div style="margin-top: 30px; padding: 20px; background: rgba(76, 175, 80, 0.1); border-radius: 10px; border-left: 4px solid #4caf50;">
        <h3 style="color: #4caf50; margin-top: 0;">🎨 Preview E-Commerce</h3>
        <p style="color: #a0a0b8; margin-bottom: 20px;">
            Anteprima di come appariranno i filtri e le categorie nel tuo e-commerce Next.js
        </p>

        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px; margin-top: 20px;">

            <!-- SIDEBAR FILTRI -->
            <?php if (!empty($ecommerceConfig['filters'])): ?>
            <div style="background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <h4 style="color: #667eea; margin-bottom: 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                    🔍 Filtri Sidebar
                </h4>

                <?php foreach ($ecommerceConfig['filters'] as $filter): ?>
                <?php
                    $field = $filter['field'];
                    $hasRealData = isset($previewData[$field]);
                    $realData = $previewData[$field] ?? null;
                ?>
                <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <div style="font-weight: 600; color: #fff; margin-bottom: 10px; font-size: 13px;">
                        <?= htmlspecialchars($filter['label']) ?>
                    </div>

                    <?php if ($filter['type'] === 'checkbox'): ?>
                        <!-- Checkbox Filter -->
                        <?php if ($hasRealData && $realData['type'] === 'options'): ?>
                            <?php foreach ($realData['values'] as $value): ?>
                            <label style="display: flex; align-items: center; gap: 8px; padding: 6px 0; cursor: pointer; color: #a0a0b8; font-size: 13px;">
                                <input type="checkbox" style="width: 16px; height: 16px;">
                                <span><?= is_bool($value) ? ($value ? 'Sì' : 'No') : htmlspecialchars($value) ?></span>
                            </label>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <label style="display: flex; align-items: center; gap: 8px; padding: 6px 0; cursor: pointer; color: #a0a0b8; font-size: 13px;">
                                <input type="checkbox" style="width: 16px; height: 16px;">
                                <span>Opzione 1</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; padding: 6px 0; cursor: pointer; color: #a0a0b8; font-size: 13px;">
                                <input type="checkbox" style="width: 16px; height: 16px;">
                                <span>Opzione 2</span>
                            </label>
                        <?php endif; ?>

                    <?php elseif ($filter['type'] === 'select'): ?>
                        <!-- Select Dropdown -->
                        <select style="width: 100%; padding: 8px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 6px; color: #fff; font-size: 13px;">
                            <option>Tutte le opzioni</option>
                            <?php if ($hasRealData && $realData['type'] === 'options'): ?>
                                <?php foreach ($realData['values'] as $value): ?>
                                <option><?= is_bool($value) ? ($value ? 'Sì' : 'No') : htmlspecialchars($value) ?></option>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <option>Opzione 1</option>
                                <option>Opzione 2</option>
                            <?php endif; ?>
                        </select>

                    <?php elseif ($filter['type'] === 'range'): ?>
                        <!-- Range Slider -->
                        <div style="padding: 10px 0;">
                            <input type="range" style="width: 100%; accent-color: #667eea;">
                            <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #a0a0b8;">
                                <?php if ($hasRealData && $realData['type'] === 'range'): ?>
                                    <span>€<?= number_format($realData['min'], 2, ',', '.') ?></span>
                                    <span>€<?= number_format($realData['max'], 2, ',', '.') ?></span>
                                <?php else: ?>
                                    <span>€10</span>
                                    <span>€250</span>
                                <?php endif; ?>
                            </div>
                        </div>

                    <?php elseif ($filter['type'] === 'tags'): ?>
                        <!-- Tags/Chips -->
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                            <?php if ($hasRealData && $realData['type'] === 'options'): ?>
                                <?php foreach ($realData['values'] as $idx => $value): ?>
                                <span style="display: inline-block; padding: 6px 12px; background: <?= $idx === 0 ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)' ?>; border: 1px solid <?= $idx === 0 ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 255, 255, 0.1)' ?>; border-radius: 20px; font-size: 12px; color: <?= $idx === 0 ? '#667eea' : '#a0a0b8' ?>; cursor: pointer;">
                                    <?= is_bool($value) ? ($value ? 'Sì' : 'No') : htmlspecialchars($value) ?>
                                </span>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <span style="display: inline-block; padding: 6px 12px; background: rgba(102, 126, 234, 0.2); border: 1px solid rgba(102, 126, 234, 0.4); border-radius: 20px; font-size: 12px; color: #667eea; cursor: pointer;">
                                    Tag 1
                                </span>
                                <span style="display: inline-block; padding: 6px 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; font-size: 12px; color: #a0a0b8; cursor: pointer;">
                                    Tag 2
                                </span>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>

            <!-- CATEGORIE HOMEPAGE -->
            <div>
                <?php if (!empty($ecommerceConfig['categories'])): ?>
                <div style="background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1);">
                    <h4 style="color: #764ba2; margin-bottom: 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                        🏠 Categorie Homepage
                    </h4>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <?php foreach ($ecommerceConfig['categories'] as $category): ?>
                        <?php
                            $field = $category['field'];
                            $categoryData = $previewData[$field] ?? null;
                            $productCount = $categoryData && $categoryData['type'] === 'category' ? $categoryData['count'] : 0;
                        ?>
                        <div style="background: linear-gradient(135deg, <?= htmlspecialchars($category['color']) ?>22 0%, <?= htmlspecialchars($category['color']) ?>11 100%); border: 2px solid <?= htmlspecialchars($category['color']) ?>44; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden;">
                            <div style="font-size: 36px; margin-bottom: 10px;">
                                <?= htmlspecialchars($category['icon']) ?>
                            </div>
                            <div style="font-weight: 600; color: #fff; font-size: 16px; margin-bottom: 5px;">
                                <?= htmlspecialchars($category['label']) ?>
                            </div>
                            <?php if (!empty($category['description'])): ?>
                            <div style="font-size: 12px; color: #a0a0b8; margin-bottom: 10px;">
                                <?= htmlspecialchars($category['description']) ?>
                            </div>
                            <?php endif; ?>
                            <div style="display: inline-block; padding: 4px 10px; background: <?= htmlspecialchars($category['color']) ?>33; border-radius: 12px; font-size: 11px; color: <?= htmlspecialchars($category['color']) ?>; font-weight: 600;">
                                <?= $productCount ?> prodott<?= $productCount === 1 ? 'o' : 'i' ?>
                            </div>

                            <!-- Decorative circle -->
                            <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: <?= htmlspecialchars($category['color']) ?>22; border-radius: 50%;"></div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endif; ?>

                <!-- Summary -->
                <div style="margin-top: 20px; padding: 15px; background: rgba(255, 255, 255, 0.03); border-radius: 10px; border-left: 4px solid #4caf50;">
                    <div style="display: flex; justify-content: space-around; text-align: center;">
                        <div>
                            <div style="font-size: 28px; font-weight: bold; color: #667eea;">
                                <?= count($ecommerceConfig['filters'] ?? []) ?>
                            </div>
                            <div style="font-size: 12px; color: #a0a0b8; text-transform: uppercase; letter-spacing: 1px;">
                                Filtri Attivi
                            </div>
                        </div>
                        <div style="width: 1px; background: rgba(255, 255, 255, 0.1);"></div>
                        <div>
                            <div style="font-size: 28px; font-weight: bold; color: #764ba2;">
                                <?= count($ecommerceConfig['categories'] ?? []) ?>
                            </div>
                            <div style="font-size: 12px; color: #a0a0b8; text-transform: uppercase; letter-spacing: 1px;">
                                Categorie Attive
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
    <?php endif; ?>
</div>

<script>
// Abilita/disabilita campi quando checkbox viene toggleata
function toggleFilterRow(checkbox) {
    const row = checkbox.closest('div[style*="grid-template-columns"]');
    const inputs = row.querySelectorAll('select, input[type="text"], input[type="number"]');
    inputs.forEach(input => {
        input.disabled = !checkbox.checked;
    });
}

function toggleCategoryRow(checkbox) {
    const row = checkbox.closest('div[style*="grid-template-columns"]');
    const inputs = row.querySelectorAll('input[type="text"], input[type="color"]');
    inputs.forEach(input => {
        input.disabled = !checkbox.checked;
    });
}

// Seleziona immagine dalla grid
function selectCategoryImage(url, fieldName, element) {
    // Aggiorna campo hidden
    const hiddenInput = document.getElementById('image-url-' + fieldName);
    hiddenInput.value = url;

    // Rimuovi selezione precedente
    const parent = element.parentElement;
    parent.querySelectorAll('div[onclick]').forEach(div => {
        const img = div.querySelector('img');
        if (img) {
            img.style.border = '2px solid rgba(255,255,255,0.2)';
        }
        // Rimuovi checkmark
        const checkmark = div.querySelector('div[style*="position: absolute"]');
        if (checkmark) checkmark.remove();
    });

    // Aggiungi selezione corrente
    const img = element.querySelector('img');
    img.style.border = '3px solid #667eea';

    // Aggiungi checkmark
    const checkmark = document.createElement('div');
    checkmark.style = 'position: absolute; top: -5px; right: -5px; background: #667eea; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;';
    checkmark.textContent = '✓';
    element.appendChild(checkmark);

    // Aggiorna anteprima grande
    const previewDiv = document.getElementById('preview-' + fieldName);
    previewDiv.innerHTML = `<img src="${url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; border: 3px solid #667eea;">`;
}

// Upload immagine categoria
function uploadCategoryImage(input, fieldName) {
    const file = input.files[0];
    if (!file) return;

    // Valida tipo file
    if (!file.type.match('image.*')) {
        alert('Per favore seleziona un file immagine');
        return;
    }

    // Valida dimensione (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('L\'immagine è troppo grande. Max 2MB');
        return;
    }

    // Crea FormData
    const formData = new FormData();
    formData.append('image', file);
    formData.append('action', 'upload_category_image');

    // Mostra loading
    const previewDiv = document.getElementById('preview-' + fieldName);
    previewDiv.innerHTML = '<div style="color: #667eea;">⏳ Caricamento...</div>';

    // Upload via AJAX
    fetch(window.location.href, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Aggiorna campo hidden
            const hiddenInput = document.getElementById('image-url-' + fieldName);
            hiddenInput.value = data.url;

            // Aggiorna anteprima grande
            previewDiv.innerHTML = `<img src="${data.url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; border: 3px solid #667eea;">`;

            // Aggiungi alla grid
            const grid = input.closest('div').parentElement.querySelector('div[style*="grid-template-columns"]');
            if (grid) {
                const newThumbnail = document.createElement('div');
                newThumbnail.onclick = function() { selectCategoryImage(data.url, fieldName, this); };
                newThumbnail.style = 'cursor: pointer; position: relative;';
                newThumbnail.innerHTML = `
                    <img src="${data.url}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; border: 3px solid #667eea; transition: all 0.2s;">
                    <div style="position: absolute; top: -5px; right: -5px; background: #667eea; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">✓</div>
                    <div style="font-size: 10px; color: #a0a0b8; margin-top: 4px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${data.filename}">
                        ${data.filename.length > 15 ? data.filename.substring(0, 15) + '...' : data.filename}
                    </div>
                `;
                grid.appendChild(newThumbnail);

                // Deseleziona altre immagini
                grid.querySelectorAll('img').forEach(img => {
                    if (img.src !== data.url) {
                        img.style.border = '2px solid rgba(255,255,255,0.2)';
                    }
                });
            }
        } else {
            previewDiv.innerHTML = `<div style="color: #f44336;">❌ ${data.error}</div>`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        previewDiv.innerHTML = '<div style="color: #f44336;">❌ Errore durante upload</div>';
    });
}
</script>

<?php include '../includes/footer.php'; ?>
