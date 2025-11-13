'use client';

// app/admin/translations/page.tsx
// Admin panel for managing UI translations

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Languages, Search, Save, Loader2, Edit2, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' }
];

interface TranslationEntry {
  key: string;
  section: string;
  translations: Record<string, string>;
}

export default function TranslationsAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [translations, setTranslations] = useState<any>(null);
  const [entries, setEntries] = useState<TranslationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/');
    }
  }, [user, authLoading, router]);

  // Load translations
  useEffect(() => {
    loadTranslations();
  }, []);

  const loadTranslations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/translations/save');
      const data = await response.json();

      if (data.success) {
        setTranslations(data.translations);
        parseTranslations(data.translations);
      }
    } catch (error) {
      console.error('Error loading translations:', error);
      showMessage('error', 'Errore nel caricamento delle traduzioni');
    } finally {
      setLoading(false);
    }
  };

  const parseTranslations = (data: any) => {
    const parsed: TranslationEntry[] = [];

    function traverse(obj: any, prefix = '', section = '') {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const currentSection = section || key;

        if (typeof obj[key] === 'object' && !obj[key].it) {
          traverse(obj[key], fullKey, currentSection);
        } else {
          parsed.push({
            key: fullKey,
            section: currentSection,
            translations: obj[key]
          });
        }
      }
    }

    traverse(data);
    setEntries(parsed);
  };

  const sections = useMemo(() => {
    const sectionSet = new Set(entries.map(e => e.section));
    return Array.from(sectionSet).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = !searchTerm ||
        entry.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(entry.translations).some(t =>
          t.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesSection = selectedSection === 'all' || entry.section === selectedSection;

      return matchesSearch && matchesSection;
    });
  }, [entries, searchTerm, selectedSection]);

  const updateTranslation = (key: string, lang: string, value: string) => {
    setEntries(prev => prev.map(entry => {
      if (entry.key === key) {
        return {
          ...entry,
          translations: {
            ...entry.translations,
            [lang]: value
          }
        };
      }
      return entry;
    }));
  };

  const saveTranslations = async () => {
    try {
      setSaving(true);

      // Rebuild nested structure
      const rebuilt: any = {};

      entries.forEach(entry => {
        const parts = entry.key.split('.');
        let current = rebuilt;

        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }

        current[parts[parts.length - 1]] = entry.translations;
      });

      const token = process.env.NEXT_PUBLIC_ADMIN_API_TOKEN || '';
      const response = await fetch('/api/translations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ translations: rebuilt })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', `Traduzioni salvate! Backup: ${data.backup}`);
        setTranslations(rebuilt);
      } else {
        showMessage('error', data.error || 'Errore nel salvataggio');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showMessage('error', 'Errore nel salvataggio delle traduzioni');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Caricamento traduzioni...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Languages className="w-6 h-6 text-white" />
              </div>
              Gestione Traduzioni UI
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">
                {filteredEntries.length}
              </span>
              <span>
                {filteredEntries.length === entries.length
                  ? `${entries.length} chiavi tradotte`
                  : `${filteredEntries.length} di ${entries.length} chiavi`
                }
              </span>
            </p>
          </div>
          <button
            onClick={saveTranslations}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
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

      {/* Message */}
      {message && (
        <div className={`rounded-2xl border-2 p-4 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <Check className="w-5 h-5" /> : null}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Filtri e Ricerca</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Cerca
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca chiave o traduzione..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Sezione
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
            >
              <option value="all">Tutte le sezioni ({entries.length})</option>
              {sections.map(section => {
                const count = entries.filter(e => e.section === section).length;
                return (
                  <option key={section} value={section}>
                    {section} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Lingua da modificare
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
            >
              {LANGUAGES.filter(l => l.code !== 'it').map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Translations Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Chiave
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  🇮🇹 Italiano (Base)
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {LANGUAGES.find(l => l.code === selectedLanguage)?.flag} {LANGUAGES.find(l => l.code === selectedLanguage)?.name}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredEntries.map((entry) => (
                <tr key={entry.key} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="text-sm font-mono font-semibold text-gray-900">{entry.key}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
                        {entry.section}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm text-gray-700 font-medium">{entry.translations.it}</div>
                  </td>
                  <td className="px-6 py-5">
                    {editingKey === entry.key ? (
                      <input
                        type="text"
                        value={entry.translations[selectedLanguage] || ''}
                        onChange={(e) => updateTranslation(entry.key, selectedLanguage, e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        autoFocus
                        onBlur={() => setEditingKey(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingKey(null);
                          if (e.key === 'Escape') setEditingKey(null);
                        }}
                      />
                    ) : (
                      <div
                        className="text-sm font-medium cursor-pointer text-gray-900 hover:text-blue-600 transition-colors"
                        onClick={() => setEditingKey(entry.key)}
                      >
                        {entry.translations[selectedLanguage] || (
                          <span className="text-gray-400 italic bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                            ⚠️ Non tradotto
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setEditingKey(editingKey === entry.key ? null : entry.key)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all border-2 ${
                        editingKey === entry.key
                          ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                          : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {editingKey === entry.key ? (
                        <>
                          <Check className="w-4 h-4 inline mr-1" />
                          Salva
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-4 h-4 inline mr-1" />
                          Modifica
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <Languages className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nessuna traduzione trovata</p>
          </div>
        )}
      </div>
    </div>
  );
}
