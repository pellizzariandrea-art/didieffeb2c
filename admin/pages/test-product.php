<?php
require_once '../config.php';
require_once '../includes/functions.php';

// Helper per costruire condizioni di filtro
function buildFilterCondition($filter, $cleanFieldName) {
    $operator = $filter['operator'];
    $value = $filter['value'] ?? null;

    // Usa il nome campo pulito per il parametro (senza punti o caratteri speciali)
    $paramName = ':filter_' . preg_replace('/[^a-zA-Z0-9_]/', '_', $cleanFieldName);

    switch ($operator) {
        case '=':
        case '!=':
        case '>':
        case '<':
        case '>=':
        case '<=':
            return "$operator $paramName";
        case 'LIKE':
            return "LIKE $paramName";
        case 'NOT LIKE':
            return "NOT LIKE $paramName";
        case 'IS NULL':
            return "IS NULL";
        case 'IS NOT NULL':
            return "IS NOT NULL";
        default:
            return "= $paramName";
    }
}

// API endpoint per cercare prodotti (ricerca completa nel database)
if (isset($_GET['action']) && $_GET['action'] === 'search_products') {
    try {
        $query = trim($_GET['query'] ?? '');

        if (strlen($query) < 2) {
            echo json_encode(['success' => false, 'error' => 'Query troppo corta']);
            exit;
        }

        $dbConfig = loadDBConfig();
        $mappings = loadMappingConfig();
        $filterConfig = loadFilterConfig();
        $tableConfig = loadTableConfig();

        if (!$dbConfig || !$mappings) {
            echo json_encode(['success' => false, 'error' => 'Configurazione mancante']);
            exit;
        }

        // Trova i campi codice e nome nel mapping
        $codiceColumn = null;
        $nomeColumn = null;
        foreach ($mappings as $mapping) {
            if ($mapping['targetField'] === 'codice') {
                $codiceColumn = $mapping['dbColumn'];
            }
            if ($mapping['targetField'] === 'nome') {
                $nomeColumn = $mapping['dbColumn'];
            }
        }

        // Debug: valori originali
        $debugInfo = [
            'codiceColumn_original' => $codiceColumn,
            'nomeColumn_original' => $nomeColumn,
            'tableConfig' => $tableConfig ? [
                'mainTable' => $tableConfig['mainTable'],
                'hasJoins' => !empty($tableConfig['joins'])
            ] : null
        ];

        // Costruisci query di ricerca
        $pdo = connectDB($dbConfig);

        if ($tableConfig) {
            // Con JOIN
            $whereClause = " WHERE (";
            $conditions = [];

            if ($codiceColumn) {
                // Rimuovi il prefisso tabella se presente
                $codiceField = $codiceColumn;
                if (strpos($codiceField, '.') !== false) {
                    $parts = explode('.', $codiceField, 2);
                    $codiceField = isset($parts[1]) && $parts[1] !== '' ? $parts[1] : $parts[0];
                    $debugInfo['codiceField_cleaned'] = $codiceField;
                    $debugInfo['codiceField_parts'] = $parts;
                }
                $conditions[] = "`{$tableConfig['mainTable']}`.`$codiceField` LIKE :query";
            }

            if ($nomeColumn) {
                // Rimuovi il prefisso tabella se presente
                $nomeField = $nomeColumn;
                if (strpos($nomeField, '.') !== false) {
                    $parts = explode('.', $nomeField, 2);
                    $nomeField = isset($parts[1]) && $parts[1] !== '' ? $parts[1] : $parts[0];
                    $debugInfo['nomeField_cleaned'] = $nomeField;
                    $debugInfo['nomeField_parts'] = $parts;
                }
                $conditions[] = "`{$tableConfig['mainTable']}`.`$nomeField` LIKE :query";
            }

            $whereClause .= implode(' OR ', $conditions) . ")";

            // Applica filtri se configurati
            if (!empty($filterConfig)) {
                $debugInfo['filters'] = [];
                foreach ($filterConfig as $filter) {
                    $filterField = $filter['field'];

                    // Rimuovi il prefisso tabella se presente
                    $cleanFilterField = $filterField;
                    if (strpos($cleanFilterField, '.') !== false) {
                        $parts = explode('.', $cleanFilterField, 2);
                        if (count($parts) === 2 && !empty($parts[1])) {
                            $cleanFilterField = $parts[1];
                        } else {
                            // Se il campo dopo il punto è vuoto, skippa questo filtro
                            $debugInfo['filters'][] = [
                                'original' => $filterField,
                                'cleaned' => $cleanFilterField,
                                'operator' => $filter['operator'],
                                'skipped' => true,
                                'reason' => 'Campo vuoto dopo il punto'
                            ];
                            continue;
                        }
                    }

                    // Skippa filtri con campo vuoto
                    if (empty(trim($cleanFilterField))) {
                        $debugInfo['filters'][] = [
                            'original' => $filterField,
                            'cleaned' => $cleanFilterField,
                            'operator' => $filter['operator'],
                            'skipped' => true,
                            'reason' => 'Campo vuoto'
                        ];
                        continue;
                    }

                    $debugInfo['filters'][] = [
                        'original' => $filterField,
                        'cleaned' => $cleanFilterField,
                        'operator' => $filter['operator'],
                        'skipped' => false
                    ];

                    $whereClause .= " AND `{$tableConfig['mainTable']}`.`$cleanFilterField` " . buildFilterCondition($filter, $cleanFilterField);
                }
            }

            $sql = buildSelectQuery($tableConfig, $whereClause, 50); // Limite 50 risultati
        } else {
            // Senza JOIN
            $conditions = [];
            if ($codiceColumn) {
                $conditions[] = "`$codiceColumn` LIKE :query";
            }
            if ($nomeColumn) {
                $conditions[] = "`$nomeColumn` LIKE :query";
            }
            $whereClause = " WHERE (" . implode(' OR ', $conditions) . ")";

            // Applica filtri se configurati
            if (!empty($filterConfig)) {
                foreach ($filterConfig as $filter) {
                    $filterField = $filter['field'];

                    // Rimuovi il prefisso tabella se presente
                    $cleanFilterField = $filterField;
                    if (strpos($cleanFilterField, '.') !== false) {
                        $parts = explode('.', $cleanFilterField, 2);
                        if (count($parts) === 2 && !empty($parts[1])) {
                            $cleanFilterField = $parts[1];
                        } else {
                            // Se il campo dopo il punto è vuoto, skippa questo filtro
                            continue;
                        }
                    }

                    // Skippa filtri con campo vuoto
                    if (empty(trim($cleanFilterField))) {
                        continue;
                    }

                    $whereClause .= " AND `$cleanFilterField` " . buildFilterCondition($filter, $cleanFilterField);
                }
            }

            $sql = "SELECT * FROM `{$dbConfig['table']}` $whereClause LIMIT 50";
        }

        // Debug SQL finale
        $debugInfo['sql'] = $sql;
        $debugInfo['whereClause'] = $whereClause ?? 'N/A';

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':query', "%$query%");

        // Bind filter values se presenti
        if (!empty($filterConfig)) {
            foreach ($filterConfig as $filter) {
                if ($filter['operator'] !== 'IS NULL' && $filter['operator'] !== 'IS NOT NULL') {
                    // Usa il nome campo pulito per il parametro (senza punti)
                    $filterField = $filter['field'];
                    $cleanFilterField = $filterField;
                    if (strpos($cleanFilterField, '.') !== false) {
                        $parts = explode('.', $cleanFilterField, 2);
                        if (count($parts) === 2 && !empty($parts[1])) {
                            $cleanFilterField = $parts[1];
                        } else {
                            // Skippa filtro con campo vuoto
                            continue;
                        }
                    }

                    // Skippa filtri con campo vuoto
                    if (empty(trim($cleanFilterField))) {
                        continue;
                    }

                    $paramName = ':filter_' . preg_replace('/[^a-zA-Z0-9_]/', '_', $cleanFilterField);
                    $stmt->bindValue($paramName, $filter['value']);
                }
            }
        }

        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Estrai codice e nome
        $products = [];
        foreach ($rows as $row) {
            $codice = null;
            if ($codiceColumn) {
                $codice = $row[$codiceColumn] ?? null;
                if ($codice === null && strpos($codiceColumn, '.') !== false) {
                    $parts = explode('.', $codiceColumn, 2);
                    if (count($parts) === 2) {
                        $codice = $row[$parts[1]] ?? null;
                    }
                }
            }

            $nome = null;
            if ($nomeColumn) {
                $nome = $row[$nomeColumn] ?? null;
                if ($nome === null && strpos($nomeColumn, '.') !== false) {
                    $parts = explode('.', $nomeColumn, 2);
                    if (count($parts) === 2) {
                        $nome = $row[$parts[1]] ?? null;
                    }
                }
            }

            if ($codice) {
                $products[] = [
                    'codice' => $codice,
                    'nome' => $nome ?? ''
                ];
            }
        }

        echo json_encode([
            'success' => true,
            'products' => $products,
            'total' => count($products),
            'debug' => $debugInfo
        ]);
        exit;

    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'debug' => $debugInfo ?? null
        ]);
        exit;
    }
}

