<?php
require_once '../config.php';
require_once '../includes/functions.php';

// Carica JSON esportato
$jsonPath = PUBLIC_JSON_PATH;
$jsonExists = file_exists($jsonPath);
$jsonData = null;
$products = [];
$meta = [];
$languages = ['it'];
$selectedLang = $_GET['lang'] ?? 'it';

if ($jsonExists) {
    $jsonContent = file_get_contents($jsonPath);
    $jsonData = json_decode($jsonContent, true);

    if ($jsonData) {
        $products = array_slice($jsonData['prodotti'] ?? [], 0, 10); // Primi 10 prodotti
        $meta = $jsonData['_meta'] ?? [];
        $languages = $meta['languages'] ?? ['it'];

        // Valida lingua selezionata
        if (!in_array($selectedLang, $languages)) {
            $selectedLang = 'it';
        }
    }
}

// Funzione helper per ottenere valore tradotto
function getTranslatedValue($value, $lang) {
    if (is_array($value) && isset($value[$lang])) {
        return $value[$lang];
    }
    return $value;
}

include '../includes/header.php';
?>

<style>
.lang-selector {
    display: inline-flex;
    gap: 5px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 5px;
}

.lang-btn {
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: #a0a0b8;
    cursor: pointer;
    border-radius: 6px;
    font-weight: 600;
    transition: all 0.3s;
    text-transform: uppercase;
    font-size: 13px;
    text-decoration: none;
}

.lang-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.lang-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
}

.product-card {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    border: 2px solid rgba(102, 126, 234, 0.2);
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 20px;
    transition: all 0.3s;
}

.product-card:hover {
    border-color: rgba(102, 126, 234, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
}

.filter-preview, .category-preview {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
}

.filter-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 15px;
}

.category-card {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border: 2px solid rgba(102, 126, 234, 0.3);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
}

.category-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.3);
}
</style>

