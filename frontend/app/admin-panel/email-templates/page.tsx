'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { EmailTemplate, TemplateCategory, SupportedLanguage, COMMON_VARIABLES, formatVariable } from '@/types/email-template';
import { getEmailTemplates, deleteEmailTemplate, toggleEmailTemplateStatus } from '@/lib/firebase/email-templates';
import { Plus, Edit2, Trash2, Eye, Mail, CheckCircle, XCircle, Loader2, Languages } from 'lucide-react';
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

  const categoryGradients = {
    all: 'from-blue-500 to-indigo-600',
    authentication: 'from-purple-500 to-pink-600',
    orders: 'from-green-500 to-emerald-600',
    notifications: 'from-orange-500 to-red-600',
    marketing: 'from-cyan-500 to-blue-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Caricamento template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Email</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                {templates.length}
              </span>
              template multilingua per eventi di sistema
            </p>
          </div>
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-5 h-5" />
            Nuovo Template
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Filtra per Categoria</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(Object.keys(categoryLabels) as Array<TemplateCategory | 'all'>).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? `bg-gradient-to-r ${categoryGradients[cat]} text-white shadow-lg`
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
              }`}
            >
              {categoryIcons[cat]} {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nessun template trovato per questa categoria</p>
            </div>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group bg-white rounded-2xl shadow-sm border-2 border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {/* Color Bar */}
              <div className={`h-2 bg-gradient-to-r ${categoryGradients[template.category]}`}></div>

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{template.name}</h3>
                      {template.enabled ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                  </div>
                </div>

                {/* Category & Target Badges */}
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r ${categoryGradients[template.category]} text-white`}>
                    {categoryIcons[template.category]} {categoryLabels[template.category]}
                  </span>
                  {template.targetAudience?.includes('b2c') && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 border-2 border-purple-200">
                      👤 B2C
                    </span>
                  )}
                  {template.targetAudience?.includes('b2b') && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-100 text-orange-700 border-2 border-orange-200">
                      🏢 B2B
                    </span>
                  )}
                </div>

                {/* Variables Count */}
                <div className="mb-4 flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xs">{template.variables.length}</span>
                  </div>
                  <span className="text-gray-600">variabili disponibili</span>
                </div>

                {/* Languages */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-600 uppercase">Traduzioni</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(['it', 'en', 'de', 'fr', 'es', 'pt', 'hr', 'sl', 'el'] as SupportedLanguage[]).map((lang) => {
                      const hasTranslation = template.translations[lang]?.subject && template.translations[lang]?.body;
                      return (
                        <span
                          key={lang}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg ${
                            hasTranslation
                              ? 'bg-green-100 text-green-700 border-2 border-green-200'
                              : 'bg-gray-50 text-gray-400 border-2 border-gray-100'
                          }`}
                        >
                          {lang.toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-4 border-t-2 border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1.5 transition-all border-2 border-blue-100"
                      title="Modifica template"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifica
                    </button>
                    <button
                      onClick={() => handleToggleStatus(template)}
                      className={`px-3 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all border-2 ${
                        template.enabled
                          ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
                          : 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200'
                      }`}
                      title={template.enabled ? 'Disabilita' : 'Abilita'}
                    >
                      {template.enabled ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      {template.enabled ? 'Disabilita' : 'Abilita'}
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(template)}
                    className="w-full px-3 py-2.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center gap-1.5 transition-all border-2 border-red-200"
                    title="Elimina template"
                  >
                    <Trash2 className="w-4 h-4" />
                    Elimina
                  </button>
                </div>
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
