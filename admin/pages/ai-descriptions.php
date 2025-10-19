<?php
require_once '../config.php';
require_once '../includes/functions.php';

$pageTitle = "Descrizioni AI";

// Path descrizioni AI
$aiDescriptionsDir = DATA_PATH . '/ai-descriptions';

// Lista tutti i file JSON nella cartella
$descriptions = [];
if (is_dir($aiDescriptionsDir)) {
    $files = glob($aiDescriptionsDir . '/*.json');
    foreach ($files as $file) {
        $productCode = basename($file, '.json');
        $data = json_decode(file_get_contents($file), true) ?? [];

        // Conta lingue disponibili
        $languages = array_keys($data);
        $lastModified = filemtime($file);

        $descriptions[] = [
            'code' => $productCode,
            'languages' => $languages,
            'count' => count($languages),
            'last_modified' => $lastModified,
            'data' => $data
        ];
    }

    // Ordina per data modifica (più recenti prima)
    usort($descriptions, function($a, $b) {
        return $b['last_modified'] - $a['last_modified'];
    });
}

// Carica products.json per mostrare nomi prodotti
$productsData = [];
if (file_exists(PUBLIC_JSON_PATH)) {
    $json = json_decode(file_get_contents(PUBLIC_JSON_PATH), true);
    if (isset($json['prodotti'])) {
        foreach ($json['prodotti'] as $product) {
            if (isset($product['codice'])) {
                $productsData[$product['codice']] = $product;
            }
        }
    }
}
include '../includes/header.php';
?>

<!-- CodeMirror Editor -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/monokai.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/xml/xml.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/htmlmixed/htmlmixed.min.js"></script>

