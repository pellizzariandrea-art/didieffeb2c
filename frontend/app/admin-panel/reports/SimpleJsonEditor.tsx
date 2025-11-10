'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Copy,
  CheckCircle,
  AlertCircle,
  Code,
  Database,
  X
} from 'lucide-react';

interface SimpleJsonEditorProps {
  reportSlug: string;
  onClose: () => void;
  onSave: () => void;
}

export default function SimpleJsonEditor({
  reportSlug,
  onClose,
  onSave,
}: SimpleJsonEditorProps) {
  const [reportConfig, setReportConfig] = useState('');
  const [queryConfig, setQueryConfig] = useState('');
  const [originalReportConfig, setOriginalReportConfig] = useState('');
  const [originalQueryConfig, setOriginalQueryConfig] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [reportValid, setReportValid] = useState(true);
  const [queryValid, setQueryValid] = useState(true);

  // Load configurations
  useEffect(() => {
    loadConfigurations();
  }, [reportSlug]);

  const loadConfigurations = async () => {
    try {
      setLoading(true);

      // Load report config
      const reportRes = await fetch(`/api/reports/config?slug=${reportSlug}`);
      const reportData = await reportRes.json();
      const reportJson = JSON.stringify(reportData.config, null, 2);
      setReportConfig(reportJson);
      setOriginalReportConfig(reportJson);

      // Get query slug from report config
      const querySlug = reportData.config.query;

      // Load query config
      const queryRes = await fetch(`/api/queries/config?slug=${querySlug}`);
      const queryData = await queryRes.json();
      const queryJson = JSON.stringify(queryData.query, null, 2);
      setQueryConfig(queryJson);
      setOriginalQueryConfig(queryJson);
    } catch (error) {
      console.error('Error loading configurations:', error);
      alert('Errore nel caricamento delle configurazioni');
    } finally {
      setLoading(false);
    }
  };

  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleReportChange = (value: string) => {
    setReportConfig(value);
    const isValid = validateJson(value);
    setReportValid(isValid);
    if (isValid) {
      setReportError(null);
    } else {
      setReportError('JSON non valido');
    }
  };

  const handleQueryChange = (value: string) => {
    setQueryConfig(value);
    const isValid = validateJson(value);
    setQueryValid(isValid);
    if (isValid) {
      setQueryError(null);
    } else {
      setQueryError('JSON non valido');
    }
  };

  const handleSave = async () => {
    if (!reportValid || !queryValid) {
      alert('Correggi gli errori JSON prima di salvare');
      return;
    }

    try {
      setSaving(true);

      const reportData = JSON.parse(reportConfig);
      const queryData = JSON.parse(queryConfig);

      // Save query config
      await fetch('/api/queries/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: reportData.query,
          query: queryData,
        }),
      });

      // Save report config
      await fetch('/api/reports/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: reportSlug,
          config: reportData,
        }),
      });

      alert('✅ Configurazioni salvate con successo!');
      setOriginalReportConfig(reportConfig);
      setOriginalQueryConfig(queryConfig);
      onSave();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Ripristinare le configurazioni originali?')) {
      setReportConfig(originalReportConfig);
      setQueryConfig(originalQueryConfig);
      setReportError(null);
      setQueryError(null);
      setReportValid(true);
      setQueryValid(true);
    }
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportConfig);
      alert('📋 Report config copiato negli appunti!');
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const handleCopyQuery = async () => {
    try {
      await navigator.clipboard.writeText(queryConfig);
      alert('📋 Query config copiato negli appunti!');
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const handleFormat = (value: string, setter: (v: string) => void) => {
    try {
      const formatted = JSON.stringify(JSON.parse(value), null, 2);
      setter(formatted);
    } catch (error) {
      alert('Impossibile formattare: JSON non valido');
    }
  };

  const hasChanges = reportConfig !== originalReportConfig || queryConfig !== originalQueryConfig;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Caricamento configurazioni...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Code className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">JSON Editor</h2>
            <p className="text-sm text-gray-500">Report: {reportSlug}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Ripristina
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges || !reportValid || !queryValid || saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>

          <button
            onClick={onClose}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2" />
            Chiudi
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {hasChanges && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2">
          <p className="text-sm text-yellow-800">
            ⚠️ Modifiche non salvate
          </p>
        </div>
      )}

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Query Config Panel */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white">
          <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">Query Config</h3>
              {queryValid ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Valido
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Errore
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleFormat(queryConfig, (v) => {
                  setQueryConfig(v);
                  handleQueryChange(v);
                })}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Formatta
              </button>
              <button
                onClick={handleCopyQuery}
                className="inline-flex items-center text-xs text-gray-600 hover:text-gray-900"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copia
              </button>
            </div>
          </div>
          {queryError && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-2">
              <p className="text-sm text-red-600">{queryError}</p>
            </div>
          )}
          <div className="flex-1 p-4">
            <textarea
              value={queryConfig}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full h-full font-mono text-sm border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Report Config Panel */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Report Config</h3>
              {reportValid ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Valido
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Errore
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleFormat(reportConfig, (v) => {
                  setReportConfig(v);
                  handleReportChange(v);
                })}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Formatta
              </button>
              <button
                onClick={handleCopyReport}
                className="inline-flex items-center text-xs text-gray-600 hover:text-gray-900"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copia
              </button>
            </div>
          </div>
          {reportError && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-2">
              <p className="text-sm text-red-600">{reportError}</p>
            </div>
          )}
          <div className="flex-1 p-4">
            <textarea
              value={reportConfig}
              onChange={(e) => handleReportChange(e.target.value)}
              className="w-full h-full font-mono text-sm border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div>
            💡 <strong>Tip:</strong> Copia il JSON, modificalo con Claude Code, poi incolla e salva
          </div>
          <div className="flex items-center space-x-4">
            <span>Query: {queryValid ? '✅' : '❌'}</span>
            <span>Report: {reportValid ? '✅' : '❌'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
