<?php
require_once '../config.php';
require_once '../includes/functions.php';

$message = '';
$messageType = '';

// Carica configurazione esistente
$resourceConfig = loadResourceConfig();
if (!$resourceConfig) {
    $resourceConfig = [
        'enabled' => false,
        'baseUrl' => 'https://didieffeb2b.com/public_html/template/risorse',
        'categories' => []
    ];
}

// Categorie predefinite
$defaultCategories = [
    ['name' => 'Scheda Tecnica PDF', 'folder' => 'pdf', 'extensions' => ['pdf'], 'icon' => '📄'],
    ['name' => 'Disegno Tecnico DWG', 'folder' => 'dwg', 'extensions' => ['dwg', 'dxf'], 'icon' => '📐'],
    ['name' => 'Modello 3D', 'folder' => '3d', 'extensions' => ['step', 'stp', 'iges', 'igs'], 'icon' => '🔷'],
    ['name' => 'Immagini Alta Risoluzione', 'folder' => 'images_hq', 'extensions' => ['jpg', 'png', 'tiff'], 'icon' => '🖼️'],
    ['name' => 'Video Prodotto', 'folder' => 'video', 'extensions' => ['mp4', 'mov', 'avi'], 'icon' => '🎥'],
    ['name' => 'Certificazioni', 'folder' => 'certificati', 'extensions' => ['pdf'], 'icon' => '✅'],
    ['name' => 'Manuale Installazione', 'folder' => 'manuali', 'extensions' => ['pdf', 'doc', 'docx'], 'icon' => '📖'],
    ['name' => 'Catalogo Completo', 'folder' => 'cataloghi', 'extensions' => ['pdf'], 'icon' => '📚']
];

// Carica categorie predefinite
if (isset($_POST['load_defaults'])) {
    $resourceConfig['categories'] = $defaultCategories;
    $message = 'Categorie predefinite caricate! Clicca "Salva Configurazione" per confermare.';
    $messageType = 'success';
}

// Salva configurazione
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_POST['load_defaults'])) {
    try {
        $config = [
            'enabled' => isset($_POST['enabled']),
            'baseUrl' => trim($_POST['baseUrl'] ?? ''),
            'categories' => []
        ];

        // Processa le categorie
        if (!empty($_POST['categories'])) {
            foreach ($_POST['categories'] as $cat) {
                if (!empty($cat['name']) && !empty($cat['folder'])) {
                    $extensions = array_filter(array_map('trim', explode(',', $cat['extensions'] ?? '')));
                    $config['categories'][] = [
                        'name' => trim($cat['name']),
                        'folder' => trim($cat['folder']),
                        'extensions' => $extensions,
                        'icon' => trim($cat['icon'] ?? '📄')
                    ];
                }
            }
        }

        if (saveResourceConfig($config)) {
            $message = 'Configurazione risorse salvata con successo!';
            $messageType = 'success';
            $resourceConfig = $config;
        } else {
            $message = 'Errore nel salvataggio della configurazione';
            $messageType = 'error';
        }
    } catch (Exception $e) {
        $message = 'Errore: ' . $e->getMessage();
        $messageType = 'error';
    }
}

include '../includes/header.php';
?>

