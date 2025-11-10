'use client';

import { useState, useEffect } from 'react';
import { ReportConfig } from '@/types/report';
import { ReportEngine } from '@/lib/report-engine';
import {
  executeQuery,
  getDocumentTypes,
  getDocumentYears,
} from '@/lib/mysql-query';
import ReportTable from './ReportTable';
import ReportFilters from './ReportFilters';
import ReportExport from './ReportExport';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { languageInfo } from '@/components/LanguageSelector';

const TEXTS_REPORTS: Record<
  string,
  {
    title: Record<string, string>;
    description: Record<string, string>;
  }
> = {
  customer_documents_summary: {
    title: {
      it: 'Documenti Cliente',
      en: 'Customer documents',
      de: 'Kundendokumente',
      fr: 'Documents client',
      es: 'Documentos del cliente',
      pt: 'Documentos do cliente',
      hr: 'Documentos do cliente',
      sl: 'Documentos do cliente',
      el: 'Documentos do cliente',
    },
    description: {
      it: 'Riepilogo documenti con raggruppamento per anno e tipo',
      en: 'Document summary grouped by year and type',
      de: 'Dokumentenübersicht nach Jahr und Art gruppiert',
      fr: 'Récapitulatif des documents regroupés par année et type',
      es: 'Resumen de documentos agrupados por año y tipo',
      pt: 'Resumo de documentos agrupados por ano e tipo',
      hr: 'Resumo de documentos agrupados por ano e tipo',
      sl: 'Resumo de documentos agrupados por ano e tipo',
      el: 'Resumo de documentos agrupados por ano e tipo',
    },
  },
  customer_documents_flat: {
    title: {
      it: 'Lista Documenti',
      en: 'Documents list',
      de: 'Dokumentenliste',
      fr: 'Liste de documents',
      es: 'Listado de documentos',
      pt: 'Lista de documentos',
      hr: 'Lista de documentos',
      sl: 'Lista de documentos',
      el: 'Lista de documentos',
    },
    description: {
      it: 'Lista semplice senza raggruppamento',
      en: 'Simple list without grouping',
      de: 'Einfache Liste ohne Gruppierung',
      fr: 'Liste simple sans regroupement',
      es: 'Lista simple sin agrupación',
      pt: 'Lista simples sem agrupamento',
      hr: 'Lista simples sem agrupamento',
      sl: 'Lista simples sem agrupamento',
      el: 'Lista simples sem agrupamento',
    },
  },
  cc: {
    // nel tuo JSON c’era "cc" con titoli vuoti → lo rendiamo comunque traducibile
    title: {
      it: 'Ordini e movimentazioni',
      en: 'Orders and movements',
      de: 'Bestellungen und Bewegungen',
      fr: 'Commandes et mouvements',
      es: 'Pedidos y movimientos',
      pt: 'Pedidos e movimentos',
      hr: 'Pedidos e movimentos',
      sl: 'Pedidos e movimentos',
      el: 'Pedidos e movimentos',
    },
    description: {
      it: '',
      en: '',
      de: '',
      fr: '',
      es: '',
      pt: '',
    },
  },
};

function getReportTitle(slug: string, lang: string, fallback: string) {
  const r = TEXTS_REPORTS[slug];
  if (r && r.title[lang]) return r.title[lang];
  if (r && r.title.it) return r.title.it;
  return fallback;
}

function getReportDescription(slug: string, lang: string, fallback: string | undefined) {
  const r = TEXTS_REPORTS[slug];
  if (r && r.description[lang]) return r.description[lang];
  if (r && r.description.it) return r.description.it;
  return fallback || '';
}

interface ReportBuilderProps {
  reportSlug: string;
  clientCode: string;
  language?: string;
}

