<?php
// admin/pages/wizard-builder.php - Wizard Configuration Builder
if (!defined('BASE_PATH')) exit('No direct script access allowed');

$pageTitle = "Wizard Builder";
?>

<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $pageTitle ?> - Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <!-- Header -->
        <div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <a href="../index.php" class="text-gray-600 hover:text-gray-900">
                            <i class="fas fa-arrow-left"></i>
                        </a>
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900">
                                <i class="fas fa-magic mr-2 text-purple-600"></i>
                                Wizard Builder
                            </h1>
                            <div class="flex items-center gap-3 mt-1">
                                <p class="text-sm text-gray-600">Configura il wizard di ricerca guidata</p>
                                <span id="translation-badge" class="hidden px-2 py-0.5 text-xs font-semibold rounded-full">
                                    <i class="fas fa-language mr-1"></i>
                                    <span id="translation-status"></span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="previewWizard()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-eye mr-2"></i>
                            Anteprima
                        </button>
                        <button onclick="saveConfiguration()" class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                            <i class="fas fa-save mr-2"></i>
                            Salva Configurazione
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <!-- Left Panel: Available Filters -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-filter mr-2 text-emerald-600"></i>
                            Filtri Disponibili
                        </h2>
                        <p class="text-sm text-gray-600 mb-4">Trascina i filtri negli step del wizard</p>

                        <div id="available-filters" class="space-y-2">
                            <!-- Popolato dinamicamente via JS -->
                        </div>

                        <!-- AI Configuration -->
                        <div class="mt-6 pt-6 border-t border-gray-200">
                            <h3 class="text-sm font-bold text-gray-900 mb-3 flex items-center">
                                <i class="fas fa-robot mr-2 text-purple-600"></i>
                                Configurazione AI
                            </h3>
                            <div class="space-y-3">
                                <label class="flex items-center">
                                    <input type="checkbox" id="ai-enabled" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500">
                                    <span class="ml-2 text-sm text-gray-700">Abilita AI Assistant</span>
                                </label>
                                <div id="ai-config" class="hidden space-y-3">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Provider</label>
                                        <select id="ai-provider" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                            <option value="claude">Claude (Anthropic)</option>
                                            <option value="openai">OpenAI GPT</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Model</label>
                                        <input type="text" id="ai-model" value="claude-3-sonnet" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Panel: Wizard Steps -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-list-ol mr-2 text-purple-600"></i>
                            Step del Wizard
                        </h2>
                        <p class="text-sm text-gray-600 mb-6">Organizza e personalizza i vari step</p>

                        <div id="wizard-steps" class="space-y-4">
                            <!-- Popolato dinamicamente via JS -->
                        </div>

                        <button onclick="addNewStep()" class="mt-4 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                            <i class="fas fa-plus mr-2"></i>
                            Aggiungi Nuovo Step
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Edit Step Modal -->
    <div id="edit-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200">
                <h3 class="text-xl font-bold text-gray-900">Modifica Step</h3>
            </div>
            <div class="p-6 space-y-4" id="edit-modal-content">
                <!-- Populated dynamically -->
            </div>
            <div class="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button onclick="closeEditModal()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    Annulla
                </button>
                <button onclick="saveStepEdit()" class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Salva Modifiche
                </button>
            </div>
        </div>
    </div>

    <script>
        // Global state
        let wizardConfig = null;
        let availableFilters = [];
        let currentEditingStep = null;

        // Load configuration on page load
        document.addEventListener('DOMContentLoaded', async () => {
            await loadConfiguration();
            await loadAvailableFilters();
            await loadTranslationStatus();
            initializeDragAndDrop();

            // AI enabled toggle
            document.getElementById('ai-enabled').addEventListener('change', (e) => {
                document.getElementById('ai-config').classList.toggle('hidden', !e.target.checked);
            });
        });

        // Load wizard configuration
        async function loadConfiguration() {
            try {
                const response = await fetch('../api/get-wizard-config.php');
                const data = await response.json();
                if (data.success) {
                    wizardConfig = data.config;
                    renderWizardSteps();

                    // Set AI config
                    if (wizardConfig.ai) {
                        document.getElementById('ai-enabled').checked = wizardConfig.ai.enabled;
                        document.getElementById('ai-provider').value = wizardConfig.ai.provider;
                        document.getElementById('ai-model').value = wizardConfig.ai.model;
                        document.getElementById('ai-config').classList.toggle('hidden', !wizardConfig.ai.enabled);
                    }
                } else {
                    console.error('Error loading config:', data.error);
                }
            } catch (error) {
                console.error('Error loading configuration:', error);
            }
        }

        // Load available filters from filter-config.json
        async function loadAvailableFilters() {
            try {
                const response = await fetch('../api/get-distinct-values.php');
                const data = await response.json();
                if (data.success && data.filters) {
                    availableFilters = data.filters.map(f => ({
                        key: f.key,
                        type: f.type || 'select',
                        valueCount: f.values ? f.values.length : 0
                    }));
                    renderAvailableFilters();
                }
            } catch (error) {
                console.error('Error loading filters:', error);
            }
        }

        // Load and display translation status
        async function loadTranslationStatus() {
            try {
                const response = await fetch('../api/get-translation-settings.php');
                const data = await response.json();

                const badge = document.getElementById('translation-badge');
                const status = document.getElementById('translation-status');

                if (data.success && data.settings) {
                    const settings = data.settings;
                    badge.classList.remove('hidden');

                    if (settings.enabled) {
                        const langs = settings.languages || ['it'];
                        const langCount = langs.filter(l => l !== 'it').length;
                        badge.classList.add('bg-emerald-100', 'text-emerald-700');
                        badge.classList.remove('bg-gray-100', 'text-gray-600');
                        status.textContent = `Auto-traduzione attiva (${langCount} lingue)`;
                    } else {
                        badge.classList.add('bg-gray-100', 'text-gray-600');
                        badge.classList.remove('bg-emerald-100', 'text-emerald-700');
                        status.textContent = 'Traduzioni disabilitate';
                    }
                }
            } catch (error) {
                console.error('Error loading translation status:', error);
            }
        }

        // Render available filters
        function renderAvailableFilters() {
            const container = document.getElementById('available-filters');
            container.innerHTML = availableFilters.map(filter => `
                <div class="filter-item p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                     data-filter-key="${filter.key}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-grip-vertical text-gray-400"></i>
                            <span class="text-sm font-medium text-gray-900">${filter.key}</span>
                        </div>
                        <span class="text-xs text-gray-500">${filter.valueCount} opzioni</span>
                    </div>
                </div>
            `).join('');
        }

        // Render wizard steps
        function renderWizardSteps() {
            const container = document.getElementById('wizard-steps');
            container.innerHTML = wizardConfig.steps.map((step, index) => `
                <div class="step-card border-2 border-gray-200 rounded-xl p-4 bg-white hover:border-emerald-300 transition-colors"
                     data-step-id="${step.id}">
                    <div class="flex items-start gap-3">
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <i class="fas fa-grip-vertical text-gray-400 cursor-move"></i>
                            <div class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                ${index + 1}
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-bold text-gray-900">${step.title.it}</h3>
                                <div class="flex items-center gap-2">
                                    ${step.type === 'category' ? '<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">Fisso</span>' : ''}
                                    ${step.required ? '<span class="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">Required</span>' : ''}
                                    ${step.multiSelect ? '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">Multi</span>' : ''}
                                </div>
                            </div>
                            <p class="text-sm text-gray-600 mb-2">${step.subtitle.it}</p>
                            ${step.filterKey ? `<div class="text-xs text-gray-500"><i class="fas fa-filter mr-1"></i> Filtro: <span class="font-semibold">${step.filterKey}</span></div>` : ''}
                            ${step.allowTextInput ? '<div class="text-xs text-purple-600 mt-1"><i class="fas fa-keyboard mr-1"></i> Input testuale abilitato</div>' : ''}
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="editStep('${step.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifica">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${step.type !== 'category' ? `
                                <button onclick="deleteStep('${step.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Elimina">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Initialize drag and drop
        function initializeDragAndDrop() {
            const wizardSteps = document.getElementById('wizard-steps');
            new Sortable(wizardSteps, {
                animation: 150,
                handle: '.fa-grip-vertical',
                onEnd: function(evt) {
                    // Update order in config
                    const movedStep = wizardConfig.steps.splice(evt.oldIndex, 1)[0];
                    wizardConfig.steps.splice(evt.newIndex, 0, movedStep);

                    // Update order numbers
                    wizardConfig.steps.forEach((step, index) => {
                        step.order = index + 1;
                    });

                    renderWizardSteps();
                }
            });
        }

        // Edit step
        function editStep(stepId) {
            currentEditingStep = wizardConfig.steps.find(s => s.id === stepId);
            if (!currentEditingStep) return;

            const modal = document.getElementById('edit-modal');
            const content = document.getElementById('edit-modal-content');

            const languages = ['it', 'en', 'de', 'fr', 'es', 'pt'];
            const langNames = {it: 'Italiano', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español', pt: 'Português'};

            content.innerHTML = `
                ${currentEditingStep.type !== 'category' ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Filtro Associato</label>
                        <select id="edit-filter-key" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            ${availableFilters.map(f => `
                                <option value="${f.key}" ${f.key === currentEditingStep.filterKey ? 'selected' : ''}>
                                    ${f.key} (${f.valueCount} opzioni)
                                </option>
                            `).join('')}
                        </select>
                    </div>
                ` : ''}

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Titolo (multilingua)</label>
                    ${languages.map(lang => `
                        <div class="mb-2">
                            <label class="block text-xs text-gray-500 mb-1">${langNames[lang]}</label>
                            <input type="text"
                                   id="edit-title-${lang}"
                                   value="${currentEditingStep.title[lang] || ''}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        </div>
                    `).join('')}
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Sottotitolo (multilingua)</label>
                    ${languages.map(lang => `
                        <div class="mb-2">
                            <label class="block text-xs text-gray-500 mb-1">${langNames[lang]}</label>
                            <input type="text"
                                   id="edit-subtitle-${lang}"
                                   value="${currentEditingStep.subtitle[lang] || ''}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        </div>
                    `).join('')}
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Prompt AI</label>
                    <textarea id="edit-ai-prompt"
                              rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="Prompt per l'assistente AI...">${currentEditingStep.aiPrompt || ''}</textarea>
                    <p class="text-xs text-gray-500 mt-1">
                        Usa <code>{options}</code> per inserire le opzioni disponibili
                    </p>
                </div>

                <div class="flex items-center gap-4">
                    <label class="flex items-center">
                        <input type="checkbox" id="edit-required" ${currentEditingStep.required ? 'checked' : ''}
                               class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500">
                        <span class="ml-2 text-sm text-gray-700">Step obbligatorio</span>
                    </label>
                    ${currentEditingStep.type !== 'category' ? `
                        <label class="flex items-center">
                            <input type="checkbox" id="edit-multi-select" ${currentEditingStep.multiSelect ? 'checked' : ''}
                                   class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500">
                            <span class="ml-2 text-sm text-gray-700">Multi-selezione</span>
                        </label>
                    ` : ''}
                    <label class="flex items-center">
                        <input type="checkbox" id="edit-text-input" ${currentEditingStep.allowTextInput ? 'checked' : ''}
                               class="rounded border-gray-300 text-purple-600 focus:ring-purple-500">
                        <span class="ml-2 text-sm text-gray-700">Input testuale</span>
                    </label>
                </div>
            `;

            modal.classList.remove('hidden');
        }

        // Close edit modal
        function closeEditModal() {
            document.getElementById('edit-modal').classList.add('hidden');
            currentEditingStep = null;
        }

        // Save step edit
        function saveStepEdit() {
            if (!currentEditingStep) return;

            const languages = ['it', 'en', 'de', 'fr', 'es', 'pt'];

            // Update filter key (if not category)
            if (currentEditingStep.type !== 'category') {
                currentEditingStep.filterKey = document.getElementById('edit-filter-key').value;
            }

            // Update titles and subtitles
            languages.forEach(lang => {
                currentEditingStep.title[lang] = document.getElementById(`edit-title-${lang}`).value;
                currentEditingStep.subtitle[lang] = document.getElementById(`edit-subtitle-${lang}`).value;
            });

            // Update AI prompt
            currentEditingStep.aiPrompt = document.getElementById('edit-ai-prompt').value;

            // Update checkboxes
            currentEditingStep.required = document.getElementById('edit-required').checked;
            if (currentEditingStep.type !== 'category') {
                currentEditingStep.multiSelect = document.getElementById('edit-multi-select').checked;
            }
            currentEditingStep.allowTextInput = document.getElementById('edit-text-input').checked;

            renderWizardSteps();
            closeEditModal();
        }

        // Delete step
        function deleteStep(stepId) {
            if (!confirm('Sei sicuro di voler eliminare questo step?')) return;

            wizardConfig.steps = wizardConfig.steps.filter(s => s.id !== stepId);
            wizardConfig.steps.forEach((step, index) => {
                step.order = index + 1;
            });
            renderWizardSteps();
        }

        // Add new step
        function addNewStep() {
            const newId = 'filter_' + Date.now();
            const newStep = {
                id: newId,
                order: wizardConfig.steps.length + 1,
                type: 'filter',
                filterKey: availableFilters[0]?.key || '',
                required: false,
                multiSelect: true,
                title: {it: 'Nuovo Step', en: 'New Step', de: 'Neuer Schritt', fr: 'Nouvelle étape', es: 'Nuevo paso', pt: 'Nova etapa'},
                subtitle: {it: 'Descrizione', en: 'Description', de: 'Beschreibung', fr: 'Description', es: 'Descripción', pt: 'Descrição'},
                aiPrompt: 'Aiuta l\'utente a scegliere. Opzioni: {options}',
                allowTextInput: false
            };
            wizardConfig.steps.push(newStep);
            renderWizardSteps();
        }

        // Save configuration
        async function saveConfiguration() {
            // Update AI config
            wizardConfig.ai = {
                enabled: document.getElementById('ai-enabled').checked,
                provider: document.getElementById('ai-provider').value,
                model: document.getElementById('ai-model').value,
                systemPrompt: wizardConfig.ai?.systemPrompt || '',
                temperature: wizardConfig.ai?.temperature || 0.7
            };

            wizardConfig.lastUpdated = new Date().toISOString().split('T')[0];

            try {
                const response = await fetch('../api/save-wizard-config.php', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(wizardConfig)
                });

                const result = await response.json();
                if (result.success) {
                    let message = '✅ Configurazione salvata con successo!';
                    if (result.translation_enabled && result.translated > 0) {
                        message += `\n🌐 ${result.translated} step tradotti automaticamente`;
                    } else if (result.translation_enabled === false) {
                        message += '\nℹ️ Traduzioni disabilitate - Abilita nelle impostazioni';
                    }
                    alert(message);
                } else {
                    alert('❌ Errore nel salvataggio: ' + result.error);
                }
            } catch (error) {
                alert('❌ Errore di rete: ' + error.message);
            }
        }

        // Preview wizard
        function previewWizard() {
            window.open('<?= BASE_URL ?>', '_blank');
        }
    </script>
</body>
</html>
