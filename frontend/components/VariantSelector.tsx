'use client';

// components/VariantSelector.tsx
import { useRouter } from 'next/navigation';
import { Variant } from '@/types/product';
import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { getLabel } from '@/lib/ui-labels';
import { getTranslatedValue } from '@/lib/product-utils';

interface VariantSelectorProps {
  variants: Variant[];
  currentCode: string;
  productAttributes?: Record<string, any>;
  groupProducts?: any[];
  lang?: string;
  onVariantChange?: (code: string) => void;
  onOpenGallery?: (images: string[]) => void; // Callback per aprire lightbox con immagini variante
  compact?: boolean; // Modalità compatta con dropdowns (mobile)
}

export default function VariantSelector({
  variants,
  currentCode,
  productAttributes,
  groupProducts = [],
  lang = 'it',
  onVariantChange,
  onOpenGallery,
  compact = false
}: VariantSelectorProps) {
  const router = useRouter();

  // State per tracciare la selezione corrente di ogni qualifier
  const [currentSelection, setCurrentSelection] = useState<Record<string, string>>({});

  // Funzione per tradurre la label di un attributo
  const getAttributeLabel = (key: string): string => {
    // Prima prova a cercare una traduzione in ui-labels.json per attributi comuni
    const normalizedKey = key.toLowerCase();
    const attributeLabel = getLabel(`attributes.${normalizedKey}`, lang);
    if (attributeLabel) {
      return attributeLabel;
    }

    // Se non trovata, usa i dati del prodotto
    if (!productAttributes || !productAttributes[key]) {
      return key;
    }

    const attr = productAttributes[key];

    // Se l'attributo ha una label, usala
    if (typeof attr === 'object' && attr !== null && 'label' in attr && attr.label) {
      return getTranslatedValue(attr.label, lang);
    }

    // Altrimenti ritorna la chiave
    return key;
  };

  // Funzione per tradurre il valore di un attributo dalle varianti
  const getAttributeValue = (key: string, value: string): string => {
    const valueTrimmed = value.trim();

    // Cerca prima nelle varianti stesse (hanno gli attributi tradotti!)
    for (const variant of variants) {
      if (variant.attributi && variant.attributi[key]) {
        const attr = variant.attributi[key];

        // Se l'attributo ha una struttura value multilingua
        if (typeof attr === 'object' && attr !== null && 'value' in attr && attr.value) {
          if (typeof attr.value === 'object') {
            // Confronta con il valore italiano (trimmed)
            const italianValue = getTranslatedValue(attr.value, 'it').trim();
            if (italianValue.toLowerCase() === valueTrimmed.toLowerCase()) {
              // Ritorna la traduzione nella lingua corrente
              return getTranslatedValue(attr.value, lang);
            }
          }
        }
        // CRITICAL: Support DIRECT multilingual objects {it: "...", en: "..."}
        else if (typeof attr === 'object' && attr !== null && 'it' in attr) {
          const italianValue = getTranslatedValue(attr, 'it').trim();
          if (italianValue.toLowerCase() === valueTrimmed.toLowerCase()) {
            return getTranslatedValue(attr, lang);
          }
        }
      }
    }

    // Fallback: cerca tra tutti i prodotti del catalogo
    for (const product of groupProducts) {
      if (product.attributi && product.attributi[key]) {
        const attr = product.attributi[key];

        if (typeof attr === 'object' && attr !== null && 'value' in attr && attr.value) {
          if (typeof attr.value === 'object') {
            const italianValue = getTranslatedValue(attr.value, 'it').trim();
            if (italianValue.toLowerCase() === valueTrimmed.toLowerCase()) {
              return getTranslatedValue(attr.value, lang);
            }
          }
        }
        // CRITICAL: Support DIRECT multilingual objects {it: "...", en: "..."}
        else if (typeof attr === 'object' && attr !== null && 'it' in attr) {
          const italianValue = getTranslatedValue(attr, 'it').trim();
          if (italianValue.toLowerCase() === valueTrimmed.toLowerCase()) {
            return getTranslatedValue(attr, lang);
          }
        }
      }
    }

    // Se non trova traduzione, ritorna il valore originale
    return value;
  };

  // Trova la variante corrente
  const currentVariant = variants.find(v => v.codice === currentCode);

  // Inizializza currentSelection con i qualifiers della variante corrente
  useEffect(() => {
    if (currentVariant && currentVariant.qualifiers) {
      setCurrentSelection(currentVariant.qualifiers);
    }
  }, [currentVariant]);

  // Funzione per verificare se una combinazione di qualifier è disponibile
  const isOptionAvailable = (qualifierKey: string, optionValue: string): boolean => {
    // Il valore attualmente selezionato è sempre disponibile
    if (currentSelection[qualifierKey] === optionValue) {
      return true;
    }

    // Crea una selezione temporanea con questo nuovo valore
    const tempSelection = { ...currentSelection, [qualifierKey]: optionValue };

    // Verifica se esiste almeno una variante che matcha questa combinazione
    return variants.some(variant => {
      return Object.entries(tempSelection).every(([key, value]) => {
        const variantValue = String(variant.qualifiers[key] || '').trim();
        const selectionValue = String(value || '').trim();
        return variantValue.toLowerCase() === selectionValue.toLowerCase();
      });
    });
  };

  // Analizza la struttura dei qualifiers per decidere come costruire la tabella
  const tableStructure = useMemo(() => {
    if (variants.length === 0) return null;

    // Estrai tutti i qualifiers disponibili
    const qualifierKeys = new Set<string>();
    variants.forEach(v => {
      Object.keys(v.qualifiers).forEach(k => qualifierKeys.add(k));
    });

    const keys = Array.from(qualifierKeys);

    // Se c'è solo 1 qualifier, usa lista semplice
    if (keys.length === 1) {
      return { type: 'simple', key: keys[0] };
    }

    // Se ci sono 2+ qualifiers, usa il primo per righe, il secondo per colonne
    // (oppure identifica quello con più valori unici per le colonne)
    const qualifierValueCounts: Record<string, number> = {};
    keys.forEach(key => {
      const uniqueValues = new Set(variants.map(v => String(v.qualifiers[key] || '')));
      qualifierValueCounts[key] = uniqueValues.size;
    });

    // Ordina per numero di valori (il qualifier con più valori diventa colonne)
    const sortedKeys = keys.sort((a, b) => qualifierValueCounts[b] - qualifierValueCounts[a]);

    // Colonne: ultimo qualifier (di solito dimensioni/specifiche tecniche)
    const columnKey = sortedKeys[sortedKeys.length - 1];
    // Righe: tutti gli altri qualifiers combinati
    const rowKeys = sortedKeys.slice(0, -1);

    // Costruisci valori unici per colonne
    const columnValues = Array.from(
      new Set(variants.map(v => String(v.qualifiers[columnKey] || '')).filter(Boolean))
    ).sort();

    // Costruisci combinazioni uniche per righe
    const rowCombinations = new Map<string, Record<string, string>>();
    variants.forEach(v => {
      const rowId = rowKeys.map(k => String(v.qualifiers[k] || '')).join('|||');
      if (!rowCombinations.has(rowId)) {
        const rowData: Record<string, string> = {};
        rowKeys.forEach(k => {
          rowData[k] = String(v.qualifiers[k] || '');
        });
        rowCombinations.set(rowId, rowData);
      }
    });

    return {
      type: 'matrix',
      columnKey,
      columnValues,
      rowKeys,
      rowCombinations: Array.from(rowCombinations.values()),
    };
  }, [variants]);

  // Trova variante per combinazione di qualifiers
  const findVariant = (rowData: Record<string, string>, columnValue: string, columnKey: string): Variant | null => {
    return variants.find(v => {
      // Controlla che tutti i qualifiers della riga corrispondano
      const rowMatch = Object.keys(rowData).every(
        k => String(v.qualifiers[k] || '').trim() === rowData[k].trim()
      );
      // E che il valore della colonna corrisponda
      const colMatch = String(v.qualifiers[columnKey] || '').trim() === columnValue.trim();
      return rowMatch && colMatch;
    }) || null;
  };

  if (!tableStructure || !currentVariant) return null;

  // Estrai tutti i qualifiers disponibili con le loro opzioni
  const qualifierKeys = useMemo(() => {
    const keys = new Set<string>();
    variants.forEach(v => {
      Object.keys(v.qualifiers).forEach(k => keys.add(k));
    });
    return Array.from(keys);
  }, [variants]);

  const qualifierOptions = useMemo(() => {
    const options: Record<string, Set<string>> = {};
    qualifierKeys.forEach(key => {
      options[key] = new Set();
      variants.forEach(v => {
        if (v.qualifiers[key]) {
          options[key].add(String(v.qualifiers[key]));
        }
      });
    });
    return options;
  }, [qualifierKeys, variants]);

  // Gestisci selezione di un valore di qualifier
  const handleQualifierSelect = (qualifierKey: string, value: string) => {
    if (!currentVariant) return;

    // Aggiorna la selezione corrente
    const newSelection = { ...currentSelection, [qualifierKey]: value };
    setCurrentSelection(newSelection);

    // Trova variante che matcha la nuova selezione completa
    const targetVariant = variants.find(v => {
      return Object.entries(newSelection).every(([key, val]) => {
        const variantValue = String(v.qualifiers[key] || '').trim();
        const selectionValue = String(val || '').trim();
        return variantValue.toLowerCase() === selectionValue.toLowerCase();
      });
    });

    if (targetVariant && targetVariant.codice !== currentCode) {
      // Se c'è un callback, chiamalo invece di navigare
      if (onVariantChange) {
        onVariantChange(targetVariant.codice);
      } else {
        router.push(`/products/${targetVariant.codice}`);
      }
    }
  };

  // Colori per i pulsanti (ciclo attraverso colori diversi)
  const getColorClass = (index: number, isSelected: boolean) => {
    const colors = [
      { normal: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200', selected: 'bg-blue-600 text-white border-blue-600' },
      { normal: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200', selected: 'bg-green-600 text-white border-green-600' },
      { normal: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200', selected: 'bg-purple-600 text-white border-purple-600' },
      { normal: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200', selected: 'bg-orange-600 text-white border-orange-600' },
      { normal: 'bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200', selected: 'bg-pink-600 text-white border-pink-600' },
    ];
    const colorSet = colors[index % colors.length];
    return isSelected ? colorSet.selected : colorSet.normal;
  };

  // Render compatto con gallery di varianti GRANDE per mobile
  if (compact) {
    return (
      <div>
        <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
          {getLabel('variants.select', lang)}
        </p>
        <div className="flex gap-3 overflow-x-auto py-2 pb-3 -mx-3 px-3 scrollbar-thin scrollbar-thumb-gray-300">
          {variants.map((variant) => {
            const isSelected = variant.codice === currentCode;

            // Costruisci il testo descrittivo della variante
            const variantDescription = Object.entries(variant.qualifiers)
              .map(([key, value]) => getAttributeValue(key, String(value)))
              .join(' • ');

            return (
              <div
                key={variant.codice}
                onClick={() => {
                  // Cambia variante (il pulsante foto gestisce l'apertura gallery)
                  if (!isSelected) {
                    if (onVariantChange) {
                      onVariantChange(variant.codice);
                    } else {
                      router.push(`/products/${variant.codice}`);
                    }
                  }
                }}
                className={`relative flex-shrink-0 w-44 transition-all duration-200 cursor-pointer ${
                  isSelected ? 'scale-105' : 'active:scale-95'
                }`}
              >
                {/* Foto variante - PIÙ GRANDE */}
                <div className={`relative aspect-[4/3] rounded-xl overflow-hidden mb-2 transition-all ${
                  isSelected
                    ? 'bg-green-50 border-4 border-green-600 ring-4 ring-green-200 shadow-2xl'
                    : 'bg-gray-100 border-2 border-gray-300 hover:border-gray-400 shadow-md'
                }`}>
                  <Image
                    src={variant.immagini?.[0] || variant.immagine || '/placeholder.png'}
                    alt={variantDescription}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 768px) 176px, 176px"
                    priority={isSelected}
                    loading={isSelected ? 'eager' : 'lazy'}
                  />

                  {/* Check icon se selezionata */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white z-10">
                      <svg className="w-3.5 h-3.5 text-white font-bold" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Pulsante Gallery Foto - sempre visibile se ci sono foto */}
                  {variant.immagini && variant.immagini.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Previeni il click sulla card
                        if (onOpenGallery) {
                          onOpenGallery(variant.immagini!);
                        }
                      }}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 transition-all hover:scale-105 z-10 shadow-lg"
                    >
                      📷 {variant.immagini.length}
                    </button>
                  )}
                </div>

                {/* Testo descrittivo - PIÙ LEGGIBILE */}
                <div className={`text-left px-1 ${isSelected ? 'bg-green-50 border-2 border-green-600 rounded-lg p-2 -mt-1' : ''}`}>
                  <p className={`text-[11px] leading-snug font-bold mb-1 line-clamp-2 ${
                    isSelected ? 'text-green-800' : 'text-gray-800'
                  }`}>
                    {variantDescription}
                  </p>
                  <p className={`text-[10px] font-mono font-semibold ${
                    isSelected ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {variant.codice}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render normale con pulsanti per desktop
  return (
    <div className="space-y-3">
      {/* Card Configuratore */}
      <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {getLabel('variants.select', lang)}
        </h3>

        {/* PARTE 1: Pulsanti per qualifier - Ultra-compatti */}
        <div className="space-y-2 sm:space-y-3">
          {qualifierKeys.map((qualifierKey, keyIndex) => {
            const options = Array.from(qualifierOptions[qualifierKey]);
            const currentValue = String(currentVariant.qualifiers[qualifierKey] || '');

            return (
              <div key={qualifierKey}>
                <p className="text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  {getAttributeLabel(qualifierKey)}:
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {options.map((optionValue) => {
                    const isSelected = optionValue === currentValue;
                    const isAvailable = isOptionAvailable(qualifierKey, optionValue);

                    return (
                      <button
                        key={optionValue}
                        onClick={() => isAvailable && handleQualifierSelect(qualifierKey, optionValue)}
                        disabled={!isAvailable}
                        className={`relative px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 font-medium text-xs sm:text-sm transition-all ${
                          !isAvailable
                            ? 'opacity-40 cursor-not-allowed border-dashed bg-gray-50 text-gray-400'
                            : isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                        }`}
                        title={!isAvailable ? getLabel('variants.not_available', lang) || 'Combinazione non disponibile' : undefined}
                      >
                        {isSelected && (
                          <svg className="absolute -top-1 -right-1 w-3.5 h-3.5 text-emerald-600 bg-white rounded-full" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {getAttributeValue(qualifierKey, optionValue)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Riepilogo configurazione - Nascondi su mobile per risparmiare spazio */}
        <div className="hidden sm:block mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {getLabel('variants.selected_config', lang) || 'Configurazione'}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {Object.entries(currentVariant.qualifiers)
                  .map(([k, v]) => getAttributeValue(k, String(v)))
                  .join(' • ')}
              </p>
              <p className="text-xs text-gray-500 font-mono mt-1">
                {getLabel('product.code', lang)} {currentVariant.codice}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