<div class="card">
    <h2>📦 Configurazione Risorse Scaricabili</h2>
    <p style="color: #a0a0b8; margin-bottom: 20px;">
        Configura le categorie di risorse (PDF, DWG, Video, etc.) scaricabili per ogni prodotto.
        Le risorse verranno cercate nelle cartelle specificate usando il codice prodotto come nome file.
    </p>

    <?php if ($message): ?>
        <div class="alert alert-<?= $messageType ?>">
            <?= htmlspecialchars($message) ?>
        </div>
    <?php endif; ?>

    <form method="POST" class="form">
        <!-- Attiva Sistema Risorse -->
        <div class="form-group">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" name="enabled" value="1" <?= $resourceConfig['enabled'] ? 'checked' : '' ?> style="width: auto; cursor: pointer;">
                <span style="font-weight: 600; color: #fff;">Attiva Sistema Risorse Scaricabili</span>
            </label>
            <small style="display: block; margin-top: 5px;">
                Abilita la scansione automatica delle risorse nelle cartelle configurate
            </small>
        </div>

        <!-- Base URL -->
        <div class="form-group">
            <label>Base URL Risorse</label>
            <input type="text" name="baseUrl" value="<?= htmlspecialchars($resourceConfig['baseUrl']) ?>" placeholder="https://example.com/risorse" required>
            <small>URL base dove si trovano le cartelle delle risorse (senza slash finale)</small>
        </div>

        <!-- Categorie Risorse -->
        <h3 style="margin-top: 40px; color: #667eea;">📁 Categorie Risorse</h3>
        <p style="color: #a0a0b8; margin-bottom: 20px;">
            Definisci le categorie di risorse disponibili. Per ogni categoria, specifica la cartella e le estensioni file supportate.
        </p>

        <div id="categories-container">
            <?php if (!empty($resourceConfig['categories'])): ?>
                <?php foreach ($resourceConfig['categories'] as $index => $category): ?>
                <div class="category-item" style="background: rgba(102, 126, 234, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 15px; position: relative;">
                    <button type="button" onclick="removeCategory(this)" style="position: absolute; top: 10px; right: 10px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px; line-height: 1;">×</button>

                    <div style="display: grid; grid-template-columns: 80px 1fr 1fr 1fr; gap: 15px; align-items: end;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Icona</label>
                            <input type="text" name="categories[<?= $index ?>][icon]" value="<?= htmlspecialchars($category['icon'] ?? '📄') ?>" placeholder="📄" style="text-align: center; font-size: 24px;">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Nome Categoria</label>
                            <input type="text" name="categories[<?= $index ?>][name]" value="<?= htmlspecialchars($category['name']) ?>" placeholder="es: PDF" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Nome Cartella</label>
                            <input type="text" name="categories[<?= $index ?>][folder]" value="<?= htmlspecialchars($category['folder']) ?>" placeholder="es: pdf" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Estensioni (separate da virgola)</label>
                            <input type="text" name="categories[<?= $index ?>][extensions]" value="<?= htmlspecialchars(implode(', ', $category['extensions'] ?? [])) ?>" placeholder="es: pdf, doc">
                        </div>
                    </div>
                    <small style="display: block; margin-top: 10px; color: #a0a0b8;">
                        Percorso file: <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;"><?= htmlspecialchars($resourceConfig['baseUrl']) ?>/<?= htmlspecialchars($category['folder']) ?>/{codice_prodotto}.{estensione}</code>
                    </small>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 30px;">
            <button type="button" onclick="addCategory()" class="btn btn-secondary">
                ➕ Aggiungi Categoria
            </button>
            <button type="submit" name="load_defaults" class="btn" style="background: rgba(102, 126, 234, 0.2);">
                ⚡ Carica Categorie Predefinite
            </button>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
            <button type="submit" class="btn">💾 Salva Configurazione</button>
        </div>
    </form>

    <!-- Categorie Predefinite Disponibili -->
    <div style="margin-top: 40px; padding: 20px; background: rgba(118, 75, 162, 0.1); border-radius: 10px; border-left: 4px solid #764ba2;">
        <h3 style="color: #764ba2; margin-top: 0;">⚡ Categorie Predefinite Disponibili</h3>
        <p style="color: #a0a0b8; margin-bottom: 15px;">
            Clicca il pulsante "Carica Categorie Predefinite" per caricare automaticamente queste categorie:
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-top: 15px;">
            <?php foreach ($defaultCategories as $cat): ?>
                <div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;"><?= htmlspecialchars($cat['icon']) ?></span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #fff; font-size: 13px;"><?= htmlspecialchars($cat['name']) ?></div>
                        <div style="font-size: 11px; color: #a0a0b8; font-family: monospace;">
                            <?= htmlspecialchars($cat['folder']) ?>/ (.<?= implode(', .', $cat['extensions']) ?>)
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Info Box -->
    <div style="margin-top: 20px; padding: 20px; background: rgba(102, 126, 234, 0.1); border-radius: 10px; border-left: 4px solid #667eea;">
        <h3 style="color: #667eea; margin-top: 0;">💡 Come Funziona</h3>
        <ul style="color: #a0a0b8; line-height: 1.8; margin-left: 20px;">
            <li>Le risorse vengono cercate automaticamente nelle cartelle configurate</li>
            <li>Il nome del file deve corrispondere al <strong>codice prodotto</strong> (es: <code>ABC123.pdf</code>)</li>
            <li>Puoi definire più estensioni per categoria (es: PDF supporta sia .pdf che .doc)</li>
            <li>Le risorse trovate vengono aggiunte automaticamente al JSON di export</li>
            <li>Nell'anteprima web e catalogo stampato appaiono come pulsanti download</li>
        </ul>
    </div>

    <!-- Stato Configurazione -->
    <?php if ($resourceConfig['enabled']): ?>
    <div style="margin-top: 30px; padding: 20px; background: rgba(76, 175, 80, 0.1); border-radius: 10px; border-left: 4px solid #4caf50;">
        <h3 style="color: #4caf50; margin-top: 0;">✅ Sistema Risorse Attivo</h3>
        <table style="width: 100%; margin-top: 15px;">
            <tr>
                <td style="padding: 8px; font-weight: bold;">Base URL:</td>
                <td style="padding: 8px; font-family: monospace;"><?= htmlspecialchars($resourceConfig['baseUrl']) ?></td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold;">Categorie Configurate:</td>
                <td style="padding: 8px;">
                    <?php if (!empty($resourceConfig['categories'])): ?>
                        <?php foreach ($resourceConfig['categories'] as $cat): ?>
                            <span style="display: inline-block; padding: 5px 12px; background: rgba(102, 126, 234, 0.2); border-radius: 5px; margin-right: 8px; margin-bottom: 5px;">
                                <?= htmlspecialchars($cat['icon']) ?> <?= htmlspecialchars($cat['name']) ?>
                                <span style="color: #a0a0b8; font-size: 11px;">(<?= implode(', ', $cat['extensions']) ?>)</span>
                            </span>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <em style="color: #999;">Nessuna categoria configurata</em>
                    <?php endif; ?>
                </td>
            </tr>
        </table>
    </div>
    <?php endif; ?>
