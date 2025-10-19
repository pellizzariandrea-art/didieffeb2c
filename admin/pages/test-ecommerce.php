<?php
require_once '../config.php';
require_once '../includes/functions.php';

// Carica JSON esportato (TUTTI i prodotti)
$jsonPath = PUBLIC_JSON_PATH;
$jsonExists = file_exists($jsonPath);
$jsonData = null;
$allProducts = [];
$meta = [];
$languages = ['it'];
$selectedLang = $_GET['lang'] ?? 'it';

if ($jsonExists) {
    $jsonContent = file_get_contents($jsonPath);
    $jsonData = json_decode($jsonContent, true);

    if ($jsonData) {
        $allProducts = $jsonData['prodotti'] ?? [];
        $meta = $jsonData['_meta'] ?? [];
        $languages = $meta['languages'] ?? ['it'];

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

// Funzione per estrarre valore semplice da attributo (per filtri e data attributes)
function extractSimpleAttributeValue($attrValue) {
    if (is_array($attrValue) && isset($attrValue['value'])) {
        // Attributo multilingua con struttura {label: {...}, value: {...}}
        if (is_array($attrValue['value'])) {
            // Prendi il primo valore disponibile
            $values = array_values($attrValue['value']);
            return !empty($values) ? $values[0] : null;
        }
        return $attrValue['value'];
    }
    return $attrValue;
}

// Prepara dati filtri con valori reali e conteggi
$filtersData = [];
if (!empty($meta['filters'])) {
    foreach ($meta['filters'] as $filter) {
        $field = $filter['field'];

        if ($field === 'prezzo') {
            // Per il prezzo, calcola min/max
            $prices = array_column($allProducts, 'prezzo');
            if (!empty($prices)) {
                $filtersData[$field] = [
                    'type' => 'range',
                    'label' => $filter['label'] ?? 'Prezzo',
                    'min' => min($prices),
                    'max' => max($prices)
                ];
            }
        } else {
            // Per gli attributi, estrai valori unici
            $values = [];
            foreach ($allProducts as $product) {
                if (isset($product['attributi'][$field])) {
                    $val = extractSimpleAttributeValue($product['attributi'][$field]);
                    if ($val !== null && $val !== '' && !in_array($val, $values)) {
                        $values[] = $val;
                    }
                }
            }

            if (!empty($values)) {
                $filtersData[$field] = [
                    'type' => $filter['type'] ?? 'checkbox',
                    'label' => $filter['label'] ?? $field,
                    'values' => $values
                ];
            }
        }
    }
}

// Prepara dati categorie
$categoriesData = [];
if (!empty($meta['categories'])) {
    foreach ($meta['categories'] as $category) {
        $field = $category['field'];
        // Conta prodotti con questo attributo = true
        $count = 0;
        foreach ($allProducts as $product) {
            if (isset($product['attributi'][$field])) {
                $val = extractSimpleAttributeValue($product['attributi'][$field]);
                if ($val === true || $val === 'true' || $val === 1 || $val === '1') {
                    $count++;
                }
            }
        }

        if ($count > 0) {
            $categoriesData[$field] = [
                'label' => $category['label'] ?? $field,
                'icon' => $category['icon'] ?? '📦',
                'color' => $category['color'] ?? '#667eea',
                'description' => $category['description'] ?? '',
                'count' => $count
            ];
        }
    }
}

include '../includes/header.php';
?>

<style>
/* Layout E-Commerce */
.ecommerce-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 30px;
    margin-top: 20px;
}

@media (max-width: 992px) {
    .ecommerce-layout {
        grid-template-columns: 1fr;
    }
    .sidebar {
        display: none;
    }
}

/* Sidebar Filtri */
.sidebar {
    position: sticky;
    top: 20px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    overflow-x: hidden;
}

/* Scrollbar personalizzata per la sidebar */
.sidebar::-webkit-scrollbar {
    width: 8px;
}

.sidebar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
}

.sidebar::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.5);
    border-radius: 10px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.7);
}

.filter-section {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
}

.filter-section h3 {
    font-size: 14px;
    color: #667eea;
    margin: 0 0 15px 0;
    text-transform: uppercase;
    font-weight: 600;
}

.filter-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    cursor: pointer;
    transition: all 0.2s;
}

.filter-option:hover {
    padding-left: 5px;
}

.filter-option input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #667eea;
}

.filter-option label {
    flex: 1;
    cursor: pointer;
    color: #a0a0b8;
    font-size: 14px;
}

.filter-count {
    color: #667eea;
    font-size: 12px;
    font-weight: 600;
}

/* Select Dropdown */
.filter-select {
    width: 100%;
    padding: 10px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.filter-select:hover {
    border-color: #667eea;
}

.filter-select:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.15);
}

.filter-select option {
    background-color: #2a2a3e;
    color: #ffffff;
    padding: 8px;
}

/* Tags/Chips */
.filter-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
}

.filter-tag-chip {
    display: inline-block;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    font-size: 12px;
    color: #a0a0b8;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
}

.filter-tag-chip:hover {
    background: rgba(102, 126, 234, 0.1);
    border-color: rgba(102, 126, 234, 0.3);
}

.filter-tag-chip.active {
    background: rgba(102, 126, 234, 0.2);
    border-color: #667eea;
    color: #667eea;
}

/* Category Filter (sidebar) */
.category-filter {
    background: linear-gradient(135deg, rgba(118, 75, 162, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%);
    border: 2px solid rgba(118, 75, 162, 0.3);
    padding: 15px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 10px;
}

.category-filter:hover {
    border-color: #764ba2;
    background: rgba(118, 75, 162, 0.15);
}

.category-filter.active {
    border-color: #764ba2;
    background: rgba(118, 75, 162, 0.2);
    box-shadow: 0 4px 12px rgba(118, 75, 162, 0.3);
}

/* Category Card (homepage) */
.category-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(118, 75, 162, 0.4);
}

