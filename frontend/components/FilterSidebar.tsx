'use client';

// components/FilterSidebar.tsx
import { useState, useMemo } from 'react';
import { getLabel } from '@/lib/ui-labels';
import { formatAttributeValue } from '@/lib/product-utils';

interface FilterOption {
  label?: Record<string, string>;
  value: Record<string, string> | string | boolean | number;
}

interface Filter {
  key: string;
  values: string[];
  options?: FilterOption[]; // Opzioni con traduzioni dal backend
  type?: 'checkbox' | 'tags' | 'select' | 'range';
  min?: number;
  max?: number;
  availableCount?: number; // Numero di prodotti disponibili con questo filtro
  availableValues?: string[]; // Lista valori disponibili (per disabilitare gli altri)
  valueCounts?: Record<string, number>; // NEW: Numero di prodotti per ogni valore
}

interface FilterSidebarProps {
  filters: Filter[];
  selectedFilters: Record<string, string[]>;
  onFiltersChange: (filters: Record<string, string[]>) => void;
  lang?: string;
}

export default function FilterSidebar({
  filters,
  selectedFilters,
  onFiltersChange,
  lang = 'it',
}: FilterSidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [rangeValues, setRangeValues] = useState<Record<string, [number, number]>>({});
  const [showAllValues, setShowAllValues] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const MAX_VISIBLE_VALUES = 6; // Mostra max 6 valori prima di "Mostra tutti"

  // Helper per ottenere valore tradotto da opzione
  const getTranslatedValue = (value: any, lang: string): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      return value[lang] || value['it'] || Object.values(value)[0] || '';
    }
    return String(value);
  };

  // Funzione per ottenere TUTTI i valori tradotti di un filtro (anche non disponibili)
  const getAllFilterValues = (filter: Filter): string[] => {
    // Se ha options con traduzioni, usale
    if (filter.options && filter.options.length > 0) {
      return filter.options.map(opt => {
        // Ottieni il valore in italiano (chiave univoca)
        const italianValue = getTranslatedValue(opt.value, 'it');
        return italianValue.trim();
      });
    }
    // Altrimenti usa values legacy
    return filter.values || [];
  };

  // Funzione per verificare se un valore è disponibile (ha prodotti)
  const isValueAvailable = (filter: Filter, value: string): boolean => {
    // Se non abbiamo informazioni sulla disponibilità, consideriamo tutto disponibile
    if (!filter.availableValues || filter.availableValues.length === 0) {
      return true;
    }
    // Verifica se il valore è nella lista dei disponibili (trim per sicurezza)
    return filter.availableValues.some(av => av.trim() === value.trim());
  };

  // NEW: Funzione per ottenere il conteggio prodotti per un valore
  const getValueCount = (filter: Filter, value: string): number => {
    if (!filter.valueCounts) {
      return 0;
    }
    return filter.valueCounts[value.trim()] || 0;
  };

  // Funzione per tradurre un valore basandosi sulle options
  const translateValue = (filter: Filter, italianValue: string): string => {
    // Se il valore è booleano ("1", "0", "true", "false"), traduci in Sì/No
    const normalizedValue = italianValue.toLowerCase().trim();
    if (normalizedValue === '1' || normalizedValue === 'true' || normalizedValue === '0' || normalizedValue === 'false') {
      // Per booleani, mostra "Sì" / "No" o la label del filtro
      if (normalizedValue === '1' || normalizedValue === 'true') {
        // Se ha solo un valore "1" o "true", usa la label del filtro
        const allValues = getAllFilterValues(filter);
        if (allValues.length === 1 && (allValues[0] === '1' || allValues[0].toLowerCase() === 'true')) {
          return getFilterLabel(filter); // Es: "Applicazione su Legno"
        }
        return getLabel('filters.boolean.yes', lang) || 'Sì';
      }
      return getLabel('filters.boolean.no', lang) || 'No';
    }

    if (!filter.options || filter.options.length === 0) {
      return italianValue;
    }

    const option = filter.options.find(opt => {
      const itValue = getTranslatedValue(opt.value, 'it').trim();
      return itValue === italianValue;
    });

    if (option) {
      return getTranslatedValue(option.value, lang).trim();
    }

    return italianValue;
  };

  // Funzione per ottenere la label tradotta del filtro
  const getFilterLabel = (filter: Filter): string => {
    // Se è il filtro prezzo, usa la label tradotta dal sistema UI
    if (filter.key === 'prezzo' || filter.key.toLowerCase() === 'price') {
      return getLabel('home.price_label', lang);
    }

    // Se ha options con traduzioni, usa la label della prima option
    if (filter.options && filter.options.length > 0 && filter.options[0].label) {
      return getTranslatedValue(filter.options[0].label, lang);
    }

    // Altrimenti usa la key
    return filter.key;
  };

  // Funzione per ottenere i valori filtrati da search
  const getFilteredValues = (filter: Filter): string[] => {
    const allValues = getAllFilterValues(filter);
    const searchTerm = searchTerms[filter.key]?.toLowerCase() || '';

    if (!searchTerm) {
      return allValues;
    }

    return allValues.filter(value => {
      const translatedLabel = translateValue(filter, value).toLowerCase();
      return translatedLabel.includes(searchTerm);
    });
  };

  // Funzione per verificare se un filtro è booleano (ha solo valore "1" o "true")
  const isBooleanFilter = (filter: Filter): boolean => {
    const allValues = getAllFilterValues(filter);
    if (allValues.length === 0) return false;
    const firstValue = allValues[0].toLowerCase().trim();
    return allValues.length === 1 && (firstValue === '1' || firstValue === '0' || firstValue === 'true' || firstValue === 'false');
  };

  // Funzione per ottenere i valori visibili (con limite)
  const getVisibleValues = (filter: Filter): { values: string[], hasMore: boolean } => {
    const filteredValues = getFilteredValues(filter);
    const isShowingAll = showAllValues[filter.key];

    if (isShowingAll || filteredValues.length <= MAX_VISIBLE_VALUES) {
      return { values: filteredValues, hasMore: false };
    }

    // Mostra i primi MAX_VISIBLE_VALUES, dando priorità a quelli selezionati
    const selectedValues = selectedFilters[filter.key] || [];
    const selected = filteredValues.filter(v => selectedValues.includes(v));
    const notSelected = filteredValues.filter(v => !selectedValues.includes(v));

    const visible = [
      ...selected,
      ...notSelected.slice(0, MAX_VISIBLE_VALUES - selected.length)
    ];

    return {
      values: visible,
      hasMore: filteredValues.length > MAX_VISIBLE_VALUES
    };
  };

  if (filters.length === 0) return null;

  const toggleExpanded = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFilterValue = (filterKey: string, value: string) => {
    const currentValues = selectedFilters[filterKey] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...selectedFilters,
      [filterKey]: newValues,
    });
  };

  const handleRangeChange = (filterKey: string, min: number, max: number) => {
    setRangeValues(prev => ({ ...prev, [filterKey]: [min, max] }));

    // Converti range in formato stringa per il filtro
    onFiltersChange({
      ...selectedFilters,
      [filterKey]: [`${min}-${max}`],
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setRangeValues({});
  };

  const hasActiveFilters = Object.values(selectedFilters).some(arr => arr.length > 0);
  const activeFilterCount = Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);

  // Separa filtri booleani da altri filtri
  const booleanFilters = filters.filter(f => isBooleanFilter(f));
  const regularFilters = filters.filter(f => !isBooleanFilter(f));

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-base font-bold text-slate-800">
              {getLabel('filters.title', lang)}
            </h3>
            {hasActiveFilters && (
              <span className="bg-emerald-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {getLabel('filters.clear', lang)}
            </button>
          )}
        </div>
      </div>

      {/* Filtri */}
      <div className="p-4 space-y-3">
        {/* Gruppo Caratteristiche (filtri booleani) */}
        {booleanFilters.length > 0 && (
          <div className="border rounded-lg border-gray-200 bg-white hover:bg-gray-50">
            {/* Titolo gruppo */}
            <button
              onClick={() => toggleExpanded('_boolean_group')}
              className="flex items-center justify-between w-full text-left px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-800">
                  {getLabel('filters.features', lang) || 'Caratteristiche'}
                </span>
                {booleanFilters.some(f => (selectedFilters[f.key] || []).length > 0) && (
                  <span className="bg-emerald-700 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {booleanFilters.filter(f => (selectedFilters[f.key] || []).length > 0).length}
                  </span>
                )}
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  expanded['_boolean_group'] !== false ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Lista filtri booleani */}
            {expanded['_boolean_group'] !== false && (
              <div className="px-4 pb-3 pt-1 space-y-2">
                {booleanFilters.map((filter) => {
                  const hasSelected = (selectedFilters[filter.key] || []).length > 0;
                  return (
                    <label
                      key={filter.key}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all cursor-pointer hover:bg-gray-50"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={hasSelected}
                          onChange={() => {
                            if (hasSelected) {
                              const newFilters = { ...selectedFilters };
                              delete newFilters[filter.key];
                              onFiltersChange(newFilters);
                            } else {
                              onFiltersChange({
                                ...selectedFilters,
                                [filter.key]: ['1'],
                              });
                            }
                          }}
                          className="w-4 h-4 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 transition-all cursor-pointer text-emerald-700"
                        />
                        {hasSelected && (
                          <svg className="w-3 h-3 text-emerald-700 absolute left-0.5 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm flex-1 text-gray-700">
                        {getFilterLabel(filter)}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        ({getValueCount(filter, '1')})
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Filtri regolari */}
        {regularFilters.map((filter) => {
          const isExpanded = expanded[filter.key] !== false; // Default aperto
          const selectedValues = selectedFilters[filter.key] || [];
          const hasSelected = selectedValues.length > 0;

          return (
            <div
              key={filter.key}
              className={`border rounded-lg transition-all ${
                hasSelected
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              {/* Titolo filtro */}
              <button
                onClick={() => toggleExpanded(filter.key)}
                className="flex items-center justify-between w-full text-left px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${hasSelected ? 'text-emerald-700' : 'text-gray-800'}`}>
                    {getFilterLabel(filter)}
                  </span>
                  {hasSelected && (
                    <span className="bg-emerald-700 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {selectedValues.length}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Valori filtro con animazione */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-1">
                  {/* Search box se ci sono molti valori */}
                  {getAllFilterValues(filter).length > MAX_VISIBLE_VALUES && filter.type !== 'range' && (
                        <div className="mb-3">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder={`${getLabel('filters.search_placeholder', lang)} ${getFilterLabel(filter).toLowerCase()}...`}
                              value={searchTerms[filter.key] || ''}
                              onChange={(e) => setSearchTerms({ ...searchTerms, [filter.key]: e.target.value })}
                              className="w-full px-3 py-2 pl-9 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>
                      )}

                  <div className="space-y-2">
                    {/* Rendering basato sul tipo */}
                    {filter.type === 'tags' ? (
                      // Tags: pulsanti colorati più moderni
                      (() => {
                        const { values, hasMore } = getVisibleValues(filter);
                        return (
                          <>
                            <div className="flex flex-wrap gap-2">
                              {values.map((value) => {
                          const isSelected = selectedValues.includes(value);
                          const isAvailable = isValueAvailable(filter, value);
                          const isDisabled = !isAvailable && !isSelected;
                          const translatedLabel = translateValue(filter, value);
                          const productCount = getValueCount(filter, value); // NEW: Ottieni conteggio

                          return (
                            <button
                              key={value}
                              disabled={isDisabled}
                              onClick={() => !isDisabled && toggleFilterValue(filter.key, value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isDisabled
                                  ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border border-gray-200'
                                  : 'transform hover:scale-105'
                              } ${
                                isSelected
                                  ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-md'
                                  : isDisabled
                                  ? ''
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                              }`}
                            >
                              {translatedLabel} <span className="ml-1">({productCount})</span>
                            </button>
                          );
                        })}
                      </div>
                      {/* Bottone Mostra tutti/meno */}
                      {hasMore && (
                        <button
                          onClick={() => setShowAllValues({ ...showAllValues, [filter.key]: !showAllValues[filter.key] })}
                          className="mt-2 text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                        >
                          {showAllValues[filter.key] ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              {getLabel('filters.show_less', lang)}
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              {getLabel('filters.show_more', lang, { count: getAllFilterValues(filter).length - values.length })}
                            </>
                          )}
                        </button>
                      )}
                    </>
                  );
                })()
                    ) : filter.type === 'select' ? (
                      // Select: dropdown moderno - mostra tutte le opzioni (disabilita quelle non disponibili)
                      <select
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value) {
                            onFiltersChange({
                              ...selectedFilters,
                              [filter.key]: [value],
                            });
                          } else {
                            const newFilters = { ...selectedFilters };
                            delete newFilters[filter.key];
                            onFiltersChange(newFilters);
                          }
                        }}
                        value={selectedValues[0] || ''}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm font-medium text-gray-900 transition-all"
                      >
                        <option value="">Tutti</option>
                        {getAllFilterValues(filter).map((value) => {
                          const isAvailable = isValueAvailable(filter, value);
                          const isSelected = selectedValues.includes(value);
                          const isDisabled = !isAvailable && !isSelected;
                          const translatedLabel = translateValue(filter, value);
                          const productCount = getValueCount(filter, value); // NEW: Ottieni conteggio

                          return (
                            <option
                              key={value}
                              value={value}
                              disabled={isDisabled}
                              className={isDisabled ? 'text-gray-400' : ''}
                            >
                              {translatedLabel} ({productCount})
                            </option>
                          );
                        })}
                      </select>
                    ) : filter.type === 'range' ? (
                      // Range: slider doppio interattivo
                      (() => {
                        const minValue = filter.min ?? 0;
                        const maxValue = filter.max ?? 100;
                        const currentMin = rangeValues[filter.key]?.[0] ?? minValue;
                        const currentMax = rangeValues[filter.key]?.[1] ?? maxValue;

                        return (
                          <div className="py-3 px-3">
                            {/* Display valori correnti */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">{getLabel('filters.range.min', lang)}</div>
                                <div className="font-bold text-emerald-700">€{currentMin.toFixed(2)}</div>
                              </div>
                              <div className="text-gray-400">—</div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">{getLabel('filters.range.max', lang)}</div>
                                <div className="font-bold text-emerald-700">€{currentMax.toFixed(2)}</div>
                              </div>
                            </div>

                            {/* Slider Min */}
                            <div className="mb-3">
                              <label className="text-xs text-gray-600 mb-1 block">{getLabel('filters.range.price_min', lang)}</label>
                              <input
                                type="range"
                                min={minValue}
                                max={maxValue}
                                step="0.01"
                                value={currentMin}
                                onChange={(e) => {
                                  const newMin = parseFloat(e.target.value);
                                  if (newMin <= currentMax) {
                                    handleRangeChange(filter.key, newMin, currentMax);
                                  }
                                }}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                              />
                            </div>

                            {/* Slider Max */}
                            <div className="mb-3">
                              <label className="text-xs text-gray-600 mb-1 block">{getLabel('filters.range.price_max', lang)}</label>
                              <input
                                type="range"
                                min={minValue}
                                max={maxValue}
                                step="0.01"
                                value={currentMax}
                                onChange={(e) => {
                                  const newMax = parseFloat(e.target.value);
                                  if (newMax >= currentMin) {
                                    handleRangeChange(filter.key, currentMin, newMax);
                                  }
                                }}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                              />
                            </div>

                            {/* Reset button */}
                            {(currentMin !== minValue || currentMax !== maxValue) && (
                              <button
                                onClick={() => handleRangeChange(filter.key, minValue, maxValue)}
                                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 mt-2"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {getLabel('filters.range.reset', lang)}
                              </button>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      // Checkbox: design moderno con hover
                      (() => {
                        const { values, hasMore } = getVisibleValues(filter);
                        return (
                          <>
                            {values.map((value) => {
                        const isSelected = selectedValues.includes(value);
                        const isAvailable = isValueAvailable(filter, value);
                        const isDisabled = !isAvailable && !isSelected;
                        const translatedLabel = translateValue(filter, value);
                        const productCount = getValueCount(filter, value); // NEW: Ottieni conteggio

                        return (
                          <label
                            key={value}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${
                              isDisabled
                                ? 'opacity-40 cursor-not-allowed'
                                : 'cursor-pointer'
                            } ${
                              isSelected
                                ? 'bg-emerald-50 border border-emerald-200'
                                : isDisabled
                                ? 'border border-transparent'
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => !isDisabled && toggleFilterValue(filter.key, value)}
                                className={`w-4 h-4 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 transition-all ${
                                  isDisabled
                                    ? 'cursor-not-allowed bg-gray-100'
                                    : 'cursor-pointer text-emerald-700'
                                }`}
                              />
                              {isSelected && (
                                <svg className="w-3 h-3 text-emerald-700 absolute left-0.5 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm flex-1 ${
                              isSelected
                                ? 'text-emerald-900 font-medium'
                                : isDisabled
                                ? 'text-gray-400'
                                : 'text-gray-700'
                            }`}>
                              {translatedLabel}
                            </span>
                            {/* NEW: Mostra sempre il conteggio */}
                            <span className={`text-xs font-medium ${
                              isDisabled
                                ? 'text-gray-400'
                                : isSelected
                                ? 'text-emerald-700'
                                : 'text-gray-500'
                            }`}>
                              ({productCount})
                            </span>
                          </label>
                        );
                      })}
                      {/* Bottone Mostra tutti/meno per checkbox */}
                      {hasMore && (
                        <button
                          onClick={() => setShowAllValues({ ...showAllValues, [filter.key]: !showAllValues[filter.key] })}
                          className="mt-2 text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                        >
                          {showAllValues[filter.key] ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              {getLabel('filters.show_less', lang)}
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              {getLabel('filters.show_more', lang, { count: getAllFilterValues(filter).length - values.length })}
                            </>
                          )}
                        </button>
                      )}
                    </>
                  );
                })()
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
