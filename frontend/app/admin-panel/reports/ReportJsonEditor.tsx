'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Save,
  RotateCcw,
  Copy,
  CheckCircle,
  AlertCircle,
  Code,
  Database,
  Eye,
  X
} from 'lucide-react';

interface ReportJsonEditorProps {
  reportSlug: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ReportJsonEditor({
  reportSlug,
  onClose,
  onSave,
}: ReportJsonEditorProps) {
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

  const reportEditorRef = useRef<any>(null);
  const queryEditorRef = useRef<any>(null);

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

  const handleReportChange = (value: string | undefined) => {
    if (value !== undefined) {
      setReportConfig(value);
      const isValid = validateJson(value);
      setReportValid(isValid);
      if (isValid) {
        setReportError(null);
      } else {
        setReportError('JSON non valido');
      }
    }
  };

  const handleQueryChange = (value: string | undefined) => {
    if (value !== undefined) {
      setQueryConfig(value);
      const isValid = validateJson(value);
      setQueryValid(isValid);
      if (isValid) {
        setQueryError(null);
      } else {
        setQueryError('JSON non valido');
      }
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

  const handleValidate = () => {
    const reportOk = validateJson(reportConfig);
    const queryOk = validateJson(queryConfig);

    if (reportOk && queryOk) {
      alert('✅ Entrambe le configurazioni sono valide!');
    } else {
      let msg = '❌ Errori trovati:\n';
      if (!reportOk) msg += '- Report Config: JSON non valido\n';
      if (!queryOk) msg += '- Query Config: JSON non valido\n';
      alert(msg);
    }
  };

  const handleFormatReport = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(reportConfig), null, 2);
      setReportConfig(formatted);
    } catch (error) {
      alert('Impossibile formattare: JSON non valido');
    }
  };

  const handleFormatQuery = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(queryConfig), null, 2);
      setQueryConfig(formatted);
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
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Code className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">JSON Editor</h2>
            <p className="text-sm text-gray-400">Report: {reportSlug}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Validate Button */}
          <button
            onClick={handleValidate}
            className="inline-flex items-center px-3 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Valida
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="inline-flex items-center px-3 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Ripristina
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || !reportValid || !queryValid || saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="inline-flex items-center px-3 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700"
          >
            <X className="w-4 h-4 mr-2" />
            Chiudi
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {hasChanges && (
        <div className="bg-yellow-900 bg-opacity-20 border-b border-yellow-700 px-6 py-2">
          <p className="text-sm text-yellow-400">
            ⚠️ Modifiche non salvate
          </p>
        </div>
      )}

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Query Config Panel */}
        <div className="w-1/2 border-r border-gray-700 flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Query Config</h3>
              {queryValid ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Valido
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Errore
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleFormatQuery}
                className="text-xs text-gray-400 hover:text-white"
                title="Formatta JSON"
              >
                Formatta
              </button>
              <button
                onClick={handleCopyQuery}
                className="inline-flex items-center text-xs text-gray-400 hover:text-white"
                title="Copia negli appunti"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copia
              </button>
            </div>
          </div>
          {queryError && (
            <div className="bg-red-900 bg-opacity-20 border-b border-red-700 px-4 py-2">
              <p className="text-sm text-red-400">{queryError}</p>
            </div>
          )}
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={queryConfig}
              onChange={handleQueryChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
              }}
              onMount={(editor) => {
                queryEditorRef.current = editor;
              }}
            />
          </div>
        </div>

        {/* Report Config Panel */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Report Config</h3>
              {reportValid ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Valido
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Errore
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleFormatReport}
                className="text-xs text-gray-400 hover:text-white"
                title="Formatta JSON"
              >
                Formatta
              </button>
              <button
                onClick={handleCopyReport}
                className="inline-flex items-center text-xs text-gray-400 hover:text-white"
                title="Copia negli appunti"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copia
              </button>
            </div>
          </div>
          {reportError && (
            <div className="bg-red-900 bg-opacity-20 border-b border-red-700 px-4 py-2">
              <p className="text-sm text-red-400">{reportError}</p>
            </div>
          )}
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={reportConfig}
              onChange={handleReportChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
              }}
              onMount={(editor) => {
                reportEditorRef.current = editor;
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-6">
            <span>
              💡 <strong>Tip:</strong> Copia il JSON, modificalo con Claude Code, poi incolla e salva
            </span>
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
