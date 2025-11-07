'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  EmailTemplate,
  SupportedLanguage,
  EmailTemplateTranslation,
  TargetAudience,
  EmailTemplateVariable,
  COMMON_VARIABLES,
  formatVariable
} from '@/types/email-template';
import { updateEmailTemplate, getEmailTemplate } from '@/lib/firebase/email-templates';
import { X, Copy, Globe, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditTemplateModalProps {
  template: EmailTemplate;
  onClose: () => void;
  onSuccess: (template: EmailTemplate) => void;
}

const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

export default function EditTemplateModal({ template, onClose, onSuccess }: EditTemplateModalProps) {
  const { user, firebaseUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SupportedLanguage>('it');
  const [translations, setTranslations] = useState(template.translations);
  const [targetAudience, setTargetAudience] = useState<TargetAudience[]>(template.targetAudience || ['b2c']);
  const [variables, setVariables] = useState<EmailTemplateVariable[]>(template.variables);
  const [showVariableManager, setShowVariableManager] = useState(false);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState('');

  const handleTranslationChange = (
    lang: SupportedLanguage,
    field: 'subject' | 'body',
    value: string
  ) => {
    setTranslations(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value,
      },
    }));
  };

  const toggleTargetAudience = (audience: TargetAudience) => {
    setTargetAudience(prev =>
      prev.includes(audience)
        ? prev.filter(a => a !== audience)
        : [...prev, audience]
    );
  };

  const insertVariable = (variableName: string) => {
    const textarea = document.querySelector(`textarea[data-lang="${activeTab}"]`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = translations[activeTab]?.body || '';
    const variable = formatVariable(variableName);

    const newText = text.substring(0, start) + variable + text.substring(end);
    handleTranslationChange(activeTab, 'body', newText);

    // Restore cursor position after variable insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const handleTranslate = async () => {
    // Verifica che ci sia contenuto italiano
    if (!translations.it?.subject?.trim() || !translations.it?.body?.trim()) {
      toast.error('Compila prima la traduzione italiana (oggetto e corpo)');
      return;
    }

    try {
      setTranslating(true);
      toast.info('Traduzione in corso... Attendere');

      const response = await fetch('/api/translate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSubject: translations.it.subject,
          sourceBody: translations.it.body,
          targetLanguages: ['en', 'de', 'fr', 'es', 'pt'],
        }),
      });

      // Controlla se la risposta è OK
      if (!response.ok) {
        const text = await response.text();
        console.error('Backend response:', text);
        throw new Error(`Errore backend (${response.status}): ${text.substring(0, 200)}`);
      }

      // Prova a parsare il JSON
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('Invalid JSON response:', text);
        throw new Error('Risposta backend non valida. Controlla che il file PHP sia caricato correttamente.');
      }

      if (result.success) {
        // Aggiorna le traduzioni
        const updatedTranslations = { ...translations };

        for (const [lang, content] of Object.entries(result.translations)) {
          if (lang !== 'it') {
            updatedTranslations[lang as SupportedLanguage] = content as EmailTemplateTranslation;
          }
        }

        setTranslations(updatedTranslations);
        toast.success('Traduzioni generate con successo!');
      } else {
        throw new Error(result.error || 'Errore nella traduzione');
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error(error.message || 'Errore durante la generazione delle traduzioni');
    } finally {
      setTranslating(false);
    }
  };

  const toggleVariablePreset = (preset: string) => {
    const presetVars = COMMON_VARIABLES[preset];
    if (!presetVars) return;

    // Check if all variables from this preset are already added
    const allPresent = presetVars.every(pv =>
      variables.some(v => v.name === pv.name)
    );

    if (allPresent) {
      // Remove all variables from this preset
      setVariables(prev =>
        prev.filter(v => !presetVars.some(pv => pv.name === v.name))
      );
    } else {
      // Add missing variables from this preset
      const newVars = presetVars.filter(pv =>
        !variables.some(v => v.name === pv.name)
      );
      setVariables(prev => [...prev, ...newVars]);
    }
  };

  const removeVariable = (variableName: string) => {
    setVariables(prev => prev.filter(v => v.name !== variableName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firebaseUser) {
      toast.error('Utente non autenticato');
      return;
    }

    const userId = firebaseUser.uid;

    // Validation: at least Italian translation should have subject and body
    if (!translations.it?.subject?.trim() || !translations.it?.body?.trim()) {
      setError('La traduzione italiana (subject e body) è obbligatoria');
      toast.error('La traduzione italiana è obbligatoria');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await updateEmailTemplate(
        template.id,
        { translations, targetAudience, variables },
        userId
      );

      toast.success('Template salvato con successo!');

      // Reload the updated template
      const updatedTemplate = await getEmailTemplate(template.id);

      if (updatedTemplate) {
        onSuccess(updatedTemplate);
      } else {
        throw new Error('Template non trovato dopo l\'aggiornamento');
      }
    } catch (err: any) {
      console.error('Error updating template:', err);
      setError(err.message || 'Errore durante l\'aggiornamento del template');
      toast.error(err.message || 'Errore durante il salvataggio');
      setSaving(false);
    }
  };

  const currentTranslation = translations[activeTab] || { subject: '', body: '' };
  const translationProgress = LANGUAGES.map(lang => ({
    ...lang,
    hasContent: !!(translations[lang.code]?.subject && translations[lang.code]?.body)
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTranslate}
              disabled={translating || saving}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              {translating ? 'Traduzione...' : 'Traduci da IT'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={saving || translating}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="border-b bg-gray-50 px-6 py-3 overflow-x-auto">
          <div className="flex gap-2">
            {translationProgress.map(({ code, label, flag, hasContent }) => (
              <button
                key={code}
                onClick={() => setActiveTab(code)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === code
                    ? 'bg-blue-600 text-white'
                    : hasContent
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {flag} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Destinatari
              </label>
              <div className="flex gap-3">
                <label className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  targetAudience.includes('b2c')
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={targetAudience.includes('b2c')}
                    onChange={() => toggleTargetAudience('b2c')}
                    className="sr-only"
                    disabled={saving}
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-1">👤</div>
                    <div className="font-medium text-sm">B2C</div>
                    <div className="text-xs text-gray-600 mt-1">Clienti privati</div>
                  </div>
                </label>
                <label className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  targetAudience.includes('b2b')
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={targetAudience.includes('b2b')}
                    onChange={() => toggleTargetAudience('b2b')}
                    className="sr-only"
                    disabled={saving}
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-1">🏢</div>
                    <div className="font-medium text-sm">B2B</div>
                    <div className="text-xs text-gray-600 mt-1">Aziende</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Variable Management */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Gestione Variabili
                </h3>
                <button
                  type="button"
                  onClick={() => setShowVariableManager(!showVariableManager)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  disabled={saving}
                >
                  {showVariableManager ? 'Nascondi' : 'Modifica'}
                  <Plus className={`w-4 h-4 transition-transform ${showVariableManager ? 'rotate-45' : ''}`} />
                </button>
              </div>

              {/* Current Variables */}
              <div className="flex flex-wrap gap-2 mb-3">
                {variables.map((variable) => (
                  <div
                    key={variable.name}
                    className="px-3 py-1.5 bg-gray-100 border border-gray-300 text-gray-700 rounded-md text-xs font-mono flex items-center gap-2"
                    title={variable.description}
                  >
                    {formatVariable(variable.name)}
                    {showVariableManager && (
                      <button
                        type="button"
                        onClick={() => removeVariable(variable.name)}
                        className="text-red-500 hover:text-red-700"
                        disabled={saving}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {variables.length === 0 && (
                  <p className="text-sm text-gray-500">Nessuna variabile configurata</p>
                )}
              </div>

              {/* Add Variables from Presets */}
              {showVariableManager && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs text-gray-600 mb-2">
                    Aggiungi variabili dai preset comuni:
                  </p>
                  {Object.keys(COMMON_VARIABLES).map((preset) => {
                    const presetVars = COMMON_VARIABLES[preset];
                    const allPresent = presetVars.every(pv =>
                      variables.some(v => v.name === pv.name)
                    );
                    return (
                      <label
                        key={preset}
                        className="flex items-start gap-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={allPresent}
                          onChange={() => toggleVariablePreset(preset)}
                          className="mt-1"
                          disabled={saving}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900 capitalize">
                            {preset === 'user' && '👤 Utente'}
                            {preset === 'company' && '🏢 Azienda'}
                            {preset === 'order' && '📦 Ordine'}
                            {preset === 'shipping' && '🚚 Spedizione'}
                            {preset === 'signature' && '✍️ Firma'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {presetVars.map(v => v.name).join(', ')}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Variables Helper */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                Variabili Disponibili (clicca per inserire):
              </h3>
              <div className="flex flex-wrap gap-2">
                {variables.map((variable) => (
                  <button
                    key={variable.name}
                    type="button"
                    onClick={() => insertVariable(variable.name)}
                    className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-md text-xs font-mono hover:bg-blue-100 flex items-center gap-1"
                    title={variable.description}
                    disabled={saving}
                  >
                    <Copy className="w-3 h-3" />
                    {formatVariable(variable.name)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-blue-700 mt-3">
                💡 Le variabili verranno sostituite automaticamente con i valori reali quando l'email viene inviata
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oggetto {activeTab === 'it' && '*'}
              </label>
              <input
                type="text"
                value={currentTranslation.subject}
                onChange={(e) => handleTranslationChange(activeTab, 'subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Oggetto dell'email in ${LANGUAGES.find(l => l.code === activeTab)?.label}`}
                required={activeTab === 'it'}
                disabled={saving}
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Corpo Email {activeTab === 'it' && '*'}
              </label>
              <textarea
                data-lang={activeTab}
                value={currentTranslation.body}
                onChange={(e) => handleTranslationChange(activeTab, 'body', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder={`Corpo dell'email in ${LANGUAGES.find(l => l.code === activeTab)?.label}\n\nUsa le variabili qui sopra per personalizzare il messaggio`}
                rows={12}
                required={activeTab === 'it'}
                disabled={saving}
              />
              <p className="mt-2 text-xs text-gray-500">
                Puoi usare HTML di base: &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;p&gt;, &lt;a href=""&gt;
              </p>
            </div>

            {/* Preview */}
            {currentTranslation.body && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Anteprima:</h3>
                <div className="bg-white border rounded p-4">
                  <div className="font-bold mb-2">{currentTranslation.subject}</div>
                  <div
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: currentTranslation.body }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={saving}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