.category-card:active {
    transform: translateY(-2px);
}

.category-icon {
    font-size: 24px;
    margin-bottom: 8px;
}

.category-name {
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
    font-size: 14px;
}

.category-description {
    font-size: 11px;
    color: #a0a0b8;
    margin-bottom: 8px;
}

.category-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
}

/* Range Slider */
.range-slider {
    padding: 15px 0;
}

.range-slider input {
    width: 100%;
    accent-color: #667eea;
}

.range-values {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 13px;
    color: #a0a0b8;
}

/* Search Box */
.search-box {
    position: relative;
    margin-bottom: 20px;
}

.search-box input {
    width: 100%;
    padding: 12px 40px 12px 15px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
}

.search-box input:focus {
    outline: none;
    border-color: #667eea;
}

.search-box::after {
    content: '🔍';
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
}

/* Griglia Prodotti */
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 25px;
}

.product-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;
}

.product-card:hover {
    border-color: #667eea;
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.3);
}

.product-image {
    width: 100%;
    height: 280px;
    object-fit: cover;
    background: rgba(0, 0, 0, 0.3);
}

.product-info {
    padding: 20px;
}

.product-name {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 8px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.product-code {
    font-family: monospace;
    font-size: 11px;
    color: #667eea;
    margin-bottom: 12px;
}

.product-price {
    font-size: 24px;
    font-weight: bold;
    color: #4caf50;
    margin-bottom: 10px;
}

.product-badges {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
}

.badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
}

.badge-variant {
    background: rgba(153, 102, 255, 0.2);
    color: #9966ff;
}

.badge-resources {
    background: rgba(255, 193, 7, 0.2);
    color: #ffc107;
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    overflow-y: auto;
    padding: 20px;
}

.modal.active {
    display: flex;
    align-items: start;
    justify-content: center;
}

.modal-content {
    background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    max-width: 1200px;
    width: 100%;
    margin: 40px auto;
    position: relative;
}

.modal-close {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #fff;
    font-size: 32px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s;
    z-index: 1;
}

.modal-close:hover {
    background: rgba(255, 67, 54, 0.8);
    transform: rotate(90deg);
}

.modal-body {
    padding: 40px;
}

.modal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-bottom: 40px;
}

@media (max-width: 992px) {
    .modal-grid {
        grid-template-columns: 1fr;
    }
}

/* Gallery */
.gallery-main {
    width: 100%;
    height: 400px;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 15px;
    background: rgba(0, 0, 0, 0.3);
}

.gallery-main img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.gallery-thumbs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 10px;
}

.gallery-thumb {
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s;
}

.gallery-thumb:hover,
.gallery-thumb.active {
    border-color: #667eea;
}

.gallery-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Attributi */
.attributes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    margin-top: 20px;
}

.attribute-item {
    background: rgba(255, 255, 255, 0.05);
    padding: 12px;
    border-radius: 8px;
    border-left: 3px solid #667eea;
}

.attribute-label {
    font-size: 11px;
    color: #a0a0b8;
    margin-bottom: 5px;
}

.attribute-value {
    font-size: 14px;
    color: #fff;
    font-weight: 600;
}

/* Risorse */
.resources-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 20px;
}

.resource-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border: 2px solid #667eea;
    border-radius: 10px;
    text-decoration: none;
    transition: all 0.3s;
}

.resource-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
}

.resource-icon {
    font-size: 32px;
}

.resource-info {
    flex: 1;
}

.resource-category {
    color: #667eea;
    font-weight: 700;
    font-size: 14px;
}

.resource-ext {
    color: #a0a0b8;
    font-size: 11px;
    font-family: monospace;
}

/* Language Selector */
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

/* Risultati header */
.results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
}

.results-count {
    font-size: 18px;
    color: #667eea;
    font-weight: 600;
}

/* Empty state */
.empty-state {
    text-align: center;
    padding: 80px 20px;
    color: #a0a0b8;
}

.empty-state-icon {
    font-size: 64px;
    margin-bottom: 20px;
}

/* Active filters */
.active-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.filter-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(102, 126, 234, 0.2);
    border: 1px solid #667eea;
    border-radius: 20px;
    font-size: 13px;
    color: #667eea;
}

.filter-tag-remove {
    cursor: pointer;
    font-weight: bold;
    transition: color 0.2s;
}

.filter-tag-remove:hover {
    color: #f44336;
}

/* Pagination */
.pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 25px 0;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
}

.pagination-info {
    color: #a0a0b8;
    font-size: 14px;
}

.pagination-controls {
    display: flex;
    gap: 8px;
    align-items: center;
}

.pagination-btn {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
    background: rgba(102, 126, 234, 0.2);
    border-color: #667eea;
}

.pagination-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.pagination-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
}

.per-page-selector {
    display: flex;
    align-items: center;
    gap: 10px;
}

.per-page-selector select {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
}
</style>

