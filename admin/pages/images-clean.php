<?php
require_once '../config.php';
require_once '../includes/functions.php';

$imageSettings = loadImageSettings();
$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $settings = [
            'enabled' => isset($_POST['enabled']),
            'images_path' => trim($_POST['images_path'] ?? ''),
            'public_base_url' => trim($_POST['public_base_url'] ?? '')
        ];

        if ($settings['enabled']) {
            if (empty($settings['images_path'])) {
                throw new Exception('Il path delle immagini è obbligatorio.');
            }
            if (!is_dir($settings['images_path'])) {
                throw new Exception('Il path non esiste: ' . $settings['images_path']);
            }
            if (empty($settings['public_base_url'])) {
                throw new Exception('L\'URL pubblico è obbligatorio.');
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
            <h1>🖼️ Immagini Multiple</h1>
            <p class="subtitle">Configura la scansione automatica delle gallery immagini prodotto</p>
        </div>
        <a href="<?= ADMIN_URL ?>" class="btn btn-secondary">← Dashboard</a>
    </div>

    <?php if ($message): ?>
        <div class="alert alert-<?= $messageType ?>">
            <?= htmlspecialchars($message) ?>
        </div>
    <?php endif; ?>

    <div style="background: #e3f2fd; border: 1px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0;">📍 Path Trovato</h3>
        <p>Usa questo path nella configurazione:</p>
        <code style="background: #fff; padding: 10px; display: block; border-radius: 4px; font-size: 14px;">/home/customer/www/didieffeb2b.com/public_html/img_catalogo_norm</code>
    </div>

    <div class="card">
        <h2>⚙️ Configurazione</h2>
        <form method="POST" class="form">
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 10px; font-weight: 600; cursor: pointer;">
                    <input type="checkbox" name="enabled" <?= !empty($imageSettings['enabled']) ? 'checked' : '' ?> style="width: 20px; height: 20px;">
                    Abilita scansione immagini multiple
                </label>
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
            </div>

            <div class="form-group">
                <label for="public_base_url">URL Pubblico Base</label>
                <input
                    type="text"
                    id="public_base_url"
                    name="public_base_url"
                    value="<?= htmlspecialchars($imageSettings['public_base_url'] ?? 'https://didieffeb2b.com/img_catalogo_norm/') ?>"
                    class="form-control"
                >
            </div>

            <button type="submit" class="btn btn-primary">💾 Salva Impostazioni</button>
        </form>
    </div>

    <div class="card">
        <h2>📊 Stato</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8; width: 200px;"><strong>Stato:</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;">
                    <?= !empty($imageSettings['enabled']) ? '<span style="color: #28a745;">✅ Abilitate</span>' : '<span style="color: #6c757d;">❌ Disabilitate</span>' ?>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;"><strong>Path:</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8; font-family: monospace; font-size: 13px;">
                    <?= $imageSettings['images_path'] ?: '<em>Non configurato</em>' ?>
                    <?php if (!empty($imageSettings['images_path']) && is_dir($imageSettings['images_path'])): ?>
                        <span style="color: #28a745;">✓ OK</span>
                    <?php elseif (!empty($imageSettings['images_path'])): ?>
                        <span style="color: #dc3545;">✗ Non trovato</span>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px;"><strong>URL:</strong></td>
                <td style="padding: 12px; font-family: monospace; font-size: 13px;">
                    <?= htmlspecialchars($imageSettings['public_base_url'] ?? 'https://didieffeb2b.com/img_catalogo_norm/') ?>
                </td>
            </tr>
        </table>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
