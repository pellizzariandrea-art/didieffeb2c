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
                        placeholder="Di Dieffe B2B"
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
                        placeholder="Di Dieffe Support"
                    >
                </div>
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
                        placeholder="Benvenuto su Di Dieffe B2B!"
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
                        placeholder="Richiesta Registrazione B2B Ricevuta - Di Dieffe"
                    >
                </div>
            </div>

            <div class="button-group">
                <button type="submit" class="btn-primary">
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
            try {
                const response = await fetch(`${API_BASE}/get-email-config.php`);
                const result = await response.json();

                if (result.success) {
                    const config = result.config;

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

                    console.log('✅ Configuration loaded');
                } else {
                    showAlert('Errore nel caricamento della configurazione', 'error');
                }
            } catch (error) {
                console.error('Error loading config:', error);
                showAlert('Errore di connessione al server', 'error');
            }
        }

        // Save configuration
        document.getElementById('emailForm').addEventListener('submit', async (e) => {
            e.preventDefault();

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

            try {
                const response = await fetch(`${API_BASE}/save-email-config.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(config)
                });

                const result = await response.json();

                if (result.success) {
                    showAlert('✅ Configurazione salvata con successo!', 'success');
                } else {
                    showAlert(`❌ Errore: ${result.error}`, 'error');
                }
            } catch (error) {
                console.error('Error saving config:', error);
                showAlert('❌ Errore di connessione al server', 'error');
            }
        });

        // Load config on page load
        window.addEventListener('DOMContentLoaded', loadConfig);
    </script>
</body>
</html>
