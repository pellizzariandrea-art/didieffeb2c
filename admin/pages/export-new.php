<?php
require_once '../config.php';
require_once '../includes/functions.php';

$dbConfig = loadDBConfig();
$mappingConfig = loadMappingConfig();
$translationSettings = loadTranslationSettings();

if (!$dbConfig || !$mappingConfig) {
    header('Location: /admin/pages/connection.php');
    exit;
}

$message = '';
$messageType = '';
$exportData = null;
$exportStats = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'export') {
        try {
            $productLimit = !empty($_POST['product_limit']) ? intval($_POST['product_limit']) : null;

            $startTime = microtime(true);

            $jsonData = generateProductsJSONMultilang($dbConfig, $mappingConfig, $translationSettings, $productLimit);
            savePublicJSON($jsonData);

            $endTime = microtime(true);
            $executionTime = round($endTime - $startTime, 2);

            $exportStats = [
                'execution_time' => $executionTime,
                'product_limit' => $productLimit,
                'languages' => $jsonData['_meta']['languages'] ?? ['it']
            ];

            logActivity("Export completato: {$jsonData['total']} prodotti in {$executionTime}s");

            $messageType = 'success';
            $message = "✓ Export completato! {$jsonData['total']} prodotti generati in {$executionTime} secondi.";
            $exportData = $jsonData;
        } catch (Exception $e) {
            $messageType = 'error';
            $message = "Errore durante l'export: " . $e->getMessage();
            error_log("Export error: " . $e->getMessage());
        }
    }
}

// Carica ultimo export se esiste
if (!$exportData && file_exists(PUBLIC_JSON_PATH)) {
    $exportData = json_decode(file_get_contents(PUBLIC_JSON_PATH), true);
}

// Conta prodotti totali
$totalProducts = 0;
try {
    $pdo = connectDB($dbConfig);
    $stmt = $pdo->query("SELECT COUNT(*) FROM `{$dbConfig['table']}`");
    $totalProducts = $stmt->fetchColumn();
} catch (Exception $e) {
    $totalProducts = '?';
}

include '../includes/header.php';
?>

<style>
.info-box {
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 10px;
    padding: 15px 20px;
    margin-bottom: 20px;
}

.info-box h4 {
    color: #667eea;
    margin-bottom: 10px;
    font-size: 14px;
}

.info-box p {
    color: #a0a0b8;
    font-size: 13px;
    margin: 0;
}

.lang-badge {
    display: inline-block;
    padding: 4px 10px;
    background: rgba(102, 126, 234, 0.2);
    border-radius: 5px;
    font-size: 12px;
    margin-right: 5px;
    margin-bottom: 5px;
}
</style>

<?php if ($translationSettings['enabled']): ?>
<div class="info-box">
    <h4>🌍 Traduzioni Automatiche Attive</h4>
    <p style="margin-bottom: 10px;">
        L'export genererà contenuti multilingua in:
        <?php foreach ($translationSettings['languages'] as $lang): ?>
            <span class="lang-badge"><?php echo strtoupper($lang); ?></span>
        <?php endforeach; ?>
    </p>
    <p>
        <strong>Nota:</strong> La prima traduzione potrebbe richiedere più tempo. Le traduzioni successive sono cachate e molto più veloci.
    </p>
</div>
<?php endif; ?>

<div class="card">
    <h2>Step 4: Export JSON</h2>

    <?php if ($message): ?>
        <div class="alert alert-<?php echo $messageType; ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <form method="POST">
        <input type="hidden" name="action" value="export">

        <p>Genera il file <code>products.json</code> dal database <strong><?php echo htmlspecialchars($dbConfig['database']); ?></strong>.</p>

        <div style="background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h4 style="color: #667eea; margin-bottom: 15px;">Opzioni Export</h4>

            <div class="form-group">
                <label>Limita Numero Prodotti (per test)</label>
                <input type="number" name="product_limit" placeholder="Lascia vuoto per tutti" min="1" max="<?php echo $totalProducts; ?>">
                <small style="color: #a0a0b8; display: block; margin-top: 5px;">
                    📊 Totale prodotti nel database: <strong><?php echo $totalProducts; ?></strong>
                    <br>
                    💡 Consiglio: Prova prima con 5-10 prodotti per testare le traduzioni
                </small>
            </div>
        </div>

        <div style="margin: 30px 0;">
            <button type="submit" class="btn" style="font-size: 18px; padding: 20px 40px;">
                🚀 Genera products.json
            </button>
            <?php if (!$translationSettings['enabled']): ?>
                <a href="/admin/pages/settings.php" class="btn btn-secondary" style="margin-left: 10px;">
                    ⚙️ Configura Traduzioni
                </a>
            <?php endif; ?>
        </div>
    </form>
</div>

