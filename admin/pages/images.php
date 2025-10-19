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

    <!-- Info Box -->
    <div class="info-box">
        <h3>ℹ️ Come Funziona</h3>
        <ol>
            <li><strong>Base:</strong> Il sistema usa il <strong>nome file dell'immagine principale dal database</strong> come punto di partenza</li>
            <li><strong>Pattern:</strong> Estrae il nome base (es: <code>FAA00245U0IR</code> da <code>FAA00245U0IR____.JPG</code>)</li>
            <li><strong>Ricerca:</strong> Cerca nel filesystem tutti i file che iniziano con quel nome base: <code>FAA00245U0IR*</code></li>
            <li><strong>Trova:</strong> <code>FAA00245U0IR____.JPG</code>, <code>FAA00245U0IR____01.JPG</code>, <code>FAA00245U0IR____02.JPG</code>, ecc.</li>
            <li><strong>Output JSON:</strong> Array ordinato con tutte le immagini trovate</li>
        </ol>
        <p style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px;">
            <strong>⚠️ Importante:</strong> Funziona anche se prodotti diversi condividono la stessa immagine, perché usa il nome file effettivo, non il codice prodotto.
        </p>
    </div>

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
                    required
                >
                <small>
                    Usa <a href="../trova-path.php" target="_blank">trova-path.php</a> per trovare il path corretto.
                    <br>Path trovato: <code>/home/customer/www/didieffeb2b.com/public_html/img_catalogo_norm</code>
                </small>
            </div>

            <div class="form-group">
                <label for="public_base_url">URL Pubblico Base</label>
                <input
                    type="text"
                    id="public_base_url"
                    name="public_base_url"
                    value="<?= htmlspecialchars($imageSettings['public_base_url'] ?? 'https://didieffeb2b.com/img_catalogo_norm/') ?>"
                    class="form-control"
                    required
                >
                <small>URL pubblico per accedere alle immagini (con slash finale)</small>
            </div>

            <button type="submit" class="btn btn-primary">💾 Salva Impostazioni</button>
        </form>

        <?php if ($imageSettings['enabled']): ?>
            <div style="margin-top: 20px; padding: 15px; background: rgba(76, 175, 80, 0.1); border-radius: 8px; border: 1px solid rgba(76, 175, 80, 0.3);">
                <strong style="color: #4caf50;">✓ Immagini multiple abilitate</strong>
                <p style="margin: 10px 0 5px 0; font-size: 14px;">
                    Per testare la configurazione, vai a <a href="test-product.php" style="color: #667eea; font-weight: bold;">🧪 Test Singolo Prodotto</a>
                </p>
            </div>
        <?php endif; ?>
    </div>

    <!-- Stato Configurazione -->
    <div class="card">
        <h2>📊 Stato Configurazione</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8; width: 220px;"><strong>Immagini Multiple:</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;">
                    <?php if (!empty($imageSettings['enabled'])): ?>
                        <span style="color: #28a745; font-weight: bold; font-size: 15px;">✅ Abilitate</span>
                    <?php else: ?>
                        <span style="color: #6c757d; font-size: 15px;">❌ Disabilitate</span>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8;"><strong>Path Filesystem:</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e1e4e8; font-family: monospace; font-size: 13px;">
                    <?= $imageSettings['images_path'] ? htmlspecialchars($imageSettings['images_path']) : '<em style="color: #999;">Non configurato</em>' ?>
                    <?php if (!empty($imageSettings['images_path']) && is_dir($imageSettings['images_path'])): ?>
                        <span style="color: #28a745; margin-left: 10px; font-weight: bold;">✓ Accessibile</span>
                    <?php elseif (!empty($imageSettings['images_path'])): ?>
                        <span style="color: #dc3545; margin-left: 10px; font-weight: bold;">✗ Non trovato</span>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <td style="padding: 12px;"><strong>URL Pubblico Base:</strong></td>
                <td style="padding: 12px; font-family: monospace; font-size: 13px;">
                    <a href="<?= htmlspecialchars($imageSettings['public_base_url'] ?? 'https://didieffeb2b.com/img_catalogo_norm/') ?>" target="_blank" style="color: #667eea; text-decoration: none;">
                        <?= htmlspecialchars($imageSettings['public_base_url'] ?? 'https://didieffeb2b.com/img_catalogo_norm/') ?>
                    </a>
                </td>
            </tr>
        </table>

        <div style="margin-top: 20px; padding: 15px; background: rgba(102, 126, 234, 0.1); border-radius: 8px;">
            <p style="margin: 0; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">🧪</span>
                <span>Vuoi testare come apparirà un prodotto con le sue immagini? Usa la pagina
                    <a href="test-product.php" style="color: #667eea; font-weight: bold; text-decoration: none;">Test Singolo Prodotto</a>
                </span>
            </p>
        </div>
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
</style>

<?php include '../includes/footer.php'; ?>