<div class="container">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 20px;">
        <div>
            <h1 style="font-size: 32px; margin-bottom: 10px;">
                🛍️ Test E-Commerce Interattivo
            </h1>
            <p style="font-size: 16px; color: #a0a0b8;">
                Interfaccia e-commerce completa con filtri funzionanti e dettaglio prodotto
            </p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
            <div class="lang-selector">
                <?php foreach ($languages as $lang): ?>
                    <a href="?lang=<?= $lang ?>" class="lang-btn <?= $selectedLang === $lang ? 'active' : '' ?>">
                        <?= strtoupper($lang) ?>
                    </a>
                <?php endforeach; ?>
            </div>
            <a href="<?= ADMIN_URL ?>" class="btn btn-secondary">← Dashboard</a>
        </div>
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

        <!-- Layout E-Commerce -->
        <div class="ecommerce-layout">
            <!-- Sidebar Filtri -->
            <aside class="sidebar">
                <!-- Search Box -->
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="Cerca prodotti...">
                </div>

                <!-- Filtri attivi -->
                <div id="activeFilters" class="active-filters" style="display: none;"></div>

                <!-- Reset filtri -->
                <button id="resetFilters" class="btn btn-secondary" style="width: 100%; margin-bottom: 20px; display: none;">
                    🔄 Reset Filtri
                </button>

                <!-- Categorie (se disponibili) -->
                <?php if (!empty($categoriesData)): ?>
                <div class="filter-section">
                    <h3>🏠 Categorie</h3>
                    <?php foreach ($categoriesData as $field => $categoryData): ?>
                        <div class="category-filter"
                             data-category-field="<?= htmlspecialchars($field) ?>"
                             onclick="toggleCategoryFilter(this)">
                            <div class="category-icon"><?= htmlspecialchars($categoryData['icon']) ?></div>
                            <div class="category-name"><?= htmlspecialchars($categoryData['label']) ?></div>
                            <?php if (!empty($categoryData['description'])): ?>
                                <div class="category-description"><?= htmlspecialchars($categoryData['description']) ?></div>
                            <?php endif; ?>
                            <div class="category-badge" style="background: <?= htmlspecialchars($categoryData['color']) ?>33; color: <?= htmlspecialchars($categoryData['color']) ?>;">
                                <?= $categoryData['count'] ?> prodott<?= $categoryData['count'] === 1 ? 'o' : 'i' ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>

                <!-- Filtri da config -->
                <?php foreach ($filtersData as $field => $filterData): ?>
                    <div class="filter-section">
                        <h3><?= htmlspecialchars($filterData['label']) ?></h3>

                        <?php if ($filterData['type'] === 'range'): ?>
                            <!-- Range Slider (Prezzo) -->
                            <div class="range-slider">
                                <input type="range"
                                       id="price_min"
                                       min="<?= floor($filterData['min']) ?>"
                                       max="<?= ceil($filterData['max']) ?>"
                                       value="<?= floor($filterData['min']) ?>"
                                       step="1">
                                <input type="range"
                                       id="price_max"
                                       min="<?= floor($filterData['min']) ?>"
                                       max="<?= ceil($filterData['max']) ?>"
                                       value="<?= ceil($filterData['max']) ?>"
                                       step="1">
                                <div class="range-values">
                                    <span>€<span id="price_min_value"><?= floor($filterData['min']) ?></span></span>
                                    <span>€<span id="price_max_value"><?= ceil($filterData['max']) ?></span></span>
                                </div>
                            </div>

                        <?php elseif ($filterData['type'] === 'select'): ?>
                            <!-- Select Dropdown -->
                            <select class="filter-select"
                                    data-filter-field="<?= htmlspecialchars($field) ?>"
                                    onchange="applyFilters()">
                                <option value="">Tutte le opzioni</option>
                                <?php foreach ($filterData['values'] as $value): ?>
                                    <option value="<?= htmlspecialchars($value) ?>">
                                        <?= is_bool($value) ? ($value ? 'Sì' : 'No') : htmlspecialchars($value) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>

                        <?php elseif ($filterData['type'] === 'tags'): ?>
                            <!-- Tags/Chips -->
                            <div class="filter-tags">
                                <?php foreach ($filterData['values'] as $value): ?>
                                    <span class="filter-tag-chip"
                                          data-filter-field="<?= htmlspecialchars($field) ?>"
                                          data-filter-value="<?= htmlspecialchars($value) ?>"
                                          onclick="toggleTagFilter(this)">
                                        <?= is_bool($value) ? ($value ? 'Sì' : 'No') : htmlspecialchars($value) ?>
                                    </span>
                                <?php endforeach; ?>
                            </div>

                        <?php elseif ($filterData['type'] === 'checkbox'): ?>
                            <!-- Checkbox Multi-select -->
                            <?php foreach ($filterData['values'] as $value): ?>
                                <div class="filter-option">
                                    <input type="checkbox"
                                           id="filter_<?= htmlspecialchars($field) ?>_<?= htmlspecialchars($value) ?>"
                                           data-filter-field="<?= htmlspecialchars($field) ?>"
                                           data-filter-value="<?= htmlspecialchars($value) ?>">
                                    <label for="filter_<?= htmlspecialchars($field) ?>_<?= htmlspecialchars($value) ?>">
                                        <?= is_bool($value) ? ($value ? 'Sì' : 'No') : htmlspecialchars($value) ?>
                                    </label>
                                    <span class="filter-count" id="count_<?= htmlspecialchars($field) ?>_<?= htmlspecialchars($value) ?>">0</span>
                                </div>
                            <?php endforeach; ?>

                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>

                <!-- Filtro Varianti -->
                <?php
                $hasVariants = array_filter($allProducts, function($p) {
                    return !empty($p['variants']) && count($p['variants']) > 1;
                });
                if (!empty($hasVariants)):
                ?>
                <div class="filter-section">
                    <h3>🔀 Tipo Prodotto</h3>
                    <div class="filter-option">
                        <input type="checkbox" id="filterHasVariants">
                        <label for="filterHasVariants">Con varianti</label>
                        <span class="filter-count" id="countHasVariants"><?= count($hasVariants) ?></span>
                    </div>
                </div>
                <?php endif; ?>

                <!-- Filtro Risorse -->
                <?php
                $hasResources = array_filter($allProducts, function($p) {
                    return !empty($p['risorse']);
                });
                if (!empty($hasResources)):
                ?>
                <div class="filter-section">
                    <h3>📦 Contenuti</h3>
                    <div class="filter-option">
                        <input type="checkbox" id="filterHasResources">
                        <label for="filterHasResources">Con risorse scaricabili</label>
                        <span class="filter-count" id="countHasResources"><?= count($hasResources) ?></span>
                    </div>
                </div>
                <?php endif; ?>
            </aside>

            <!-- Main Content -->
            <main>
                <!-- Categorie Homepage (se disponibili) -->
                <?php if (!empty($categoriesData)): ?>
                <div style="margin-bottom: 40px;">
                    <h2 style="color: #764ba2; margin-bottom: 25px; font-size: 24px;">
                        🏠 Categorie
                    </h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                        <?php foreach ($categoriesData as $field => $categoryData): ?>
                        <div class="category-card"
                             data-category-field="<?= htmlspecialchars($field) ?>"
                             onclick="filterByCategory('<?= htmlspecialchars($field) ?>')"
                             style="background: linear-gradient(135deg, <?= htmlspecialchars($categoryData['color']) ?>22 0%, <?= htmlspecialchars($categoryData['color']) ?>11 100%); border: 2px solid <?= htmlspecialchars($categoryData['color']) ?>44; border-radius: 16px; padding: 25px; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden;">

                            <!-- Decorative circle -->
                            <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: <?= htmlspecialchars($categoryData['color']) ?>22; border-radius: 50%;"></div>

                            <div style="position: relative; z-index: 1;">
                                <div style="font-size: 48px; margin-bottom: 15px;">
                                    <?= htmlspecialchars($categoryData['icon']) ?>
                                </div>
                                <div style="font-weight: 600; color: #fff; font-size: 18px; margin-bottom: 8px;">
                                    <?= htmlspecialchars($categoryData['label']) ?>
                                </div>
                                <?php if (!empty($categoryData['description'])): ?>
                                <div style="font-size: 13px; color: #a0a0b8; margin-bottom: 15px; line-height: 1.4;">
                                    <?= htmlspecialchars($categoryData['description']) ?>
                                </div>
                                <?php endif; ?>
                                <div style="display: inline-block; padding: 6px 12px; background: <?= htmlspecialchars($categoryData['color']) ?>44; border-radius: 12px; font-size: 12px; color: <?= htmlspecialchars($categoryData['color']) ?>; font-weight: 600;">
                                    <?= $categoryData['count'] ?> prodott<?= $categoryData['count'] === 1 ? 'o' : 'i' ?>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endif; ?>

                <!-- Results Header -->
                <div class="results-header">
                    <div class="results-count">
                        <span id="resultsCount"><?= count($allProducts) ?></span> prodotti trovati
                    </div>
                    <div class="per-page-selector">
                        <span style="color: #a0a0b8; font-size: 14px;">Prodotti per pagina:</span>
                        <select id="perPageSelect" onchange="changePerPage()">
                            <option value="9">9</option>
                            <option value="10" selected>10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                    <a href="/admin/pages/export.php" class="btn btn-secondary" style="font-size: 14px; padding: 8px 16px;">
                        🚀 Nuovo Export
                    </a>
                </div>

                <!-- Pagination Top -->
                <div class="pagination-container" id="paginationTop">
                    <div class="pagination-info">
                        Pagina <span id="currentPageTop">1</span> di <span id="totalPagesTop">1</span>
                        <span style="margin-left: 10px;">
                            (Mostrando <span id="showingFromTop">1</span>-<span id="showingToTop">10</span> di <span id="totalProductsTop"><?= count($allProducts) ?></span>)
                        </span>
                    </div>
                    <div class="pagination-controls">
                        <button class="pagination-btn" id="prevBtnTop" onclick="prevPage()" disabled>← Precedente</button>
                        <div id="pageNumbersTop" style="display: flex; gap: 5px;"></div>
                        <button class="pagination-btn" id="nextBtnTop" onclick="nextPage()">Successivo →</button>
                    </div>
                </div>

                <!-- Products Grid -->
                <div class="products-grid" id="productsGrid">
                    <?php foreach ($allProducts as $index => $product): ?>
                        <?php
                        $images = [];
                        if (!empty($product['immagini'])) {
                            $images = $product['immagini'];
                        } elseif (!empty($product['immagine'])) {
                            $images = [$product['immagine']];
                        }
                        $mainImage = !empty($images) ? $images[0] : '';

                        // Estrai attributi per filtri - memorizza JSON
                        $attributesJson = [];
                        if (!empty($product['attributi'])) {
                            foreach ($product['attributi'] as $key => $value) {
                                $attributesJson[$key] = extractSimpleAttributeValue($value);
                            }
                        }
                        ?>
                        <div class="product-card"
                             data-product-index="<?= $index ?>"
                             data-price="<?= $product['prezzo'] ?? 0 ?>"
                             data-has-variants="<?= !empty($product['variants']) && count($product['variants']) > 1 ? '1' : '0' ?>"
                             data-has-resources="<?= !empty($product['risorse']) ? '1' : '0' ?>"
                             data-attributes='<?= htmlspecialchars(json_encode($attributesJson), ENT_QUOTES) ?>'
                             onclick="openProductModal(<?= $index ?>)">

                            <?php if ($mainImage): ?>
                                <img src="<?= htmlspecialchars($mainImage) ?>"
                                     alt="<?= htmlspecialchars(getTranslatedValue($product['nome'] ?? '', $selectedLang)) ?>"
                                     class="product-image"
                                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%22%23333%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23666%22 font-size=%2240%22%3E📦%3C/text%3E%3C/svg%3E'">
                            <?php else: ?>
                                <div class="product-image" style="display: flex; align-items: center; justify-content: center; font-size: 64px;">
                                    📦
                                </div>
                            <?php endif; ?>

                            <div class="product-info">
                                <h3 class="product-name">
                                    <?= htmlspecialchars(getTranslatedValue($product['nome'] ?? 'N/A', $selectedLang)) ?>
                                </h3>
                                <div class="product-code">
                                    <?= htmlspecialchars($product['codice'] ?? 'N/A') ?>
                                </div>
                                <div class="product-price">
                                    €<?= number_format($product['prezzo'] ?? 0, 2, ',', '.') ?>
                                </div>
                                <div class="product-badges">
                                    <?php if (!empty($product['variants']) && count($product['variants']) > 1): ?>
                                        <span class="badge badge-variant">🔀 <?= count($product['variants']) ?> varianti</span>
                                    <?php endif; ?>
                                    <?php if (!empty($product['risorse'])): ?>
                                        <span class="badge badge-resources">📦 <?= count($product['risorse']) ?> risorse</span>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>

                <!-- Empty State -->
                <div id="emptyState" class="empty-state" style="display: none;">
                    <div class="empty-state-icon">🔍</div>
                    <h3 style="color: #667eea; margin-bottom: 10px;">Nessun prodotto trovato</h3>
                    <p>Prova a modificare i filtri di ricerca</p>
                </div>

                <!-- Pagination Bottom -->
                <div class="pagination-container" id="paginationBottom">
                    <div class="pagination-info">
                        Pagina <span id="currentPageBottom">1</span> di <span id="totalPagesBottom">1</span>
                        <span style="margin-left: 10px;">
                            (Mostrando <span id="showingFromBottom">1</span>-<span id="showingToBottom">10</span> di <span id="totalProductsBottom"><?= count($allProducts) ?></span>)
                        </span>
                    </div>
                    <div class="pagination-controls">
                        <button class="pagination-btn" id="prevBtnBottom" onclick="prevPage()" disabled>← Precedente</button>
                        <div id="pageNumbersBottom" style="display: flex; gap: 5px;"></div>
                        <button class="pagination-btn" id="nextBtnBottom" onclick="nextPage()">Successivo →</button>
                    </div>
                </div>
            </main>
        </div>

        <!-- Modal Dettaglio Prodotto -->
        <div id="productModal" class="modal">
            <div class="modal-content">
                <button class="modal-close" onclick="closeProductModal()">×</button>
                <div class="modal-body" id="modalBody">
                    <!-- Contenuto caricato dinamicamente -->
                </div>
            </div>
        </div>

    <?php endif; ?>