<?php if ($exportStats): ?>
<div class="card">
    <h3>📊 Statistiche Export</h3>
    <div class="stats">
        <div class="stat-box">
            <div class="stat-number"><?php echo $exportStats['execution_time']; ?>s</div>
            <div class="stat-label">Tempo Esecuzione</div>
        </div>
        <div class="stat-box">
            <div class="stat-number"><?php echo count($exportStats['languages']); ?></div>
            <div class="stat-label">Lingue Generate</div>
        </div>
        <div class="stat-box">
            <div class="stat-number"><?php echo $exportStats['product_limit'] ?: 'Tutti'; ?></div>
            <div class="stat-label">Prodotti Esportati</div>
        </div>
    </div>
</div>
<?php endif; ?>

<?php if ($exportData): ?>
<div class="card">
    <h3>Ultimo Export</h3>

    <div class="stats">
        <div class="stat-box">
            <div class="stat-number"><?php echo $exportData['total']; ?></div>
            <div class="stat-label">Prodotti Esportati</div>
        </div>

        <div class="stat-box">
            <div class="stat-number">
                <?php
                $date = new DateTime($exportData['generated_at']);
                echo $date->format('d/m/Y');
                ?>
            </div>
            <div class="stat-label">Data</div>
        </div>

        <div class="stat-box">
            <div class="stat-number">
                <?php
                $date = new DateTime($exportData['generated_at']);
                echo $date->format('H:i');
                ?>
            </div>
            <div class="stat-label">Ora</div>
        </div>

        <div class="stat-box">
            <div class="stat-number">
                <?php
                $size = filesize(PUBLIC_JSON_PATH);
                echo round($size / 1024, 2) . ' KB';
                ?>
            </div>
            <div class="stat-label">Dimensione File</div>
        </div>
    </div>

    <?php if (isset($exportData['_meta']['languages'])): ?>
        <div style="margin-top: 20px;">
            <strong>Lingue disponibili:</strong>
            <?php foreach ($exportData['_meta']['languages'] as $lang): ?>
                <span class="lang-badge"><?php echo strtoupper($lang); ?></span>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <h4 style="margin-top: 30px;">URL Pubblico</h4>
    <p>Il file JSON è accessibile a questo indirizzo:</p>
    <pre><?php
    $domain = $_SERVER['HTTP_HOST'];
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $jsonUrl = "$protocol://$domain/data/products.json";
    echo $jsonUrl;
    ?></pre>

    <a href="<?php echo $jsonUrl; ?>" target="_blank" class="btn">Visualizza JSON</a>
    <a href="<?php echo $jsonUrl; ?>" download class="btn btn-secondary" style="margin-left: 10px;">Download JSON</a>
</div>

<div class="card">
    <h3>Esempio Utilizzo nel tuo E-Commerce</h3>
    <p>Nel tuo e-commerce Next.js su Vercel, usa questo URL per caricare i prodotti:</p>
    <pre>// lib/db/products.ts
const PRODUCTS_URL = '<?php echo $jsonUrl; ?>';

export async function getAllProducts() {
  const response = await fetch(PRODUCTS_URL, {
    next: { revalidate: 300 } // Cache 5 minuti
  });
  const json = await response.json();
  return json.prodotti;
}

// Per accedere ai nomi tradotti
const currentLang = 'en'; // o 'it', 'de', etc.
product.nome[currentLang] // Nome tradotto
product.descrizione[currentLang] // Descrizione tradotta</pre>
</div>

<div class="card">
    <h3>Preview Primo Prodotto</h3>
    <pre><?php
    if (!empty($exportData['prodotti'])) {
        ini_set('serialize_precision', 14);
        $previewJson = json_encode($exportData['prodotti'][0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $previewJson = forceDecimalsInJSON($previewJson, 2);
        echo $previewJson;
    }
    ?></pre>
</div>
<?php endif; ?>

<div class="card">
    <h3>Sync Automatico (Opzionale)</h3>
    <p>Puoi automatizzare l'export creando un Cron Job su Siteground che esegue:</p>
    <pre>*/6 * * * * php <?php echo BASE_PATH; ?>/cron/auto-sync.php</pre>
    <p style="color: #a0a0b8; margin-top: 10px;">
        Questo rigenera il JSON ogni 6 ore automaticamente.
    </p>
</div>

<div class="card" style="background: rgba(102, 126, 234, 0.1);">
    <h3>📋 Istruzioni Rapide</h3>
    <ol style="color: #fff; line-height: 1.8;">
        <li>Configura le traduzioni in <a href="/admin/pages/settings.php" style="color: #667eea;">Settings</a> (se necessario)</li>
        <li>Per test: Limita a 5-10 prodotti</li>
        <li>Clicca "Genera products.json"</li>
        <li>Verifica il JSON generato nella preview</li>
        <li>Usa l'URL pubblico nel tuo e-commerce Next.js</li>
    </ol>
</div>

<?php include '../includes/footer.php'; ?>
