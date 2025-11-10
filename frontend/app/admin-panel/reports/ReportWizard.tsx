'use client';

import { useState, useEffect } from 'react';
import { ReportConfig, ReportColumn } from '@/types/report';
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Table,
  Layers,
  Filter,
  CheckCircle,
  Play,
  Loader2,
  Eye,
  X
} from 'lucide-react';

type ReportWithSlug = ReportConfig & { slug: string };

interface ReportWizardProps {
  report: ReportWithSlug | null;
  onSave: () => void;
  onCancel: () => void;
}

type WizardStep = 'query' | 'columns' | 'grouping' | 'filters' | 'summary';

interface QueryConfig {
  slug: string;
  description: string;
  sql: string;
  params: Record<string, any>;
}

export default function ReportWizard({ report, onSave, onCancel }: ReportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('query');
  const [saving, setSaving] = useState(false);

  // Wizard data
  const [reportSlug, setReportSlug] = useState(report?.slug || '');
  const [reportTitle, setReportTitle] = useState(report?.title || '');
  const [reportDescription, setReportDescription] = useState(report?.description || '');
  const [clientTypes, setClientTypes] = useState<('b2b' | 'b2c')[]>(report?.clientTypes || ['b2b', 'b2c']);
  const [enabled, setEnabled] = useState(report?.enabled !== false);
  const [clientCodeField, setClientCodeField] = useState(report?.clientCodeField || '');

  // Query step
  const [querySlug, setQuerySlug] = useState(report?.query || '');
  const [querySql, setQuerySql] = useState('');
  const [queryParams, setQueryParams] = useState<Record<string, any>>({});
  const [queryDescription, setQueryDescription] = useState('');
  const [availableQueries, setAvailableQueries] = useState<Record<string, any>>({});
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [testingQuery, setTestingQuery] = useState(false);
  const [queryTested, setQueryTested] = useState(report ? true : false); // Se editing, assume tested
  const [loadingQueries, setLoadingQueries] = useState(false);

  // Columns step
  const [columns, setColumns] = useState<ReportColumn[]>(report?.columns || []);

  // Grouping step
  const [grouping, setGrouping] = useState<any[]>(report?.grouping || []);

  // Filters step
  const [filters, setFilters] = useState<any[]>(report?.filters || []);

  // Preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewClientType, setPreviewClientType] = useState<'b2b' | 'b2c'>('b2b');
  const [previewClients, setPreviewClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');

  // Load query data when editing
  useEffect(() => {
    if (report && report.query) {
      loadQueryData(report.query);
    }
  }, [report]);

  const loadQueryData = async (slug: string) => {
    try {
      const response = await fetch(`/api/queries/config?slug=${slug}`);
      const data = await response.json();

      if (data.query) {
        setQuerySql(data.query.sql || '');
        setQueryDescription(data.query.description || '');
        setQueryParams(data.query.params || {});

        // Extract columns from report
        if (report?.columns) {
          setDetectedColumns(report.columns.map(c => c.field));
        }
      }
    } catch (error) {
      console.error('Error loading query data:', error);
    }
  };

  const steps: { id: WizardStep; label: string; icon: any }[] = [
    { id: 'query', label: '1. Query SQL', icon: Database },
    { id: 'columns', label: '2. Colonne', icon: Table },
    { id: 'grouping', label: '3. Raggruppamenti', icon: Layers },
    { id: 'filters', label: '4. Filtri', icon: Filter },
    { id: 'summary', label: '5. Riepilogo', icon: CheckCircle },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 'query':
        return querySlug && querySql && queryTested && detectedColumns.length > 0;
      case 'columns':
        return columns.length > 0;
      case 'grouping':
        return true; // Optional
      case 'filters':
        return true; // Optional
      case 'summary':
        return reportSlug && reportTitle;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleTestQuery = async () => {
    setTestingQuery(true);
    try {
      // Step 1: Salva temporaneamente la query nel config
      const tempQueryConfig = {
        description: queryDescription || 'Test query',
        sql: querySql,
        params: {
          clientCode: { type: 'string', required: false, default: 'TEST' },
          dateFrom: { type: 'date', required: false, default: '2024-01-01' },
          dateTo: { type: 'date', required: false, default: '2024-12-31' },
          limit: { type: 'int', required: false, default: 100 },
          offset: { type: 'int', required: false, default: 0 },
        },
      };

      // Salva i parametri nello stato per usarli nel summary step
      setQueryParams(tempQueryConfig.params);

      await fetch('/api/queries/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: querySlug,
          query: tempQueryConfig,
        }),
      });

      // Step 2: Testa la query salvata
      const response = await fetch('/api/test-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          querySlug: querySlug,
          params: {
            clientCode: 'TEST',
            dateFrom: '2024-01-01',
            dateTo: '2024-12-31',
            limit: 1,
            offset: 0,
          },
        }),
      });

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const cols = Object.keys(result.data[0]);
        setDetectedColumns(cols);

        // Auto-create columns from detected fields
        const autoColumns: ReportColumn[] = cols.map((field) => ({
          field,
          label: field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
          type: 'string',
          visible: true,
          width: 120,
          align: 'left',
        }));

        setColumns(autoColumns);
        setQueryTested(true);

        const mockNote = result._mock ? ' (MOCK MODE - deploy backend per dati reali)' : '';
        alert(`✅ Query testata con successo! Rilevati ${cols.length} campi.${mockNote}`);
      } else {
        const errorMsg = result.error || 'Query valida ma nessun dato ritornato. Verifica i parametri.';
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Error testing query:', error);
      alert(`Errore durante il test della query: ${error.message}`);
    } finally {
      setTestingQuery(false);
    }
  };


  // Preview functions
  const handleOpenPreview = () => {
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
      } else {
        alert('Errore nel caricamento dei clienti');
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      alert('Errore nel caricamento dei clienti');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleClientTypeChange = (type: 'b2b' | 'b2c') => {
    setPreviewClientType(type);
    setSelectedClient('');
    loadPreviewClients(type);
  };

  const handleOpenReportPreview = () => {
    if (!selectedClient) {
      alert('Seleziona un cliente');
      return;
    }

    // Construct preview URL
    const previewUrl = `/my-account/reports/${reportSlug}?preview=true&clientCode=${selectedClient}`;
    window.open(previewUrl, '_blank');
    setShowPreviewModal(false);
  };

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      // 1. Save query-config.json
      await fetch('/api/queries/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: querySlug,
          query: {
            description: queryDescription,
            sql: querySql,
            params: queryParams,
          },
        }),
      });

      // 2. Save report-config.json
      await fetch('/api/reports/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: reportSlug,
          config: {
            title: reportTitle,
            description: reportDescription,
            query: querySlug,
            clientTypes,
            enabled,
            clientCodeField, // Campo che contiene il codice cliente
            columns,
            grouping,
            filters,
            sorting: { field: columns[0]?.field || 'id', direction: 'desc' },
            export: { pdf: true, excel: true, csv: true },
          },
        }),
      });

      alert('Report salvato con successo!');
      onSave();
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <button onClick={onCancel} className="text-sm text-blue-600 hover:text-blue-700">
          ← Torna alla lista
        </button>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {report ? 'Modifica Report' : 'Nuovo Report'} - Wizard
          </h3>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = steps.findIndex((s) => s.id === currentStep) > index;

                return (
                  <li key={step.id} className="relative flex-1">
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                          isActive
                            ? 'border-blue-600 bg-blue-50'
                            : isCompleted
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isActive
                              ? 'text-blue-600'
                              : isCompleted
                              ? 'text-green-500'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                      <span
                        className={`ml-2 text-xs font-medium ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="absolute top-5 left-10 w-full h-0.5 bg-gray-300"></div>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="px-6 py-6 min-h-[400px]">
          {currentStep === 'query' && (
            <QueryStep
              querySlug={querySlug}
              setQuerySlug={setQuerySlug}
              querySql={querySql}
              setQuerySql={setQuerySql}
              queryParams={queryParams}
              setQueryParams={setQueryParams}
              queryDescription={queryDescription}
              setQueryDescription={setQueryDescription}
              detectedColumns={detectedColumns}
              testingQuery={testingQuery}
              queryTested={queryTested}
              onTestQuery={handleTestQuery}
              isEditing={!!report}
            />
          )}

          {currentStep === 'columns' && (
            <ColumnsStep
              columns={columns}
              setColumns={setColumns}
              clientCodeField={clientCodeField}
              setClientCodeField={setClientCodeField}
            />
          )}

          {currentStep === 'grouping' && (
            <GroupingStep
              grouping={grouping}
              setGrouping={setGrouping}
              columns={columns}
            />
          )}

          {currentStep === 'filters' && (
            <FiltersStep
              filters={filters}
              setFilters={setFilters}
              columns={columns}
            />
          )}

          {currentStep === 'summary' && (
            <SummaryStep
              reportSlug={reportSlug}
              setReportSlug={setReportSlug}
              reportTitle={reportTitle}
              setReportTitle={setReportTitle}
              reportDescription={reportDescription}
              setReportDescription={setReportDescription}
              clientTypes={clientTypes}
              setClientTypes={setClientTypes}
              enabled={enabled}
              setEnabled={setEnabled}
              querySlug={querySlug}
              clientCodeField={clientCodeField}
              columns={columns}
              onPreview={handleOpenPreview}
              grouping={grouping}
              filters={filters}
              isEditing={!!report}
            />
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 'query'}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </button>

          <div className="flex items-center space-x-3">
            {currentStep !== 'summary' ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avanti
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveReport}
                disabled={!canProceed() || saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salva Report
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Anteprima Report - Selezione Cliente
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Client Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo Cliente
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={previewClientType === 'b2b'}
                      onChange={() => handleClientTypeChange('b2b')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">🏢 B2B</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={previewClientType === 'b2c'}
                      onChange={() => handleClientTypeChange('b2c')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">👤 B2C</span>
                  </label>
                </div>
              </div>

              {/* Client List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Seleziona Cliente
                </label>

                {loadingClients ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-gray-600">
                      Caricamento clienti...
                    </span>
                  </div>
                ) : previewClients.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">
                      Nessun cliente {previewClientType === 'b2b' ? 'B2B' : 'B2C'} attivo trovato
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {previewClients.map((client) => (
                      <label
                        key={client.clientCode || client.email}
                        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          checked={selectedClient === client.clientCode}
                          onChange={() => setSelectedClient(client.clientCode)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {client.displayName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {client.email}
                            {client.clientCode && (
                              <span className="ml-2 text-gray-400">
                                • Codice: <code className="bg-gray-100 px-1 py-0.5 rounded">
                                  {client.clientCode}
                                </code>
                              </span>
                            )}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleOpenReportPreview}
                disabled={!selectedClient}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4 mr-2" />
                Apri Anteprima
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 1: Query
function QueryStep({
  querySlug,
  setQuerySlug,
  querySql,
  setQuerySql,
  queryParams,
  setQueryParams,
  queryDescription,
  setQueryDescription,
  detectedColumns,
  testingQuery,
  queryTested,
  onTestQuery,
  isEditing,
}: any) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Definisci Query SQL</h4>
        <p className="text-sm text-gray-600 mb-6">
          La query verrà salvata in <code className="bg-gray-100 px-2 py-1 rounded">query-config.json</code> e
          utilizzata per recuperare i dati dal database MySQL.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Query Slug (ID univoco) *
        </label>
        <input
          type="text"
          value={querySlug}
          onChange={(e) => setQuerySlug(e.target.value)}
          disabled={isEditing}
          className="block w-full border-gray-300 rounded-md shadow-sm font-mono text-sm disabled:bg-gray-100"
          placeholder="customer_documents"
        />
        {isEditing && (
          <p className="mt-1 text-xs text-gray-500">Lo slug non può essere modificato</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
        <input
          type="text"
          value={queryDescription}
          onChange={(e) => setQueryDescription(e.target.value)}
          className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
          placeholder="Lista documenti cliente"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Query SQL *
        </label>
        <textarea
          value={querySql}
          onChange={(e) => setQuerySql(e.target.value)}
          rows={8}
          className="block w-full border-gray-300 rounded-md shadow-sm font-mono text-sm"
          placeholder="SELECT id, tipo_documento, numero, data, totale FROM documenti WHERE cod_cliente = :clientCode"
        />
        <p className="mt-2 text-xs text-gray-500">
          Usa named parameters con <code className="bg-gray-100 px-1 py-0.5 rounded">:paramName</code> (es: :clientCode, :dateFrom)
        </p>
      </div>

      <div>
        <button
          type="button"
          onClick={onTestQuery}
          disabled={!querySlug || !querySql || testingQuery}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {testingQuery ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Test Query & Rileva Campi
            </>
          )}
        </button>
      </div>

      {queryTested && detectedColumns.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h5 className="text-sm font-medium text-green-900 mb-2">
            ✅ Query testata con successo!
          </h5>
          <p className="text-sm text-green-800 mb-2">Campi rilevati ({detectedColumns.length}):</p>
          <div className="flex flex-wrap gap-2">
            {detectedColumns.map((col) => (
              <span
                key={col}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Step 2: Columns
function ColumnsStep({ columns, setColumns, clientCodeField, setClientCodeField }: any) {
  const handleToggleVisible = (index: number) => {
    const updated = [...columns];
    updated[index].visible = !updated[index].visible;
    setColumns(updated);
  };

  const handleLabelChange = (index: number, value: string) => {
    const updated = [...columns];
    updated[index].label = value;
    setColumns(updated);
  };

  const handleSetClientCode = (field: string) => {
    setClientCodeField(field === clientCodeField ? '' : field);
  };

  const handleToggleTranslatable = (index: number) => {
    const updated = [...columns];
    updated[index].translatable = !updated[index].translatable;
    setColumns(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900">Configura Colonne</h4>
        <p className="text-sm text-gray-600 mt-1">
          Colonne rilevate: {columns.length}. Personalizza etichette e visibilità.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  Vis.
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  🔒
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12" title="Traduci contenuto">
                  🌍
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campo DB
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Etichetta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Tipo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {columns.map((col: any, index: number) => (
                <tr key={col.field} className={!col.visible ? 'opacity-50' : ''}>
                  <td className="px-3 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => handleToggleVisible(index)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-center">
                    <input
                      type="radio"
                      checked={clientCodeField === col.field}
                      onChange={() => handleSetClientCode(col.field)}
                      className="h-4 w-4 text-amber-600"
                      title="Marca come campo Codice Cliente"
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={col.translatable || false}
                      onChange={() => handleToggleTranslatable(index)}
                      disabled={col.type === 'number' || col.type === 'currency' || col.type === 'date'}
                      className="h-4 w-4 text-green-600 rounded disabled:opacity-30"
                      title="Traduci contenuto (usa traduzioni da products.json)"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className={`text-sm font-mono px-2 py-1 rounded ${
                      clientCodeField === col.field
                        ? 'bg-amber-100 text-amber-800 font-semibold'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {col.field}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={col.label}
                      onChange={(e) => handleLabelChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Etichetta colonna"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {col.type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {clientCodeField && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            🔒 <strong>Campo Codice Cliente:</strong> <code className="bg-amber-100 px-2 py-1 rounded font-mono">{clientCodeField}</code>
            {' '}sarà utilizzato per filtrare automaticamente i dati dell'utente loggato.
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Suggerimenti:</strong><br/>
          • Clicca sulla colonna 🔒 per marcare quale campo contiene il codice cliente<br/>
          • Clicca sulla colonna 🌍 per marcare quali campi devono essere tradotti dal sistema B2C (products.json)
        </p>
      </div>
    </div>
  );
}

// Step 3: Raggruppamenti
function GroupingStep({ grouping, setGrouping, columns }: any) {
  const addGrouping = () => {
    const newGrouping = {
      field: '',
      label: '',
      level: grouping.length + 1,
      showTotals: false,
      collapsed: false,
    };
    setGrouping([...grouping, newGrouping]);
  };

  const removeGrouping = (index: number) => {
    const updated = grouping.filter((_: any, i: number) => i !== index);
    // Ricalcola i livelli
    updated.forEach((g: any, i: number) => {
      g.level = i + 1;
    });
    setGrouping(updated);
  };

  const updateGrouping = (index: number, field: string, value: any) => {
    const updated = [...grouping];
    updated[index][field] = value;
    setGrouping(updated);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...grouping];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Ricalcola livelli
    updated.forEach((g: any, i: number) => {
      g.level = i + 1;
    });
    setGrouping(updated);
  };

  const moveDown = (index: number) => {
    if (index === grouping.length - 1) return;
    const updated = [...grouping];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    // Ricalcola livelli
    updated.forEach((g: any, i: number) => {
      g.level = i + 1;
    });
    setGrouping(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-gray-900">Raggruppamenti (Opzionale)</h4>
          <p className="text-sm text-gray-600 mt-1">
            Crea raggruppamenti gerarchici dei dati (es: Anno → Mese → Tipo)
          </p>
        </div>
        <button
          type="button"
          onClick={addGrouping}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          + Aggiungi Raggruppamento
        </button>
      </div>

      {grouping.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">
            Nessun raggruppamento configurato. I dati saranno mostrati in una lista piatta.
          </p>
          <button
            onClick={addGrouping}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Aggiungi Primo Raggruppamento
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouping.map((group: any, index: number) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Livello {group.level}
                  </span>
                  <span className="text-sm text-gray-500">
                    {index === 0
                      ? '(Raggruppamento principale)'
                      : `(Sottogruppo di Livello ${index})`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Sposta su"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === grouping.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Sposta giù"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeGrouping(index)}
                    className="p-1 text-red-600 hover:text-red-700"
                    title="Rimuovi"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campo da raggruppare *
                  </label>
                  <select
                    value={group.field}
                    onChange={(e) => updateGrouping(index, 'field', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                  >
                    <option value="">-- Seleziona campo --</option>
                    {columns.map((col: any) => (
                      <option key={col.field} value={col.field}>
                        {col.label} ({col.field})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etichetta gruppo
                  </label>
                  <input
                    type="text"
                    value={group.label}
                    onChange={(e) => updateGrouping(index, 'label', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder={`Raggruppa per ${group.field || '...'}`}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={group.showTotals}
                    onChange={(e) => updateGrouping(index, 'showTotals', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Mostra subtotali</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={group.collapsed}
                    onChange={(e) => updateGrouping(index, 'collapsed', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inizialmente collassato</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Suggerimenti:</strong><br />
          • L'ordine dei raggruppamenti definisce la gerarchia (es: Anno → Mese → Giorno)<br />
          • I subtotali calcolano aggregazioni per ogni gruppo<br />
          • Puoi riordinare i livelli con le frecce ↑↓
        </p>
      </div>
    </div>
  );
}

// Step 4: Filtri Utente
function FiltersStep({ filters, setFilters, columns }: any) {
  const addFilter = () => {
    const newFilter = {
      field: '',
      label: '',
      type: 'text',
      options: [],
      default: null,
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_: any, i: number) => i !== index));
  };

  const updateFilter = (index: number, field: string, value: any) => {
    const updated = [...filters];
    updated[index][field] = value;
    setFilters(updated);
  };

  const addOption = (filterIndex: number) => {
    const updated = [...filters];
    if (!Array.isArray(updated[filterIndex].options)) {
      updated[filterIndex].options = [];
    }
    updated[filterIndex].options.push('');
    setFilters(updated);
  };

  const updateOption = (filterIndex: number, optionIndex: number, value: string) => {
    const updated = [...filters];
    updated[filterIndex].options[optionIndex] = value;
    setFilters(updated);
  };

  const removeOption = (filterIndex: number, optionIndex: number) => {
    const updated = [...filters];
    updated[filterIndex].options = updated[filterIndex].options.filter(
      (_: any, i: number) => i !== optionIndex
    );
    setFilters(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-gray-900">Filtri Utente (Opzionale)</h4>
          <p className="text-sm text-gray-600 mt-1">
            Permetti agli utenti di filtrare i dati visualizzati
          </p>
        </div>
        <button
          type="button"
          onClick={addFilter}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          + Aggiungi Filtro
        </button>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">
            Nessun filtro configurato. Gli utenti vedranno tutti i dati (filtrati per codice cliente se configurato).
          </p>
          <button
            onClick={addFilter}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Aggiungi Primo Filtro
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filters.map((filter: any, index: number) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <h5 className="text-sm font-medium text-gray-900">Filtro #{index + 1}</h5>
                <button
                  onClick={() => removeFilter(index)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Rimuovi
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campo da filtrare *
                  </label>
                  <select
                    value={filter.field}
                    onChange={(e) => updateFilter(index, 'field', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                  >
                    <option value="">-- Seleziona campo --</option>
                    {columns.map((col: any) => (
                      <option key={col.field} value={col.field}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etichetta filtro
                  </label>
                  <input
                    type="text"
                    value={filter.label}
                    onChange={(e) => updateFilter(index, 'label', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="Es: Seleziona anno"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo filtro *
                  </label>
                  <select
                    value={filter.type}
                    onChange={(e) => updateFilter(index, 'type', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                  >
                    <option value="text">Testo libero</option>
                    <option value="select">Dropdown singolo</option>
                    <option value="multiselect">Dropdown multiplo</option>
                    <option value="daterange">Intervallo date</option>
                    <option value="numberrange">Intervallo numeri</option>
                  </select>
                </div>
              </div>

              {/* Opzioni per select/multiselect */}
              {(filter.type === 'select' || filter.type === 'multiselect') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opzioni
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={filter.options === 'auto'}
                        onChange={() => updateFilter(index, 'options', 'auto')}
                        className="text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Auto (carica da dati)
                      </span>
                    </label>
                    <label className="flex items-center ml-4">
                      <input
                        type="radio"
                        checked={Array.isArray(filter.options)}
                        onChange={() => updateFilter(index, 'options', [])}
                        className="text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Manuale (lista fissa)
                      </span>
                    </label>
                  </div>

                  {Array.isArray(filter.options) && (
                    <div className="space-y-2">
                      {filter.options.map((opt: string, optIndex: number) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(index, optIndex, e.target.value)}
                            className="flex-1 border-gray-300 rounded-md shadow-sm text-sm"
                            placeholder={`Opzione ${optIndex + 1}`}
                          />
                          <button
                            onClick={() => removeOption(index, optIndex)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(index)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Aggiungi opzione
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Valore default */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valore predefinito (opzionale)
                </label>
                <input
                  type="text"
                  value={filter.default || ''}
                  onChange={(e) => updateFilter(index, 'default', e.target.value || null)}
                  className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
                  placeholder="Lascia vuoto per nessun default"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Suggerimenti:</strong><br />
          • <strong>Testo libero:</strong> Campo di ricerca testuale<br />
          • <strong>Dropdown:</strong> Selezione da lista (Auto = carica valori unici dai dati)<br />
          • <strong>Intervallo date/numeri:</strong> Filtro "da - a"
        </p>
      </div>
    </div>
  );
}

function SummaryStep({
  reportSlug,
  setReportSlug,
  reportTitle,
  setReportTitle,
  reportDescription,
  setReportDescription,
  clientTypes,
  setClientTypes,
  enabled,
  setEnabled,
  querySlug,
  clientCodeField,
  columns,
  grouping,
  filters,
  isEditing,
  onPreview,
}: any) {
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium text-gray-900">Riepilogo e Metadati Report</h4>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Report Slug (ID univoco) *
        </label>
        <input
          type="text"
          value={reportSlug}
          onChange={(e) => setReportSlug(e.target.value)}
          disabled={isEditing}
          className="block w-full border-gray-300 rounded-md shadow-sm font-mono text-sm disabled:bg-gray-100"
          placeholder="customer_documents_summary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Titolo Report *</label>
        <input
          type="text"
          value={reportTitle}
          onChange={(e) => setReportTitle(e.target.value)}
          className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
          placeholder="Documenti Cliente"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
        <textarea
          value={reportDescription}
          onChange={(e) => setReportDescription(e.target.value)}
          rows={2}
          className="block w-full border-gray-300 rounded-md shadow-sm text-sm"
          placeholder="Riepilogo documenti con raggruppamento"
        />
      </div>

      {clientCodeField && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <p className="text-sm text-amber-800">
            🔒 <strong>Campo Codice Cliente:</strong> <code className="bg-amber-100 px-2 py-1 rounded font-mono">{clientCodeField}</code>
            <br/>
            <span className="text-xs">I dati verranno automaticamente filtrati per il codice cliente dell'utente loggato.</span>
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipologie Cliente
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={clientTypes.includes('b2b')}
              onChange={(e) => {
                if (e.target.checked) {
                  setClientTypes([...clientTypes, 'b2b']);
                } else {
                  setClientTypes(clientTypes.filter((t: string) => t !== 'b2b'));
                }
              }}
              className="rounded text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">🏢 Clienti B2B</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={clientTypes.includes('b2c')}
              onChange={(e) => {
                if (e.target.checked) {
                  setClientTypes([...clientTypes, 'b2c']);
                } else {
                  setClientTypes(clientTypes.filter((t: string) => t !== 'b2c'));
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
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded text-blue-600"
          />
          <span className="ml-2 text-sm text-gray-700">Report abilitato</span>
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2">
        <h5 className="text-sm font-medium text-blue-900">📋 Riepilogo Configurazione</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Query: <code className="bg-blue-100 px-1 py-0.5 rounded">{querySlug}</code></li>
          <li>• Colonne definite: {columns.length}</li>
          <li>• Raggruppamenti: {grouping.length || 'Nessuno'}</li>
          <li>• Filtri: {filters.length || 'Nessuno'}</li>
        </ul>
      </div>

      {/* Preview Button */}
      {reportSlug && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Pronto per l'anteprima</p>
              <p className="text-xs text-green-700 mt-1">
                Visualizza il report con dati di un cliente a tua scelta
              </p>
            </div>
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              Anteprima Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