</div>

<script>
// Dati prodotti
const products = <?= json_encode($allProducts) ?>;
const currentLang = '<?= $selectedLang ?>';
const filtersConfig = <?= json_encode($filtersData) ?>;
const categoriesData = <?= json_encode($categoriesData) ?>;

// Pagination variables
let currentPage = 1;
let perPage = 10;
let visibleProducts = [];

// Funzione helper per ottenere valore tradotto
function getTranslatedValue(value, lang) {
    if (typeof value === 'object' && value !== null && value[lang]) {
        return value[lang];
    }
    return value;
}

// Funzione per estrarre valore semplice da attributo
function extractSimpleValue(attrValue) {
    if (typeof attrValue === 'object' && attrValue !== null) {
        if (attrValue.value !== undefined) {
            if (typeof attrValue.value === 'object' && attrValue.value !== null) {
                const values = Object.values(attrValue.value);
                return values.length > 0 ? values[0] : null;
            }
            return attrValue.value;
        }
    }
    return attrValue;
}

// Gestione filtri
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    // Prezzo
    const priceMin = document.getElementById('price_min') ? parseInt(document.getElementById('price_min').value) : 0;
    const priceMax = document.getElementById('price_max') ? parseInt(document.getElementById('price_max').value) : 999999;

    const hasVariantsFilter = document.getElementById('filterHasVariants')?.checked;
    const hasResourcesFilter = document.getElementById('filterHasResources')?.checked;

    // Raccogli filtri attributi checkbox attivi
    const attributeFilters = {};
    document.querySelectorAll('.filter-option input[type="checkbox"][data-filter-field]:checked').forEach(checkbox => {
        const field = checkbox.dataset.filterField;
        const value = checkbox.dataset.filterValue;
        if (!attributeFilters[field]) {
            attributeFilters[field] = [];
        }
        attributeFilters[field].push(value);
    });

    // Raccogli filtri select attivi
    document.querySelectorAll('.filter-select[data-filter-field]').forEach(select => {
        const field = select.dataset.filterField;
        const value = select.value;
        if (value) {
            if (!attributeFilters[field]) {
                attributeFilters[field] = [];
            }
            attributeFilters[field].push(value);
        }
    });

    // Raccogli filtri tags attivi
    document.querySelectorAll('.filter-tag-chip.active[data-filter-field]').forEach(tag => {
        const field = tag.dataset.filterField;
        const value = tag.dataset.filterValue;
        if (!attributeFilters[field]) {
            attributeFilters[field] = [];
        }
        attributeFilters[field].push(value);
    });

    // Raccogli categorie attive
    const activeCategories = [];
    document.querySelectorAll('.category-filter.active[data-category-field]').forEach(cat => {
        activeCategories.push(cat.dataset.categoryField);
    });

    // Filtra prodotti
    const productCards = document.querySelectorAll('.product-card');
    visibleProducts = [];

    productCards.forEach((card) => {
        const index = parseInt(card.dataset.productIndex);
        const product = products[index];
        let visible = true;

        // Filtro ricerca testuale
        if (searchTerm) {
            const nome = getTranslatedValue(product.nome || '', currentLang).toLowerCase();
            const codice = (product.codice || '').toLowerCase();
            const descrizione = getTranslatedValue(product.descrizione || '', currentLang).toLowerCase();

            visible = visible && (nome.includes(searchTerm) || codice.includes(searchTerm) || descrizione.includes(searchTerm));
        }

        // Filtro prezzo
        const price = parseFloat(card.dataset.price);
        visible = visible && (price >= priceMin && price <= priceMax);

        // Filtro varianti
        if (hasVariantsFilter) {
            visible = visible && card.dataset.hasVariants === '1';
        }

        // Filtro risorse
        if (hasResourcesFilter) {
            visible = visible && card.dataset.hasResources === '1';
        }

        // Filtri categorie
        if (activeCategories.length > 0) {
            try {
                const cardAttributes = JSON.parse(card.dataset.attributes || '{}');
                const matchesCategory = activeCategories.some(catField => {
                    const catValue = cardAttributes[catField];
                    return catValue === true || catValue === 'true' || catValue === 1 || catValue === '1';
                });
                visible = visible && matchesCategory;
            } catch (e) {
                console.error('Errore parsing categorie:', e);
            }
        }

        // Filtri attributi
        try {
            const cardAttributes = JSON.parse(card.dataset.attributes || '{}');

            for (const [field, values] of Object.entries(attributeFilters)) {
                if (values.length > 0) {
                    const productValue = cardAttributes[field];
                    const match = values.some(v => {
                        const vStr = String(v);
                        const prodStr = String(productValue);

                        if (vStr === 'true' || vStr === 'false') {
                            return vStr === prodStr;
                        }

                        return vStr === prodStr;
                    });
                    visible = visible && match;
                }
            }
        } catch (e) {
            console.error('Errore parsing attributi:', e, card.dataset.attributes);
        }

        if (visible) {
            visibleProducts.push(card);
        }
    });

    // Reset alla prima pagina
    currentPage = 1;

    // Aggiorna contatore risultati
    document.getElementById('resultsCount').textContent = visibleProducts.length;

    // Mostra empty state
    document.getElementById('emptyState').style.display = visibleProducts.length === 0 ? 'block' : 'none';
    document.getElementById('productsGrid').style.display = visibleProducts.length === 0 ? 'none' : 'grid';

    // Applica paginazione
    updatePagination();

    // Aggiorna contatori filtri
    updateFilterCounts();

    // Mostra filtri attivi
    updateActiveFilters();
}

