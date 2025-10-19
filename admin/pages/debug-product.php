<?php
require_once '../config.php';
require_once '../includes/functions.php';

$debugResult = null;
$productCode = '';

if (isset($_GET['debug']) && !empty($_GET['product_code'])) {
    $productCode = trim($_GET['product_code']);

    try {
        $debugResult = [
            'code' => $productCode,
            'steps' => [],
            'finalResult' => null
        ];

        // Carica configurazioni
        $dbConfig = loadDBConfig();
        $filterConfig = loadFilterConfig();
        $tableConfig = loadTableConfig();

        if (!$dbConfig) {
            throw new Exception('Configurazione database non trovata');
        }

        $pdo = connectDB($dbConfig);

        // STEP 1: Cerca nella tabella principale
        $debugResult['steps'][] = [
            'step' => 1,
            'title' => 'Ricerca nella Tabella Principale',
            'description' => "Cerco il codice nella tabella principale: {$dbConfig['table']}",
            'query' => null,
            'found' => false,
            'count' => 0,
            'data' => null
        ];

        $mainTable = $dbConfig['table'];
        $sql = "SELECT * FROM `$mainTable` WHERE `codice` = :code";
        $debugResult['steps'][0]['query'] = $sql;

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':code', $productCode);
        $stmt->execute();
        $mainResult = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $debugResult['steps'][0]['found'] = count($mainResult) > 0;
        $debugResult['steps'][0]['count'] = count($mainResult);
        $debugResult['steps'][0]['data'] = $mainResult;

        // STEP 2: Cerca con JOIN (se configurato)
        if ($tableConfig) {
            $debugResult['steps'][] = [
                'step' => 2,
                'title' => 'Ricerca con JOIN',
                'description' => 'Applico i JOIN configurati alle tabelle secondarie',
                'query' => null,
                'found' => false,
                'count' => 0,
                'data' => null,
                'joins' => []
            ];

            $whereClause = " WHERE `{$tableConfig['mainTable']}`.`codice` = :code";
            $sql = buildSelectQuery($tableConfig, $whereClause, null);
            $debugResult['steps'][1]['query'] = $sql;
            $debugResult['steps'][1]['joins'] = $tableConfig['joins'];

            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':code', $productCode);
            $stmt->execute();
            $joinResult = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $debugResult['steps'][1]['found'] = count($joinResult) > 0;
            $debugResult['steps'][1]['count'] = count($joinResult);
            $debugResult['steps'][1]['data'] = $joinResult;
        }

        // STEP 3: Applica Filtri
        if (!empty($filterConfig)) {
            $debugResult['steps'][] = [
                'step' => 3,
                'title' => 'Applicazione Filtri',
                'description' => 'Applico i filtri configurati per vedere se il prodotto passa',
                'filters' => $filterConfig,
                'found' => false,
                'count' => 0,
                'data' => null,
                'filterDetails' => []
            ];

            // Cerca il prodotto con filtri
            $rows = fetchProductsWithFilters($dbConfig, $filterConfig, null);
            $filteredResult = array_filter($rows, function($row) use ($productCode) {
                return isset($row['codice']) && $row['codice'] === $productCode;
            });

            $stepIndex = $tableConfig ? 2 : 1;
            $debugResult['steps'][$stepIndex]['found'] = count($filteredResult) > 0;
            $debugResult['steps'][$stepIndex]['count'] = count($filteredResult);
            $debugResult['steps'][$stepIndex]['data'] = array_values($filteredResult);

            // Analizza ogni filtro individualmente
            $dataToCheck = $tableConfig && !empty($joinResult) ? $joinResult[0] : (!empty($mainResult) ? $mainResult[0] : null);

            if ($dataToCheck) {
                foreach ($filterConfig as $filter) {
                    $fieldValue = $dataToCheck[$filter['field']] ?? null;
                    $passes = false;
                    $reason = '';

                    switch ($filter['operator']) {
                        case 'equals':
                            $passes = ($fieldValue == $filter['value']);
                            $reason = $passes ?
                                "✓ '{$fieldValue}' = '{$filter['value']}'" :
                                "✗ '{$fieldValue}' ≠ '{$filter['value']}'";
                            break;
                        case 'not_equals':
                            $passes = ($fieldValue != $filter['value']);
                            $reason = $passes ?
                                "✓ '{$fieldValue}' ≠ '{$filter['value']}'" :
                                "✗ '{$fieldValue}' = '{$filter['value']}'";
                            break;
                        case 'contains':
                            $passes = (stripos($fieldValue, $filter['value']) !== false);
                            $reason = $passes ?
                                "✓ '{$fieldValue}' contiene '{$filter['value']}'" :
                                "✗ '{$fieldValue}' non contiene '{$filter['value']}'";
                            break;
                        case 'not_contains':
                            $passes = (stripos($fieldValue, $filter['value']) === false);
                            $reason = $passes ?
                                "✓ '{$fieldValue}' non contiene '{$filter['value']}'" :
                                "✗ '{$fieldValue}' contiene '{$filter['value']}'";
                            break;
                        case 'greater_than':
                            $passes = ($fieldValue > $filter['value']);
                            $reason = $passes ?
                                "✓ {$fieldValue} > {$filter['value']}" :
                                "✗ {$fieldValue} ≤ {$filter['value']}";
                            break;
                        case 'less_than':
                            $passes = ($fieldValue < $filter['value']);
                            $reason = $passes ?
                                "✓ {$fieldValue} < {$filter['value']}" :
                                "✗ {$fieldValue} ≥ {$filter['value']}";
                            break;
                        case 'is_null':
                            $passes = is_null($fieldValue) || $fieldValue === '';
                            $reason = $passes ?
                                "✓ Campo vuoto/null" :
                                "✗ Campo non vuoto: '{$fieldValue}'";
                            break;
                        case 'is_not_null':
                            $passes = !is_null($fieldValue) && $fieldValue !== '';
                            $reason = $passes ?
                                "✓ Campo non vuoto: '{$fieldValue}'" :
                                "✗ Campo vuoto/null";
                            break;
                    }

                    $debugResult['steps'][$stepIndex]['filterDetails'][] = [
                        'field' => $filter['field'],
                        'operator' => $filter['operator'],
                        'value' => $filter['value'],
                        'fieldValue' => $fieldValue,
                        'passes' => $passes,
                        'reason' => $reason
                    ];
                }
            }
        }

        // Determina risultato finale
        $lastStep = end($debugResult['steps']);
        $debugResult['finalResult'] = $lastStep['found'];

    } catch (Exception $e) {
        $debugResult['error'] = $e->getMessage();
    }
}

