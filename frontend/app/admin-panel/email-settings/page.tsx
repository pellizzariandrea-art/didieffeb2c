'use client';

// app/admin-panel/email-settings/page.tsx
// Email Settings Admin Page

import { useState, useEffect } from 'react';
import { getEmailConfig, saveEmailConfig, uploadLogo } from '@/lib/firebase/email-config';

interface EmailConfig {
  brevo: {
    senderEmail: string;
    senderName: string;
    replyToEmail: string;
    replyToName: string;
  };
  templates: {
    b2c_welcome: {
      subject: string;
      enabled: boolean;
    };
    b2b_confirmation: {
      subject: string;
      enabled: boolean;
    };
  };
  logo?: {
    base64: string;
    type: string;
    uploadedAt: string;
  };
}

export default function EmailSettingsPage() {
  const [config, setConfig] = useState<EmailConfig>({
    brevo: {
      senderEmail: '',
      senderName: '',
      replyToEmail: '',
      replyToName: '',
    },
    templates: {
      b2c_welcome: {
        subject: 'Benvenuto su Didieffe B2B!',
        enabled: true,
      },
      b2b_confirmation: {
        subject: 'Richiesta Registrazione B2B Ricevuta - Didieffe',
        enabled: true,
      },
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testLogs, setTestLogs] = useState<Array<{ time: string; type: 'info' | 'success' | 'error'; message: string }>>([]);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const loadedConfig = await getEmailConfig();
      if (loadedConfig) {
        setConfig(loadedConfig);
      }
    } catch (error: any) {
      console.error('Error loading config:', error);
      showMessage('error', 'Errore nel caricamento della configurazione');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveEmailConfig(config);
      showMessage('success', 'Configurazione salvata con successo!');
    } catch (error: any) {
      console.error('Error saving config:', error);
      showMessage('error', 'Errore nel salvataggio: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.match('image/(png|jpeg|jpg)')) {
      showMessage('error', 'Formato non supportato. Usa PNG o JPG');
      return;
    }

    if (file.size > 1024 * 1024) {
      showMessage('error', 'File troppo grande. Max 1MB');
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;

        const logoData = {
          base64,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        };

        // Update config
        const newConfig = { ...config, logo: logoData };
        setConfig(newConfig);

        // Save to Firestore
        await saveEmailConfig(newConfig);
        showMessage('success', 'Logo caricato con successo!');
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      showMessage('error', 'Errore nel caricamento del logo');
    }
  };

  const addLog = (type: 'info' | 'success' | 'error', message: string) => {
    const time = new Date().toLocaleTimeString('it-IT');
    setTestLogs(prev => [...prev, { time, type, message }]);
  };

  const clearLogs = () => {
    setTestLogs([]);
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      showMessage('error', 'Inserisci un indirizzo email');
      return;
    }

    try {
      setTestEmailSending(true);
      clearLogs();

      addLog('info', `Preparazione invio email di test a: ${testEmail}`);
      addLog('info', 'Caricamento configurazione Brevo...');

      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      addLog('info', `Risposta ricevuta dal server (HTTP ${response.status})`);

      const result = await response.json();

      if (result.success) {
        if (result.viaProxy) {
          addLog('info', `📡 Invio tramite proxy PHP (${result.proxyUrl}) - IP statico whitelistato`);
        }
        addLog('success', '✅ Email inviata con successo!');
        if (result.messageId) {
          addLog('info', `Message ID: ${result.messageId}`);
        }
        addLog('info', 'Controlla la casella di posta (anche spam) per verificare la ricezione');
        showMessage('success', 'Email di test inviata con successo!');
        setTestEmail('');
      } else {
        addLog('error', `❌ Errore: ${result.error || 'Errore sconosciuto'}`);
        showMessage('error', result.error || 'Errore nell\'invio');
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      addLog('error', `❌ Errore di rete: ${error.message}`);
      showMessage('error', 'Errore nell\'invio dell\'email di test');
    } finally {
      setTestEmailSending(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configura le impostazioni per l'invio delle email tramite Brevo
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Brevo Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Configurazione Brevo</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Mittente *
              </label>
              <input
                type="email"
                value={config.brevo.senderEmail}
                onChange={(e) => setConfig({ ...config, brevo: { ...config.brevo, senderEmail: e.target.value } })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="noreply@didieffe.com"
              />
              <p className="mt-1 text-xs text-gray-500">Deve essere verificata su Brevo</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome Mittente *
              </label>
              <input
                type="text"
                value={config.brevo.senderName}
                onChange={(e) => setConfig({ ...config, brevo: { ...config.brevo, senderName: e.target.value } })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="Didieffe B2B"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Risposta (Reply-To)
              </label>
              <input
                type="email"
                value={config.brevo.replyToEmail}
                onChange={(e) => setConfig({ ...config, brevo: { ...config.brevo, replyToEmail: e.target.value } })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="support@didieffe.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome Reply-To
              </label>
              <input
                type="text"
                value={config.brevo.replyToName}
                onChange={(e) => setConfig({ ...config, brevo: { ...config.brevo, replyToName: e.target.value } })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="Didieffe Support"
              />
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Logo Email</h2>

          {config.logo && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Logo Attuale:</p>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 inline-block">
                <img src={config.logo.base64} alt="Logo" className="max-w-xs max-h-24 object-contain" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carica Nuovo Logo
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleLogoUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">PNG o JPG, max 1MB</p>
          </div>
        </div>

        {/* Email Templates */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Template Email</h2>

          <div className="space-y-4">
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.templates.b2c_welcome.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    templates: {
                      ...config.templates,
                      b2c_welcome: { ...config.templates.b2c_welcome, enabled: e.target.checked }
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Invia email di benvenuto ai clienti B2C
                </label>
              </div>
              <input
                type="text"
                value={config.templates.b2c_welcome.subject}
                onChange={(e) => setConfig({
                  ...config,
                  templates: {
                    ...config.templates,
                    b2c_welcome: { ...config.templates.b2c_welcome, subject: e.target.value }
                  }
                })}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="Oggetto email B2C"
              />
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.templates.b2b_confirmation.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    templates: {
                      ...config.templates,
                      b2b_confirmation: { ...config.templates.b2b_confirmation, enabled: e.target.checked }
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Invia email di conferma ai clienti B2B
                </label>
              </div>
              <input
                type="text"
                value={config.templates.b2b_confirmation.subject}
                onChange={(e) => setConfig({
                  ...config,
                  templates: {
                    ...config.templates,
                    b2b_confirmation: { ...config.templates.b2b_confirmation, subject: e.target.value }
                  }
                })}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="Oggetto email B2B"
              />
            </div>
          </div>
        </div>

        {/* Test Email */}
        <div className="bg-blue-50 border border-blue-200 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-blue-900 mb-4">Invia Email di Test</h2>
          <p className="text-sm text-blue-700 mb-4">
            Invia un'email di test per verificare la configurazione
          </p>

          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Inserisci email destinatario"
              className="flex-1 rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
            <button
              onClick={handleSendTestEmail}
              disabled={testEmailSending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testEmailSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Invio...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Invia Test
                </>
              )}
            </button>
          </div>

          {/* Test Email Log */}
          {testLogs.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-900">Log Invio</h3>
                <button
                  onClick={clearLogs}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Pulisci Log
                </button>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-xs">
                {testLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`mb-1 ${
                      log.type === 'error'
                        ? 'text-red-400'
                        : log.type === 'success'
                        ? 'text-green-400'
                        : 'text-gray-300'
                    }`}
                  >
                    <span className="text-gray-500">[{log.time}]</span>{' '}
                    {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={loadConfig}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Ripristina
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvataggio...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Salva Configurazione
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
