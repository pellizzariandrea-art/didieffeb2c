<?php
// DEBUG VERSION - Configurazione immagini multiple
error_reporting(E_ALL);
ini_set('display_errors', 1);

// IMPORTANTE: Includere config.php PRIMA di qualsiasi output (session_start richiede questo)
require_once '../config.php';
require_once '../includes/functions.php';

try {
    $imageSettings = loadImageSettings();
} catch (Exception $e) {
    $imageSettings = ['enabled' => false, 'images_path' => '', 'public_base_url' => 'https://didieffeb2b.com/img_catalogo_norm/'];
}

$message = '';
$messageType = '';

// Salva impostazioni
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $settings = [
            'enabled' => isset($_POST['enabled']),
            'images_path' => trim($_POST['images_path'] ?? ''),
            'public_base_url' => trim($_POST['public_base_url'] ?? '')
        ];

        // Valida path se abilitato
        if ($settings['enabled']) {
            if (empty($settings['images_path'])) {
                throw new Exception('Il path delle immagini è obbligatorio se le immagini multiple sono abilitate.');
            }

            if (!is_dir($settings['images_path'])) {
                throw new Exception('Il path specificato non esiste o non è accessibile: ' . $settings['images_path']);
            }

            if (empty($settings['public_base_url'])) {
                throw new Exception('L\'URL pubblico base è obbligatorio.');
            }
        }

        saveImageSettings($settings);
        $imageSettings = $settings;
        $message = 'Impostazioni salvate con successo!';
        $messageType = 'success';

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
            <h1>🖼️ Immagini Multiple (DEBUG)</h1>
            <p class="subtitle">Configura la scansione automatica delle gallery immagini prodotto</p>
        </div>
        <a href="<?= ADMIN_URL ?>" class="btn btn-secondary">← Dashboard</a>
    </div>

    <!-- DEBUG INFO -->
    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0;">🐛 Debug Info</h3>
        <table style="width: 100%; font-size: 13px;">
            <tr>
                <td style="padding: 5px;"><strong>PHP Version:</strong></td>
                <td style="padding: 5px;"><?= phpversion() ?></td>
            </tr>
            <tr>
                <td style="padding: 5px;"><strong>DATA_PATH:</strong></td>
                <td style="padding: 5px; font-family: monospace;"><?= DATA_PATH ?></td>
            </tr>
            <tr>
                <td style="padding: 5px;"><strong>DATA_PATH exists:</strong></td>
                <td style="padding: 5px;"><?= is_dir(DATA_PATH) ? '✅ Yes' : '❌ No' ?></td>
            </tr>
            <tr>
                <td style="padding: 5px;"><strong>Settings file:</strong></td>
                <td style="padding: 5px; font-family: monospace;"><?= DATA_PATH . '/image-settings.json' ?></td>
            </tr>
            <tr>
                <td style="padding: 5px;"><strong>Settings file exists:</strong></td>
                <td style="padding: 5px;"><?= file_exists(DATA_PATH . '/image-settings.json') ? '✅ Yes' : '❌ No' ?></td>
            </tr>
            <tr>
                <td style="padding: 5px;"><strong>Current settings:</strong></td>
                <td style="padding: 5px; font-family: monospace;"><?= htmlspecialchars(json_encode($imageSettings)) ?></td>
            </tr>
        </table>
    </div>

    <?php if ($message): ?>
        <div class="alert alert-<?= $messageType ?>">
            <?= htmlspecialchars($message) ?>
        </div>
    <?php endif; ?>

    <!-- Form Configurazione -->
    <div class="card">
        <h2>⚙️ Configurazione</h2>
        <form method="POST" class="form">
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" name="enabled" <?= !empty($imageSettings['enabled']) ? 'checked' : '' ?>>
                    Abilita scansione immagini multiple
                </label>
                <small>Se disabilitato, verrà usata solo l'immagine principale dal database</small>
            </div>

            <div class="form-group">
                <label for="images_path">Path Assoluto Cartella Immagini</label>
                <input
                    type="text"
                    id="images_path"
                    name="images_path"
                    value="<?= htmlspecialchars($imageSettings['images_path'] ?? '') ?>"
                    placeholder="/home/customer/www/didieffeb2b.com/public_html/img_catalogo_norm"
                    class="form-control"
                    style="font-family: monospace;"
                >
                <small>
                    Path trovato: <code>/home/customer/www/didieffeb2b.com/public_html/img_catalogo_norm</code>
                </small>
            </div>

            <div class="form-group">
                <label for="public_base_url">URL Pubblico Base</label>
                <input
                    type="text"
                    id="public_base_url"
                    name="public_base_url"
                    value="<?= htmlspecialchars($imageSettings['public_base_url'] ?? 'https://didieffeb2b.com/img_catalogo_norm/') ?>"
                    placeholder="https://didieffeb2b.com/img_catalogo_norm/"
                    class="form-control"
                >
                <small>URL pubblico per accedere alle immagini</small>
            </div>

            <button type="submit" class="btn btn-primary">💾 Salva Impostazioni</button>
        </form>
    </div>

    <!-- Stato Attuale -->
    <div class="card">
        <h2>📊 Stato Configurazione</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8; width: 250px;"><strong>Immagini Multiple:</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;">
                    <?php if (!empty($imageSettings['enabled'])): ?>
                        <span style="color: #28a745; font-weight: bold;">✅ Abilitate</span>
                    <?php else: ?>
                        <span style="color: #6c757d;">❌ Disabilitate</span>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;"><strong>Path Filesystem:</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8; font-family: monospace; font-size: 13px;">
                    <?= $imageSettings['images_path'] ? htmlspecialchars($imageSettings['images_path']) : '<em>Non configurato</em>' ?>
                    <?php if (!empty($imageSettings['images_path']) && is_dir($imageSettings['images_path'])): ?>
                        <span style="color: #28a745; margin-left: 10px;">✓ Accessibile</span>
                    <?php elseif (!empty($imageSettings['images_path'])): ?>
                        <span style="color: #dc3545; margin-left: 10px;">✗ Non accessibile</span>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px;"><strong>URL Pubblico:</strong></td>
                <td style="padding: 12px; font-family: monospace; font-size: 13px;">
                    <?= htmlspecialchars($imageSettings['public_base_url'] ?? 'https://didieffeb2b.com/img_catalogo_norm/') ?>
                </td>
            </tr>
        </table>
    </div>
</div>

<style>
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
</style>

<?php include '../includes/footer.php'; ?>