<div class="container">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 20px;">
        <div>
            <h1 style="font-size: 32px; margin-bottom: 10px;">
                👁️ Preview Export
            </h1>
            <p style="font-size: 16px; color: #a0a0b8;">
                Anteprima del JSON esportato - Dati e statistiche
            </p>
        </div>
        <a href="<?= ADMIN_URL ?>" class="btn btn-secondary">← Dashboard</a>
    </div>

    <?php if (!$jsonExists): ?>
        <!-- Nessun export trovato -->
        <div class="card">
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 64px; margin-bottom: 20px;">📦</div>
                <h2 style="color: #667eea; margin-bottom: 15px;">Nessun Export Disponibile</h2>
                <p style="color: #a0a0b8; margin-bottom: 25px;">
                    Non è stato ancora generato alcun file <code>products.json</code>.
                    <br>
                    Esegui il primo export per vedere l'anteprima qui.
                </p>
                <a href="/admin/pages/export.php" class="btn">
                    🚀 Vai all'Export
                </a>
            </div>
        </div>

    <?php else: ?>

        <!-- Statistiche Export -->
        <div class="card">
            <h2>📊 Statistiche Ultimo Export</h2>
            <div class="stats">
                <div class="stat-box">
                    <div class="stat-number"><?= $jsonData['total'] ?? 0 ?></div>
                    <div class="stat-label">Prodotti Esportati</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number"><?= count($languages) ?></div>
                    <div class="stat-label">Lingue Disponibili</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">
                        <?php
                        $fileSize = filesize($jsonPath);
                        echo $fileSize < 1024 ? $fileSize . ' B' : round($fileSize / 1024, 2) . ' KB';
                        ?>
                    </div>
                    <div class="stat-label">Dimensione File</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">
                        <?php
                        $date = new DateTime($jsonData['generated_at']);
                        echo $date->format('H:i');
                        ?>
                    </div>
                    <div class="stat-label">Ora Export</div>
                </div>
            </div>

            <!-- Lingue disponibili -->
            <div style="margin-top: 20px; padding: 20px; background: rgba(102, 126, 234, 0.1); border-radius: 10px;">
                <strong style="margin-right: 15px;">🌍 Lingue Disponibili:</strong>
                <div class="lang-selector">
                    <?php foreach ($languages as $lang): ?>
                        <a href="?lang=<?= $lang ?>" class="lang-btn <?= $selectedLang === $lang ? 'active' : '' ?>">
                            <?= strtoupper($lang) ?>
                        </a>
                    <?php endforeach; ?>
                </div>
                <div style="margin-top: 10px; font-size: 13px; color: #a0a0b8;">
                    Lingua attiva: <strong><?= strtoupper($selectedLang) ?></strong>
                </div>
            </div>
        </div>

        <!-- Filtri E-Commerce -->
        <?php if (!empty($meta['filters'])): ?>
        <div class="card">
            <h2>🔍 Filtri E-Commerce Configurati</h2>
            <p style="color: #a0a0b8; margin-bottom: 20px;">
                Questi filtri appariranno nella sidebar dell'e-commerce Next.js
            </p>

            <div class="filter-preview">
                <?php foreach ($meta['filters'] as $filter): ?>
                <div class="filter-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: #667eea; font-size: 16px;"><?= htmlspecialchars($filter['label']) ?></strong>
                        <span style="background: rgba(102, 126, 234, 0.2); padding: 4px 10px; border-radius: 5px; font-size: 12px; text-transform: uppercase;">
                            <?= htmlspecialchars($filter['type']) ?>
                        </span>
                    </div>

                    <?php if ($filter['type'] === 'range' && isset($filter['min'], $filter['max'])): ?>
                        <!-- Range Slider -->
                        <div style="padding: 10px 0;">
                            <input type="range" style="width: 100%; accent-color: #667eea;" disabled>
                            <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; color: #a0a0b8;">
                                <span>€<?= number_format($filter['min'], 2, ',', '.') ?></span>
                                <span>€<?= number_format($filter['max'], 2, ',', '.') ?></span>
                            </div>
                        </div>

                    <?php elseif (!empty($filter['options'])): ?>
                        <!-- Options -->
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                            <?php foreach (array_slice($filter['options'], 0, 6) as $option): ?>
                                <span style="display: inline-block; padding: 6px 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 5px; font-size: 13px;">
                                    <?= is_bool($option) ? ($option ? 'Sì' : 'No') : htmlspecialchars($option) ?>
                                </span>
                            <?php endforeach; ?>
                            <?php if (count($filter['options']) > 6): ?>
                                <span style="padding: 6px 12px; color: #667eea; font-size: 13px;">
                                    +<?= count($filter['options']) - 6 ?> altri
                                </span>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Categorie Homepage -->
        <?php if (!empty($meta['categories'])): ?>
        <div class="card">
            <h2>🏠 Categorie Homepage</h2>
            <p style="color: #a0a0b8; margin-bottom: 20px;">
                Questi pulsanti appariranno nella homepage come macrocategorie
            </p>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
                <?php foreach ($meta['categories'] as $category): ?>
                <div class="category-card" style="border-color: <?= htmlspecialchars($category['color']) ?>44;">
                    <div style="font-size: 48px; margin-bottom: 10px;">
                        <?= htmlspecialchars($category['icon']) ?>
                    </div>
                    <div style="font-weight: 600; color: #fff; font-size: 18px; margin-bottom: 8px;">
                        <?= htmlspecialchars($category['label']) ?>
                    </div>
                    <?php if (!empty($category['description'])): ?>
                    <div style="font-size: 13px; color: #a0a0b8; margin-bottom: 12px;">
                        <?= htmlspecialchars($category['description']) ?>
                    </div>
                    <?php endif; ?>
                    <div style="display: inline-block; padding: 6px 14px; background: <?= htmlspecialchars($category['color']) ?>33; border-radius: 20px; font-size: 13px; color: <?= htmlspecialchars($category['color']) ?>; font-weight: 600;">
                        <?= $category['count'] ?? 0 ?> prodott<?= ($category['count'] ?? 0) === 1 ? 'o' : 'i' ?>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Preview Prodotti -->
        <div class="card">
            <h2>🎨 Preview Prodotti (Primi 10)</h2>
            <p style="color: #a0a0b8; margin-bottom: 25px;">
                Visualizzazione prodotti in lingua: <strong><?= strtoupper($selectedLang) ?></strong>
            </p>

            <?php if (empty($products)): ?>
                <div style="text-align: center; padding: 40px; color: #a0a0b8;">
                    Nessun prodotto trovato nel JSON esportato.
                </div>
            <?php else: ?>
                <?php foreach ($products as $index => $product): ?>
                <div class="product-card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                        <div style="flex: 1;">
                            <div style="font-size: 14px; color: #a0a0b8; margin-bottom: 5px;">
                                Prodotto #<?= $index + 1 ?>
                            </div>
                            <h3 style="color: #667eea; margin: 0; font-size: 24px;">
                                <?= htmlspecialchars(getTranslatedValue($product['nome'] ?? 'N/A', $selectedLang)) ?>
                            </h3>
                            <div style="font-family: monospace; color: #a0a0b8; margin-top: 5px;">
                                <?= htmlspecialchars($product['codice'] ?? 'N/A') ?>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 32px; font-weight: bold; color: #4caf50;">
                                €<?= number_format($product['prezzo'] ?? 0, 2, ',', '.') ?>
                            </div>
                        </div>
                    </div>

                    <!-- Descrizione -->
                    <?php if (!empty($product['descrizione'])): ?>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="color: #a0a0b8; font-size: 14px; line-height: 1.6;">
                            <?= nl2br(htmlspecialchars(getTranslatedValue($product['descrizione'], $selectedLang))) ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Immagini -->
                    <?php
                    $images = [];
                    if (!empty($product['immagini'])) {
                        $images = $product['immagini'];
                    } elseif (!empty($product['immagine'])) {
                        $images = [$product['immagine']];
                    }
                    ?>

                    <?php if (!empty($images)): ?>
                    <div style="margin-bottom: 20px;">
                        <strong style="color: #667eea; margin-bottom: 10px; display: block;">
                            📸 Immagini (<?= count($images) ?>)
                        </strong>
                        <div style="display: flex; gap: 10px; overflow-x: auto; padding: 5px;">
                            <?php foreach (array_slice($images, 0, 5) as $imgIndex => $imgUrl): ?>
                                <img src="<?= htmlspecialchars($imgUrl) ?>"
                                     alt="Img <?= $imgIndex ?>"
                                     style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 2px solid <?= $imgIndex === 0 ? '#667eea' : '#555' ?>; cursor: pointer;"
                                     onclick="window.open('<?= htmlspecialchars($imgUrl) ?>', '_blank')"
                                     onerror="this.style.display='none'">
                            <?php endforeach; ?>
                            <?php if (count($images) > 5): ?>
                                <div style="width: 120px; height: 120px; border: 2px dashed #555; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #a0a0b8;">
                                    +<?= count($images) - 5 ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Attributi -->
                    <?php if (!empty($product['attributi'])): ?>
                    <div style="margin-bottom: 20px;">
                        <strong style="color: #667eea; margin-bottom: 10px; display: block;">
                            📌 Attributi (<?= count($product['attributi']) ?>)
                        </strong>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                            <?php foreach ($product['attributi'] as $key => $value): ?>
                                <?php
                                // Gestisci attributi tradotti vs semplici
                                $attrLabel = $key;
                                $attrValue = $value;

                                if (is_array($value) && isset($value['label'], $value['value'])) {
                                    $attrLabel = getTranslatedValue($value['label'], $selectedLang);
                                    $attrValue = getTranslatedValue($value['value'], $selectedLang);
                                }
                                ?>
                                <div style="padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 6px; border-left: 3px solid #667eea;">
                                    <div style="font-size: 11px; color: #a0a0b8; margin-bottom: 3px;">
                                        <?= htmlspecialchars($attrLabel) ?>
                                    </div>
                                    <div style="font-weight: bold; color: #fff; font-size: 14px;">
                                        <?php if (is_bool($attrValue)): ?>
                                            <?= $attrValue ? '✓ Sì' : '✗ No' ?>
                                        <?php else: ?>
                                            <?= htmlspecialchars($attrValue) ?>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Risorse Scaricabili -->
                    <?php if (!empty($product['risorse'])): ?>
                    <div style="margin-bottom: 20px;">
                        <strong style="color: #667eea; margin-bottom: 10px; display: block;">
                            📦 Risorse Scaricabili (<?= count($product['risorse']) ?>)
                        </strong>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <?php foreach ($product['risorse'] as $resource): ?>
                                <a href="<?= htmlspecialchars($resource['url']) ?>"
                                   target="_blank"
                                   style="display: flex; align-items: center; gap: 8px; padding: 10px 15px; background: rgba(255, 193, 7, 0.2); border: 1px solid rgba(255, 193, 7, 0.5); border-radius: 8px; color: #ffc107; text-decoration: none; transition: all 0.3s;"
                                   onmouseover="this.style.background='rgba(255, 193, 7, 0.3)'"
                                   onmouseout="this.style.background='rgba(255, 193, 7, 0.2)'">
                                    <span style="font-size: 20px;"><?= htmlspecialchars($resource['icon']) ?></span>
                                    <span style="font-weight: 600;"><?= htmlspecialchars($resource['category']) ?></span>
                                    <span style="font-size: 12px; color: #a0a0b8;">.<?= htmlspecialchars($resource['extension']) ?></span>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Varianti -->
                    <?php if (!empty($product['variants'])): ?>
                    <div style="background: rgba(153, 102, 255, 0.1); border: 1px solid rgba(153, 102, 255, 0.3); border-radius: 8px; padding: 15px;">
                        <strong style="color: #9966ff; margin-bottom: 10px; display: block;">
                            🔀 Varianti (<?= count($product['variants']) ?>)
                        </strong>
                        <div style="display: flex; gap: 10px; overflow-x: auto;">
                            <?php foreach ($product['variants'] as $variant): ?>
                                <div style="background: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 6px; min-width: 150px;">
                                    <div style="font-family: monospace; font-size: 12px; color: #a0a0b8;">
                                        <?= htmlspecialchars($variant['codice']) ?>
                                    </div>
                                    <div style="font-weight: 600; color: #4caf50; margin-top: 5px;">
                                        €<?= number_format($variant['prezzo'] ?? 0, 2, ',', '.') ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Show JSON Toggle -->
                    <details style="margin-top: 20px;">
                        <summary style="cursor: pointer; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 6px; color: #667eea; font-weight: 600;">
                            📄 Mostra JSON Completo
                        </summary>
                        <pre style="margin-top: 10px; background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 11px; max-height: 400px; overflow-y: auto;"><?= json_encode($product, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?></pre>
                    </details>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

        <!-- Azioni -->
        <div class="card">
            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <a href="/admin/pages/export.php" class="btn">
                        🚀 Nuovo Export
                    </a>
                    <a href="/admin/pages/test-ecommerce.php" class="btn" style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);">
                        🛍️ Test E-Commerce Interattivo
                    </a>
                    <a href="/admin/pages/ecommerce-config.php" class="btn btn-secondary">
                        🛒 Configura Filtri/Categorie
                    </a>
                    <a href="/admin/pages/settings.php" class="btn btn-secondary">
                        🌍 Configura Traduzioni
                    </a>
                </div>
                <a href="<?php
                    $domain = $_SERVER['HTTP_HOST'];
                    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
                    echo "$protocol://$domain/data/products.json";
                ?>" target="_blank" class="btn btn-secondary" style="background: rgba(76, 175, 80, 0.2); border-color: #4caf50;">
                    📥 Download JSON
                </a>
            </div>
        </div>

    <?php endif; ?>
</div>

<?php include '../includes/footer.php'; ?>
