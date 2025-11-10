'use client';

import { useState, useEffect } from 'react';
import { ReportConfig, ReportColumn, ReportGrouping, ReportFilter } from '@/types/report';
import { Plus, Trash2, GripVertical, Save, Database } from 'lucide-react';

type ReportWithSlug = ReportConfig & { slug: string };

interface ReportFormAdvancedProps {
  report: ReportWithSlug | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function ReportFormAdvanced({
  report,
  onSave,
  onCancel,
}: ReportFormAdvancedProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'columns' | 'grouping' | 'filters' | 'query'>('basic');
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<any>({
    slug: report?.slug || '',
    title: report?.title || '',
    description: report?.description || '',
    query: report?.query || 'customer_documents',
    clientTypes: report?.clientTypes || ['b2b', 'b2c'],
    enabled: report?.enabled !== false,
    columns: report?.columns || [],
    grouping: report?.grouping || [],
    filters: report?.filters || [],
    sorting: report?.sorting || { field: 'data', direction: 'desc' },
    export: report?.export || { pdf: true, excel: true, csv: true },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.slug || !formData.title) {
      alert('Slug e Titolo sono obbligatori');
      return;
    }

    if (formData.columns.length === 0) {
      alert('Devi definire almeno una colonna');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/reports/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: formData.slug,
          config: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save report');
      }

      alert('Report salvato con successo!');
      onSave();
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Errore nel salvataggio del report');
    } finally {
      setSaving(false);
    }
  };

  // Column management
  const addColumn = () => {
    setFormData({
      ...formData,
      columns: [
        ...formData.columns,
        {
          field: '',
          label: '',
          type: 'string',
          visible: true,
          width: 120,
          align: 'left',
        },
      ],
    });
  };

  const updateColumn = (index: number, updates: Partial<ReportColumn>) => {
    const newColumns = [...formData.columns];
    newColumns[index] = { ...newColumns[index], ...updates };
    setFormData({ ...formData, columns: newColumns });
  };

  const removeColumn = (index: number) => {
    setFormData({
      ...formData,
      columns: formData.columns.filter((_: any, i: number) => i !== index),
    });
  };

  // Grouping management
  const addGrouping = () => {
    setFormData({
      ...formData,
      grouping: [
        ...formData.grouping,
        {
          field: '',
          label: '',
          level: formData.grouping.length + 1,
          showTotals: true,
          collapsed: false,
        },
      ],
    });
  };

  const updateGrouping = (index: number, updates: Partial<ReportGrouping>) => {
    const newGrouping = [...formData.grouping];
    newGrouping[index] = { ...newGrouping[index], ...updates };
    setFormData({ ...formData, grouping: newGrouping });
  };

  const removeGrouping = (index: number) => {
    setFormData({
      ...formData,
      grouping: formData.grouping.filter((_: any, i: number) => i !== index),
    });
  };