// Aggiorna contatori per ogni filtro
function updateFilterCounts() {
    // Contatori per filtri attributi
    document.querySelectorAll('.filter-option input[type="checkbox"][data-filter-field]').forEach(checkbox => {
        const field = checkbox.dataset.filterField;
        const value = checkbox.dataset.filterValue;

        const count = products.filter(p => {
            const attrValue = p.attributi?.[field];
            const simpleValue = extractSimpleValue(attrValue);

            const valueStr = String(value);
            const simpleStr = String(simpleValue);

            if (valueStr === 'true' || valueStr === 'false') {
                return valueStr === simpleStr;
            }

            return valueStr === simpleStr;
        }).length;

        const countEl = checkbox.parentElement.querySelector('.filter-count');
        if (countEl) {
            countEl.textContent = count;
        }
    });
}

// Mostra filtri attivi
function updateActiveFilters() {
    const container = document.getElementById('activeFilters');
    const resetBtn = document.getElementById('resetFilters');
    const tags = [];

    // Ricerca
    const searchTerm = document.getElementById('searchInput').value;
    if (searchTerm) {
        tags.push({
            label: `Ricerca: "${searchTerm}"`,
            onClick: 'clearSearch()'
        });
    }

    // Prezzo
    if (document.getElementById('price_min')) {
        const priceMin = parseInt(document.getElementById('price_min').value);
        const priceMax = parseInt(document.getElementById('price_max').value);
        const originalMin = parseInt(document.getElementById('price_min').min);
        const originalMax = parseInt(document.getElementById('price_max').max);

        if (priceMin > originalMin || priceMax < originalMax) {
            tags.push({
                label: `Prezzo: €${priceMin} - €${priceMax}`,
                onClick: 'clearPriceFilter()'
            });
        }
    }

    // Altri filtri checkbox
    document.querySelectorAll('.filter-option input[type="checkbox"]:checked').forEach((checkbox, idx) => {
        const label = checkbox.nextElementSibling.textContent.trim();
        tags.push({
            label: label,
            onClick: `clearCheckbox('${checkbox.id}')`
        });
    });

    if (tags.length > 0) {
        container.innerHTML = tags.map(tag => `
            <div class="filter-tag">
                <span>${tag.label}</span>
                <span class="filter-tag-remove" onclick="${tag.onClick}">×</span>
            </div>
        `).join('');
        container.style.display = 'flex';
        resetBtn.style.display = 'block';
    } else {
        container.style.display = 'none';
        resetBtn.style.display = 'none';
    }
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    applyFilters();
}

