'use client';

// app/admin/translations/page.tsx
// Admin panel for managing UI translations

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('it');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestione Traduzioni</h1>
              <p className="text-sm text-gray-500 mt-1">
                {filteredEntries.length} di {entries.length} chiavi
              </p>
            </div>
            <button
              onClick={saveTranslations}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4`}>
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cerca
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca chiave o traduzione..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Section Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sezione
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lingua da modificare
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Translations Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chiave
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Italiano (IT)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {LANGUAGES.find(l => l.code === selectedLanguage)?.flag} {LANGUAGES.find(l => l.code === selectedLanguage)?.name}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">{entry.key}</div>
                      <div className="text-xs text-gray-500">{entry.section}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{entry.translations.it}</div>
                    </td>
                    <td className="px-6 py-4">
                      {editingKey === entry.key ? (
                        <input
                          type="text"
                          value={entry.translations[selectedLanguage] || ''}
                          onChange={(e) => updateTranslation(entry.key, selectedLanguage, e.target.value)}
                          className="w-full px-3 py-2 border border-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          onBlur={() => setEditingKey(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingKey(null);
                            if (e.key === 'Escape') setEditingKey(null);
                          }}
                        />
                      ) : (
                        <div
                          className="text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                          onClick={() => setEditingKey(entry.key)}
                        >
                          {entry.translations[selectedLanguage] || <span className="text-gray-400 italic">Non tradotto</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setEditingKey(editingKey === entry.key ? null : entry.key)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {editingKey === entry.key ? 'Chiudi' : 'Modifica'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nessuna traduzione trovata</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
