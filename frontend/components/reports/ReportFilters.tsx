'use client';

import { useState, useEffect, useRef } from 'react';
import { ReportFilter } from '@/types/report';
import { Filter, X } from 'lucide-react';

const TEXTS_FILTERS = {
  filters: {
    it: 'Filtri',
    en: 'Filters',
    de: 'Filter',
    fr: 'Filtres',
    es: 'Filtros',
    pt: 'Filtros',
    hr: 'Filtros',
    sl: 'Filtros',
    el: 'Filtros',
  },
  show: {
    it: 'Mostra',
    en: 'Show',
    de: 'Anzeigen',
    fr: 'Afficher',
    es: 'Mostrar',
    pt: 'Mostrar',
    hr: 'Mostrar',
    sl: 'Mostrar',
    el: 'Mostrar',
  },
  hide: {
    it: 'Nascondi',
    en: 'Hide',
    de: 'Verbergen',
    fr: 'Masquer',
    es: 'Ocultar',
    pt: 'Ocultar',
    hr: 'Ocultar',
    sl: 'Ocultar',
    el: 'Ocultar',
  },
  applyFilters: {
    it: 'Applica filtri',
    en: 'Apply filters',
    de: 'Filter anwenden',
    fr: 'Appliquer les filtres',
    es: 'Aplicar filtros',
    pt: 'Aplicar filtros',
    hr: 'Aplicar filtros',
    sl: 'Aplicar filtros',
    el: 'Aplicar filtros',
  },
  reset: {
    it: 'Reset',
    en: 'Reset',
    de: 'Zurücksetzen',
    fr: 'Réinitialiser',
    es: 'Restablecer',
    pt: 'Redefinir',
    hr: 'Redefinir',
    sl: 'Redefinir',
    el: 'Redefinir',
  },
  all: {
    it: 'Tutti',
    en: 'All',
    de: 'Alle',
    fr: 'Tous',
    es: 'Todos',
    pt: 'Todos',
    hr: 'Todos',
    sl: 'Todos',
    el: 'Todos',
  },
  search: {
    it: 'Cerca...',
    en: 'Search...',
    de: 'Suchen...',
    fr: 'Rechercher...',
    es: 'Buscar...',
    pt: 'Pesquisar...',
    hr: 'Pesquisar...',
    sl: 'Pesquisar...',
    el: 'Pesquisar...',
  },
  selected: {
    it: 'selezionati',
    en: 'selected',
    de: 'ausgewählt',
    fr: 'sélectionnés',
    es: 'seleccionados',
    pt: 'selecionados',
    hr: 'selecionados',
    sl: 'selecionados',
    el: 'selecionados',
  },
  noOptionsFound: {
    it: 'Nessuna opzione trovata',
    en: 'No options found',
    de: 'Keine Optionen gefunden',
    fr: 'Aucune option trouvée',
    es: 'No se encontraron opciones',
    pt: 'Nenhuma opção encontrada',
    hr: 'Nenhuma opção encontrada',
    sl: 'Nenhuma opção encontrada',
    el: 'Nenhuma opção encontrada',
  },
  selectAll: {
    it: 'Seleziona tutti',
    en: 'Select all',
    de: 'Alle auswählen',
    fr: 'Tout sélectionner',
    es: 'Seleccionar todo',
    pt: 'Selecionar tudo',
    hr: 'Selecionar tudo',
    sl: 'Selecionar tudo',
    el: 'Selecionar tudo',
  },
  from: {
    it: 'Da',
    en: 'From',
    de: 'Von',
    fr: 'De',
    es: 'Desde',
    pt: 'De',
    hr: 'De',
    sl: 'De',
    el: 'De',
  },
  to: {
    it: 'A',
    en: 'To',
    de: 'Bis',
    fr: 'À',
    es: 'Hasta',
    pt: 'Até',
    hr: 'Até',
    sl: 'Até',
    el: 'Até',
  },
  // Label dei filtri comuni
  filterDataOrdine: {
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
  filterNumeroDocumento: {
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
  filterCodiceArticolo: {
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
  filterAnno: {
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
  filterTipoDocumento: {
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
  filterCliente: {
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
};


interface ReportFiltersProps {
  filters: ReportFilter[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onApply: () => void;
  autoOptions?: Record<string, string[]>;
  rawData?: any[];
  language?: string;
}

export default function ReportFilters({
  filters,
  values,
  onChange,
  onApply,
  autoOptions = {},
  rawData = [],
  language = 'it',
}: ReportFiltersProps) {
  const currentLang = language || 'it';

  const [showFilters, setShowFilters] = useState(false);
  const [localValues, setLocalValues] = useState(values);
  const [autocompleteOpen, setAutocompleteOpen] = useState<string | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const [multiselectSearch, setMultiselectSearch] = useState<Record<string, string>>({});
  const [multiselectOpen, setMultiselectOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setAutocompleteOpen(null);
        setMultiselectOpen({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field: string, value: any) => {
    setLocalValues({ ...localValues, [field]: value });
  };

  const getUniqueValues = (field: string): string[] => {
    if (!rawData || rawData.length === 0) return [];

    const uniqueValues = new Set<string>();
    rawData.forEach((row) => {
      const value = row[field];
      if (value != null && value !== '') {
        uniqueValues.add(String(value));
      }
    });

    return Array.from(uniqueValues).sort();
  };

  const getSuggestions = (field: string, inputValue: string): string[] => {
    if (!inputValue) return getUniqueValues(field).slice(0, 10);

    const uniqueValues = getUniqueValues(field);
    return uniqueValues
      .filter((val) => val.toLowerCase().includes(inputValue.toLowerCase()))
      .slice(0, 10);
  };

  const handleApply = () => {
    onChange(localValues);
    onApply();
    setShowFilters(false);
  };

  const handleReset = () => {
    const resetValues: Record<string, any> = {};
    filters.forEach((filter) => {
      resetValues[filter.field] = filter.default || null;
    });
    setLocalValues(resetValues);
    onChange(resetValues);
    onApply();
  };

  const getDateRangeDefault = (defaultValue: string) => {
    const today = new Date();
    const currentYear = today.getFullYear();

    switch (defaultValue) {
      case 'current_year':
        return {
          from: `${currentYear}-01-01`,
          to: `${currentYear}-12-31`,
        };
      case 'last_year':
        return {
          from: `${currentYear - 1}-01-01`,
          to: `${currentYear - 1}-12-31`,
        };
      case 'last_6_months': {
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        return {
          from: sixMonthsAgo.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0],
        };
      }
      default:
        return { from: '', to: '' };
    }
  };

  const getFilterLabel = (filter: ReportFilter): string => {
    // Mappa i field comuni a chiavi TEXTS
    const fieldToTextKey: Record<string, string> = {
      'data_ordine': 'filterDataOrdine',
      'numero_documento': 'filterNumeroDocumento',
      'codice_articolo': 'filterCodiceArticolo',
      'anno': 'filterAnno',
      'tipo_documento': 'filterTipoDocumento',
      'cliente': 'filterCliente',
    };

    const textKey = fieldToTextKey[filter.field];
    if (textKey && (TEXTS_FILTERS as any)[textKey]) {
      return (TEXTS_FILTERS as any)[textKey][currentLang] || filter.label;
    }

    // Fallback
    return filter.label;
  };

  const renderFilter = (filter: ReportFilter) => {
    const value = localValues[filter.field];
    const label = getFilterLabel(filter);

    switch (filter.type) {
      case 'text': {
        const suggestions = getSuggestions(filter.field, value || '');
        const showAutocomplete =
          autocompleteOpen === filter.field && suggestions.length > 0;

        return (
          <div
            className="relative"
            ref={autocompleteOpen === filter.field ? autocompleteRef : null}
          >
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(filter.field, e.target.value)}
              onFocus={() => setAutocompleteOpen(filter.field)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-sm"
              placeholder={label}
            />
            {showAutocomplete && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleChange(filter.field, suggestion);
                      setAutocompleteOpen(null);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-sky-50 text-sm text-gray-700 hover:text-sky-900 border-b last:border-b-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'select': {
        const selectOptions =
          filter.options === 'auto'
            ? autoOptions[filter.field] || []
            : filter.options || [];

        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(filter.field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white shadow-sm"
          >
            <option value="">{TEXTS_FILTERS.all[currentLang]}</option>
            {selectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }

      case 'multiselect': {
        const multiOptions =
          filter.options === 'auto'
            ? autoOptions[filter.field] || []
            : filter.options || [];

        const selectedValues = value || [];
        const searchTerm = multiselectSearch[filter.field] || '';
        const isOpen = multiselectOpen[filter.field] || false;

        const filteredOptions = multiOptions.filter((option) =>
          option.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <div className="relative" ref={isOpen ? autocompleteRef : null}>
            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedValues.map((val: string) => (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded-full"
                  >
                    {val}
                    <button
                      type="button"
                      onClick={() => {
                        const newValues = selectedValues.filter(
                          (v: string) => v !== val
                        );
                        handleChange(filter.field, newValues);
                      }}
                      className="text-sky-600 hover:text-sky-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setMultiselectSearch({
                    ...multiselectSearch,
                    [filter.field]: e.target.value,
                  })
                }
                onFocus={() =>
                  setMultiselectOpen({
                    ...multiselectOpen,
                    [filter.field]: true,
                  })
                }
                placeholder={`${TEXTS_FILTERS.search[currentLang]} (${
                  selectedValues.length
                } ${TEXTS_FILTERS.selected[currentLang]})`}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-sm"
              />

              {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {TEXTS_FILTERS.noOptionsFound[currentLang]}
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          handleChange(filter.field, filteredOptions);
                          setMultiselectOpen({
                            ...multiselectOpen,
                            [filter.field]: false,
                          });
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-sky-600 hover:bg-sky-50 border-b"
                      >
                        ✓ {TEXTS_FILTERS.selectAll[currentLang]} (
                        {filteredOptions.length})
                      </button>
                      {filteredOptions.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedValues.includes(option)}
                            onChange={(e) => {
                              const newValues = e.target.checked
                                ? [...selectedValues, option]
                                : selectedValues.filter(
                                    (v: string) => v !== option
                                  );
                              handleChange(filter.field, newValues);
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setMultiselectOpen({
                  ...multiselectOpen,
                  [filter.field]: !isOpen,
                })
              }
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
            >
              {isOpen ? '▲' : '▼'}
            </button>
          </div>
        );
      }

      case 'daterange': {
        const dateRange = value || getDateRangeDefault(filter.default as string);

        return (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">
                {TEXTS_FILTERS.from[currentLang]}
              </label>
              <input
                type="date"
                value={dateRange.from || ''}
                onChange={(e) =>
                  handleChange(filter.field, { ...dateRange, from: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">
                {TEXTS_FILTERS.to[currentLang]}
              </label>
              <input
                type="date"
                value={dateRange.to || ''}
                onChange={(e) =>
                  handleChange(filter.field, { ...dateRange, to: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-sm"
              />
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const activeFiltersCount = Object.values(localValues).filter(
    (v) =>
      v !== null &&
      v !== undefined &&
      v !== '' &&
      !(typeof v === 'object' && Object.keys(v).length === 0)
  ).length;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-sky-700 shadow-sm">
            <Filter className="w-4 h-4" />
          </span>
          <h3 className="text-base font-semibold text-gray-900">
            {TEXTS_FILTERS.filters[currentLang]}
          </h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-sky-100 text-sky-800 text-xs font-medium rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sky-600 hover:text-sky-700 text-sm font-medium"
        >
          {showFilters
            ? TEXTS_FILTERS.hide[currentLang]
            : TEXTS_FILTERS.show[currentLang]}
        </button>
      </div>

      {showFilters && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {filters.map((filter) => {
              const label = getFilterLabel(filter);
              return (
                <div key={filter.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                  </label>
                  {renderFilter(filter)}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-4 border-t border-dashed border-slate-200">
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 font-medium shadow-sm transition"
            >
              {TEXTS_FILTERS.applyFilters[currentLang]}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-md hover:bg-gray-50 font-medium flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {TEXTS_FILTERS.reset[currentLang]}
            </button>
          </div>
        </>
      )}
    </div>
  );
}