function clearPriceFilter() {
    if (document.getElementById('price_min')) {
        const originalMin = parseInt(document.getElementById('price_min').min);
        const originalMax = parseInt(document.getElementById('price_max').max);
        document.getElementById('price_min').value = originalMin;
        document.getElementById('price_max').value = originalMax;
        document.getElementById('price_min_value').textContent = originalMin;
        document.getElementById('price_max_value').textContent = originalMax;
    }
    applyFilters();
}

function clearCheckbox(id) {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        checkbox.checked = false;
        applyFilters();
    }
}

// Reset tutti i filtri
document.getElementById('resetFilters')?.addEventListener('click', () => {
    clearSearch();
    clearPriceFilter();
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.filter-select').forEach(sel => sel.value = '');
    document.querySelectorAll('.filter-tag-chip').forEach(tag => tag.classList.remove('active'));
    document.querySelectorAll('.category-filter').forEach(cat => cat.classList.remove('active'));
    applyFilters();
});

// Toggle tag filter
function toggleTagFilter(tagElement) {
    tagElement.classList.toggle('active');
    applyFilters();
}

// Toggle category filter
function toggleCategoryFilter(catElement) {
    catElement.classList.toggle('active');
    applyFilters();
}

// Filter by category (from homepage category cards)
function filterByCategory(categoryField) {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reset all filters first
    clearSearch();
    if (document.getElementById('price_min')) {
        clearPriceFilter();
    }
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.filter-select').forEach(sel => sel.value = '');
    document.querySelectorAll('.filter-tag-chip').forEach(tag => tag.classList.remove('active'));
    document.querySelectorAll('.category-filter').forEach(cat => cat.classList.remove('active'));

    // Activate only the clicked category in sidebar
    document.querySelectorAll('.category-filter').forEach(cat => {
        if (cat.dataset.categoryField === categoryField) {
            cat.classList.add('active');
        }
    });

    // Apply filters
    applyFilters();
}

