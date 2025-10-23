<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Impostazioni Email - Admin</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 30px;
        }

        h1 {
            color: #2563eb;
            margin-bottom: 10px;
        }

        .subtitle {
            color: #6b7280;
            margin-bottom: 30px;
        }

        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
        }

        .section h2 {
            color: #374151;
            font-size: 18px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }

        .section h2::before {
            content: '📧';
            margin-right: 10px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            font-weight: 500;
            color: #374151;
            margin-bottom: 8px;
        }

        label .required {
            color: #ef4444;
        }

        input[type="text"],
        input[type="email"] {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
        }

        input[type="text"]:focus,
        input[type="email"]:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 30px;
        }

        button {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary {
            background: #2563eb;
            color: white;
        }

        .btn-primary:hover {
            background: #1d4ed8;
        }

        .btn-secondary {
            background: #e5e7eb;
            color: #374151;
        }

        .btn-secondary:hover {
            background: #d1d5db;
        }

        .alert {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }

        .alert.success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #10b981;
        }

        .alert.error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #ef4444;
        }

        .alert.show {
            display: block;
        }

        .help-text {
            font-size: 13px;
            color: #6b7280;
            margin-top: 5px;
        }

        .back-link {
            display: inline-flex;
            align-items: center;
            color: #2563eb;
            text-decoration: none;
            margin-bottom: 20px;
            font-size: 14px;
        }

        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="../index.php" class="back-link">← Torna alla Dashboard</a>

        <h1>Impostazioni Email</h1>
        <p class="subtitle">Configura le impostazioni per l'invio delle email tramite Brevo</p>

        <div id="alert" class="alert"></div>

        <form id="emailForm">
            <!-- Brevo Settings -->
            <div class="section">
                <h2>Configurazione Brevo</h2>

                <div class="form-group">
                    <label>
                        Email Mittente <span class="required">*</span>
                    </label>
                    <input
                        type="email"
                        id="senderEmail"
                        required
                        placeholder="noreply@didieffe.com"
                    >
                    <p class="help-text">L'email che apparirà come mittente (deve essere verificata su Brevo)</p>
                </div>

                <div class="form-group">
                    <label>
                        Nome Mittente <span class="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="senderName"
                        required
                        placeholder="Didieffe B2B"
                    >
                    <p class="help-text">Il nome che apparirà come mittente delle email</p>
                </div>

                <div class="form-group">
                    <label>
                        Email Risposta (Reply-To)
                    </label>
                    <input
                        type="email"
                        id="replyToEmail"
                        placeholder="apellizzari@didieffe.com"
                    >
                    <p class="help-text">L'email a cui verranno inviate le risposte dei clienti</p>
                </div>

                <div class="form-group">
                    <label>
                        Nome Reply-To
                    </label>
                    <input
                        type="text"
                        id="replyToName"
                        placeholder="Didieffe Support"
                    >
                </div>
            </div>

            <!-- Logo Settings -->
            <div class="section">
                <h2 style="display: flex; align-items: center;">
                    <span style="margin-right: 10px;">🖼️</span>
                    Logo Email
                </h2>

                <div id="logoPreview" style="margin-bottom: 20px; display: none;">
                    <label>Logo Attuale:</label>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; margin-top: 10px;">
                        <img id="currentLogo" src="" alt="Logo" style="max-width: 300px; max-height: 100px; object-fit: contain;">
                    </div>
                </div>

                <div class="form-group">
                    <label>
                        Carica Nuovo Logo
                    </label>
                    <input
                        type="file"
                        id="logoFile"
                        accept="image/png,image/jpeg,image/jpg"
                        style="padding: 8px;"
                    >
                    <p class="help-text">Formato supportato: PNG, JPG (consigliato: PNG trasparente, max 300x100px)</p>
                </div>

                <button type="button" id="uploadLogoBtn" class="btn-secondary" style="margin-top: 10px;">
                    📤 Carica Logo
                </button>
            </div>

            <!-- Email Templates -->
            <div class="section">
                <h2>Template Email</h2>

                <div class="form-group">
                    <div class="checkbox-group">
                        <input
                            type="checkbox"
                            id="b2cEnabled"
                            checked
                        >
                        <label for="b2cEnabled" style="margin: 0;">
                            Invia email di benvenuto ai clienti B2C
                        </label>
                    </div>
                    <p class="help-text">Email inviata dopo la registrazione di un cliente privato</p>
                </div>

                <div class="form-group">
                    <label>Oggetto Email B2C</label>
                    <input
                        type="text"
                        id="b2cSubject"
                        placeholder="Benvenuto su Didieffe B2B!"
                    >
                </div>

                <div class="form-group" style="margin-top: 30px;">
                    <div class="checkbox-group">
                        <input
                            type="checkbox"
                            id="b2bEnabled"
                            checked
                        >
                        <label for="b2bEnabled" style="margin: 0;">
                            Invia email di conferma ai clienti B2B
                        </label>
                    </div>
                    <p class="help-text">Email inviata dopo la richiesta di registrazione aziendale</p>
                </div>

                <div class="form-group">
                    <label>Oggetto Email B2B</label>
                    <input
                        type="text"
                        id="b2bSubject"
                        placeholder="Richiesta Registrazione B2B Ricevuta - Didieffe"
                    >
                </div>
            </div>

            <div class="button-group">
                <button type="button" id="saveConfigBtn" class="btn-primary">
                    💾 Salva Configurazione
                </button>
                <button type="button" class="btn-secondary" onclick="loadConfig()">
                    🔄 Ripristina
                </button>
            </div>
        </form>
    </div>

    <script>
        const API_BASE = '../api';

        // Show alert message
        function showAlert(message, type = 'success') {
            const alert = document.getElementById('alert');
            alert.textContent = message;
            alert.className = `alert ${type} show`;

            setTimeout(() => {
                alert.classList.remove('show');
            }, 5000);
        }

        // Load configuration
        async function loadConfig() {
            console.log('📥 [Email Settings] Loading config...');
            try {
                const response = await fetch(`${API_BASE}/get-email-config.php`);
                console.log('📥 [Email Settings] Response status:', response.status);

                const result = await response.json();
                console.log('📥 [Email Settings] Response data:', result);

                if (result.success) {
                    const config = result.config;
                    console.log('✅ [Email Settings] Config loaded:', config);

                    // Brevo settings
                    document.getElementById('senderEmail').value = config.brevo.senderEmail || '';
                    document.getElementById('senderName').value = config.brevo.senderName || '';
                    document.getElementById('replyToEmail').value = config.brevo.replyToEmail || '';
                    document.getElementById('replyToName').value = config.brevo.replyToName || '';

                    // Template settings
                    document.getElementById('b2cEnabled').checked = config.templates.b2c_welcome.enabled;
                    document.getElementById('b2cSubject').value = config.templates.b2c_welcome.subject || '';
                    document.getElementById('b2bEnabled').checked = config.templates.b2b_confirmation.enabled;
                    document.getElementById('b2bSubject').value = config.templates.b2b_confirmation.subject || '';

                    // Logo preview
                    if (config.logo && config.logo.base64) {
                        document.getElementById('logoPreview').style.display = 'block';
                        document.getElementById('currentLogo').src = config.logo.base64;
                        console.log('🖼️ [Email Settings] Logo found in config');
                    } else {
                        document.getElementById('logoPreview').style.display = 'none';
                        console.log('ℹ️ [Email Settings] No logo in config');
                    }

                    console.log('✅ [Email Settings] Configuration loaded successfully');
                } else {
                    console.error('❌ [Email Settings] Load failed:', result.error);
                    showAlert('Errore nel caricamento della configurazione', 'error');
                }
            } catch (error) {
                console.error('❌ [Email Settings] Error loading config:', error);
                showAlert('Errore di connessione al server', 'error');
            }
        }

        // Save configuration
        console.log('🔧 [Email Settings] Setting up save button click listener...');
        const saveBtn = document.getElementById('saveConfigBtn');

        if (!saveBtn) {
            console.error('❌ [Email Settings] Save button not found!');
        } else {
            console.log('✅ [Email Settings] Save button found, attaching listener...');

            saveBtn.addEventListener('click', async () => {
                console.log('📤 [Email Settings] Save button clicked!');

                const config = {
                brevo: {
                    senderEmail: document.getElementById('senderEmail').value,
                    senderName: document.getElementById('senderName').value,
                    replyToEmail: document.getElementById('replyToEmail').value,
                    replyToName: document.getElementById('replyToName').value
                },
                templates: {
                    b2c_welcome: {
                        subject: document.getElementById('b2cSubject').value,
                        enabled: document.getElementById('b2cEnabled').checked
                    },
                    b2b_confirmation: {
                        subject: document.getElementById('b2bSubject').value,
                        enabled: document.getElementById('b2bEnabled').checked
                    }
                }
            };

            console.log('📤 [Email Settings] Saving config:', config);

            try {
                const response = await fetch(`${API_BASE}/save-email-config.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(config)
                });

                console.log('📥 [Email Settings] Response status:', response.status);

                const result = await response.json();
                console.log('📥 [Email Settings] Response data:', result);

                if (result.success) {
                    showAlert('✅ Configurazione salvata con successo!', 'success');
                    console.log('✅ [Email Settings] Config saved successfully');
                } else {
                    showAlert(`❌ Errore: ${result.error}`, 'error');
                    console.error('❌ [Email Settings] Save failed:', result.error);
                }
            } catch (error) {
                console.error('❌ [Email Settings] Error saving config:', error);
                showAlert('❌ Errore di connessione al server', 'error');
            }
            });
            console.log('✅ [Email Settings] Click listener attached to save button');
        }

        // Upload logo handler
        document.getElementById('uploadLogoBtn').addEventListener('click', async () => {
            const fileInput = document.getElementById('logoFile');
            const file = fileInput.files[0];

            if (!file) {
                showAlert('Seleziona un file da caricare', 'error');
                return;
            }

            // Check file type
            if (!file.type.match('image/(png|jpeg|jpg)')) {
                showAlert('Formato file non supportato. Usa PNG o JPG', 'error');
                return;
            }

            // Check file size (max 1MB)
            if (file.size > 1024 * 1024) {
                showAlert('File troppo grande. Massimo 1MB', 'error');
                return;
            }

            try {
                // Convert to base64
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const base64 = e.target.result;

                    // Save logo to config
                    const response = await fetch(`${API_BASE}/upload-logo.php`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ base64 })
                    });

                    const result = await response.json();

                    if (result.success) {
                        showAlert('✅ Logo caricato con successo!', 'success');
                        // Reload config to show new logo
                        await loadConfig();
                        // Clear file input
                        fileInput.value = '';
                    } else {
                        showAlert(`❌ Errore: ${result.error}`, 'error');
                    }
                };

                reader.onerror = () => {
                    showAlert('❌ Errore nella lettura del file', 'error');
                };

                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error uploading logo:', error);
                showAlert('❌ Errore nel caricamento del logo', 'error');
            }
        });

        // Load config on page load
        window.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 [Email Settings] Page loaded, initializing...');

            // Check if form exists
            const form = document.getElementById('emailForm');
            if (form) {
                console.log('✅ [Email Settings] Form found');
            } else {
                console.error('❌ [Email Settings] Form NOT found!');
            }

            loadConfig();
        });
    </script>
</body>
</html>