</div>

<script>
let categoryIndex = <?= !empty($resourceConfig['categories']) ? count($resourceConfig['categories']) : 0 ?>;

function addCategory() {
    const container = document.getElementById('categories-container');
    const baseUrl = document.querySelector('input[name="baseUrl"]').value || 'https://example.com/risorse';

    const categoryHtml = `
        <div class="category-item" style="background: rgba(102, 126, 234, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 15px; position: relative;">
            <button type="button" onclick="removeCategory(this)" style="position: absolute; top: 10px; right: 10px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px; line-height: 1;">×</button>

            <div style="display: grid; grid-template-columns: 80px 1fr 1fr 1fr; gap: 15px; align-items: end;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Icona</label>
                    <input type="text" name="categories[${categoryIndex}][icon]" value="📄" placeholder="📄" style="text-align: center; font-size: 24px;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Nome Categoria</label>
                    <input type="text" name="categories[${categoryIndex}][name]" placeholder="es: PDF" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Nome Cartella</label>
                    <input type="text" name="categories[${categoryIndex}][folder]" placeholder="es: pdf" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Estensioni (separate da virgola)</label>
                    <input type="text" name="categories[${categoryIndex}][extensions]" placeholder="es: pdf, doc">
                </div>
            </div>
            <small style="display: block; margin-top: 10px; color: #a0a0b8;">
                Percorso file: <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">${baseUrl}/{cartella}/{codice_prodotto}.{estensione}</code>
            </small>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', categoryHtml);
    categoryIndex++;
}

function removeCategory(button) {
    if (confirm('Sei sicuro di voler rimuovere questa categoria?')) {
        button.closest('.category-item').remove();
    }
}
</script>

<?php include '../includes/footer.php'; ?>