// Pagination functions
function updatePagination() {
    const totalProducts = visibleProducts.length;
    const totalPages = Math.ceil(totalProducts / perPage);

    // Hide all products first
    document.querySelectorAll('.product-card').forEach(card => {
        card.style.display = 'none';
    });

    // Show only products for current page
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, totalProducts);

    for (let i = startIndex; i < endIndex; i++) {
        if (visibleProducts[i]) {
            visibleProducts[i].style.display = 'block';
        }
    }

    // Update pagination info (both top and bottom)
    const showingFrom = totalProducts > 0 ? startIndex + 1 : 0;
    const showingTo = endIndex;

    ['Top', 'Bottom'].forEach(pos => {
        document.getElementById(`currentPage${pos}`).textContent = currentPage;
        document.getElementById(`totalPages${pos}`).textContent = totalPages;
        document.getElementById(`showingFrom${pos}`).textContent = showingFrom;
        document.getElementById(`showingTo${pos}`).textContent = showingTo;
        document.getElementById(`totalProducts${pos}`).textContent = totalProducts;

        // Update buttons
        document.getElementById(`prevBtn${pos}`).disabled = currentPage === 1;
        document.getElementById(`nextBtn${pos}`).disabled = currentPage >= totalPages;

        // Update page numbers
        const pageNumbersContainer = document.getElementById(`pageNumbers${pos}`);
        pageNumbersContainer.innerHTML = '';

        // Show max 5 page numbers
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = 'pagination-btn' + (i === currentPage ? ' active' : '');
            btn.textContent = i;
            btn.onclick = () => goToPage(i);
            pageNumbersContainer.appendChild(btn);
        }
    });

    // Show/hide pagination containers
    const showPagination = totalProducts > perPage;
    document.getElementById('paginationTop').style.display = showPagination ? 'flex' : 'none';
    document.getElementById('paginationBottom').style.display = showPagination ? 'flex' : 'none';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextPage() {
    const totalPages = Math.ceil(visibleProducts.length / perPage);
    if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        updatePagination();
    }
}

function goToPage(page) {
    currentPage = page;
    updatePagination();
}

function changePerPage() {
    perPage = parseInt(document.getElementById('perPageSelect').value);
    currentPage = 1;
    applyFilters();
}

// Event listeners per filtri
document.getElementById('searchInput')?.addEventListener('input', applyFilters);

if (document.getElementById('price_min')) {
    document.getElementById('price_min').addEventListener('input', function() {
        document.getElementById('price_min_value').textContent = this.value;
        applyFilters();
    });
}

if (document.getElementById('price_max')) {
    document.getElementById('price_max').addEventListener('input', function() {
        document.getElementById('price_max_value').textContent = this.value;
        applyFilters();
    });
}

document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', applyFilters);
});