// API endpoint per caricare lista prodotti (per autocomplete iniziale - solo primi 100)
if (isset($_GET['action']) && $_GET['action'] === 'get_products') {
    try {
        $dbConfig = loadDBConfig();
        $mappings = loadMappingConfig();
        $filterConfig = loadFilterConfig();

        if (!$dbConfig || !$mappings) {
            echo json_encode(['success' => false, 'error' => 'Configurazione mancante']);
            exit;
        }

        // Fetch primi 100 prodotti con filtri applicati
        if (!empty($filterConfig)) {
            $rows = fetchProductsWithFilters($dbConfig, $filterConfig, 100);
        } else {
            $rows = fetchProducts($dbConfig, 100);
        }

        // Estrai solo codice e nome
        $products = [];
        foreach ($rows as $row) {
            // Cerca campo codice
            $codice = null;
            foreach ($mappings as $mapping) {
                if ($mapping['targetField'] === 'codice') {
                    $dbColumn = $mapping['dbColumn'];
                    // Gestisci nome colonna con/senza alias
                    $codice = $row[$dbColumn] ?? null;
                    if ($codice === null && strpos($dbColumn, '.') !== false) {
                        $parts = explode('.', $dbColumn, 2);
                        if (count($parts) === 2) {
                            $codice = $row[$parts[1]] ?? null;
                        }
                    }
                    break;
                }
            }

            // Cerca campo nome
            $nome = null;
            foreach ($mappings as $mapping) {
                if ($mapping['targetField'] === 'nome') {
                    $dbColumn = $mapping['dbColumn'];
                    $nome = $row[$dbColumn] ?? null;
                    if ($nome === null && strpos($dbColumn, '.') !== false) {
                        $parts = explode('.', $dbColumn, 2);
                        if (count($parts) === 2) {
                            $nome = $row[$parts[1]] ?? null;
                        }
                    }
                    break;
                }
            }

            if ($codice) {
                $products[] = [
                    'codice' => $codice,
                    'nome' => $nome ?? ''
                ];
            }
        }

        echo json_encode(['success' => true, 'products' => $products]);
        exit;

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

// Test immagini con preview completa prodotto
$testResult = null;
$testLog = [];

if (isset($_GET['test']) && !empty($_GET['product_code'])) {
    $productCode = trim($_GET['product_code']);

    try {
        $testLog[] = "🔍 Inizio ricerca prodotto: <code>$productCode</code>";

        // Carica configurazioni necessarie
        $dbConfig = loadDBConfig();
        $mappings = loadMappingConfig();
        $filterConfig = loadFilterConfig();
        $imageSettings = loadImageSettings();

        if (!$dbConfig) {
            throw new Exception('Configurazione database non trovata');
        }
        if (!$mappings) {
            throw new Exception('Configurazione mapping non trovata');
        }

        $testLog[] = "✓ Configurazioni caricate";

        // Connetti al database
        $pdo = connectDB($dbConfig);
        $testLog[] = "✓ Connessione database stabilita";

        // Costruisci query per trovare il prodotto
        $tableConfig = loadTableConfig();
        if ($tableConfig) {
            $whereClause = " WHERE `{$tableConfig['mainTable']}`.`codice` = :code";
            $sql = buildSelectQuery($tableConfig, $whereClause, 1);
            $testLog[] = "✓ Query costruita con JOIN";
        } else {
            $table = $dbConfig['table'];
            $sql = "SELECT * FROM `$table` WHERE `codice` = :code LIMIT 1";
            $testLog[] = "✓ Query base (senza JOIN)";
        }

        $testLog[] = "📝 SQL: <code style='font-size: 11px;'>" . htmlspecialchars($sql) . "</code>";

        // Esegui query
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':code', $productCode);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new Exception("Prodotto con codice '$productCode' non trovato nel database");
        }

        $testLog[] = "✓ Prodotto trovato nel database";

        // Trasforma riga usando mapping
        if ($imageSettings['enabled']) {
            $product = transformRowWithImages($row, $mappings, $imageSettings);
            $testLog[] = "✓ Trasformazione applicata (con immagini multiple)";
        } else {
            $product = transformRow($row, $mappings);
            $testLog[] = "✓ Trasformazione applicata (solo immagine principale)";
        }

        // Carica varianti se sistema attivo
        $variantConfig = loadVariantConfig();
        $variantGroup = null;

        if (!empty($variantConfig['enabled']) && !empty($variantConfig['groupByField'])) {
            $testLog[] = "🔀 Sistema varianti attivo - ricerca varianti...";

            // Trova il valore del campo aggregatore per questo prodotto
            $groupByField = $variantConfig['groupByField'];
            $groupId = null;

            // Cerca il campo nel row originale
            if (isset($row[$groupByField])) {
                $groupId = $row[$groupByField];
            } elseif (strpos($groupByField, '.') !== false) {
                $parts = explode('.', $groupByField, 2);
                if (count($parts) === 2 && isset($row[$parts[1]])) {
                    $groupId = $row[$parts[1]];
                }
            }

            // Cerca case-insensitive
            if ($groupId === null) {
                $fieldLower = strtolower($groupByField);
                foreach ($row as $key => $value) {
                    if (strtolower($key) === $fieldLower) {
                        $groupId = $value;
                        break;
                    }
                }
            }

            if ($groupId !== null && $groupId !== '') {
                $testLog[] = "📊 Trovato gruppo varianti: <code>$groupId</code>";

                // Cerca tutti i prodotti con lo stesso groupId
                if ($tableConfig) {
                    $whereClause = " WHERE `{$tableConfig['mainTable']}`.`$groupByField` = :groupId";
                    $orderByField = $variantConfig['orderByField'] ?? '';
                    if (!empty($orderByField)) {
                        $whereClause .= " ORDER BY `{$tableConfig['mainTable']}`.`$orderByField` ASC";
                    }
                    $sql = buildSelectQuery($tableConfig, $whereClause, null);
                } else {
                    $sql = "SELECT * FROM `{$dbConfig['table']}` WHERE `$groupByField` = :groupId";
                    $orderByField = $variantConfig['orderByField'] ?? '';
                    if (!empty($orderByField)) {
                        $sql .= " ORDER BY `$orderByField` ASC";
                    }
                }

                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':groupId', $groupId);
                $stmt->execute();
                $variantRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $testLog[] = "✓ Trovate <strong>" . count($variantRows) . "</strong> varianti nel gruppo";

                // Trasforma tutte le varianti
                $variants = [];
                foreach ($variantRows as $vRow) {
                    if ($imageSettings['enabled']) {
                        $variants[] = transformRowWithImages($vRow, $mappings, $imageSettings);
                    } else {
                        $variants[] = transformRow($vRow, $mappings);
                    }
                }

                // Crea struttura gruppo varianti
                if (count($variants) > 1) {
                    $variantGroup = [
                        'groupId' => $groupId,
                        'master' => $variants[0],
                        'variants' => $variants,
                        'qualifiers' => $variantConfig['qualifiers'] ?? []
                    ];
                    $testLog[] = "✓ Gruppo varianti creato con " . count($variants) . " prodotti";
                } else {
                    $testLog[] = "ℹ️ Solo 1 prodotto nel gruppo - nessuna variante da mostrare";
                }
            } else {
                $testLog[] = "ℹ️ Prodotto non ha campo aggregatore varianti";
            }
        }

        // Log immagini trovate
        if (!empty($product['immagine'])) {
            $mainImageFile = basename($product['immagine']);
            $testLog[] = "📸 Immagine principale: <code>$mainImageFile</code>";

            if (!empty($product['immagini']) && count($product['immagini']) > 1) {
                $galleryCount = count($product['immagini']) - 1;
                $testLog[] = "🖼️ Gallery trovata: <strong>$galleryCount</strong> immagine/i aggiuntive";

                // Lista file gallery
                foreach (array_slice($product['immagini'], 1) as $idx => $imgUrl) {
                    $fileName = basename($imgUrl);
                    $testLog[] = "&nbsp;&nbsp;&nbsp;→ Gallery " . ($idx + 1) . ": <code style='font-size: 11px;'>$fileName</code>";
                }
            } else {
                $testLog[] = "ℹ️ Nessuna gallery trovata (solo immagine principale)";
            }
        } else {
            $testLog[] = "⚠️ Nessuna immagine trovata per questo prodotto";
        }

        $testLog[] = "✅ <strong>Test completato con successo</strong>";

        $testResult = [
            'product' => $product,
            'variantGroup' => $variantGroup,
            'success' => true
        ];

    } catch (Exception $e) {
        $testLog[] = "❌ <strong>Errore:</strong> " . htmlspecialchars($e->getMessage());
        $testResult = [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

include '../includes/header.php';
?>

<div class="container">
    <div class="header-section">
        <div>
            <h1>🧪 Test Singolo Prodotto</h1>
            <p class="subtitle">Verifica come apparirà un prodotto nel JSON di export con tutti i dettagli e le immagini gallery</p>
        </div>
        <a href="<?= ADMIN_URL ?>" class="btn btn-secondary">← Dashboard</a>
    </div>

    <!-- Info Box -->
    <div class="info-box">
        <h3>ℹ️ A Cosa Serve Questo Test</h3>
        <ul style="margin: 15px 0 0 20px; line-height: 1.8;">
            <li><strong>Preview Completa:</strong> Visualizza come apparirà esattamente il prodotto nel file JSON di export</li>
            <li><strong>Verifica Mapping:</strong> Controlla che tutti i campi del database siano mappati correttamente</li>
            <li><strong>Test Immagini:</strong> Verifica la scansione automatica delle immagini gallery dal filesystem</li>
            <li><strong>Debug:</strong> Log dettagliato di tutte le operazioni per diagnosticare eventuali problemi</li>
        </ul>
        <p style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 6px;">
            <strong>💡 Tip:</strong> Usa questo test prima di fare l'export completo per verificare che tutto funzioni correttamente!
        </p>
    </div>

    <!-- Form Ricerca Prodotto -->
    <div class="card">
        <h2>🔍 Cerca Prodotto</h2>
        <p>Inserisci un codice prodotto per vedere l'anteprima completa come apparirà nel JSON, incluse tutte le immagini gallery.</p>

        <form method="GET" class="form" style="max-width: 700px;">
            <div class="form-group" style="position: relative;">
                <label for="product_code">Cerca Prodotto</label>
                <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <div style="flex: 1; position: relative;">
                        <input
                            type="text"
                            id="product_search"
                            placeholder="Digita codice o nome prodotto..."
                            class="form-control"
                            style="font-size: 16px;"
                            autocomplete="off"
                        >
                        <input
                            type="hidden"
                            id="product_code"
                            name="product_code"
                            value="<?= htmlspecialchars($_GET['product_code'] ?? '') ?>"
                        >
                        <div id="search-results" style="display: none; position: absolute; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 8px; margin-top: 5px; max-height: 300px; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15); width: 100%;"></div>
                    </div>
                    <button type="button" id="search-btn" class="btn btn-secondary" style="padding: 12px 20px; white-space: nowrap;">
                        🔍 Cerca
                    </button>
                </div>
                <small>Digita codice o nome prodotto e clicca Cerca per vedere i risultati</small>
            </div>
            <div id="selected-product" style="display: none; margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-radius: 8px; border: 2px solid #667eea;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 12px; color: #667eea; font-weight: 600; margin-bottom: 5px;">PRODOTTO SELEZIONATO</div>
                        <div style="font-family: monospace; font-size: 14px; color: #495057; font-weight: bold;" id="selected-code"></div>
                        <div style="font-size: 14px; color: #212529; margin-top: 3px;" id="selected-name"></div>
                    </div>
                    <button type="button" onclick="clearSelection()" style="background: none; border: none; color: #dc3545; cursor: pointer; font-size: 20px; padding: 5px 10px;">×</button>
                </div>
            </div>
            <input type="hidden" name="test" value="1">
            <button type="submit" class="btn btn-primary" id="submit-btn" disabled>
                🔍 Carica Preview Prodotto
            </button>
        </form>

<script>
let products = [];
let debounceTimer = null;

// Carica prodotti all'avvio
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();

    // Inizializza stato pulsanti
    document.getElementById('search-btn').disabled = true;

    // Se c'è già un codice selezionato, mostralo
    const selectedCode = document.getElementById('product_code').value;
    if (selectedCode) {
        document.getElementById('product_search').value = selectedCode;
        document.getElementById('submit-btn').disabled = false;
        document.getElementById('search-btn').disabled = false;
    }

    // Gestione input: nascondi risultati quando si modifica il testo
    document.getElementById('product_search').addEventListener('input', function(e) {
        const query = e.target.value.trim();

        // Nascondi risultati quando si modifica
        document.getElementById('search-results').style.display = 'none';

        // Aggiorna il campo nascosto con il valore corrente
        document.getElementById('product_code').value = query;

        // Abilita pulsanti se c'è del testo
        document.getElementById('search-btn').disabled = query.length < 2;
        document.getElementById('submit-btn').disabled = query.length === 0;
    });

    // Pulsante Cerca: ricerca completa nel database
    document.getElementById('search-btn').addEventListener('click', async function() {
        const query = document.getElementById('product_search').value.trim();

        if (query.length < 2) {
            alert('Inserisci almeno 2 caratteri per cercare');
            return;
        }

        console.log('Cerca cliccato, query:', query);

        // Mostra loading
        const container = document.getElementById('search-results');
        container.innerHTML = '<div style="padding: 20px; text-align: center; background: white;"><div style="color: #667eea;">🔍 Ricerca in corso...</div></div>';
        container.style.display = 'block';

        try {
            // Ricerca nel database completo
            const response = await fetch('<?= $_SERVER['PHP_SELF'] ?>?action=search_products&query=' + encodeURIComponent(query));
            const data = await response.json();

            // Mostra debug in console
            if (data.debug) {
                console.log('=== DEBUG SEARCH ===');
                console.log('Query:', query);
                console.log('Codice Column (original):', data.debug.codiceColumn_original);
                console.log('Nome Column (original):', data.debug.nomeColumn_original);
                console.log('Codice Field (cleaned):', data.debug.codiceField_cleaned);
                console.log('Nome Field (cleaned):', data.debug.nomeField_cleaned);
                console.log('Codice Parts:', data.debug.codiceField_parts);
                console.log('Nome Parts:', data.debug.nomeField_parts);
                console.log('Table Config:', data.debug.tableConfig);

                // Log dettagliato dei filtri
                if (data.debug.filters && data.debug.filters.length > 0) {
                    console.log('Filters (dettaglio):');
                    let hasSkipped = false;
                    data.debug.filters.forEach((filter, idx) => {
                        console.log(`  Filter ${idx + 1}:`, filter);
                        console.log(`    - original: "${filter.original}"`);
                        console.log(`    - cleaned: "${filter.cleaned}"`);
                        console.log(`    - operator: ${filter.operator}`);
                        if (filter.skipped) {
                            console.warn(`    ⚠️ SKIPPED: ${filter.reason}`);
                            hasSkipped = true;
                        }
                    });
                    if (hasSkipped) {
                        console.warn('⚠️ ATTENZIONE: Alcuni filtri hanno campi vuoti e sono stati ignorati. Controlla la configurazione dei filtri!');
                    }
                } else {
                    console.log('Filters: Nessun filtro');
                }

                console.log('WHERE Clause:', data.debug.whereClause);
                console.log('SQL:', data.debug.sql);
                console.log('===================');
            }

            if (data.success) {
                console.log('Risultati trovati nel database:', data.total);
                showResults(data.products, query);
            } else {
                console.error('Errore SQL:', data.error);
                container.innerHTML = '<div style="padding: 20px; text-align: center; background: white; color: #dc3545;">Errore: ' + data.error + '</div>';
            }
        } catch (error) {
            console.error('Errore ricerca:', error);
            container.innerHTML = '<div style="padding: 20px; text-align: center; background: white; color: #dc3545;">Errore di connessione</div>';
        }
    });

    // Permetti di premere Enter per cercare o sottomettere
    document.getElementById('product_search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = this.value.trim();

            if (query.length >= 2) {
                // Se il dropdown è aperto, chiudilo e mostra risultati
                if (document.getElementById('search-results').style.display === 'none') {
                    // Dropdown chiuso - mostra risultati
                    document.getElementById('search-btn').click();
                } else {
                    // Dropdown aperto - chiudilo e vai al submit se codice è lungo
                    if (query.length >= 4) {
                        document.getElementById('search-results').style.display = 'none';
                    }
                }
            }
        }
    });
});

