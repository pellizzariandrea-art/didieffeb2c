'use client';

import { useState, useEffect } from 'react';
import { ReportConfig } from '@/types/report';
import { Plus, Edit2, Trash2, Eye as EyeIcon, EyeOff, Users, FileText, Code, Play } from 'lucide-react';
import ReportWizard from './ReportWizard';
import SimpleJsonEditor from './SimpleJsonEditor';

type ReportWithSlug = ReportConfig & { slug: string };

export default function ReportsManager() {
  const [reports, setReports] = useState<ReportWithSlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReport, setEditingReport] = useState<ReportWithSlug | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingJsonSlug, setEditingJsonSlug] = useState<string | null>(null);

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewReportSlug, setPreviewReportSlug] = useState<string>('');
  const [previewClientType, setPreviewClientType] = useState<'b2b' | 'b2c'>('b2b');
  const [previewClients, setPreviewClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState(false);

  // Load reports
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/config');
      const data = await response.json();

      // Convert object to array
      const reportsArray: ReportWithSlug[] = Object.entries(data).map(([slug, config]) => ({
        ...(config as ReportConfig),
        slug,
      }));

      setReports(reportsArray);
    } catch (error) {
      console.error('Error loading reports:', error);
      alert('Errore nel caricamento dei report');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Sei sicuro di voler eliminare il report "${slug}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/config?slug=${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      alert('Report eliminato con successo');
      loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Errore nell\'eliminazione del report');
    }
  };

  const handleEdit = (report: ReportWithSlug) => {
    setEditingReport(report);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingReport(null);
    setShowForm(true);
  };

  const handleEditJson = (slug: string) => {
    setEditingJsonSlug(slug);
  };

  const handleToggleEnabled = async (report: ReportWithSlug) => {
    const updatedReport = {
      ...report,
      enabled: !report.enabled,
    };

    try {
      const response = await fetch('/api/reports/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: report.slug,
          config: updatedReport,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      loadReports();
    } catch (error) {
      console.error('Error toggling report:', error);
      alert('Errore nell\'aggiornamento del report');
    }
  };

  const handleOpenPreview = (reportSlug: string) => {
    setPreviewReportSlug(reportSlug);
    setShowPreviewModal(true);
    setPreviewClientType('b2b');
    setSelectedClient('');
    loadPreviewClients('b2b');
  };

  const loadPreviewClients = async (role: 'b2b' | 'b2c') => {
    setLoadingClients(true);
    try {
      const response = await fetch(`/api/users/list?role=${role}`);
      const data = await response.json();
      if (data.success) {
        setPreviewClients(data.users || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setPreviewClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleOpenReportPreview = () => {
    if (!selectedClient) {
      alert('Seleziona un cliente');
      return;
    }
    const previewUrl = `/my-account/reports/${previewReportSlug}?preview=true&clientCode=${selectedClient}`;
    window.open(previewUrl, '_blank');
    setShowPreviewModal(false);
  };

  const getClientTypeBadge = (types?: ('b2b' | 'b2c')[]) => {
    if (!types || types.length === 0 || types.length === 2) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Users className="w-3 h-3 mr-1" />
          Tutti
        </span>
      );
    }

    return types.map((type) => (
      <span
        key={type}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-1 ${
          type === 'b2b'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-green-100 text-green-800'
        }`}
      >
        {type === 'b2b' ? '🏢 B2B' : '👤 B2C'}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show JSON Editor
  if (editingJsonSlug) {
    return (
      <SimpleJsonEditor
        reportSlug={editingJsonSlug}
        onClose={() => setEditingJsonSlug(null)}
        onSave={() => {
          setEditingJsonSlug(null);
          loadReports();
        }}
      />
    );
  }

  // Show Wizard
  if (showForm) {
    return (
      <ReportWizard
        report={editingReport}
        onSave={() => {
          setShowForm(false);
          loadReports();
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Report</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configura i report disponibili per i clienti B2B e B2C
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Report
        </button>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun report configurato</h3>
          <p className="mt-1 text-sm text-gray-500">
            Inizia creando il tuo primo report
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crea Report
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {reports.map((report) => (
              <li key={report.slug} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {report.title}
                        </h3>
                        <span className="ml-3 text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                          {report.slug}
                        </span>
                        {report.enabled === false && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Disabilitato
                          </span>
                        )}
                      </div>
                      {report.description && (
                        <p className="mt-1 text-sm text-gray-600">{report.description}</p>
                      )}
                      <div className="mt-2 flex items-center space-x-2">
                        {getClientTypeBadge(report.clientTypes)}
                        <span className="text-xs text-gray-500">
                          • Query: {report.query}
                        </span>
                        {report.grouping && report.grouping.length > 0 && (
                          <span className="text-xs text-gray-500">
                            • {report.grouping.length} raggruppamenti
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenPreview(report.slug)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-md"
                        title="Anteprima"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleEnabled(report)}
                        className={`p-2 rounded-md ${
                          report.enabled === false
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        title={report.enabled === false ? 'Abilita' : 'Disabilita'}
                      >
                        {report.enabled === false ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditJson(report.slug)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-md"
                        title="Modifica JSON"
                      >
                        <Code className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(report)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Modifica via Wizard"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(report.slug)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Elimina"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Seleziona Cliente per Anteprima
              </h3>

              {/* Client Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Cliente
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="b2b"
                      checked={previewClientType === 'b2b'}
                      onChange={(e) => {
                        setPreviewClientType('b2b');
                        setSelectedClient('');
                        loadPreviewClients('b2b');
                      }}
                      className="mr-2"
                    />
                    🏢 B2B
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="b2c"
                      checked={previewClientType === 'b2c'}
                      onChange={(e) => {
                        setPreviewClientType('b2c');
                        setSelectedClient('');
                        loadPreviewClients('b2c');
                      }}
                      className="mr-2"
                    />
                    👤 B2C
                  </label>
                </div>
              </div>

              {/* Clients List */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleziona Cliente
                </label>
                {loadingClients ? (
                  <div className="text-center py-4 text-gray-500">
                    Caricamento clienti...
                  </div>
                ) : previewClients.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Nessun cliente trovato
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                    {previewClients.map((client) => (
                      <label
                        key={client.clientCode}
                        className="flex items-start p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <input
                          type="radio"
                          value={client.clientCode}
                          checked={selectedClient === client.clientCode}
                          onChange={(e) => setSelectedClient(e.target.value)}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {client.displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.email}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {client.clientCode}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleOpenReportPreview}
                  disabled={!selectedClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apri Anteprima
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