// Modal dettaglio prodotto
function openProductModal(index) {
    const product = products[index];
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');

    // Immagini
    let images = [];
    if (product.immagini && product.immagini.length > 0) {
        images = product.immagini;
    } else if (product.immagine) {
        images = [product.immagine];
    }

    // Helper per escapare HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Costruisci HTML modal
    let html = `
        <div class="modal-grid">
            <!-- Colonna Sinistra: Gallery -->
            <div>
                ${images.length > 0 ? `
                    <div class="gallery-main">
                        <img id="galleryMainImage" src="${escapeHtml(images[0])}" alt="Prodotto">
                    </div>
                    ${images.length > 1 ? `
                        <div class="gallery-thumbs">
                            ${images.map((img, i) => `
                                <div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="changeGalleryImage(${i})">
                                    <img src="${escapeHtml(img)}" alt="Thumb ${i}">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                ` : `
                    <div class="gallery-main" style="display: flex; align-items: center; justify-content: center; font-size: 100px;">
                        📦
                    </div>
                `}
            </div>

            <!-- Colonna Destra: Info -->
            <div>
                <h2 style="color: #fff; margin: 0 0 10px 0; font-size: 28px;">
                    ${escapeHtml(getTranslatedValue(product.nome || 'N/A', currentLang))}
                </h2>
                <div style="font-family: monospace; color: #667eea; margin-bottom: 20px; font-size: 14px;">
                    SKU: ${escapeHtml(product.codice || 'N/A')}
                </div>

                ${product.descrizione ? `
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                        <p style="color: #a0a0b8; line-height: 1.6; margin: 0;">
                            ${escapeHtml(getTranslatedValue(product.descrizione, currentLang))}
                        </p>
                    </div>
                ` : ''}

                <div style="font-size: 36px; color: #4caf50; font-weight: bold; margin-bottom: 30px;">
                    €${(product.prezzo || 0).toFixed(2).replace('.', ',')}
                </div>

                ${product.disponibilita !== undefined ? `
                    <div style="margin-bottom: 20px; padding: 12px; background: ${product.disponibilita > 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}; border-radius: 8px;">
                        <strong style="color: ${product.disponibilita > 0 ? '#4caf50' : '#f44336'};">
                            ${product.disponibilita > 0 ? '✓ Disponibile' : '✗ Non disponibile'}
                            ${product.disponibilita > 0 ? ` (${product.disponibilita} pz)` : ''}
                        </strong>
                    </div>
                ` : ''}
            </div>
        </div>

        <!-- Attributi -->
        ${product.attributi && Object.keys(product.attributi).length > 0 ? `
            <div style="background: rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
                <h3 style="color: #667eea; margin: 0 0 20px 0;">📌 Attributi</h3>
                <div class="attributes-grid">
                    ${Object.entries(product.attributi).map(([key, value]) => {
                        let attrLabel = key;
                        let attrValue = value;

                        // Gestisci attributi tradotti
                        if (typeof value === 'object' && value !== null) {
                            if (value.label) {
                                attrLabel = getTranslatedValue(value.label, currentLang);
                            }
                            if (value.value !== undefined) {
                                attrValue = getTranslatedValue(value.value, currentLang);
                            }
                        }

                        return `
                            <div class="attribute-item">
                                <div class="attribute-label">${escapeHtml(attrLabel)}</div>
                                <div class="attribute-value">
                                    ${typeof attrValue === 'boolean' ? (attrValue ? '✓ Sì' : '✗ No') : escapeHtml(String(attrValue))}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : ''}

        <!-- Risorse -->
        ${product.risorse && product.risorse.length > 0 ? `
            <div style="background: rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
                <h3 style="color: #667eea; margin: 0 0 20px 0;">📦 Risorse Scaricabili (${product.risorse.length})</h3>
                <div class="resources-grid">
                    ${product.risorse.map(resource => `
                        <a href="${escapeHtml(resource.url)}" target="_blank" class="resource-item">
                            <div class="resource-icon">${resource.icon}</div>
                            <div class="resource-info">
                                <div class="resource-category">${escapeHtml(resource.category)}</div>
                                <div class="resource-ext">.${escapeHtml(resource.extension)}</div>
                            </div>
                            <div style="color: #667eea; font-size: 20px;">⬇</div>
                        </a>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <!-- Varianti -->
        ${product.variants && product.variants.length > 1 ? `
            <div style="background: rgba(153, 102, 255, 0.1); border: 2px solid rgba(153, 102, 255, 0.3); padding: 25px; border-radius: 12px; margin-top: 25px;">
                <h3 style="color: #9966ff; margin: 0 0 20px 0;">🔀 Varianti (${product.variants.length})</h3>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${product.variants.map((variant, idx) => `
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 3px solid #9966ff;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                <div>
                                    <div style="font-weight: 600; color: #fff; margin-bottom: 5px;">Variante ${idx + 1}</div>
                                    <div style="font-family: monospace; color: #667eea; font-size: 12px;">
                                        SKU: ${escapeHtml(variant.codice || 'N/A')}
                                    </div>
                                </div>
                                <div style="font-size: 20px; font-weight: bold; color: #4caf50;">
                                    €${(variant.prezzo || 0).toFixed(2).replace('.', ',')}
                                </div>
                            </div>
                            ${variant.attributi ? `
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin-top: 10px;">
                                    ${Object.entries(variant.attributi).map(([key, value]) => {
                                        let attrLabel = key;
                                        let attrValue = value;
                                        if (typeof value === 'object' && value !== null) {
                                            if (value.label) attrLabel = getTranslatedValue(value.label, currentLang);
                                            if (value.value !== undefined) attrValue = getTranslatedValue(value.value, currentLang);
                                        }
                                        return `
                                            <div style="background: rgba(255, 255, 255, 0.05); padding: 8px; border-radius: 6px;">
                                                <div style="font-size: 10px; color: #a0a0b8; margin-bottom: 3px;">${escapeHtml(attrLabel)}</div>
                                                <div style="font-size: 12px; color: #fff; font-weight: 500;">
                                                    ${typeof attrValue === 'boolean' ? (attrValue ? '✓ Sì' : '✗ No') : escapeHtml(String(attrValue))}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    modalBody.innerHTML = html;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Store images per gallery
    window.currentGalleryImages = images;
}

// Helper function to escape HTML (reuse from modal)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function changeGalleryImage(index) {
    document.getElementById('galleryMainImage').src = window.currentGalleryImages[index];
    document.querySelectorAll('.gallery-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

// Chiudi modal con ESC o click fuori
document.getElementById('productModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeProductModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeProductModal();
    }
});

// Inizializza contatori e paginazione al caricamento
updateFilterCounts();

// Inizializza paginazione
visibleProducts = Array.from(document.querySelectorAll('.product-card'));
updatePagination();
</script>

<?php include '../includes/footer.php'; ?>
