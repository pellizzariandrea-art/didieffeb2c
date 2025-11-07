'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  EmailTemplate,
  TemplateCategory,
  TargetAudience,
  EmailTemplateVariable,
  COMMON_VARIABLES
} from '@/types/email-template';
import { createEmailTemplate, getEmailTemplate } from '@/lib/firebase/email-templates';
import { X } from 'lucide-react';

interface CreateTemplateModalProps {
  onClose: () => void;
  onSuccess: (template: EmailTemplate) => void;
}

export default function CreateTemplateModal({ onClose, onSuccess }: CreateTemplateModalProps) {
  const { firebaseUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'authentication' as TemplateCategory,
  });
  const [targetAudience, setTargetAudience] = useState<TargetAudience[]>(['b2c']);
  const [selectedVariablePresets, setSelectedVariablePresets] = useState<string[]>([]);
  const [customVariables, setCustomVariables] = useState<EmailTemplateVariable[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser?.uid) return;

    // Validation
    if (!formData.name.trim()) {
      setError('Il nome è obbligatorio');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Lo slug è obbligatorio');
      return;
    }

    // Validate slug format (lowercase, alphanumeric and underscores only)
    if (!/^[a-z0-9_]+$/.test(formData.slug)) {
      setError('Lo slug può contenere solo lettere minuscole, numeri e underscore');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Combine selected preset variables with custom variables
      const allVariables: EmailTemplateVariable[] = [];
      selectedVariablePresets.forEach(preset => {
        if (COMMON_VARIABLES[preset]) {
          allVariables.push(...COMMON_VARIABLES[preset]);
        }
      });
      allVariables.push(...customVariables);

      // Create template
      const templateId = await createEmailTemplate(
        {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim(),
          category: formData.category,
          targetAudience,
          variables: allVariables,
          enabled: true,
        },
        firebaseUser.uid
      );

      // Load the created template
      const createdTemplate = await getEmailTemplate(templateId);
      if (createdTemplate) {
        onSuccess(createdTemplate);
      }
    } catch (err: any) {
      console.error('Error creating template:', err);
      setError(err.message || 'Errore durante la creazione del template');
      setSaving(false);
    }
  };

  const toggleTargetAudience = (audience: TargetAudience) => {
    setTargetAudience(prev =>
      prev.includes(audience)
        ? prev.filter(a => a !== audience)
        : [...prev, audience]
    );
  };

  const toggleVariablePreset = (preset: string) => {
    setSelectedVariablePresets(prev =>
      prev.includes(preset)
        ? prev.filter(p => p !== preset)
        : [...prev, preset]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Crea Nuovo Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Template *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="es. Registrazione B2C"
              required
              disabled={saving}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (identificatore univoco) *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="es. b2c_welcome"
              required
              disabled={saving}
            />
            <p className="mt-1 text-xs text-gray-500">
              Solo lettere minuscole, numeri e underscore
            </p>
          </div>

          {/* Descrizione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Breve descrizione dello scopo del template"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TemplateCategory })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            >
              <option value="authentication">🔐 Autenticazione</option>
              <option value="orders">📦 Ordini</option>
              <option value="notifications">🔔 Notifiche</option>
              <option value="marketing">📢 Marketing</option>
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Destinatari *
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
            <p className="mt-2 text-xs text-gray-500">
              Seleziona uno o entrambi i tipi di destinatari
            </p>
          </div>

          {/* Variabili */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Variabili Disponibili
            </label>
            <div className="space-y-2">
              {Object.keys(COMMON_VARIABLES).map((preset) => (
                <label key={preset} className="flex items-start gap-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedVariablePresets.includes(preset)}
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
                      {COMMON_VARIABLES[preset].map(v => v.name).join(', ')}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
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
              {saving ? 'Creazione...' : 'Crea Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
