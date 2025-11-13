'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getAppSettings, saveAppSettings, updateLogo } from '@/lib/firebase/settings';
import { AppSettings, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/types/settings';
import { toast } from 'sonner';
import { Building2, Mail, Image as ImageIcon, Save, Loader2 } from 'lucide-react';

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
      router.push('/admin/?redirect=/admin-panel/settings');
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Caricamento impostazioni...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4 font-medium">Errore nel caricamento delle impostazioni</p>
          <button
            onClick={loadSettings}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Impostazioni</h1>
            <p className="text-gray-600">
              Configura le impostazioni dell'applicazione e i dati aziendali
            </p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salva Modifiche
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex-1 py-4 px-6 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'company'
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Informazioni Azienda
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-4 px-6 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'email'
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Mail className="w-5 h-5" />
            Email & Brevo
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Logo Aziendale</h2>
            <p className="text-sm text-gray-600">
              Utilizzato nel sito e nelle email
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            {settings.logo?.base64 ? (
              <div className="w-40 h-40 bg-white rounded-2xl border-2 border-blue-200 p-4 shadow-lg">
                <img
                  src={settings.logo.base64}
                  alt="Logo aziendale"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-40 h-40 bg-white rounded-2xl border-2 border-dashed border-blue-300 flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-blue-300" />
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
              className={`inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-200 rounded-xl shadow-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all ${
                uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploadingLogo ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  Carica Logo
                </>
              )}
            </label>
            <p className="mt-3 text-sm text-gray-600">
              <strong>Formati:</strong> PNG, JPG o GIF
              <br />
              <strong>Dimensione massima:</strong> 2MB
              <br />
              <strong>Dimensioni consigliate:</strong> 200x200px
            </p>
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Dati Aziendali</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Nome Azienda *
            </label>
            <input
              type="text"
              value={settings.company.name}
              onChange={(e) => updateCompany('name', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Didieffe B2B"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={settings.company.email}
              onChange={(e) => updateCompany('email', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="info@didieffe.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Telefono *
            </label>
            <input
              type="tel"
              value={settings.company.phone}
              onChange={(e) => updateCompany('phone', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="+39 012 345 6789"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Sito Web
            </label>
            <input
              type="url"
              value={settings.company.website || ''}
              onChange={(e) => updateCompany('website', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="https://shop.didieffeb2b.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Indirizzo *
            </label>
            <input
              type="text"
              value={settings.company.address}
              onChange={(e) => updateCompany('address', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Via Roma, 123"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Città *
            </label>
            <input
              type="text"
              value={settings.company.city}
              onChange={(e) => updateCompany('city', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Milano"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              CAP *
            </label>
            <input
              type="text"
              value={settings.company.postalCode}
              onChange={(e) => updateCompany('postalCode', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="20100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Provincia *
            </label>
            <input
              type="text"
              value={settings.company.province}
              onChange={(e) => updateCompany('province', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="MI"
              maxLength={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Paese *
            </label>
            <input
              type="text"
              value={settings.company.country}
              onChange={(e) => updateCompany('country', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Italia"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Partita IVA
            </label>
            <input
              type="text"
              value={settings.company.vatNumber || ''}
              onChange={(e) => updateCompany('vatNumber', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="IT12345678901"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Codice Fiscale
            </label>
            <input
              type="text"
              value={settings.company.taxCode || ''}
              onChange={(e) => updateCompany('taxCode', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Configurazione Brevo</h2>
            <p className="text-sm text-gray-600">
              Mittente e reply-to per email transazionali
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email Mittente *
            </label>
            <input
              type="email"
              value={settings.brevo.senderEmail}
              onChange={(e) => updateBrevo('senderEmail', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="noreply@didieffe.com"
              required
            />
            <p className="mt-1.5 text-xs text-gray-500">
              L'email che apparirà come mittente
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Nome Mittente *
            </label>
            <input
              type="text"
              value={settings.brevo.senderName}
              onChange={(e) => updateBrevo('senderName', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Didieffe B2B"
              required
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Il nome che apparirà come mittente
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email Reply-To *
            </label>
            <input
              type="email"
              value={settings.brevo.replyToEmail}
              onChange={(e) => updateBrevo('replyToEmail', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="info@didieffe.com"
              required
            />
            <p className="mt-1.5 text-xs text-gray-500">
              L'email a cui verranno inviate le risposte
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Nome Reply-To *
            </label>
            <input
              type="text"
              value={settings.brevo.replyToName}
              onChange={(e) => updateBrevo('replyToName', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Didieffe Support"
              required
            />
          </div>
        </div>
      </div>

      {/* Email Signature */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Firma Email Multilingua</h2>
            <p className="text-sm text-gray-600">
              Aggiunta automaticamente con <code className="bg-purple-100 px-2 py-0.5 rounded text-xs font-mono">{'{{firma}}'}</code>
            </p>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {SUPPORTED_LANGUAGES.map(({ code, flag, name }) => (
            <button
              key={code}
              onClick={() => setSignatureLanguage(code)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                signatureLanguage === code
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white text-gray-700 hover:bg-purple-50 border-2 border-purple-100'
              }`}
            >
              {flag} {name}
            </button>
          ))}
        </div>

        {/* Signature Editor */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Firma {SUPPORTED_LANGUAGES.find(l => l.code === signatureLanguage)?.name}
          </label>
          <textarea
            value={settings.emailSignature?.translations?.[signatureLanguage] || ''}
            onChange={(e) => updateSignature(signatureLanguage, e.target.value)}
            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono text-sm bg-white"
            rows={4}
            placeholder="Cordiali saluti,<br>Il Team Didieffe"
          />
          <p className="mt-2 text-xs text-gray-600">
            💡 <strong>Tip:</strong> Puoi usare HTML come &lt;br&gt;, &lt;strong&gt;, &lt;em&gt;
          </p>
        </div>

        {/* Preview */}
        {settings.emailSignature?.translations?.[signatureLanguage] && (
          <div className="mt-4 p-4 bg-white rounded-xl border-2 border-purple-200">
            <div className="text-xs font-bold text-purple-600 mb-2 uppercase">Anteprima:</div>
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
