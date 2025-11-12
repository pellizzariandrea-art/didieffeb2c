'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { EmailTemplate, TemplateCategory, SupportedLanguage, COMMON_VARIABLES, formatVariable } from '@/types/email-template';
import { getEmailTemplates, deleteEmailTemplate, toggleEmailTemplateStatus } from '@/lib/firebase/email-templates';
import { Plus, Edit2, Trash2, Eye, Mail, CheckCircle, XCircle } from 'lucide-react';
import CreateTemplateModal from './CreateTemplateModal';
import EditTemplateModal from './EditTemplateModal';

export default function EmailTemplatesPage() {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  // Load templates from Firestore
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await getEmailTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Errore nel caricamento dei template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Sei sicuro di voler eliminare il template "${template.name}"?\n\nQuesta azione è irreversibile!`)) {
      return;
    }

    try {
      await deleteEmailTemplate(template.id);
      setTemplates(templates.filter(t => t.id !== template.id));
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Errore durante l\'eliminazione del template');
    }
  };

  const handleToggleStatus = async (template: EmailTemplate) => {
    if (!firebaseUser?.uid) return;

    try {
      await toggleEmailTemplateStatus(template.id, firebaseUser.uid);
      setTemplates(templates.map(t =>
        t.id === template.id ? { ...t, enabled: !t.enabled } : t
      ));
    } catch (error) {
      console.error('Error toggling template status:', error);
      alert('Errore durante il cambio di stato del template');
    }
  };

  const filteredTemplates = templates.filter(t =>
    selectedCategory === 'all' || t.category === selectedCategory
  );

  const categoryIcons = {
    all: '📧',
    authentication: '🔐',
    orders: '📦',
    notifications: '🔔',
    marketing: '📢',
  };

  const categoryLabels = {
    all: 'Tutti',
    authentication: 'Autenticazione',
    orders: 'Ordini',
    notifications: 'Notifiche',
    marketing: 'Marketing',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Template Email</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestisci i template email multilingua per i vari eventi del sistema
          </p>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          Nuovo Template
        </button>
      </div>

      {/* Category Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {(Object.keys(categoryLabels) as Array<TemplateCategory | 'all'>).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {categoryIcons[cat]} {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nessun template trovato per questa categoria
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.enabled ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </div>
              </div>

              {/* Category Badge */}
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {categoryIcons[template.category]} {categoryLabels[template.category]}
                </span>
                {template.targetAudience?.includes('b2c') && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    👤 B2C
                  </span>
                )}
                {template.targetAudience?.includes('b2b') && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    🏢 B2B
                  </span>
                )}
              </div>

              {/* Variables Count */}
              <div className="mb-4 text-sm text-gray-600">
                <strong>{template.variables.length}</strong> variabili disponibili
              </div>

              {/* Languages */}
              <div className="mb-4">
                <div className="flex gap-1 flex-wrap">
                  {(['it', 'en', 'de', 'fr', 'es', 'pt', 'hr', 'sl', 'el'] as SupportedLanguage[]).map((lang) => {
                    const hasTranslation = template.translations[lang]?.subject && template.translations[lang]?.body;
                    return (
                      <span
                        key={lang}
                        className={`text-xs px-2 py-1 rounded ${
                          hasTranslation
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t">
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center justify-center gap-1"
                    title="Modifica template"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifica
                  </button>
                  <button
                    onClick={() => handleToggleStatus(template)}
                    className={`flex-1 px-3 py-2 text-sm rounded-md flex items-center justify-center gap-1 ${
                      template.enabled
                        ? 'text-yellow-600 hover:bg-yellow-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={template.enabled ? 'Disabilita' : 'Abilita'}
                  >
                    {template.enabled ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {template.enabled ? 'Disabilita' : 'Abilita'}
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(template)}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center justify-center gap-1"
                  title="Elimina template"
                >
                  <Trash2 className="w-4 h-4" />
                  Elimina
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newTemplate) => {
            setTemplates([newTemplate, ...templates]);
            setShowCreateModal(false);
          }}
        />
      )}

      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSuccess={(updatedTemplate) => {
            setTemplates(templates.map(t =>
              t.id === updatedTemplate.id ? updatedTemplate : t
            ));
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}