async function loadProducts() {
    try {
        const response = await fetch('<?= $_SERVER['PHP_SELF'] ?>?action=get_products');
        const data = await response.json();
        if (data.success) {
            products = data.products;
            console.log('Caricati ' + products.length + ' prodotti');
        }
    } catch (error) {
        console.error('Errore caricamento prodotti:', error);
    }
}

function showResults(results) {
    const container = document.getElementById('search-results');
    const query = document.getElementById('product_search').value.trim();

    console.log('showResults chiamata, container:', container);
    console.log('Container display prima:', container.style.display);

    if (results.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; background: white;">
                <div style="margin-bottom: 15px; font-weight: bold; font-size: 16px; color: #6c757d;">
                    Nessun prodotto trovato
                </div>
                <div style="font-size: 13px; color: #495057;">
                    Prova a cercare con un termine diverso o digita il codice esatto completo e usa "Carica Preview Prodotto"
                </div>
            </div>
        `;
        container.style.display = 'block';
        return;
    }

    let html = '';
    results.forEach(product => {
        html += `
            <div onclick="selectProduct('${escapeHtml(product.codice)}', '${escapeHtml(product.nome || '')}')"
                 style="padding: 12px 15px; cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: background 0.2s;"
                 onmouseover="this.style.background='#f8f9fa'"
                 onmouseout="this.style.background='white'">
                <div style="font-family: monospace; font-size: 13px; color: #667eea; font-weight: 600; margin-bottom: 3px;">
                    ${escapeHtml(product.codice)}
                </div>
                <div style="font-size: 13px; color: #495057;">
                    ${escapeHtml(product.nome || 'Senza nome')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    container.style.display = 'block';
}

function selectProduct(code, name) {
    document.getElementById('product_code').value = code;
    document.getElementById('product_search').value = code;
    document.getElementById('search-results').style.display = 'none';

    // Mostra box prodotto selezionato
    document.getElementById('selected-code').textContent = code;
    document.getElementById('selected-name').textContent = name || 'Senza nome';
    document.getElementById('selected-product').style.display = 'block';

    // Abilita pulsante submit
    document.getElementById('submit-btn').disabled = false;

    // Scrolla verso il basso per mostrare il pulsante
    document.getElementById('selected-product').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearSelection() {
    document.getElementById('product_code').value = '';
    document.getElementById('product_search').value = '';
    document.getElementById('selected-product').style.display = 'none';
    document.getElementById('submit-btn').disabled = true;
    document.getElementById('search-btn').disabled = true;
    document.getElementById('product_search').focus();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Chiudi dropdown quando si clicca fuori
document.addEventListener('click', function(e) {
    if (!e.target.closest('#product_search') &&
        !e.target.closest('#search-results') &&
        !e.target.closest('#search-btn')) {
        document.getElementById('search-results').style.display = 'none';
    }
});
</script>

        <?php if ($testResult): ?>
            <!-- Log Operazioni -->
            <div style="margin-top: 30px; padding: 20px; background: #1e1e1e; border-radius: 10px; border: 2px solid #667eea;">
                <h3 style="color: #667eea; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                    📋 Log Operazioni
                </h3>
                <div style="font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.8; color: #d4d4d4;">
                    <?php foreach ($testLog as $logEntry): ?>
                        <div style="margin: 5px 0;"><?= $logEntry ?></div>
                    <?php endforeach; ?>
                </div>
            </div>

            <?php if ($testResult['success']): ?>
                <?php
                $product = $testResult['product'];
                $variantGroup = $testResult['variantGroup'] ?? null;
                ?>

                <!-- Preview Prodotto -->
                <div style="margin-top: 30px; padding: 25px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-radius: 12px; border: 2px solid #667eea;">
                    <h3 style="color: #667eea; margin-top: 0; display: flex; align-items: center; gap: 10px;">
                        🎨 Preview Prodotto
                    </h3>

                    <!-- Campi Base -->
                    <div style="background: rgba(255,255,255,0.9); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 150px; color: #495057;">Codice:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-family: monospace; color: #212529;"><?= htmlspecialchars($product['codice'] ?? 'N/A') ?></td>
                            </tr>
                            <?php if (isset($product['nome'])): ?>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #495057;">Nome:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; color: #212529;"><?= htmlspecialchars($product['nome']) ?></td>
                            </tr>
                            <?php endif; ?>
                            <?php if (isset($product['descrizione'])): ?>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #495057;">Descrizione:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; color: #212529;"><?= htmlspecialchars($product['descrizione']) ?></td>
                            </tr>
                            <?php endif; ?>
                            <?php if (isset($product['prezzo'])): ?>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #495057;">Prezzo:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; color: #28a745; font-size: 18px; font-weight: bold;">€ <?= number_format($product['prezzo'], 2, ',', '.') ?></td>
                            </tr>
                            <?php endif; ?>
                        </table>
                    </div>

                    <!-- Attributi -->
                    <?php if (!empty($product['attributi'])): ?>
                    <div style="background: rgba(255,255,255,0.9); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin-top: 0; color: #495057;">📌 Attributi:</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                            <?php foreach ($product['attributi'] as $key => $value): ?>
                                <div style="padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #667eea;">
                                    <div style="font-size: 11px; color: #6c757d; margin-bottom: 3px;"><?= htmlspecialchars($key) ?></div>
                                    <div style="font-weight: bold; color: #212529;">
                                        <?php if (is_bool($value)): ?>
                                            <?= $value ? '✓ Si' : '✗ No' ?>
                                        <?php else: ?>
                                            <?= htmlspecialchars($value) ?>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Gallery Immagini -->
                    <?php
                    // Determina quali immagini mostrare
                    $imagesToShow = [];
                    if (!empty($product['immagini'])) {
                        $imagesToShow = $product['immagini'];
                    } elseif (!empty($product['immagine'])) {
                        $imagesToShow = [$product['immagine']];
                    }
                    ?>

                    <?php if (!empty($imagesToShow)): ?>
                    <div style="background: rgba(255,255,255,0.9); padding: 20px; border-radius: 8px;">
                        <h4 style="margin-top: 0; color: #495057; display: flex; align-items: center; gap: 10px;">
                            📸 Immagini (<?= count($imagesToShow) ?>)
                            <?php if (count($imagesToShow) === 1): ?>
                                <span style="font-size: 12px; color: #856404; background: #fff3cd; padding: 4px 8px; border-radius: 4px; font-weight: normal;">
                                    ℹ️ Solo immagine principale (nessuna gallery trovata)
                                </span>
                            <?php else: ?>
                                <span style="font-size: 12px; color: #155724; background: #d4edda; padding: 4px 8px; border-radius: 4px; font-weight: normal;">
                                    ✓ Gallery completa
                                </span>
                            <?php endif; ?>
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;">
                            <?php foreach ($imagesToShow as $index => $imageUrl): ?>
                                <div style="border: 2px solid <?= $index === 0 ? '#667eea' : '#ddd' ?>; border-radius: 10px; padding: 12px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 4px 12px rgba(102,126,234,0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
                                    <div style="font-size: 11px; font-weight: bold; margin-bottom: 8px; color: <?= $index === 0 ? '#667eea' : '#6c757d' ?>;">
                                        <?= $index === 0 ? '⭐ Principale' : "🖼️ #" . ($index) ?>
                                    </div>
                                    <img
                                        src="<?= htmlspecialchars($imageUrl) ?>"
                                        alt="Immagine <?= $index ?>"
                                        style="width: 100%; height: 140px; object-fit: cover; border-radius: 6px; margin-bottom: 10px; cursor: pointer; background: #f8f9fa;"
                                        onclick="window.open('<?= htmlspecialchars($imageUrl) ?>', '_blank')"
                                        onerror="this.style.background='#f0f0f0'; this.style.border='2px dashed #ddd'; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2212%22%3E404%3C/text%3E%3C/svg%3E'"
                                    >
                                    <div style="font-size: 10px; color: #6c757d; word-break: break-all; font-family: monospace;">
                                        <?= basename($imageUrl) ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php else: ?>
                    <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border: 1px solid #dc3545; color: #721c24;">
                        <strong>❌ Nessuna immagine trovata per questo prodotto</strong>
                        <p style="margin: 10px 0 0 0; font-size: 13px;">
                            Verifica che il campo "immagine" sia mappato correttamente nella configurazione.
                        </p>
                    </div>
                    <?php endif; ?>

                    <!-- Risorse Scaricabili -->
                    <?php if (!empty($product['risorse'])): ?>
                    <div style="background: rgba(255,255,255,0.9); padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <h4 style="margin-top: 0; color: #495057; display: flex; align-items: center; gap: 10px;">
                            📦 Risorse Scaricabili (<?= count($product['risorse']) ?>)
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                            <?php foreach ($product['risorse'] as $resource): ?>
                                <a href="<?= htmlspecialchars($resource['url']) ?>" target="_blank" download style="display: flex; align-items: center; gap: 12px; padding: 15px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border: 2px solid #667eea; border-radius: 10px; text-decoration: none; transition: all 0.3s;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 6px 16px rgba(102,126,234,0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                    <div style="font-size: 32px;"><?= htmlspecialchars($resource['icon']) ?></div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 700; color: #667eea; font-size: 14px; margin-bottom: 3px;">
                                            <?= htmlspecialchars($resource['category']) ?>
                                        </div>
                                        <div style="font-size: 11px; color: #6c757d; font-family: monospace;">
                                            .<?= htmlspecialchars($resource['extension']) ?>
                                        </div>
                                    </div>
                                    <div style="color: #667eea; font-size: 20px;">⬇</div>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>

                <!-- Anteprima E-Commerce con Varianti -->
                <?php if ($variantGroup && count($variantGroup['variants']) > 1): ?>
                <div style="margin-top: 30px; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; border: 2px solid #667eea;">
                    <h3 style="color: white; margin-top: 0; margin-bottom: 20px;">🛒 Anteprima E-Commerce con Varianti</h3>
                    <p style="color: rgba(255,255,255,0.9); margin-bottom: 25px;">
                        Questo prodotto ha <strong><?= count($variantGroup['variants']) ?></strong> varianti. Ecco come apparirebbe in un catalogo o e-commerce:
                    </p>

                    <!-- Simulazione Scheda Prodotto E-Commerce -->
                    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                            <!-- Colonna Immagine -->
                            <div>
                                <div id="variant-image-container" style="border: 2px solid #e0e0e0; border-radius: 12px; overflow: hidden; background: #f8f9fa; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;">
                                    <img id="variant-main-image" src="<?= htmlspecialchars($variantGroup['master']['immagine'] ?? '') ?>" alt="Prodotto" style="width: 100%; height: 100%; object-fit: contain;">
                                </div>
                                <div id="variant-gallery" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 15px;">
                                    <!-- Gallery thumbnails generati dinamicamente -->
                                </div>
                            </div>

                            <!-- Colonna Informazioni -->
                            <div>
                                <h2 id="variant-name" style="color: #212529; margin-top: 0; font-size: 28px; margin-bottom: 15px;">
                                    <?= htmlspecialchars($variantGroup['master']['nome'] ?? 'Prodotto') ?>
                                </h2>
                                <div id="variant-code" style="font-family: monospace; color: #6c757d; font-size: 14px; margin-bottom: 15px;">
                                    SKU: <?= htmlspecialchars($variantGroup['master']['codice'] ?? '') ?>
                                </div>

                                <!-- Descrizione -->
                                <div id="variant-description-top" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
                                    <p style="color: #6c757d; line-height: 1.6; margin: 0; font-size: 14px;">
                                        <?= htmlspecialchars($variantGroup['master']['descrizione'] ?? '') ?>
                                    </p>
                                </div>

                                <div id="variant-price" style="font-size: 36px; color: #28a745; font-weight: bold; margin-bottom: 30px;">
                                    € <?= number_format($variantGroup['master']['prezzo'] ?? 0, 2, ',', '.') ?>
                                </div>

                                <!-- Selettori Varianti (solo non-booleani) -->
                                <?php
                                $textQualifiers = array_filter($variantGroup['qualifiers'], function($q) {
                                    return $q['type'] !== 'boolean';
                                });
                                $booleanQualifiers = array_filter($variantGroup['qualifiers'], function($q) {
                                    return $q['type'] === 'boolean';
                                });

                                // Ordina i selettori: prima quelli in rowQualifiersOrder, poi columnQualifier per ultimo
                                $orderedTextQualifiers = [];
                                $columnQual = $variantConfig['columnQualifier'] ?? null;
                                $rowOrder = $variantConfig['rowQualifiersOrder'] ?? [];

                                // Crea un map dei qualificatori per nome
                                $qualifierMap = [];
                                foreach ($textQualifiers as $q) {
                                    $qualifierMap[$q['attributeName']] = $q;
                                }

                                // Prima aggiungi quelli nell'ordine configurato (escluso columnQualifier)
                                foreach ($rowOrder as $qualName) {
                                    if (isset($qualifierMap[$qualName]) && $qualName !== $columnQual) {
                                        $orderedTextQualifiers[] = $qualifierMap[$qualName];
                                        unset($qualifierMap[$qualName]);
                                    }
                                }

                                // Poi aggiungi gli altri rimasti (escluso columnQualifier)
                                foreach ($qualifierMap as $qualName => $qual) {
                                    if ($qualName !== $columnQual) {
                                        $orderedTextQualifiers[] = $qual;
                                    }
                                }

                                // Infine aggiungi columnQualifier per ultimo
                                if ($columnQual && isset($qualifierMap[$columnQual])) {
                                    $orderedTextQualifiers[] = $qualifierMap[$columnQual];
                                }
                                ?>

                                <?php foreach ($orderedTextQualifiers as $qualifier):
                                    $qualifierName = $qualifier['attributeName'];

                                    // Raccogli tutti i valori unici per questo qualifier
                                    $uniqueValues = [];
                                    foreach ($variantGroup['variants'] as $v) {
                                        $value = $v['attributi'][$qualifierName] ?? null;
                                        if ($value !== null && $value !== '') {
                                            $uniqueValues[] = $value;
                                        }
                                    }
                                    $uniqueValues = array_unique($uniqueValues);

                                    if (empty($uniqueValues)) continue;
                                ?>
                                <div style="margin-bottom: 25px;">
                                    <label style="display: block; font-weight: 600; color: #495057; margin-bottom: 12px; font-size: 15px;">
                                        <?= htmlspecialchars($qualifierName) ?>
                                    </label>

                                    <!-- Bottoni per valori testuali -->
                                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                        <?php foreach ($uniqueValues as $value): ?>
                                        <button
                                            class="variant-option"
                                            data-qualifier="<?= htmlspecialchars($qualifierName) ?>"
                                            data-value="<?= htmlspecialchars($value) ?>"
                                            style="padding: 10px 20px; border: 2px solid #dee2e6; border-radius: 8px; background: white; color: #495057; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;"
                                            onmouseover="if(!this.classList.contains('active')) this.style.borderColor='#667eea'"
                                            onmouseout="if(!this.classList.contains('active')) this.style.borderColor='#dee2e6'"
                                        >
                                            <?= htmlspecialchars($value) ?>
                                        </button>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                                <?php endforeach; ?>

                                <!-- Indicatori Booleani (read-only, cambiano automaticamente) -->
                                <?php if (!empty($booleanQualifiers)): ?>
                                <div style="margin-bottom: 25px; padding: 15px; background: rgba(102, 126, 234, 0.05); border-radius: 10px; border: 1px solid rgba(102, 126, 234, 0.2);">
                                    <div style="font-size: 13px; color: #6c757d; margin-bottom: 10px; font-weight: 500;">
                                        ℹ️ Caratteristiche della variante selezionata:
                                    </div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                                        <?php foreach ($booleanQualifiers as $boolQualifier): ?>
                                        <div id="bool-indicator-<?= htmlspecialchars($boolQualifier['attributeName']) ?>" style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: white; border-radius: 8px; border: 2px solid #dee2e6;">
                                            <span style="font-weight: 600; color: #495057; font-size: 14px;">
                                                <?= htmlspecialchars($boolQualifier['attributeName']) ?>:
                                            </span>
                                            <span id="bool-value-<?= htmlspecialchars($boolQualifier['attributeName']) ?>" style="font-weight: 700; font-size: 14px;">
                                                <!-- Valore aggiornato via JS -->
                                            </span>
                                        </div>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                                <?php endif; ?>

                                <div id="variant-availability" style="padding: 15px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; color: #155724; margin-top: 20px; margin-bottom: 25px;">
                                    ✓ Prodotto disponibile
                                </div>

                                <!-- Risorse Scaricabili per la variante selezionata -->
                                <div id="variant-resources" style="display: none; margin-bottom: 25px;">
                                    <div style="padding: 15px; background: rgba(102, 126, 234, 0.05); border-radius: 10px; border: 2px solid rgba(102, 126, 234, 0.2);">
                                        <div style="font-size: 14px; font-weight: 600; color: #667eea; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                            📦 Risorse Scaricabili
                                        </div>
                                        <div id="variant-resources-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px;">
                                            <!-- Resources will be inserted here by JavaScript -->
                                        </div>
                                    </div>
                                </div>

                                <button style="width: 100%; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 18px; font-weight: 600; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 16px rgba(102,126,234,0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                    🛒 Aggiungi al Carrello
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                // Dati varianti
                const variants = <?= json_encode($variantGroup['variants'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>;
                const qualifiers = <?= json_encode($variantGroup['qualifiers']) ?>;
                const textQualifiers = qualifiers.filter(q => q.type !== 'boolean');
                const booleanQualifiers = qualifiers.filter(q => q.type === 'boolean');
                let currentSelection = {};

                // Inizializza con la prima variante
                document.addEventListener('DOMContentLoaded', function() {
                    selectVariant(variants[0]);

                    // Imposta selezione iniziale (solo per qualificatori non-booleani)
                    textQualifiers.forEach(q => {
                        const value = variants[0].attributi[q.attributeName];
                        currentSelection[q.attributeName] = value;

                        // Attiva il pulsante corrispondente
                        const options = document.querySelectorAll(`[data-qualifier="${q.attributeName}"]`);
                        options.forEach(opt => {
                            const optValue = opt.dataset.value;
                            const normalizedValue = normalizeValue(value, q.type);
                            const normalizedOptValue = normalizeValue(optValue, q.type);

                            if (normalizedValue === normalizedOptValue) {
                                activateOption(opt);
                            }
                        });
                    });

                    // Aggiorna disponibilità iniziale
                    updateAvailability();
                });

                // Normalizza valori per confronto
                function normalizeValue(value, type) {
                    if (type === 'boolean') {
                        if (typeof value === 'boolean') return value;
                        if (value === 'true' || value === '1' || value === 1) return true;
                        if (value === 'false' || value === '0' || value === 0) return false;
                    }
                    return String(value).trim();
                }

                // Event listener per selezione varianti (solo bottoni testuali)
                document.querySelectorAll('.variant-option').forEach(option => {
                    option.addEventListener('click', function(e) {
                        e.preventDefault();

                        // Non permettere click su bottoni disabilitati
                        if (this.classList.contains('disabled')) {
                            return;
                        }

                        const qualifier = this.dataset.qualifier;
                        const value = this.dataset.value;

                        // Aggiorna selezione
                        currentSelection[qualifier] = value;

                        // Aggiorna UI - deseleziona altri della stessa categoria
                        document.querySelectorAll(`[data-qualifier="${qualifier}"]`).forEach(opt => {
                            deactivateOption(opt);
                        });
                        activateOption(this);

                        // Trova variante corrispondente (solo basandosi sui qualificatori testuali)
                        const matchingVariant = findMatchingVariant(currentSelection);
                        if (matchingVariant) {
                            selectVariant(matchingVariant);
                        }

                        // Aggiorna disponibilità altri selettori
                        updateAvailability();
                    });
                });

                function activateOption(element) {
                    element.classList.add('active');
                    if (element.tagName === 'BUTTON') {
                        element.style.borderColor = '#667eea';
                        element.style.background = '#667eea';
                        element.style.color = 'white';
                    } else if (element.tagName === 'LABEL') {
                        element.style.borderColor = '#667eea';
                        element.style.background = 'rgba(102, 126, 234, 0.1)';
                    }
                }

                function deactivateOption(element) {
                    element.classList.remove('active');
                    if (element.tagName === 'BUTTON') {
                        element.style.borderColor = '#dee2e6';
                        element.style.background = 'white';
                        element.style.color = '#495057';
                    } else if (element.tagName === 'LABEL') {
                        element.style.borderColor = '#dee2e6';
                        element.style.background = 'white';
                    }
                }

                // Aggiorna disponibilità selettori in base alla selezione corrente
                function updateAvailability() {
                    textQualifiers.forEach(qualifier => {
                        const qualifierName = qualifier.attributeName;

                        // Per ogni bottone di questo qualificatore
                        document.querySelectorAll(`[data-qualifier="${qualifierName}"]`).forEach(button => {
                            const buttonValue = button.dataset.value;

                            // Non controllare il qualificatore attualmente selezionato
                            if (currentSelection[qualifierName] &&
                                normalizeValue(currentSelection[qualifierName], qualifier.type) === normalizeValue(buttonValue, qualifier.type)) {
                                enableOption(button);
                                return;
                            }

                            // Crea selezione temporanea con questo valore
                            const tempSelection = {...currentSelection, [qualifierName]: buttonValue};

                            // Verifica se esiste almeno una variante che matcha
                            const hasMatch = variants.some(variant => {
                                return textQualifiers.every(q => {
                                    const selectedValue = tempSelection[q.attributeName];
                                    if (!selectedValue) return true; // Se non selezionato, va bene qualsiasi valore

                                    const variantValue = variant.attributi[q.attributeName];
                                    return normalizeValue(selectedValue, q.type) === normalizeValue(variantValue, q.type);
                                });
                            });

                            if (hasMatch) {
                                enableOption(button);
                            } else {
                                disableOption(button);
                            }
                        });
                    });
                }

                function enableOption(element) {
                    element.classList.remove('disabled');
                    element.style.opacity = '1';
                    element.style.cursor = 'pointer';
                    element.style.borderStyle = 'solid';
                    element.removeAttribute('title');
                    if (!element.classList.contains('active')) {
                        element.style.borderColor = '#dee2e6';
                    }
                }

                function disableOption(element) {
                    element.classList.add('disabled');
                    element.style.opacity = '0.5';
                    element.style.cursor = 'not-allowed';
                    element.style.borderStyle = 'dashed';
                    element.style.borderColor = '#dee2e6';
                    element.style.background = '#f8f9fa';
                    element.style.color = '#6c757d';

                    // Trova i valori selezionati correnti per il tooltip
                    const selectedValues = Object.entries(currentSelection)
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(', ');

                    element.setAttribute('title', `Non disponibile con ${selectedValues}`);
                }

                function findMatchingVariant(selection) {
                    // Cerca variante che matcha SOLO i qualificatori testuali (non-booleani)
                    for (const variant of variants) {
                        let matches = true;
                        for (const [qualifier, value] of Object.entries(selection)) {
                            // Ignora i qualificatori booleani nel matching
                            const qConfig = textQualifiers.find(q => q.attributeName === qualifier);
                            if (!qConfig) continue;

                            const variantValue = variant.attributi[qualifier];
                            const normalizedSelection = normalizeValue(value, qConfig.type);
                            const normalizedVariant = normalizeValue(variantValue, qConfig.type);

                            if (normalizedSelection !== normalizedVariant) {
                                matches = false;
                                break;
                            }
                        }
                        if (matches) return variant;
                    }
                    return variants[0]; // Fallback alla prima variante
                }

                function selectVariant(variant) {
                    // Aggiorna immagine
                    const imgElement = document.getElementById('variant-main-image');
                    if (variant.immagine) {
                        imgElement.src = variant.immagine;
                    }

                    // Aggiorna gallery
                    const galleryContainer = document.getElementById('variant-gallery');
                    galleryContainer.innerHTML = '';
                    if (variant.immagini && variant.immagini.length > 1) {
                        variant.immagini.slice(0, 4).forEach(img => {
                            const thumb = document.createElement('div');
                            thumb.style.cssText = 'border: 2px solid #e0e0e0; border-radius: 8px; overflow: hidden; cursor: pointer; aspect-ratio: 1; background: #f8f9fa;';
                            thumb.innerHTML = `<img src="${img}" style="width: 100%; height: 100%; object-fit: cover;">`;
                            thumb.onclick = () => { imgElement.src = img; };
                            galleryContainer.appendChild(thumb);
                        });
                    }

                    // Aggiorna prezzo
                    document.getElementById('variant-price').textContent = '€ ' + variant.prezzo.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2});

                    // Aggiorna codice
                    document.getElementById('variant-code').textContent = 'SKU: ' + variant.codice;

                    // Aggiorna nome (se diverso)
                    if (variant.nome) {
                        document.getElementById('variant-name').textContent = variant.nome;
                    }

                    // Aggiorna descrizione
                    if (variant.descrizione) {
                        const descElement = document.getElementById('variant-description-top');
                        if (descElement) {
                            descElement.querySelector('p').textContent = variant.descrizione;
                        }
                    }

                    // Aggiorna indicatori booleani
                    booleanQualifiers.forEach(boolQ => {
                        const attrName = boolQ.attributeName;
                        const boolValue = variant.attributi[attrName];
                        const valueElement = document.getElementById('bool-value-' + attrName);
                        const indicatorElement = document.getElementById('bool-indicator-' + attrName);

                        if (valueElement && indicatorElement) {
                            // Aggiorna testo e colore
                            if (boolValue === true || boolValue === 'true' || boolValue === 1 || boolValue === '1') {
                                valueElement.textContent = '✓ Si';
                                valueElement.style.color = '#28a745';
                                indicatorElement.style.borderColor = '#c3e6cb';
                                indicatorElement.style.background = 'rgba(76, 175, 80, 0.05)';
                            } else {
                                valueElement.textContent = '✗ No';
                                valueElement.style.color = '#dc3545';
                                indicatorElement.style.borderColor = '#f5c6cb';
                                indicatorElement.style.background = 'rgba(220, 53, 69, 0.05)';
                            }
                        }
                    });

                    // Aggiorna risorse scaricabili
                    const resourcesContainer = document.getElementById('variant-resources');
                    const resourcesList = document.getElementById('variant-resources-list');

                    // Funzione per ottenere l'icona appropriata in base al tipo di risorsa
                    function getResourceIcon(extension) {
                        const ext = extension.toLowerCase();

                        // PDF - Documento rosso
                        if (ext === 'pdf') {
                            return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#dc3545" stroke="#dc3545" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M14 2V8H20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M9 13H15" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                                <path d="M9 17H15" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>`;
                        }

                        // DWG/DXF - Squadra
                        if (ext === 'dwg' || ext === 'dxf') {
                            return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 21L3 3L21 21L3 21Z" fill="#667eea" stroke="#667eea" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M6 18L6 6L18 18L6 18Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>`;
                        }

                        // Default - Documento generico
                        return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#667eea" stroke="#667eea" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14 2V8H20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9 13H15" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M9 17H15" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>`;
                    }

                    if (variant.risorse && variant.risorse.length > 0) {
                        resourcesList.innerHTML = '';
                        variant.risorse.forEach(resource => {
                            const resourceBtn = document.createElement('a');
                            resourceBtn.href = resource.url;
                            resourceBtn.target = '_blank';
                            resourceBtn.download = '';
                            resourceBtn.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 12px; background: white; border: 2px solid #667eea; border-radius: 8px; text-decoration: none; transition: all 0.3s; cursor: pointer;';
                            resourceBtn.onmouseover = function() {
                                this.style.transform = 'translateY(-2px)';
                                this.style.boxShadow = '0 4px 12px rgba(102,126,234,0.3)';
                            };
                            resourceBtn.onmouseout = function() {
                                this.style.transform = 'translateY(0)';
                                this.style.boxShadow = 'none';
                            };

                            resourceBtn.innerHTML = `
                                <div style="flex-shrink: 0;">${getResourceIcon(resource.extension)}</div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #667eea; font-size: 12px; line-height: 1.2;">
                                        ${resource.category}
                                    </div>
                                    <div style="font-size: 10px; color: #6c757d; font-family: monospace;">
                                        .${resource.extension}
                                    </div>
                                </div>
                                <div style="color: #667eea; font-size: 16px;">⬇</div>
                            `;

                            resourcesList.appendChild(resourceBtn);
                        });
                        resourcesContainer.style.display = 'block';
                    } else {
                        resourcesContainer.style.display = 'none';
                    }
                }
                </script>
                <?php endif; ?>

                <!-- Anteprima Catalogo Stampato -->
                <?php if ($variantGroup && count($variantGroup['variants']) > 1): ?>
                <div style="margin-top: 30px; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">
                    <h3 style="color: #212529; margin-top: 0; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                        📋 Anteprima Catalogo Stampato
                    </h3>
                    <p style="color: #6c757d; margin-bottom: 25px; font-size: 14px;">
                        Rappresentazione ottimizzata per cataloghi PDF/stampati con griglia comparativa delle varianti
                    </p>

                    <?php
                    // Calcola i campi comuni tra tutte le varianti (dai printCatalogFields configurati)
                    $commonFields = [];
                    $varyingFields = [];
                    $printCatalogFields = $variantConfig['printCatalogFields'] ?? [];

                    if (!empty($printCatalogFields)) {
                        foreach ($printCatalogFields as $fieldName) {
                            // Prendi il valore della prima variante
                            $firstValue = $variantGroup['variants'][0]['attributi'][$fieldName] ?? null;

                            // Controlla se è uguale in tutte le varianti
                            $isCommon = true;
                            foreach ($variantGroup['variants'] as $variant) {
                                $currentValue = $variant['attributi'][$fieldName] ?? null;
                                if ($currentValue !== $firstValue) {
                                    $isCommon = false;
                                    break;
                                }
                            }

                            if ($isCommon && $firstValue !== null && $firstValue !== '') {
                                $commonFields[$fieldName] = $firstValue;
                            } elseif (!$isCommon) {
                                $varyingFields[] = $fieldName;
                            }
                        }
                    }

                    // Calcola range di prezzo
                    $prices = array_map(fn($v) => $v['prezzo'], $variantGroup['variants']);
                    $minPrice = min($prices);
                    $maxPrice = max($prices);
                    $priceRange = $minPrice === $maxPrice
                        ? '€ ' . number_format($minPrice, 2, ',', '.')
                        : 'da € ' . number_format($minPrice, 2, ',', '.');
                    ?>

                    <!-- Header Prodotto -->
                    <div style="border-bottom: 2px solid #dee2e6; padding-bottom: 15px; margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: 100px 1fr auto; gap: 15px; align-items: center;">
                            <img src="<?= htmlspecialchars($variantGroup['master']['immagine'] ?? '') ?>"
                                 style="width: 100px; height: 100px; object-fit: contain; border: 2px solid #dee2e6; background: white; padding: 5px;"
                                 onerror="this.style.display='none'">
                            <div>
                                <h2 style="margin: 0 0 8px 0; color: #212529; font-size: 22px; font-weight: 700;">
                                    <?= htmlspecialchars($variantGroup['master']['nome'] ?? 'Prodotto') ?>
                                </h2>
                                <?php if (!empty($commonFields)): ?>
                                <div style="font-size: 13px; color: #495057; line-height: 1.6;">
                                    <?php
                                    $fieldPairs = [];
                                    foreach ($commonFields as $fieldName => $fieldValue) {
                                        // Formatta valori booleani
                                        $displayValue = $fieldValue;
                                        if ($fieldValue === '1' || $fieldValue === 1 || $fieldValue === true || $fieldValue === 'true') {
                                            $displayValue = 'Sì';
                                        } elseif ($fieldValue === '0' || $fieldValue === 0 || $fieldValue === false || $fieldValue === 'false') {
                                            $displayValue = 'No';
                                        }
                                        $fieldPairs[] = '<strong>' . htmlspecialchars($fieldName) . ':</strong> ' . htmlspecialchars($displayValue);
                                    }
                                    echo implode(' <span style="color: #dee2e6;">|</span> ', $fieldPairs);
                                    ?>
                                </div>
                                <?php endif; ?>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 20px; font-weight: 700; color: #28a745;">
                                    <?= $priceRange ?>
                                </div>
                                <div style="font-size: 11px; color: #6c757d; margin-top: 3px;">
                                    <?= count($variantGroup['variants']) ?> varianti
                                </div>
                            </div>
                        </div>
                    </div>

                    <?php
                    // Analizza la struttura delle varianti per creare la griglia
                    $textQualifiersGrid = array_filter($variantGroup['qualifiers'], fn($q) => $q['type'] !== 'boolean');
                    $booleanQualifiersGrid = array_filter($variantGroup['qualifiers'], fn($q) => $q['type'] === 'boolean');

                    // Determina quale qualificatore va in colonna (configurato o auto-detection)
                    $columnQualifier = null;

                    // Se configurato manualmente, usa quello
                    if (!empty($variantConfig['columnQualifier'])) {
                        $columnQualifier = $variantConfig['columnQualifier'];
                    } else {
                        // Altrimenti usa auto-detection: il qualificatore con più valori diventa colonne
                        $qualifierValueCounts = [];
                        foreach ($textQualifiersGrid as $q) {
                            $uniqueValues = array_unique(array_map(fn($v) => $v['attributi'][$q['attributeName']] ?? '', $variantGroup['variants']));
                            $qualifierValueCounts[$q['attributeName']] = count(array_filter($uniqueValues));
                        }
                        arsort($qualifierValueCounts);
                        $columnQualifier = array_key_first($qualifierValueCounts);
                    }

                    // Gli altri qualificatori testuali diventano righe
                    $textQualifierNames = array_map(fn($q) => $q['attributeName'], $textQualifiersGrid);
                    $availableForRows = array_filter($textQualifierNames, fn($k) => $k !== $columnQualifier);

                    // Se c'è un ordine configurato, usalo
                    if (!empty($variantConfig['rowQualifiersOrder'])) {
                        $rowQualifiers = array_values(array_filter(
                            $variantConfig['rowQualifiersOrder'],
                            fn($q) => in_array($q, $availableForRows)
                        ));
                    } else {
                        // Altrimenti usa tutti i qualificatori disponibili senza ordine particolare
                        $rowQualifiers = array_values($availableForRows);
                    }

                    // Raccogli tutti i valori per colonne (normalizza spazi)
                    $columnValues = array_unique(array_filter(array_map(
                        fn($v) => trim($v['attributi'][$columnQualifier] ?? ''),
                        $variantGroup['variants']
                    )));
                    sort($columnValues);

                    // Crea combinazioni per le righe (normalizza spazi)
                    $rowCombinations = [];
                    foreach ($variantGroup['variants'] as $variant) {
                        $rowKey = [];
                        foreach ($rowQualifiers as $rq) {
                            $rowKey[] = trim($variant['attributi'][$rq] ?? '');
                        }
                        $rowKeyStr = implode(' - ', array_filter($rowKey));
                        if (!empty($rowKeyStr) && !isset($rowCombinations[$rowKeyStr])) {
                            $rowCombinations[$rowKeyStr] = $rowKey;
                        }
                    }
                    ?>

                    <!-- Tabella Griglia Varianti -->
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: white; border: 2px solid #dee2e6;">
                            <thead>
                                <!-- Riga Super Header con nome qualificatore -->
                                <tr>
                                    <th style="padding: 8px 15px; border: none; background: transparent;"></th>
                                    <th colspan="<?= count($columnValues) ?>" style="padding: 8px 10px; text-align: center; font-weight: 700; border: 1px solid #dee2e6; border-bottom: none; border-top: none; background: #f8f9fa; font-size: 15px; color: #495057; text-transform: uppercase; letter-spacing: 0.5px;">
                                        <?= htmlspecialchars($columnQualifier) ?>
                                    </th>
                                </tr>
                                <!-- Riga Header con valori -->
                                <tr style="background: #495057; color: white;">
                                    <th style="padding: 12px 15px; text-align: left; font-weight: 700; border: 1px solid #dee2e6; font-size: 14px; color: white;">
                                        <?php
                                        if (empty($rowQualifiers)) {
                                            echo 'Variante';
                                        } else {
                                            echo implode(' / ', $rowQualifiers);
                                        }
                                        ?>
                                    </th>
                                    <?php foreach ($columnValues as $colVal): ?>
                                    <th style="padding: 12px 10px; text-align: center; font-weight: 700; border: 1px solid #dee2e6; min-width: 120px; font-size: 14px; color: white;">
                                        <?= htmlspecialchars($colVal) ?>
                                    </th>
                                    <?php endforeach; ?>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $rowIndex = 0;
                                if (empty($rowCombinations)) {
                                    // Caso semplice: una sola riga
                                    $rowCombinations = ['Variante' => []];
                                }

                                foreach ($rowCombinations as $rowLabel => $rowValues):
                                    $rowIndex++;
                                    $bgColor = $rowIndex % 2 === 0 ? '#f8f9fa' : 'white';

                                    // Trova la prima variante di questa riga per mostrare l'immagine
                                    $rowImageVariant = null;
                                    foreach ($variantGroup['variants'] as $variant) {
                                        $matches = true;
                                        if (!empty($rowQualifiers)) {
                                            foreach ($rowQualifiers as $idx => $rq) {
                                                $variantRowVal = trim($variant['attributi'][$rq] ?? '');
                                                $expectedRowVal = trim($rowValues[$idx] ?? '');
                                                if ($variantRowVal !== $expectedRowVal) {
                                                    $matches = false;
                                                    break;
                                                }
                                            }
                                        }
                                        if ($matches) {
                                            $rowImageVariant = $variant;
                                            break;
                                        }
                                    }
                                ?>
                                <tr style="background: <?= $bgColor ?>;">
                                    <td style="padding: 8px 12px; font-weight: 700; color: #212529; border: 1px solid #dee2e6; font-size: 13px; vertical-align: top;">
                                        <div style="margin-bottom: 4px;">
                                            <?= htmlspecialchars($rowLabel) ?>
                                        </div>
                                        <?php if ($rowImageVariant && !empty($rowImageVariant['immagine'])): ?>
                                        <div style="margin-top: 8px;">
                                            <img src="<?= htmlspecialchars($rowImageVariant['immagine']) ?>"
                                                 alt="<?= htmlspecialchars($rowLabel) ?>"
                                                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #dee2e6; background: white;"
                                                 onerror="this.style.display='none'">
                                        </div>
                                        <?php endif; ?>
                                    </td>
                                    <?php foreach ($columnValues as $colVal):
                                        // Trova la variante che corrisponde a questa cella
                                        $matchingVariant = null;
                                        foreach ($variantGroup['variants'] as $variant) {
                                            // Check colonna (normalizza spazi)
                                            $variantColVal = trim($variant['attributi'][$columnQualifier] ?? '');
                                            if ($variantColVal !== trim($colVal)) {
                                                continue;
                                            }

                                            // Check righe - se non ci sono rowQualifiers, matcha direttamente
                                            $matches = true;
                                            if (!empty($rowQualifiers)) {
                                                foreach ($rowQualifiers as $idx => $rq) {
                                                    $variantRowVal = trim($variant['attributi'][$rq] ?? '');
                                                    $expectedRowVal = trim($rowValues[$idx] ?? '');
                                                    if ($variantRowVal !== $expectedRowVal) {
                                                        $matches = false;
                                                        break;
                                                    }
                                                }
                                            }
                                            if ($matches) {
                                                $matchingVariant = $variant;
                                                break;
                                            }
                                        }
                                    ?>
                                    <td style="padding: 12px 10px; text-align: center; border: 1px solid #dee2e6; vertical-align: top;">
                                        <?php if ($matchingVariant): ?>
                                            <div style="display: flex; flex-direction: column; min-height: 100%; justify-content: space-between;">
                                                <!-- Contenuto principale cella -->
                                                <div>
                                                    <!-- Prezzo -->
                                                    <div style="font-size: 18px; font-weight: 700; color: #212529; margin-bottom: 6px;">
                                                        € <?= number_format($matchingVariant['prezzo'], 2, ',', '.') ?>
                                                    </div>

                                                    <!-- SKU -->
                                                    <div style="font-family: monospace; font-size: 10px; color: #6c757d; margin-bottom: 8px;">
                                                        <?= htmlspecialchars($matchingVariant['codice']) ?>
                                                    </div>

                                                    <!-- Campi variabili configurati -->
                                                    <?php if (!empty($varyingFields)): ?>
                                                    <div style="font-size: 10px; color: #495057; border-top: 1px solid #dee2e6; padding-top: 6px; margin-top: 6px;">
                                                        <?php foreach ($varyingFields as $fieldName): ?>
                                                            <?php
                                                            $fieldValue = $matchingVariant['attributi'][$fieldName] ?? '';
                                                            if ($fieldValue !== '' && $fieldValue !== null):
                                                            ?>
                                                            <div style="margin-bottom: 3px;">
                                                                <span style="color: #6c757d;"><?= htmlspecialchars($fieldName) ?>:</span>
                                                                <strong style="color: #212529;"><?= htmlspecialchars($fieldValue) ?></strong>
                                                            </div>
                                                            <?php endif; ?>
                                                        <?php endforeach; ?>
                                                    </div>
                                                    <?php endif; ?>

                                                    <!-- Caratteristiche booleane -->
                                                    <?php if (!empty($booleanQualifiersGrid)): ?>
                                                    <div style="font-size: 11px; color: #495057; border-top: 1px solid #dee2e6; padding-top: 6px; margin-top: 6px;">
                                                        <?php foreach ($booleanQualifiersGrid as $bq): ?>
                                                            <?php
                                                            $boolVal = $matchingVariant['attributi'][$bq['attributeName']] ?? false;
                                                            $icon = $boolVal ? '✓' : '✗';
                                                            ?>
                                                            <div style="font-weight: 600; color: #212529;">
                                                                <?= $icon ?> <?= htmlspecialchars($bq['attributeName']) ?>
                                                            </div>
                                                        <?php endforeach; ?>
                                                    </div>
                                                    <?php endif; ?>
                                                </div>

                                                <!-- Risorse Scaricabili - sempre alla fine -->
                                                <?php if (!empty($matchingVariant['risorse'])): ?>
                                                <div style="border-top: 1px solid #e9ecef; padding-top: 6px; margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap; justify-content: center;">
                                                    <?php foreach ($matchingVariant['risorse'] as $resource): ?>
                                                        <?php
                                                        // Determina l'icona in base all'estensione
                                                        $ext = strtolower($resource['extension']);
                                                        if ($ext === 'pdf') {
                                                            $iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#dc3545" stroke="#dc3545" stroke-width="1.5"/><path d="M14 2V8H20" stroke="white" stroke-width="1.5"/></svg>';
                                                            $bgColor = '#fff5f5';
                                                            $borderColor = '#dc3545';
                                                        } elseif ($ext === 'dwg' || $ext === 'dxf') {
                                                            $iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21L3 3L21 21L3 21Z" fill="#667eea" stroke="#667eea" stroke-width="1.5"/></svg>';
                                                            $bgColor = '#f5f7ff';
                                                            $borderColor = '#667eea';
                                                        } else {
                                                            $iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#667eea" stroke="#667eea" stroke-width="1.5"/></svg>';
                                                            $bgColor = '#f5f7ff';
                                                            $borderColor = '#667eea';
                                                        }
                                                        ?>
                                                        <a href="<?= htmlspecialchars($resource['url']) ?>"
                                                           target="_blank"
                                                           download
                                                           style="display: inline-flex; align-items: center; gap: 3px; padding: 3px 5px; background: <?= $bgColor ?>; border: 1px solid <?= $borderColor ?>; border-radius: 3px; text-decoration: none; cursor: pointer; transition: all 0.2s;"
                                                           title="<?= htmlspecialchars($resource['category']) ?>"
                                                           onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'"
                                                           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                                            <?= $iconSvg ?>
                                                            <span style="font-size: 7px; font-weight: 600; color: #6c757d; text-transform: uppercase;">
                                                                <?= htmlspecialchars($resource['extension']) ?>
                                                            </span>
                                                        </a>
                                                    <?php endforeach; ?>
                                                </div>
                                                <?php endif; ?>
                                            </div>
                                        <?php else: ?>
                                            <div style="color: #adb5bd; font-size: 20px; font-weight: 300;">—</div>
                                            <div style="color: #adb5bd; font-size: 10px;">Non disponibile</div>
                                        <?php endif; ?>
                                    </td>
                                    <?php endforeach; ?>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- Legenda -->
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #495057;">
                        <div style="font-weight: 600; color: #495057; margin-bottom: 8px; font-size: 13px;">📌 Legenda:</div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 12px; color: #6c757d;">
                            <div>• <strong>Prezzi</strong> IVA esclusa</div>
                            <div>• <strong>✓</strong> = Caratteristica presente</div>
                            <div>• <strong>✗</strong> = Caratteristica assente</div>
                            <div>• <strong>—</strong> = Combinazione non disponibile</div>
                        </div>

                        <!-- Risorse Scaricabili (compatte in fondo) -->
                        <?php if (!empty($variantGroup['master']['risorse'])): ?>
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #dee2e6; font-size: 10px; color: #6c757d;">
                            <strong style="color: #495057;">Risorse disponibili:</strong>
                            <?php
                            $resourceLinks = [];
                            foreach ($variantGroup['master']['risorse'] as $resource) {
                                $resourceLinks[] = htmlspecialchars($resource['category']) . ' (' . htmlspecialchars($resource['extension']) . ')';
                            }
                            echo implode(' • ', $resourceLinks);
                            ?>
                            <span style="font-style: italic;"> - Scaricabili dal sito web</span>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endif; ?>

                <!-- JSON Completo -->
                <div style="margin-top: 30px;">
                    <h3 style="color: #495057; margin-bottom: 15px;">📄 JSON Export Completo</h3>
                    <?php if ($variantGroup && count($variantGroup['variants']) > 1): ?>
                        <p style="color: #6c757d; margin-bottom: 15px;">
                            Questo prodotto ha <strong><?= count($variantGroup['variants']) ?></strong> varianti e verrà esportato con la seguente struttura raggruppata:
                        </p>
                        <?php
                        // Costruisci la struttura come verrà esportata
                        $exportStructure = [
                            'codice' => $variantGroup['master']['codice'],
                            'nome' => $variantGroup['master']['nome'],
                            'descrizione' => $variantGroup['master']['descrizione'],
                            'prezzo' => $variantGroup['master']['prezzo'],
                            'immagine' => $variantGroup['master']['immagine'],
                            'immagini' => $variantGroup['master']['immagini'] ?? null,
                            'variantGroupId' => (string)$variantGroup['groupId'],
                            'isVariantGroup' => true,
                            'variants' => []
                        ];

                        // Aggiungi tutte le varianti
                        foreach ($variantGroup['variants'] as $idx => $variant) {
                            // Estrai qualificatori
                            $variantQualifiers = [];
                            foreach ($variantGroup['qualifiers'] as $q) {
                                $attrName = $q['attributeName'];
                                if (isset($variant['attributi'][$attrName])) {
                                    $variantQualifiers[$attrName] = $variant['attributi'][$attrName];
                                }
                            }

                            $exportStructure['variants'][] = [
                                'codice' => $variant['codice'],
                                'variantOrder' => $idx + 1,
                                'qualifiers' => $variantQualifiers,
                                'prezzo' => $variant['prezzo'],
                                'immagine' => $variant['immagine'],
                                'immagini' => $variant['immagini'] ?? null,
                                'attributi' => $variant['attributi']
                            ];
                        }

                        // Aggiungi attributi master
                        $exportStructure['attributi'] = $variantGroup['master']['attributi'];

                        // Arrotonda tutti i float a 2 decimali
                        $exportStructure = roundFloatsRecursive($exportStructure, 2);

                        // Genera JSON con precisione corretta
                        ini_set('serialize_precision', 14);
                        $jsonOutput = json_encode($exportStructure, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                        $jsonOutput = forceDecimalsInJSON($jsonOutput, 2);
                        ?>
                        <pre style="background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 10px; overflow-x: auto; font-size: 13px; line-height: 1.6; border: 2px solid #dee2e6;"><?= $jsonOutput ?></pre>
                    <?php else: ?>
                        <p style="color: #6c757d; margin-bottom: 15px;">
                            Questo prodotto non ha varianti e verrà esportato come prodotto singolo:
                        </p>
                        <?php
                        // Arrotonda tutti i float a 2 decimali
                        $productRounded = roundFloatsRecursive($product, 2);

                        // Genera JSON con precisione corretta
                        ini_set('serialize_precision', 14);
                        $jsonOutput = json_encode($productRounded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                        $jsonOutput = forceDecimalsInJSON($jsonOutput, 2);
                        ?>
                        <pre style="background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 10px; overflow-x: auto; font-size: 13px; line-height: 1.6; border: 2px solid #dee2e6;"><?= $jsonOutput ?></pre>
                    <?php endif; ?>
                </div>

            <?php else: ?>
                <!-- Errore -->
                <div style="margin-top: 30px; padding: 20px; background: #f8d7da; border-radius: 10px; border: 2px solid #dc3545;">
                    <h3 style="color: #721c24; margin-top: 0;">❌ Errore</h3>
                    <p style="color: #721c24; font-weight: bold;"><?= htmlspecialchars($testResult['error']) ?></p>
                </div>
            <?php endif; ?>
        <?php endif; ?>
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

.info-box ul {
    margin: 15px 0 0 20px;
    line-height: 1.8;
}

.info-box code {
    background: rgba(255,255,255,0.2);
    padding: 3px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
}
</style>

<?php include '../includes/footer.php'; ?>