export default function ReportBuilder({
  reportSlug,
  clientCode,
  language: initialLanguage = 'it',
}: ReportBuilderProps) {
  const { availableLanguages } = useLanguage();
  const [config, setConfig] = useState<ReportConfig | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [aggregates, setAggregates] = useState<Record<string, any>>({});
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [autoOptions, setAutoOptions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch(`/api/reports/config?slug=${reportSlug}`);

        if (!response.ok) {
          throw new Error(`Report configuration not found: ${reportSlug}`);
        }

        const data = await response.json();
        setConfig(data.config);
      } catch (err: any) {
        console.error('Error loading report config:', err);
        setError(err.message || 'Failed to load report configuration');
      }
    }

    loadConfig();
  }, [reportSlug]);

  useEffect(() => {
    if (!config || !clientCode) return;

    async function loadData(reportConfig: ReportConfig) {
      try {
        setLoading(true);
        setError(null);

        const queryParams: Record<string, any> = {};
        queryParams.clientCode = clientCode;

        const result = await executeQuery(reportConfig.query, queryParams);

        setRawData(result.data || []);

        if (result.debug) {
          setDebugInfo(result.debug);
        }

        const options: Record<string, string[]> = {};

        for (const filter of reportConfig.filters || []) {
          if (filter.options === 'auto') {
            if (filter.field === 'tipo_documento') {
              options[filter.field] = await getDocumentTypes(clientCode);
            } else if (filter.field === 'anno') {
              const years = await getDocumentYears(clientCode);
              options[filter.field] = years.map(String);
            } else {
              const uniqueValues = new Set<string>();
              result.data.forEach((row: any) => {
                const value = row[filter.field];
                if (value != null && value !== '') {
                  uniqueValues.add(String(value));
                }
              });
              options[filter.field] = Array.from(uniqueValues).sort();
            }
          }
        }

        setAutoOptions(options);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData(config);
  }, [config, clientCode]);

  useEffect(() => {
    if (!config || rawData.length === 0) {
      setProcessedData([]);
      setAggregates({});
      return;
    }

    const result = ReportEngine.processReport(rawData, config, filters);
    setProcessedData(result.data);
    setAggregates(result.aggregates);
  }, [rawData, config, filters]);

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {};

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">
          Errore
        </p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  const isGrouped = config.grouping && config.grouping.length > 0;

  const translatedTitle = getReportTitle(reportSlug, currentLanguage, config.title);
  const translatedDescription = getReportDescription(
    reportSlug,
    currentLanguage,
    config.description
  );

  const getFilterLabelByField = (field: string): string => {
    // stesso mapping usato in ReportFilters
    const m: Record<string, Record<string, string>> = {
      data_ordine: {
        it: 'Data Ordine',
        en: 'Order Date',
        de: 'Bestelldatum',
        fr: 'Date de Commande',
        es: 'Fecha de Pedido',
        pt: 'Data do Pedido',
        hr: 'Data do Pedido',
        sl: 'Data do Pedido',
        el: 'Data do Pedido',
      },
      numero_documento: {
        it: 'Numero Documento',
        en: 'Document Number',
        de: 'Dokumentnummer',
        fr: 'Numéro de Document',
        es: 'Número de Documento',
        pt: 'Número do Documento',
        hr: 'Número do Documento',
        sl: 'Número do Documento',
        el: 'Número do Documento',
      },
      codice_articolo: {
        it: 'Codice Articolo',
        en: 'Item Code',
        de: 'Artikelcode',
        fr: 'Code Article',
        es: 'Código Artículo',
        pt: 'Código do Artigo',
        hr: 'Código do Artigo',
        sl: 'Código do Artigo',
        el: 'Código do Artigo',
      },
      anno: {
        it: 'Anno',
        en: 'Year',
        de: 'Jahr',
        fr: 'Année',
        es: 'Año',
        pt: 'Ano',
        hr: 'Ano',
        sl: 'Ano',
        el: 'Ano',
      },
      tipo_documento: {
        it: 'Tipo Documento',
        en: 'Document Type',
        de: 'Dokumenttyp',
        fr: 'Type de Document',
        es: 'Tipo de Documento',
        pt: 'Tipo de Documento',
        hr: 'Tipo de Documento',
        sl: 'Tipo de Documento',
        el: 'Tipo de Documento',
      },
      cliente: {
        it: 'Cliente',
        en: 'Customer',
        de: 'Kunde',
        fr: 'Client',
        es: 'Cliente',
        pt: 'Cliente',
        hr: 'Cliente',
        sl: 'Cliente',
        el: 'Cliente',
      },
      dateRange: {
        it: 'Periodo',
        en: 'Period',
        de: 'Zeitraum',
        fr: 'Période',
        es: 'Período',
        pt: 'Período',
        hr: 'Período',
        sl: 'Período',
        el: 'Período',
      },
      stato: {
        it: 'Stato',
        en: 'Status',
        de: 'Status',
        fr: 'Statut',
        es: 'Estado',
        pt: 'Estado',
        hr: 'Estado',
        sl: 'Estado',
        el: 'Estado',
      },
    };
    const t = m[field];
    if (t) return t[currentLanguage] || t.it;
    return field;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between bg-gradient-to-r from-white to-slate-50 rounded-xl p-3 md:p-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {translatedTitle}
          </h1>
          {translatedDescription && (
            <p className="text-gray-600 mt-2">{translatedDescription}</p>
          )}
        </div>

        {/* Language selector */}
        <div className="ml-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Lingua
          </label>
          <select
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="block w-40 px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
          >
            {availableLanguages.map((langCode) => {
              const lang = languageInfo[langCode];
              if (!lang) return null;
              return (
                <option key={langCode} value={langCode}>
                  {lang.flag} {lang.name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {config && config.filters && config.filters.length > 0 && (
        <ReportFilters
          filters={config.filters}
          values={filters}
          onChange={handleFiltersChange}
          onApply={handleApplyFilters}
          autoOptions={autoOptions}
          rawData={rawData}
          language={currentLanguage}
        />
      )}

      {debugInfo && (
        <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
            Debug: Query SQL eseguita
          </summary>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Query SQL:
              </p>
              <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                {debugInfo.sql}
              </pre>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Parametri:
              </p>
              <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                {JSON.stringify(debugInfo.params, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Bind Types:
              </p>
              <code className="bg-white px-2 py-1 rounded border text-xs">
                {debugInfo.bindTypes}
              </code>
            </div>
          </div>
        </details>
      )}

      {!loading &&
        Object.keys(filters)
          .filter((key) => filters[key])
          .length > 0 && (
          <div className="bg-sky-50 border border-sky-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-sky-900">
                Filtri attivi:
              </h3>
              <button
                onClick={() => setFilters({})}
                className="text-xs text-sky-600 hover:text-sky-800 underline"
              >
                Rimuovi tutti
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([field, value]) => {
                if (!value) return null;

                const label = getFilterLabelByField(field);

                let displayValue = value;
                if (typeof value === 'object' && value.from && value.to) {
                  displayValue = `${value.from} - ${value.to}`;
                } else if (Array.isArray(value)) {
                  displayValue = value.join(', ');
                }

                return (
                  <div
                    key={field}
                    className="inline-flex items-center gap-2 bg-white border border-sky-200 rounded-full px-3 py-1 text-sm shadow-sm"
                  >
                    <span className="font-medium text-sky-900">{label}:</span>
                    <span className="text-sky-700">{displayValue}</span>
                    <button
                      onClick={() => {
                        const newFilters = { ...filters };
                        delete newFilters[field];
                        setFilters(newFilters);
                      }}
                      className="text-sky-400 hover:text-sky-600"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600 mr-2" />
          <span className="text-gray-600">
            Caricamento dati...
          </span>
        </div>
      )}

      {!loading && processedData.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">
            Nessun dato disponibile
          </p>
          <p className="text-yellow-600 text-sm mt-1">
            Non ci sono dati per il cliente selezionato con i filtri applicati.
          </p>
        </div>
      )}

      {!loading && processedData.length > 0 && config && (
        <ReportTable
          data={processedData}
          columns={config.columns}
          aggregates={aggregates}
          language={currentLanguage}
          isGrouped={isGrouped}
          groupingConfig={config.grouping}
        />
      )}

      {!loading && processedData.length > 0 && config && (
        <ReportExport
          data={processedData}
          config={config}
          reportTitle={translatedTitle}
          language={currentLanguage}
        />
      )}
    </div>
  );
}