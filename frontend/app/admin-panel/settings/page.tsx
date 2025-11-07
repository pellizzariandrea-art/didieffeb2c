'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getAppSettings, saveAppSettings, updateLogo } from '@/lib/firebase/settings';
import { AppSettings, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/types/settings';
import { toast } from 'sonner';

type TabType = 'company' | 'email';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('company');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/admin/login?redirect=/admin-panel/settings');
      return;
    }

    loadSettings();
  }, [user, authLoading, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getAppSettings(false); // Force fresh load
      setSettings(data);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Errore nel caricamento delle impostazioni');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await saveAppSettings(settings, user?.uid);
      toast.success('Impostazioni salvate con successo!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Errore nel salvataggio delle impostazioni');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Per favore seleziona un\'immagine valida');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Il file è troppo grande. Max 2MB');
      return;
    }

    try {
      setUploadingLogo(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        try {
          await updateLogo(base64, file.type, user?.uid);

          // Update local state
          setSettings(prev => prev ? {
            ...prev,
            logo: {
              base64,
              type: file.type,
              uploadedAt: new Date().toISOString(),
            }
          } : null);

          toast.success('Logo caricato con successo!');
        } catch (error) {
          console.error('Error uploading logo:', error);
          toast.error('Errore nel caricamento del logo');
        } finally {
          setUploadingLogo(false);
        }
      };

      reader.onerror = () => {
        toast.error('Errore nella lettura del file');
        setUploadingLogo(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing logo:', error);
      toast.error('Errore nel processamento del logo');
      setUploadingLogo(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento impostazioni...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Errore nel caricamento delle impostazioni</p>
          <button
            onClick={loadSettings}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
              <p className="text-sm text-gray-600 mt-1">
                Configura le impostazioni dell'applicazione
              </p>
            </div>
            <button
              onClick={() => router.push('/admin-panel')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Torna al Pannello
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('company')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'company'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏢 Informazioni Azienda
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'email'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ✉️ Email & Brevo
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'company' && (
          <CompanyTab
            settings={settings}
            onSettingsChange={setSettings}
            onLogoUpload={handleLogoUpload}
            uploadingLogo={uploadingLogo}
          />
        )}

        {activeTab === 'email' && (
          <EmailTab
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Company Tab Component
function CompanyTab({
  settings,
  onSettingsChange,
  onLogoUpload,
  uploadingLogo,
}: {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingLogo: boolean;
}) {
  const updateCompany = (field: string, value: string) => {
    onSettingsChange({
      ...settings,
      company: {
        ...settings.company,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo Aziendale</h2>
        <p className="text-sm text-gray-600 mb-4">
          Il logo verrà utilizzato sia nel sito che nelle email inviate ai clienti
        </p>

        <div className="flex items-start space-x-6">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            {settings.logo?.base64 ? (
              <img
                src={settings.logo.base64}
                alt="Logo aziendale"
                className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg p-2"
              />
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                <span className="text-4xl">🏢</span>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1">
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              onChange={onLogoUpload}
              disabled={uploadingLogo}
              className="hidden"
            />
            <label
              htmlFor="logo-upload"
              className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${
                uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploadingLogo ? 'Caricamento...' : 'Carica Logo'}
            </label>
            <p className="mt-2 text-xs text-gray-500">
              PNG, JPG o GIF. Max 2MB. Consigliato: 200x200px
            </p>
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Azienda</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Azienda *
            </label>
            <input
              type="text"
              value={settings.company.name}
              onChange={(e) => updateCompany('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Didieffe B2B"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={settings.company.email}
              onChange={(e) => updateCompany('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="info@didieffe.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefono *
            </label>
            <input
              type="tel"
              value={settings.company.phone}
              onChange={(e) => updateCompany('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="+39 012 345 6789"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sito Web
            </label>
            <input
              type="url"
              value={settings.company.website || ''}
              onChange={(e) => updateCompany('website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://shop.didieffeb2b.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indirizzo *
            </label>
            <input
              type="text"
              value={settings.company.address}
              onChange={(e) => updateCompany('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Via Roma, 123"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Città *
            </label>
            <input
              type="text"
              value={settings.company.city}
              onChange={(e) => updateCompany('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Milano"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CAP *
            </label>
            <input
              type="text"
              value={settings.company.postalCode}
              onChange={(e) => updateCompany('postalCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="20100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provincia *
            </label>
            <input
              type="text"
              value={settings.company.province}
              onChange={(e) => updateCompany('province', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="MI"
              maxLength={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paese *
            </label>
            <input
              type="text"
              value={settings.company.country}
              onChange={(e) => updateCompany('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Italia"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Partita IVA
            </label>
            <input
              type="text"
              value={settings.company.vatNumber || ''}
              onChange={(e) => updateCompany('vatNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="IT12345678901"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Codice Fiscale
            </label>
            <input
              type="text"
              value={settings.company.taxCode || ''}
              onChange={(e) => updateCompany('taxCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="12345678901"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Email Tab Component
function EmailTab({
  settings,
  onSettingsChange,
}: {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}) {
  const [signatureLanguage, setSignatureLanguage] = useState<SupportedLanguage>('it');

  const updateBrevo = (field: string, value: string) => {
    onSettingsChange({
      ...settings,
      brevo: {
        ...settings.brevo,
        [field]: value,
      },
    });
  };

  const updateSignature = (lang: SupportedLanguage, value: string) => {
    onSettingsChange({
      ...settings,
      emailSignature: {
        translations: {
          ...(settings.emailSignature?.translations || {}),
          [lang]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Brevo Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurazione Brevo</h2>
        <p className="text-sm text-gray-600 mb-6">
          Configura il mittente e reply-to delle email transazionali
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Mittente *
            </label>
            <input
              type="email"
              value={settings.brevo.senderEmail}
              onChange={(e) => updateBrevo('senderEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="noreply@didieffe.com"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              L'email che apparirà come mittente
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Mittente *
            </label>
            <input
              type="text"
              value={settings.brevo.senderName}
              onChange={(e) => updateBrevo('senderName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Didieffe B2B"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Il nome che apparirà come mittente
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Reply-To *
            </label>
            <input
              type="email"
              value={settings.brevo.replyToEmail}
              onChange={(e) => updateBrevo('replyToEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="info@didieffe.com"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              L'email a cui verranno inviate le risposte
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Reply-To *
            </label>
            <input
              type="text"
              value={settings.brevo.replyToName}
              onChange={(e) => updateBrevo('replyToName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Didieffe Support"
              required
            />
          </div>
        </div>
      </div>

      {/* Email Signature */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Firma Email</h2>
        <p className="text-sm text-gray-600 mb-6">
          La firma verrà aggiunta automaticamente a tutte le email tramite la variabile <code className="bg-gray-100 px-2 py-1 rounded text-sm">{'{{firma}}'}</code>
        </p>

        {/* Language Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {SUPPORTED_LANGUAGES.map(({ code, flag, name }) => (
            <button
              key={code}
              onClick={() => setSignatureLanguage(code)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                signatureLanguage === code
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {flag} {name}
            </button>
          ))}
        </div>

        {/* Signature Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Firma {SUPPORTED_LANGUAGES.find(l => l.code === signatureLanguage)?.name}
          </label>
          <textarea
            value={settings.emailSignature?.translations?.[signatureLanguage] || ''}
            onChange={(e) => updateSignature(signatureLanguage, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            rows={4}
            placeholder="Cordiali saluti,<br>Il Team Didieffe"
          />
          <p className="mt-2 text-xs text-gray-500">
            Puoi usare HTML: &lt;br&gt;, &lt;strong&gt;, &lt;em&gt;
          </p>
        </div>

        {/* Preview */}
        {settings.emailSignature?.translations?.[signatureLanguage] && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="text-xs font-semibold text-gray-600 mb-2">Anteprima:</div>
            <div
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: settings.emailSignature.translations[signatureLanguage] }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
