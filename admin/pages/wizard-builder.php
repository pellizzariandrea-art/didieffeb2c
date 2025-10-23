<?php
// admin/pages/wizard-builder.php - Wizard Configuration Builder
require_once '../config.php';
require_once '../includes/functions.php';

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
                        <button onclick="resetToDefault()" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors" title="Ripristina configurazione di default">
                            <i class="fas fa-undo mr-2"></i>
                            Reset
                        </button>
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
        let disabledBooleanFilters = new Set(); // Filtri booleani disabilitati

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

        // Load available filters from products
        async function loadAvailableFilters() {
            try {
                const response = await fetch('../api/get-available-filters.php');
                const data = await response.json();

                console.log('=== FILTERS API RESPONSE ===');
                console.log('Success:', data.success);
                console.log('Total filters from API:', data.totalFilters);
                console.log('Raw filters:', data.filters);

                if (data.success && data.filters) {
                    availableFilters = data.filters.map(f => ({
                        key: f.key,
                        type: f.type || 'select',
                        valueCount: f.valueCount || 0,
                        productCount: f.productCount || 0,
                        sampleValues: f.sampleValues || [],
                        trueCount: f.trueCount || 0,
                        falseCount: f.falseCount || 0
                    }));

                    const booleanCount = availableFilters.filter(f => f.type === 'boolean').length;
                    const selectCount = availableFilters.filter(f => f.type === 'select').length;

                    console.log('=== PROCESSED FILTERS ===');
                    console.log('Total filters:', availableFilters.length);
                    console.log('Boolean filters:', booleanCount);
                    console.log('Select filters:', selectCount);
                    console.log('Boolean filters list:', availableFilters.filter(f => f.type === 'boolean'));

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

            // Separa filtri booleani da filtri regolari (come nella product page)
            const booleanFilters = availableFilters.filter(f => f.type === 'boolean');
            const regularFilters = availableFilters.filter(f => f.type !== 'boolean');

            let html = '';

            // Filtri regolari
            regularFilters.forEach(filter => {
                const sampleText = filter.sampleValues ? filter.sampleValues.slice(0, 2).join(', ') : '';
                const tooltip = filter.sampleValues ? `Esempi: ${filter.sampleValues.join(', ')}` : '';

                html += `
                    <div class="filter-item p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                         data-filter-key="${filter.key}"
                         data-filter-type="select"
                         title="${tooltip}">
                        <div class="flex flex-col gap-1">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <i class="fas fa-grip-vertical text-gray-400"></i>
                                    <i class="fas fa-list text-blue-500 text-xs"></i>
                                    <span class="text-sm font-medium text-gray-900">${filter.key}</span>
                                </div>
                                <span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">${filter.productCount}</span>
                            </div>
                            ${sampleText ? `<div class="text-xs text-gray-500 ml-6 truncate">${sampleText}...</div>` : ''}
                        </div>
                    </div>
                `;
            });

            // Gruppo Caratteristiche (filtri booleani raggruppati)
            if (booleanFilters.length > 0) {
                const enabledBooleanFilters = booleanFilters.filter(f => !disabledBooleanFilters.has(f.key));
                const enabledCount = enabledBooleanFilters.length;

                html += `
                    <div class="mt-3 pt-3 border-t border-gray-200">
                        <div class="flex items-center gap-2 mb-2 px-1">
                            <i class="fas fa-check-square text-purple-600"></i>
                            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Caratteristiche</span>
                            <span class="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">${enabledCount}/${booleanFilters.length}</span>
                        </div>

                        ${enabledCount > 0 ? `
                            <!-- Item trascinabile per gruppo caratteristiche -->
                            <div class="filter-item p-3 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg cursor-move hover:from-purple-100 hover:to-purple-200 transition-all mb-3"
                                 data-filter-key="_characteristics_group"
                                 data-filter-type="characteristics"
                                 title="Trascina per aggiungere un step con tutte le caratteristiche abilitate">
                                <div class="flex flex-col gap-2">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <i class="fas fa-grip-vertical text-purple-600"></i>
                                            <i class="fas fa-layer-group text-purple-600"></i>
                                            <span class="text-sm font-bold text-purple-900">Gruppo Caratteristiche</span>
                                        </div>
                                        <span class="text-xs bg-purple-600 text-white px-2 py-1 rounded-full font-bold">${enabledCount} filtri</span>
                                    </div>
                                    <div class="text-xs text-purple-700 ml-8">
                                        ${enabledBooleanFilters.map(f => f.key).slice(0, 3).join(', ')}${enabledCount > 3 ? '...' : ''}
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Lista per abilitare/disabilitare caratteristiche -->
                        <div class="space-y-1.5">
                `;

                booleanFilters.forEach(filter => {
                    const trueCount = filter.trueCount || 0;
                    const isEnabled = !disabledBooleanFilters.has(filter.key);
                    const tooltip = isEnabled
                        ? `Filtro abilitato: ${trueCount} prodotti. Sarà incluso nel gruppo Caratteristiche.`
                        : `Filtro disabilitato. Non apparirà nel wizard.`;

                    html += `
                        <div class="flex items-center gap-2 p-2 rounded-lg ${isEnabled ? 'bg-white border border-purple-200' : 'bg-gray-100 border border-gray-200 opacity-50'}"
                             title="${tooltip}">
                            <input type="checkbox"
                                   ${isEnabled ? 'checked' : ''}
                                   onchange="toggleBooleanFilter('${filter.key}')"
                                   class="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer">
                            <div class="flex-1 flex items-center justify-between px-2 py-1">
                                <div class="flex items-center gap-2">
                                    <i class="fas ${isEnabled ? 'fa-check-circle text-purple-600' : 'fa-ban text-gray-400'} text-xs"></i>
                                    <span class="text-xs font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-500 line-through'}">${filter.key}</span>
                                </div>
                                <span class="text-xs ${isEnabled ? 'bg-purple-200 text-purple-800' : 'bg-gray-300 text-gray-600'} px-1.5 py-0.5 rounded-full font-semibold">${trueCount}</span>
                            </div>
                        </div>
                    `;
                });

                html += `
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;
        }

        // Render wizard steps
        function renderWizardSteps() {
            const container = document.getElementById('wizard-steps');
            container.innerHTML = wizardConfig.steps.map((step, index) => {
                const isCharacteristics = step.type === 'characteristics' || step.filterKey === '_characteristics_group';
                const enabledBooleanFilters = isCharacteristics
                    ? availableFilters.filter(f => f.type === 'boolean' && !disabledBooleanFilters.has(f.key))
                    : [];

                return `
                    <div class="step-card border-2 ${isCharacteristics ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'} rounded-xl p-4 hover:border-emerald-300 transition-colors"
                         data-step-id="${step.id}">
                        <div class="flex items-start gap-3">
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <i class="fas fa-grip-vertical text-gray-400 cursor-move"></i>
                                <div class="w-8 h-8 rounded-full ${isCharacteristics ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'} flex items-center justify-center font-bold text-sm">
                                    ${index + 1}
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-2">
                                    <h3 class="font-bold ${isCharacteristics ? 'text-purple-900' : 'text-gray-900'}">
                                        ${isCharacteristics ? '<i class="fas fa-layer-group mr-2"></i>' : ''}${step.title.it}
                                    </h3>
                                    <div class="flex items-center gap-2">
                                        ${step.type === 'category' ? '<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">Fisso</span>' : ''}
                                        ${isCharacteristics ? `<span class="px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded">${enabledBooleanFilters.length} caratteristiche</span>` : ''}
                                        ${step.required ? '<span class="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">Required</span>' : ''}
                                        ${step.multiSelect ? '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">Multi</span>' : ''}
                                    </div>
                                </div>
                                <p class="text-sm ${isCharacteristics ? 'text-purple-700' : 'text-gray-600'} mb-2">${step.subtitle.it}</p>
                                ${isCharacteristics ? `
                                    <div class="text-xs text-purple-600 bg-white rounded p-2 mt-2">
                                        <i class="fas fa-check-square mr-1"></i>
                                        ${enabledBooleanFilters.map(f => f.key).join(', ')}
                                    </div>
                                ` : step.filterKey && step.filterKey !== '_characteristics_group' ? `
                                    <div class="text-xs text-gray-500"><i class="fas fa-filter mr-1"></i> Filtro: <span class="font-semibold">${step.filterKey}</span></div>
                                ` : ''}
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
                `;
            }).join('');
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
            const isCharacteristics = currentEditingStep.type === 'characteristics' || currentEditingStep.filterKey === '_characteristics_group';
            const enabledBooleanFilters = availableFilters.filter(f => f.type === 'boolean' && !disabledBooleanFilters.has(f.key));

            content.innerHTML = `
                ${isCharacteristics ? `
                    <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-layer-group text-purple-600"></i>
                            <span class="font-bold text-purple-900">Gruppo Caratteristiche</span>
                            <span class="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">${enabledBooleanFilters.length} filtri</span>
                        </div>
                        <div class="text-xs text-purple-700">
                            ${enabledBooleanFilters.length > 0
                                ? enabledBooleanFilters.map(f => `<span class="inline-block bg-white px-2 py-1 rounded mr-1 mb-1">${f.key}</span>`).join('')
                                : '<span class="text-purple-500">Nessuna caratteristica abilitata</span>'}
                        </div>
                        <p class="text-xs text-purple-600 mt-2">
                            <i class="fas fa-info-circle mr-1"></i>
                            Le caratteristiche incluse vengono gestite tramite le checkbox nella sezione "Caratteristiche" della sidebar
                        </p>
                    </div>
                ` : currentEditingStep.type !== 'category' ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Filtro Associato</label>
                        <select id="edit-filter-key" class="w-full px-3 py-2 border border-gray-300 rounded-lg" onchange="onFilterChange(this.value)">
                            ${availableFilters.filter(f => f.type !== 'boolean').map(f => `
                                <option value="${f.key}" ${f.key === currentEditingStep.filterKey ? 'selected' : ''}>
                                    ${f.key} (${f.valueCount} opzioni)
                                </option>
                            `).join('')}
                            ${enabledBooleanFilters.length > 0 ? `
                                <option value="_characteristics_group" ${currentEditingStep.filterKey === '_characteristics_group' ? 'selected' : ''}>
                                    🟣 Gruppo Caratteristiche (${enabledBooleanFilters.length} filtri)
                                </option>
                            ` : ''}
                        </select>
                        <p class="text-xs text-gray-500 mt-1">
                            <i class="fas fa-info-circle text-blue-600"></i>
                            Il titolo verrà impostato automaticamente in base al filtro selezionato
                        </p>
                    </div>
                ` : ''}

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Titolo</label>
                    <input type="text"
                           id="edit-title-it"
                           value="${currentEditingStep.title.it || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                           placeholder="Es: Scegli il materiale">
                    <p class="text-xs text-gray-500 mt-1">
                        <i class="fas fa-language text-emerald-600 mr-1"></i>
                        Scrivi in italiano. Le altre lingue saranno tradotte automaticamente quando salvi.
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Sottotitolo</label>
                    <input type="text"
                           id="edit-subtitle-it"
                           value="${currentEditingStep.subtitle.it || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                           placeholder="Es: Seleziona il materiale del prodotto">
                    <p class="text-xs text-gray-500 mt-1">
                        <i class="fas fa-language text-emerald-600 mr-1"></i>
                        Scrivi in italiano. Le altre lingue saranno tradotte automaticamente quando salvi.
                    </p>
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

        // On filter change - set Italian text only
        function onFilterChange(filterKey) {
            if (!filterKey) return;

            // Se è il gruppo caratteristiche, usa testi predefiniti
            if (filterKey === '_characteristics_group') {
                document.getElementById('edit-title-it').value = 'Caratteristiche';
                document.getElementById('edit-subtitle-it').value = 'Scegli le caratteristiche del prodotto';
                return;
            }

            // Per altri filtri, usa il nome del filtro
            const italianTitle = filterKey;
            document.getElementById('edit-title-it').value = italianTitle;
            document.getElementById('edit-subtitle-it').value = `Scegli ${italianTitle.toLowerCase()}`;
        }

        // Close edit modal
        function closeEditModal() {
            document.getElementById('edit-modal').classList.add('hidden');
            currentEditingStep = null;
        }

        // Save step edit
        function saveStepEdit() {
            if (!currentEditingStep) return;

            const isCharacteristics = currentEditingStep.type === 'characteristics' || currentEditingStep.filterKey === '_characteristics_group';

            // Update filter key (if not category or characteristics)
            if (currentEditingStep.type !== 'category' && !isCharacteristics) {
                const newFilterKey = document.getElementById('edit-filter-key').value;
                currentEditingStep.filterKey = newFilterKey;

                // Se il nuovo filtro è il gruppo caratteristiche, cambia il type
                if (newFilterKey === '_characteristics_group') {
                    currentEditingStep.type = 'characteristics';
                }
            }

            // Update only Italian title and subtitle
            // Other languages will be auto-translated on save
            currentEditingStep.title.it = document.getElementById('edit-title-it').value;
            currentEditingStep.subtitle.it = document.getElementById('edit-subtitle-it').value;

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

        // Toggle boolean filter enabled/disabled
        function toggleBooleanFilter(filterKey) {
            if (disabledBooleanFilters.has(filterKey)) {
                disabledBooleanFilters.delete(filterKey);
            } else {
                disabledBooleanFilters.add(filterKey);
            }
            renderAvailableFilters();
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
            // Add includeFilters to characteristics steps
            wizardConfig.steps.forEach(step => {
                if (step.type === 'characteristics' || step.filterKey === '_characteristics_group') {
                    // Get enabled boolean filters (not disabled)
                    const enabledFilters = availableFilters
                        .filter(f => f.type === 'boolean' && !disabledBooleanFilters.has(f.key))
                        .map(f => f.key);
                    step.includeFilters = enabledFilters;
                }
            });


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

        // Reset to default configuration
        async function resetToDefault() {
            if (!confirm('⚠️ Sei sicuro di voler ripristinare la configurazione di default?\n\nQuesta azione sostituirà completamente la configurazione attuale con:\n- Step 1: Selezione categoria\n- Step 2: Applicazione (Legno/Alluminio/PVC)\n- Step 3: Materiale\n- Step 4: Colore\n- Step 5: Altri filtri\n\nTutte le personalizzazioni saranno perse!')) {
                return;
            }

            try {
                const response = await fetch('../api/reset-wizard-config.php', {
                    method: 'POST'
                });

                const result = await response.json();
                if (result.success) {
                    wizardConfig = result.config;
                    renderWizardSteps();

                    // Update AI config
                    if (wizardConfig.ai) {
                        document.getElementById('ai-enabled').checked = wizardConfig.ai.enabled;
                        document.getElementById('ai-provider').value = wizardConfig.ai.provider;
                        document.getElementById('ai-model').value = wizardConfig.ai.model;
                        document.getElementById('ai-config').classList.toggle('hidden', !wizardConfig.ai.enabled);
                    }

                    alert('✅ Configurazione ripristinata con successo!\n\n5 step configurati e pronti all\'uso.');
                } else {
                    alert('❌ Errore nel reset: ' + result.error);
                }
            } catch (error) {
                alert('❌ Errore di rete: ' + error.message);
            }
        }

        // Preview wizard
        function previewWizard() {
            // Open frontend (remove /admin from current URL)
            const frontendUrl = window.location.origin + '/';
            window.open(frontendUrl, '_blank');
        }
    </script>
</body>
</html>