include '../includes/header.php';
?>

<div class="container">
    <div class="header-section">
        <div>
            <h1>🔍 Debug Ricerca Prodotto</h1>
            <p class="subtitle">Analizza passo-passo perché un prodotto non viene trovato</p>
        </div>
        <a href="<?= ADMIN_URL ?>" class="btn btn-secondary">← Dashboard</a>
    </div>

    <!-- Info Box -->
    <div class="info-box">
        <h3>ℹ️ Come Funziona</h3>
        <p style="margin: 15px 0 0 0; line-height: 1.8;">
            Questa pagina traccia ogni passaggio della ricerca prodotto:<br>
            <strong>1.</strong> Cerca nella tabella principale<br>
            <strong>2.</strong> Applica eventuali JOIN con altre tabelle<br>
            <strong>3.</strong> Applica i filtri configurati<br>
            <br>
            Per ogni step ti dice se il prodotto viene trovato o perso, così puoi capire esattamente dove sta il problema.
        </p>
    </div>

    <!-- Form Ricerca -->
    <div class="card">
        <h2>🔎 Inserisci Codice Prodotto</h2>

        <form method="GET" class="form" style="max-width: 600px;">
            <div class="form-group">
                <label for="product_code">Codice Prodotto</label>
                <input
                    type="text"
                    id="product_code"
                    name="product_code"
                    class="form-control"
                    placeholder="es: FMA00240N1IS"
                    value="<?= htmlspecialchars($productCode) ?>"
                    required
                    style="font-family: monospace; font-size: 16px;"
                >
            </div>
            <input type="hidden" name="debug" value="1">
            <button type="submit" class="btn btn-primary">🔍 Avvia Debug</button>
        </form>
    </div>

    <?php if ($debugResult): ?>
        <?php if (isset($debugResult['error'])): ?>
            <!-- Errore -->
            <div class="card" style="background: rgba(244, 67, 54, 0.1); border: 2px solid #f44336;">
                <h2 style="color: #f44336; margin-top: 0;">❌ Errore</h2>
                <p style="color: #f44336; font-weight: bold;"><?= htmlspecialchars($debugResult['error']) ?></p>
            </div>
        <?php else: ?>
            <!-- Risultato Finale -->
            <div class="card" style="background: <?= $debugResult['finalResult'] ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' ?>; border: 2px solid <?= $debugResult['finalResult'] ? '#4caf50' : '#f44336' ?>;">
                <h2 style="color: <?= $debugResult['finalResult'] ? '#4caf50' : '#f44336' ?>; margin-top: 0;">
                    <?= $debugResult['finalResult'] ? '✅ Prodotto Trovato' : '❌ Prodotto NON Trovato' ?>
                </h2>
                <p style="font-size: 16px; margin: 0;">
                    Codice: <code style="background: rgba(255,255,255,0.3); padding: 4px 8px; border-radius: 4px;"><?= htmlspecialchars($debugResult['code']) ?></code>
                </p>
            </div>

            <!-- Steps -->
            <?php foreach ($debugResult['steps'] as $step): ?>
                <div class="card" style="border-left: 4px solid <?= $step['found'] ? '#4caf50' : '#f44336' ?>;">
                    <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 20px;">
                        <div style="flex-shrink: 0; width: 50px; height: 50px; border-radius: 50%; background: <?= $step['found'] ? '#4caf50' : '#f44336' ?>; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white;">
                            <?= $step['step'] ?>
                        </div>
                        <div style="flex: 1;">
                            <h2 style="margin: 0 0 10px 0; color: <?= $step['found'] ? '#4caf50' : '#f44336' ?>;">
                                <?= $step['found'] ? '✅' : '❌' ?> <?= htmlspecialchars($step['title']) ?>
                            </h2>
                            <p style="color: #a0a0b8; margin: 0 0 15px 0;">
                                <?= htmlspecialchars($step['description']) ?>
                            </p>

                            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <strong style="color: #667eea;">Risultato:</strong>
                                    <span style="padding: 5px 15px; background: <?= $step['found'] ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)' ?>; border-radius: 5px; font-weight: bold; color: <?= $step['found'] ? '#4caf50' : '#f44336' ?>;">
                                        <?= $step['count'] ?> prodotto/i trovato/i
                                    </span>
                                </div>

                                <!-- Query SQL -->
                                <?php if (isset($step['query'])): ?>
                                <details style="margin-top: 15px;">
                                    <summary style="cursor: pointer; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 6px; font-weight: bold; color: #667eea;">
                                        📝 Mostra Query SQL
                                    </summary>
                                    <pre style="margin-top: 10px; background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 12px;"><?= htmlspecialchars($step['query']) ?></pre>
                                </details>
                                <?php endif; ?>

                                <!-- JOIN Info -->
                                <?php if (isset($step['joins']) && !empty($step['joins'])): ?>
                                <details style="margin-top: 15px;">
                                    <summary style="cursor: pointer; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 6px; font-weight: bold; color: #667eea;">
                                        🔗 JOIN Configurati (<?= count($step['joins']) ?>)
                                    </summary>
                                    <div style="margin-top: 10px;">
                                        <?php foreach ($step['joins'] as $idx => $join): ?>
                                        <div style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 8px;">
                                            <strong>JOIN #<?= $idx + 1 ?>:</strong> <?= htmlspecialchars($join['table']) ?><br>
                                            <span style="font-size: 13px; color: #a0a0b8;">ON: <?= htmlspecialchars($join['on']) ?></span>
                                        </div>
                                        <?php endforeach; ?>
                                    </div>
                                </details>
                                <?php endif; ?>

                                <!-- Filtri Details -->
                                <?php if (isset($step['filterDetails']) && !empty($step['filterDetails'])): ?>
                                <details style="margin-top: 15px;">
                                    <summary style="cursor: pointer; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 6px; font-weight: bold; color: #667eea;">
                                        🔍 Analisi Filtri (<?= count($step['filterDetails']) ?>)
                                    </summary>
                                    <div style="margin-top: 10px;">
                                        <?php foreach ($step['filterDetails'] as $filterDetail): ?>
                                        <div style="padding: 12px; background: <?= $filterDetail['passes'] ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' ?>; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid <?= $filterDetail['passes'] ? '#4caf50' : '#f44336' ?>;">
                                            <div style="font-weight: bold; margin-bottom: 5px; color: <?= $filterDetail['passes'] ? '#4caf50' : '#f44336' ?>;">
                                                <?= $filterDetail['reason'] ?>
                                            </div>
                                            <div style="font-size: 12px; color: #a0a0b8;">
                                                Campo: <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px;"><?= htmlspecialchars($filterDetail['field']) ?></code>
                                                • Operatore: <strong><?= htmlspecialchars($filterDetail['operator']) ?></strong>
                                                • Valore atteso: <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px;"><?= htmlspecialchars($filterDetail['value']) ?></code>
                                            </div>
                                        </div>
                                        <?php endforeach; ?>
                                    </div>
                                </details>
                                <?php endif; ?>

                                <!-- Dati Trovati -->
                                <?php if ($step['found'] && !empty($step['data'])): ?>
                                <details style="margin-top: 15px;">
                                    <summary style="cursor: pointer; padding: 10px; background: rgba(76, 175, 80, 0.1); border-radius: 6px; font-weight: bold; color: #4caf50;">
                                        📊 Mostra Dati Trovati
                                    </summary>
                                    <pre style="margin-top: 10px; background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 11px; max-height: 400px;"><?= htmlspecialchars(json_encode($step['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) ?></pre>
                                </details>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    <?php endif; ?>
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

details summary {
    user-select: none;
}

details summary::-webkit-details-marker {
    display: none;
}

details summary::before {
    content: '▶ ';
    display: inline-block;
    transition: transform 0.2s;
}

details[open] summary::before {
    transform: rotate(90deg);
}
</style>

<?php include '../includes/footer.php'; ?>