<style>
        /* Search Box */
        .search-box {
            margin-bottom: 1.5rem;
        }
        .search-box input {
            width: 100%;
            max-width: 400px;
            padding: 0.75rem 1rem;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            font-size: 1rem;
        }
        .search-box input:focus {
            outline: none;
            border-color: #667eea;
        }

        /* Table Styles */
        .descriptions-table {
            width: 100%;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .descriptions-table thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .descriptions-table th {
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: white;
        }
        .descriptions-table td {
            padding: 1rem;
            border-bottom: 1px solid #dee2e6;
            color: #333;
            background: white;
        }
        .descriptions-table tbody tr {
            background: white;
        }
        .descriptions-table tbody tr:hover {
            background: #f8f9fa;
        }
        .descriptions-table tbody tr:last-child td {
            border-bottom: none;
        }

        .language-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: #e7f5ff;
            color: #0969da;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
            margin-right: 0.5rem;
            margin-bottom: 0.25rem;
        }

        /* Action Buttons */
        .btn-edit {
            background: #0969da;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-right: 0.5rem;
        }
        .btn-edit:hover {
            background: #0550ae;
        }
        .btn-delete {
            background: #dc3545;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        .btn-delete:hover {
            background: #c82333;
        }
        .btn-back {
            background: #6c757d;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            text-decoration: none;
            display: inline-block;
        }
        .btn-back:hover {
            background: #5a6268;
        }

        /* Modal */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            overflow: auto;
        }
        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .modal-content {
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 1000px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        }
        .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-header h2 {
            margin: 0;
            color: #333;
        }
        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6c757d;
        }
        .modal-body {
            padding: 1.5rem;
            overflow-y: auto;
            flex: 1;
        }
        .modal-footer {
            padding: 1.5rem;
            border-top: 1px solid #dee2e6;
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }

        /* Language Tabs */
        .language-tabs {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
            border-bottom: 2px solid #dee2e6;
            padding-bottom: 0.5rem;
        }
        .language-tab {
            padding: 0.5rem 1rem;
            background: #f8f9fa;
            border: none;
            border-radius: 4px 4px 0 0;
            cursor: pointer;
            font-weight: 500;
            color: #6c757d;
        }
        .language-tab.active {
            background: #667eea;
            color: white;
        }
        .language-tab:hover {
            background: #e7f5ff;
        }
        .language-tab.active:hover {
            background: #5568d3;
        }

        .no-data {
            text-align: center;
            padding: 3rem;
            color: #6c757d;
        }
        .no-data p {
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
        }

        /* CodeMirror Editor */
        .CodeMirror {
            height: 500px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
</style>

<div class="card">
    <h2><?php echo $pageTitle; ?></h2>

    <?php if (empty($descriptions)): ?>
                <div class="no-data">
                    <p>📝 Nessuna descrizione generata</p>
                    <p>Le descrizioni verranno create automaticamente quando gli utenti visiteranno i prodotti sul frontend.</p>
                </div>
            <?php else: ?>
                <!-- Search Box -->
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="🔍 Cerca per codice o nome prodotto...">
                </div>

                <!-- Tabella descrizioni -->
                <table class="descriptions-table" id="descriptionsTable">
                    <thead>
                        <tr>
                            <th>Codice</th>
                            <th>Nome Prodotto</th>
                            <th>Lingue</th>
                            <th>Ultima Modifica</th>
                            <th>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($descriptions as $desc): ?>
                            <?php
                            $product = $productsData[$desc['code']] ?? null;
                            $productName = 'Sconosciuto';
                            if ($product) {
                                if (is_array($product['nome'])) {
                                    $productName = $product['nome']['it'] ?? $product['nome'][array_key_first($product['nome'])] ?? 'Sconosciuto';
                                } else {
                                    $productName = $product['nome'];
                                }
                            }
                            ?>
                            <tr data-code="<?php echo htmlspecialchars($desc['code']); ?>" data-name="<?php echo htmlspecialchars($productName); ?>">
                                <td style="font-family: monospace; font-weight: 600;">
                                    <?php echo htmlspecialchars($desc['code']); ?>
                                </td>
                                <td>
                                    <?php echo htmlspecialchars($productName); ?>
                                </td>
                                <td>
                                    <?php foreach ($desc['languages'] as $lang): ?>
                                        <span class="language-badge">
                                            <?php echo strtoupper($lang); ?>
                                            <?php
                                            if (isset($desc['data'][$lang]['manually_edited']) && $desc['data'][$lang]['manually_edited']) {
                                                echo ' ✏️';
                                            }
                                            ?>
                                        </span>
                                    <?php endforeach; ?>
                                </td>
                                <td>
                                    <?php echo date('d/m/Y H:i', $desc['last_modified']); ?>
                                </td>
                                <td>
                                    <button class="btn-edit" onclick="editDescription('<?php echo htmlspecialchars($desc['code']); ?>', '<?php echo htmlspecialchars($productName); ?>')">
                                        ✏️ Modifica
                                    </button>
                                    <button class="btn-delete" onclick="deleteDescription('<?php echo htmlspecialchars($desc['code']); ?>')">
                                        🗑️ Elimina
                                    </button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
</div>

<!-- Modal per Editor -->
    <div id="editorModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle">Modifica Descrizione</h2>
                <button class="modal-close" onclick="closeEditor()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="language-tabs" id="languageTabs"></div>
                <textarea id="htmlEditor"></textarea>
            </div>
            <div class="modal-footer">
                <button class="btn-back" onclick="closeEditor()">Annulla</button>
                <button class="btn-edit" onclick="saveDescription()">💾 Salva</button>
            </div>
        </div>
    </div>

    <script>
        let currentCode = '';
        let currentData = {};
        let currentLang = '';
        let codeMirror = null;
        let isLoading = false;

        // Search functionality
        document.getElementById('searchInput')?.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#descriptionsTable tbody tr');

            rows.forEach(row => {
                const code = row.dataset.code.toLowerCase();
                const name = row.dataset.name.toLowerCase();

                if (code.includes(searchTerm) || name.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });

        // Edit Description
        async function editDescription(code, productName) {
            // Prevent multiple simultaneous calls
            if (isLoading) {
                console.log('Already loading, ignoring click');
                return;
            }

            isLoading = true;
            currentCode = code;

            // Fetch description data
            try {
                const response = await fetch(`../api/get-ai-description.php?code=${code}&lang=all`);
                const result = await response.json();

                console.log('API Response:', result);

                if (!result.success) {
                    alert('Errore nel caricamento dei dati: ' + (result.error || 'Unknown error'));
                    isLoading = false;
                    return;
                }

                currentData = result.data || {};
                console.log('Current data:', currentData);

                // Set modal title
                document.getElementById('modalTitle').textContent = `Modifica: ${productName} (${code})`;

                // Create language tabs
                const languages = Object.keys(currentData);
                console.log('Languages:', languages);

                if (languages.length === 0) {
                    alert('Nessuna lingua disponibile');
                    isLoading = false;
                    return;
                }

                const tabsContainer = document.getElementById('languageTabs');
                tabsContainer.innerHTML = '';

                languages.forEach((lang, index) => {
                    const tab = document.createElement('button');
                    tab.className = 'language-tab' + (index === 0 ? ' active' : '');
                    tab.textContent = lang.toUpperCase();
                    tab.onclick = () => switchLanguage(lang);
                    tabsContainer.appendChild(tab);
                });

                // Initialize Quill
                currentLang = languages[0];

                // Show modal first, then init editor
                document.getElementById('editorModal').classList.add('active');

                // Wait a bit for modal to be visible, then init editor
                setTimeout(() => {
                    initEditor();
                    isLoading = false;
                }, 100);

            } catch (error) {
                console.error('Error:', error);
                alert('Errore nel caricamento: ' + error.message);
                isLoading = false;
            }
        }

        function initEditor() {
            console.log('Init editor for language:', currentLang);
            console.log('Data for this language:', currentData[currentLang]);

            try {
                // Initialize CodeMirror if not already initialized
                if (!codeMirror) {
                    console.log('Creating new CodeMirror instance');
                    const textarea = document.getElementById('htmlEditor');
                    codeMirror = CodeMirror.fromTextArea(textarea, {
                        mode: 'htmlmixed',
                        theme: 'monokai',
                        lineNumbers: true,
                        lineWrapping: true,
                        indentUnit: 2,
                        tabSize: 2,
                        autoCloseTags: true,
                        matchBrackets: true,
                        indentWithTabs: false
                    });
                }

                // Set content for current language
                const html = currentData[currentLang]?.html || '';
                console.log('Setting HTML content length:', html.length);

                if (html) {
                    // Format HTML with indentation for better readability
                    const formattedHtml = formatHTML(html);
                    codeMirror.setValue(formattedHtml);
                    console.log('Content set successfully');
                } else {
                    console.warn('No HTML content found for language:', currentLang);
                    codeMirror.setValue('');
                }
            } catch (error) {
                console.error('Error initializing editor:', error);
                alert('Errore nell\'inizializzazione dell\'editor: ' + error.message);
            }
        }

        // Simple HTML formatter
        function formatHTML(html) {
            // Basic indentation (you can improve this)
            let formatted = html;
            formatted = formatted.replace(/></g, '>\n<');
            return formatted;
        }

        function switchLanguage(lang) {
            currentLang = lang;

            // Update active tab
            document.querySelectorAll('.language-tab').forEach(tab => {
                tab.classList.remove('active');
                if (tab.textContent === lang.toUpperCase()) {
                    tab.classList.add('active');
                }
            });

            // Update editor content
            if (codeMirror) {
                const html = currentData[lang]?.html || '';
                const formattedHtml = formatHTML(html);
                codeMirror.setValue(formattedHtml);
            }
        }

        async function saveDescription() {
            if (!codeMirror) return;

            const content = codeMirror.getValue();

            try {
                const response = await fetch('../api/update-ai-description.php', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        code: currentCode,
                        language: currentLang,
                        html: content
                    })
                });

                const result = await response.json();

                if (result.success) {
                    alert('Descrizione salvata con successo!');
                    closeEditor();
                    location.reload();
                } else {
                    alert('Errore: ' + result.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Errore durante il salvataggio');
            }
        }

        function closeEditor() {
            document.getElementById('editorModal').classList.remove('active');
            // Reset editor content
            if (codeMirror) {
                codeMirror.setValue('');
            }
        }

        // Delete Description
        function deleteDescription(code) {
            if (!confirm(`Sei sicuro di voler eliminare tutte le descrizioni per il prodotto ${code}?\n\nVerranno eliminate tutte le lingue e il file verrà ricreato alla prossima visita sul frontend.`)) {
                return;
            }

            fetch('../api/delete-ai-description.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ code: code })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Descrizione eliminata con successo!');
                    location.reload();
                } else {
                    alert('Errore: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Errore durante l\'eliminazione');
            });
        }

        // Close modal on outside click
        document.getElementById('editorModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeEditor();
            }
        });
    </script>

<?php include '../includes/footer.php'; ?>