  // Filter management
  const addFilter = () => {
    setFormData({
      ...formData,
      filters: [
        ...formData.filters,
        {
          field: '',
          label: '',
          type: 'text',
          options: [],
        },
      ],
    });
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    const newFilters = [...formData.filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFormData({ ...formData, filters: newFilters });
  };

  const removeFilter = (index: number) => {
    setFormData({
      ...formData,
      filters: formData.filters.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <button onClick={onCancel} className="text-sm text-blue-600 hover:text-blue-700">
          ← Torna alla lista
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow sm:rounded-lg">
          {/* Header */}
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {report ? 'Modifica Report' : 'Nuovo Report'}
              </h3>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvataggio...' : 'Salva Report'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'basic', label: 'Base' },
                { id: 'columns', label: 'Colonne', badge: formData.columns.length },
                { id: 'grouping', label: 'Raggruppamenti', badge: formData.grouping.length },
                { id: 'filters', label: 'Filtri', badge: formData.filters.length },
                { id: 'query', label: 'Query & Export' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-2 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-900">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="px-4 py-5 sm:p-6">
            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <BasicTab formData={formData} setFormData={setFormData} isEditing={!!report} />
            )}

            {/* Columns Tab */}
            {activeTab === 'columns' && (
              <ColumnsTab
                columns={formData.columns}
                onAdd={addColumn}
                onUpdate={updateColumn}
                onRemove={removeColumn}
              />
            )}

            {/* Grouping Tab */}
            {activeTab === 'grouping' && (
              <GroupingTab
                grouping={formData.grouping}
                columns={formData.columns}
                onAdd={addGrouping}
                onUpdate={updateGrouping}
                onRemove={removeGrouping}
              />
            )}

            {/* Filters Tab */}
            {activeTab === 'filters' && (
              <FiltersTab
                filters={formData.filters}
                columns={formData.columns}
                onAdd={addFilter}
                onUpdate={updateFilter}
                onRemove={removeFilter}
              />
            )}

            {/* Query Tab */}
            {activeTab === 'query' && (
              <QueryTab formData={formData} setFormData={setFormData} />
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// Basic Tab Component
function BasicTab({
  formData,
  setFormData,
  isEditing,
}: {
  formData: any;
  setFormData: (data: any) => void;
  isEditing: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Slug (ID univoco) *</label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          disabled={isEditing}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 font-mono"
          placeholder="customer_documents_summary"
        />
        {isEditing && (
          <p className="mt-1 text-xs text-gray-500">
            Lo slug non può essere modificato dopo la creazione
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Titolo *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Documenti Cliente"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descrizione</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Riepilogo documenti con raggruppamento"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipologie Cliente Autorizzate
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.clientTypes.includes('b2b')}
              onChange={(e) => {
                if (e.target.checked) {
                  setFormData({
                    ...formData,
                    clientTypes: [...formData.clientTypes, 'b2b'],
                  });
                } else {
                  setFormData({
                    ...formData,
                    clientTypes: formData.clientTypes.filter((t: string) => t !== 'b2b'),
                  });
                }
              }}
              className="rounded text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">🏢 Clienti B2B</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.clientTypes.includes('b2c')}
              onChange={(e) => {
                if (e.target.checked) {
                  setFormData({
                    ...formData,
                    clientTypes: [...formData.clientTypes, 'b2c'],
                  });
                } else {
                  setFormData({
                    ...formData,
                    clientTypes: formData.clientTypes.filter((t: string) => t !== 'b2c'),
                  });
                }
              }}
              className="rounded text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">👤 Clienti B2C</span>
          </label>
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.enabled}
            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
            className="rounded text-blue-600"
          />
          <span className="ml-2 text-sm text-gray-700">Report abilitato</span>
        </label>
      </div>
    </div>
  );
}

// Columns Tab Component
function ColumnsTab({
  columns,
  onAdd,
  onUpdate,
  onRemove,
}: {
  columns: ReportColumn[];
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<ReportColumn>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Definisci Colonne Report</h4>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
        >
          <Plus className="w-4 h-4 mr-1" />
          Aggiungi Colonna
        </button>
      </div>

      {columns.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">Nessuna colonna definita. Clicca "Aggiungi Colonna" per iniziare.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {columns.map((col, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-12 gap-3">
                {/* Field */}
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Campo DB *</label>
                  <input
                    type="text"
                    value={col.field}
                    onChange={(e) => onUpdate(index, { field: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm font-mono"
                    placeholder="totale"
                  />
                </div>

                {/* Label */}
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Label *</label>
                  <input
                    type="text"
                    value={col.label}
                    onChange={(e) => onUpdate(index, { label: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="Importo"
                  />
                </div>

                {/* Type */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={col.type}
                    onChange={(e) => onUpdate(index, { type: e.target.value as any })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="currency">Currency</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>

                {/* Format */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Formato</label>
                  <input
                    type="text"
                    value={col.format || ''}
                    onChange={(e) => onUpdate(index, { format: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm font-mono"
                    placeholder="DD/MM/YYYY"
                  />
                </div>

                {/* Aggregate */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Aggregazione</label>
                  <select
                    value={col.aggregate || ''}
                    onChange={(e) => onUpdate(index, { aggregate: e.target.value as any || undefined })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                  >
                    <option value="">Nessuna</option>
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="count">Count</option>
                    <option value="min">Min</option>
                    <option value="max">Max</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 mt-3">
                {/* Width */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Larghezza (px)</label>
                  <input
                    type="number"
                    value={col.width || ''}
                    onChange={(e) => onUpdate(index, { width: parseInt(e.target.value) || undefined })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="120"
                  />
                </div>

                {/* Align */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Allineamento</label>
                  <select
                    value={col.align || 'left'}
                    onChange={(e) => onUpdate(index, { align: e.target.value as any })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                {/* Visible */}
                <div className="col-span-2 flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={(e) => onUpdate(index, { visible: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="ml-2 text-xs text-gray-700">Visibile</span>
                  </label>
                </div>

                {/* Delete */}
                <div className="col-span-6 flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Rimuovi
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Grouping Tab Component (simplified version - same pattern as Columns)
function GroupingTab({
  grouping,
  columns,
  onAdd,
  onUpdate,
  onRemove,
}: {
  grouping: ReportGrouping[];
  columns: ReportColumn[];
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<ReportGrouping>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Raggruppamenti Gerarchici</h4>
          <p className="text-xs text-gray-500 mt-1">I dati verranno raggruppati nell'ordine definito (livello 1, 2, 3...)</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
        >
          <Plus className="w-4 h-4 mr-1" />
          Aggiungi Livello
        </button>
      </div>

      {grouping.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">Nessun raggruppamento. I dati saranno mostrati in formato piatto.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouping.map((group, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-400">#{group.level}</span>
                </div>

                <div className="col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Campo *</label>
                  <select
                    value={group.field}
                    onChange={(e) => onUpdate(index, { field: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm font-mono"
                  >
                    <option value="">Seleziona campo...</option>
                    {columns.map((col) => (
                      <option key={col.field} value={col.field}>
                        {col.field} ({col.label})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Label *</label>
                  <input
                    type="text"
                    value={group.label}
                    onChange={(e) => onUpdate(index, { label: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="Anno"
                  />
                </div>

                <div className="col-span-2 flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={group.showTotals}
                      onChange={(e) => onUpdate(index, { showTotals: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="ml-2 text-xs text-gray-700">Mostra Totali</span>
                  </label>
                </div>

                <div className="col-span-2 flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Rimuovi
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Filters Tab Component (simplified)
function FiltersTab({
  filters,
  columns,
  onAdd,
  onUpdate,
  onRemove,
}: {
  filters: ReportFilter[];
  columns: ReportColumn[];
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<ReportFilter>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Filtri Utente</h4>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
        >
          <Plus className="w-4 h-4 mr-1" />
          Aggiungi Filtro
        </button>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">Nessun filtro. Gli utenti non potranno filtrare i dati.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Campo *</label>
                  <select
                    value={filter.field}
                    onChange={(e) => onUpdate(index, { field: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm font-mono"
                  >
                    <option value="">Seleziona...</option>
                    {columns.map((col) => (
                      <option key={col.field} value={col.field}>
                        {col.field}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Label *</label>
                  <input
                    type="text"
                    value={filter.label}
                    onChange={(e) => onUpdate(index, { label: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="Tipo Documento"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={filter.type}
                    onChange={(e) => onUpdate(index, { type: e.target.value as any })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="select">Select</option>
                    <option value="multiselect">Multi Select</option>
                    <option value="daterange">Date Range</option>
                    <option value="numberrange">Number Range</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Opzioni</label>
                  <input
                    type="text"
                    value={filter.options === 'auto' ? 'auto' : ''}
                    onChange={(e) => onUpdate(index, { options: e.target.value === 'auto' ? 'auto' : [] })}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="auto"
                  />
                </div>

                <div className="col-span-2 flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Rimuovi
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Query Tab Component
function QueryTab({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Query Slug
        </label>
        <input
          type="text"
          value={formData.query}
          onChange={(e) => setFormData({ ...formData, query: e.target.value })}
          className="block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 font-mono text-sm"
          placeholder="customer_documents"
        />
        <p className="mt-1 text-xs text-gray-500">
          Slug della query definita in <code className="bg-gray-100 px-1 py-0.5 rounded">admin/data/query-config.json</code>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ordinamento Default</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="text"
              value={formData.sorting?.field || ''}
              onChange={(e) => setFormData({ ...formData, sorting: { ...formData.sorting, field: e.target.value } })}
              className="block w-full border-gray-300 rounded-md shadow-sm text-sm font-mono"
              placeholder="data"
            />
            <p className="text-xs text-gray-500 mt-1">Campo</p>
          </div>
          <div>
            <select
              value={formData.sorting?.direction || 'desc'}
              onChange={(e) => setFormData({ ...formData, sorting: { ...formData.sorting, direction: e.target.value } })}
              className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
            >
              <option value="asc">Crescente (ASC)</option>
              <option value="desc">Decrescente (DESC)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Direzione</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Opzioni Export</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.export?.pdf || false}
              onChange={(e) => setFormData({ ...formData, export: { ...formData.export, pdf: e.target.checked } })}
              className="rounded text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">PDF</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.export?.excel || false}
              onChange={(e) => setFormData({ ...formData, export: { ...formData.export, excel: e.target.checked } })}
              className="rounded text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">Excel</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.export?.csv || false}
              onChange={(e) => setFormData({ ...formData, export: { ...formData.export, csv: e.target.checked } })}
              className="rounded text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">CSV</span>
          </label>
        </div>
      </div>
    </div>
  );
}
