<?php
require_once 'config.php';
require_once 'includes/functions.php';
include 'includes/header.php';

$dbConfig = loadDBConfig();
$mappingConfig = loadMappingConfig();
?>

<div class="card">
    <h2>Dashboard Overview</h2>

    <div class="stats">
        <div class="stat-box">
            <div class="stat-number">
                <?php echo $dbConfig ? '✓' : '✗'; ?>
            </div>
            <div class="stat-label">Database Configurato</div>
        </div>

        <div class="stat-box">
            <div class="stat-number">
                <?php echo $mappingConfig ? count($mappingConfig) : '0'; ?>
            </div>
            <div class="stat-label">Campi Mappati</div>
        </div>

        <div class="stat-box">
            <div class="stat-number">
                <?php
                if (file_exists(PUBLIC_JSON_PATH)) {
                    $json = json_decode(file_get_contents(PUBLIC_JSON_PATH), true);
                    echo isset($json['total']) ? $json['total'] : '0';
                } else {
                    echo '0';
                }
                ?>
            </div>
            <div class="stat-label">Prodotti Esportati</div>
        </div>

        <div class="stat-box">
            <div class="stat-number">
                <?php
                if (file_exists(PUBLIC_JSON_PATH)) {
                    $json = json_decode(file_get_contents(PUBLIC_JSON_PATH), true);
                    if (isset($json['generated_at'])) {
                        $date = new DateTime($json['generated_at']);
                        echo $date->format('d/m');
                    } else {
                        echo '-';
                    }
                } else {
                    echo '-';
                }
                ?>
            </div>
            <div class="stat-label">Ultimo Export</div>
        </div>
    </div>
</div>

<div class="card">
    <h2>Quick Actions</h2>

    <?php if (!$dbConfig): ?>
        <div class="alert alert-warning">
            ⚠️ Devi prima configurare la connessione al database
        </div>
        <a href="/admin/pages/connection.php" class="btn">Configura Database</a>
    <?php elseif (!$mappingConfig): ?>
        <div class="alert alert-warning">
            ⚠️ Devi mappare i campi del database
        </div>
        <a href="/admin/pages/mapping.php" class="btn">Configura Mapping</a>
    <?php else: ?>
        <div class="alert alert-success">
            ✓ Sistema configurato correttamente!
        </div>
        <a href="/admin/pages/export.php" class="btn">Genera JSON Prodotti</a>
        <a href="/admin/pages/preview.php" class="btn btn-secondary" style="margin-left: 10px;">Preview Dati</a>
    <?php endif; ?>
</div>

<!-- Wizard Builder Card -->
<div class="card" style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border: 2px solid rgba(102, 126, 234, 0.3);">
    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 30px;">
            ✨
        </div>
        <div>
            <h2 style="margin: 0; color: #667eea;">Wizard di Ricerca Guidata</h2>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Configura il wizard interattivo per aiutare i clienti a trovare prodotti</p>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
        <div style="background: white; padding: 15px; border-radius: 10px; border-left: 4px solid #667eea;">
            <div style="font-size: 24px; font-weight: bold; color: #667eea;">5</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">Step Configurabili</div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 10px; border-left: 4px solid #764ba2;">
            <div style="font-size: 24px; font-weight: bold; color: #764ba2;">🌍</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">6 Lingue Tradotte</div>
        </div>
        <div style="background: white; padding: 15px; border-radius: 10px; border-left: 4px solid #10b981;">
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">🎯</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">Drag & Drop</div>
        </div>
    </div>

    <a href="/admin/pages/wizard-builder.php" class="btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: inline-flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">🚀</span>
        <span>Configura Wizard Builder</span>
    </a>
    <a href="<?= BASE_URL ?>" target="_blank" class="btn btn-secondary" style="margin-left: 10px; display: inline-flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px;">👁️</span>
        <span>Anteprima Frontend</span>
    </a>
</div>

<?php if (file_exists(PUBLIC_JSON_PATH)): ?>
<div class="card">
    <h2>JSON Pubblico</h2>
    <p>Il file JSON è accessibile pubblicamente a questo URL:</p>
    <pre><?php
    $domain = $_SERVER['HTTP_HOST'];
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    echo "$protocol://$domain/data/products.json";
    ?></pre>
    <a href="/data/products.json" target="_blank" class="btn">Visualizza JSON</a>
</div>
<?php endif; ?>

<div class="card">
    <h2>Configurazione Database SiteGround</h2>
    <table>
        <tr>
            <th>Parametro</th>
            <th>Valore</th>
        </tr>
        <tr>
            <td>Host</td>
            <td><code><?php echo DB_HOST; ?></code></td>
        </tr>
        <tr>
            <td>Database</td>
            <td><code><?php echo DB_NAME; ?></code></td>
        </tr>
        <tr>
            <td>Username</td>
            <td><code><?php echo DB_USER; ?></code></td>
        </tr>
        <tr>
            <td>Tabella</td>
            <td><code><?php echo DB_TABLE; ?></code></td>
        </tr>
    </table>
</div>

<?php include 'includes/footer.php'; ?>
