'use client';

// components/SearchAutocomplete.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { Product } from '@/types/product';
import { getTranslatedValue } from '@/lib/product-utils';
import { useRouter } from 'next/navigation';
import { getLabel } from '@/lib/ui-labels';
import Image from 'next/image';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { Clock, X, Search, Tag } from 'lucide-react';

interface Category {
  field: string;
  label: string;
  translations: Record<string, string>;
  icon?: string;
  image?: string;
  count?: number;
}

interface SearchAutocompleteProps {
  searchQuery: string;
  products: Product[];
  categories?: Category[];
  currentLang: string;
  variantQualifiers?: string[]; // Nomi degli attributi varianti dalla configurazione
  onSelect: (productCode: string) => void;
  onSearchSubmit?: (query: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function SearchAutocomplete({
  searchQuery,
  products,
  categories = [],
  currentLang,
  variantQualifiers = [],
  onSelect,
  onSearchSubmit,
  isVisible,
  onClose,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useRecentSearches();

  // Normalizza testo per confronto
  const normalizeText = (text: string | Record<string, string> | undefined): string => {
    if (!text) return '';
    const str = typeof text === 'object' ? getTranslatedValue(text, currentLang) : text;
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // Calcola suggerimenti prodotti (top 6 per score) + contatore totale
  // ALLINEATO con la logica di ProductCatalog: separa risultati esatti da suggerimenti
  const { productSuggestions, totalResults, exactResultsCount } = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return { productSuggestions: [], totalResults: 0, exactResultsCount: 0 };

    const searchTerms = normalizeText(searchQuery)
      .split(/[\s,]+/)
      .filter(t => t.length > 0);

    if (searchTerms.length === 0) return { productSuggestions: [], totalResults: 0, exactResultsCount: 0 };

    // Helper: calcola % di termini che matchano (stesso algoritmo di ProductCatalog)
    const getMatchPercentage = (product: Product): number => {
      const codice = normalizeText(product.codice);
      const nome = normalizeText(getTranslatedValue(product.nome, currentLang));
      const descrizione = product.descrizione
        ? normalizeText(getTranslatedValue(product.descrizione, currentLang))
        : '';

      // Campi ricercabili (inclusi attributi)
      const searchableFields = [
        codice,
        nome,
        descrizione,
        ...Object.values(product.attributi || {})
          .filter(v => v != null)
          .map(v => normalizeText(String(v)))
      ];

      // Conta quanti termini matchano
      const matchingTerms = searchTerms.filter(term => {
        return searchableFields.some(field => field.includes(term));
      });

      return matchingTerms.length / searchTerms.length;
    };

    // Calcola score per ogni prodotto
    const scoredProducts = products.map(product => {
      let score = 0;

      const codice = normalizeText(product.codice);
      const nome = normalizeText(getTranslatedValue(product.nome, currentLang));
      const descrizione = product.descrizione
        ? normalizeText(getTranslatedValue(product.descrizione, currentLang))
        : '';

      searchTerms.forEach(term => {
        // Codice match esatto
        if (codice === term) score += 1000;
        // Codice contiene termine
        else if (codice.includes(term)) {
          score += 100;
          if (codice.startsWith(term)) score += 50;
        }

        // Nome contiene termine
        if (nome.includes(term)) {
          score += 50;
          if (nome.startsWith(term)) score += 25;
        }

        // Descrizione contiene termine
        if (descrizione.includes(term)) {
          score += 10;
        }
      });

      return { product, score };
    });

    // Separa risultati esatti (100% match) da suggerimenti (≥50% match)
    const exactMatches: typeof scoredProducts = [];
    const suggestedMatches: typeof scoredProducts = [];

    scoredProducts.forEach(item => {
      if (item.score === 0) return;

      const matchPercentage = getMatchPercentage(item.product);

      if (matchPercentage === 1.0) {
        exactMatches.push(item); // 100% match
      } else if (matchPercentage >= 0.5) {
        suggestedMatches.push(item); // ≥50% match
      }
    });

    // Combina tutti i match (esatti + suggerimenti) e DE-DUPLICA per codice
    const allMatches = [...exactMatches, ...suggestedMatches];
    const uniqueMatches = allMatches.filter((item, index, self) =>
      index === self.findIndex(t => t.product.codice === item.product.codice)
    );

    // Ordina per score e prendi top 6 per i suggerimenti visualizzati
    const topProducts = uniqueMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ product }) => product);

    return {
      productSuggestions: topProducts,
      totalResults: uniqueMatches.length, // Totale UNICO (esatti + suggerimenti de-duplicati)
      exactResultsCount: exactMatches.length // Solo risultati esatti (100% match)
    };
  }, [searchQuery, products, currentLang]);

  // Calcola suggerimenti categorie (max 3)
  const categorySuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2 || !categories.length) return [];

    const searchTerms = normalizeText(searchQuery)
      .split(/[\s,]+/)
      .filter(t => t.length > 0);

    if (searchTerms.length === 0) return [];

    return categories
      .filter(category => {
        const categoryName = normalizeText(category.translations[currentLang] || category.label);
        return searchTerms.some(term => categoryName.includes(term));
      })
      .slice(0, 3);
  }, [searchQuery, categories, currentLang]);

  // Highlight del testo cercato
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const normalizedText = normalizeText(text);
    const searchTerms = normalizeText(query)
      .split(/[\s,]+/)
      .filter(t => t.length > 0);

    let result = text;
    const matches: { start: number; end: number; term: string }[] = [];

    // Trova tutte le posizioni dei match
    searchTerms.forEach(term => {
      let pos = 0;
      while ((pos = normalizedText.indexOf(term, pos)) !== -1) {
        matches.push({
          start: pos,
          end: pos + term.length,
          term,
        });
        pos += term.length;
      }
    });

    // Ordina per posizione e rimuovi sovrapposizioni
    matches.sort((a, b) => a.start - b.start);
    const uniqueMatches = matches.filter((match, i) => {
      if (i === 0) return true;
      const prev = matches[i - 1];
      return match.start >= prev.end;
    });

    // Costruisci JSX con highlight
    if (uniqueMatches.length === 0) return text;

    const parts: JSX.Element[] = [];
    let lastEnd = 0;

    uniqueMatches.forEach((match, i) => {
      // Testo prima del match
      if (match.start > lastEnd) {
        parts.push(
          <span key={`text-${i}`}>{text.substring(lastEnd, match.start)}</span>
        );
      }
      // Testo del match (evidenziato)
      parts.push(
        <span key={`match-${i}`} className="bg-yellow-200 font-semibold">
          {text.substring(match.start, match.end)}
        </span>
      );
      lastEnd = match.end;
    });

    // Testo dopo l'ultimo match
    if (lastEnd < text.length) {
      parts.push(<span key="text-end">{text.substring(lastEnd)}</span>);
    }

    return <>{parts}</>;
  };

  // Seleziona il prodotto (senza navigare, delega al parent)
  const handleSelectProduct = (product: Product) => {
    console.log('[AUTOCOMPLETE] handleSelectProduct called with:', product.codice);
    // Salva la ricerca come recente se c'è una query
    if (searchQuery && searchQuery.trim().length >= 2) {
      addRecentSearch(searchQuery.trim());
    }
    console.log('[AUTOCOMPLETE] Calling onSelect with:', product.codice);
    // Chiama onSelect che gestirà la selezione (mostra prodotto pinnato)
    onSelect(product.codice);
    console.log('[AUTOCOMPLETE] onSelect completed');
  };

  // Gestisce click su ricerca recente
  const handleRecentSearchClick = (query: string) => {
    if (onSearchSubmit) {
      onSearchSubmit(query);
    }
    onClose();
  };

  // Gestisce click su categoria
  const handleCategoryClick = (categoryField: string) => {
    onClose();
    // Naviga alla home con filtro categoria
    router.push(`/?category=${categoryField}`);
  };

  // Naviga ai risultati completi della ricerca
  const handleViewAllResults = () => {
    if (searchQuery && searchQuery.trim().length >= 2) {
      addRecentSearch(searchQuery.trim());
    }
    onClose();
    // Naviga alla pagina prodotti con query
    router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
  };

  // Gestione tastiera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || productSuggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < productSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : productSuggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < productSuggestions.length) {
            // Se c'è un prodotto selezionato, vai al dettaglio
            handleSelectProduct(productSuggestions[selectedIndex]);
          } else if (searchQuery && searchQuery.trim().length >= 2) {
            // Altrimenti vai ai risultati completi
            handleViewAllResults();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, productSuggestions, selectedIndex]);

  // Reset selected index quando cambiano i suggerimenti
  useEffect(() => {
    setSelectedIndex(-1);
  }, [productSuggestions]);

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      // Aggiungi un piccolo delay per evitare che il click di apertura venga catturato
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isVisible, onClose]);

  // Mostra ricerche recenti se non c'è query
  const showRecentSearches = !searchQuery && recentSearches.length > 0;
  // Mostra "nessun risultato" se c'è query ma nessun suggerimento
  const showNoResults = searchQuery.length >= 2 && productSuggestions.length === 0 && categorySuggestions.length === 0;

  if (!isVisible) return null;
  if (!showRecentSearches && !showNoResults && productSuggestions.length === 0 && categorySuggestions.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-[600px] overflow-y-auto"
    >
      {/* Ricerche recenti */}
      {showRecentSearches && (
        <>
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl flex items-center justify-between">
            <p className="text-xs text-gray-600 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {getLabel('search.recent_searches', currentLang)}
            </p>
            <button
              onClick={clearRecentSearches}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              {getLabel('search.clear_all', currentLang)}
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentSearches.map((query, index) => (
              <div key={index} className="flex items-center gap-2 hover:bg-gray-50">
                <button
                  onClick={() => handleRecentSearchClick(query)}
                  className="flex-1 px-4 py-2.5 flex items-center gap-2 text-left"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{query}</span>
                </button>
                <button
                  onClick={() => removeRecentSearch(query)}
                  className="px-3 py-2.5 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Suggerimenti categorie */}
      {categorySuggestions.length > 0 && (
        <>
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-600 font-semibold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              {getLabel('search.categories', currentLang)}
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {categorySuggestions.map((category) => (
              <button
                key={category.field}
                onClick={() => handleCategoryClick(category.field)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-emerald-50 transition-colors text-left"
              >
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.translations[currentLang] || category.label}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg">{category.icon || '📦'}</span>
                )}
                <span className="text-sm font-semibold text-gray-900">
                  {highlightMatch(category.translations[currentLang] || category.label, searchQuery)}
                </span>
                {category.count !== undefined && (
                  <span className="ml-auto text-xs text-gray-500">
                    {category.count} {getLabel('search.products', currentLang)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Suggerimenti prodotti */}
      {productSuggestions.length > 0 && (
        <>
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-600 font-semibold">
              {productSuggestions.length} {getLabel('search.suggestions', currentLang)}
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {productSuggestions.map((product, index) => {
              const nome = getTranslatedValue(product.nome, currentLang);
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={product.codice}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-emerald-50 transition-colors text-left ${
                    isSelected ? 'bg-emerald-100' : ''
                  }`}
                >
                  {/* Immagine prodotto */}
                  <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.immagine ? (
                      <Image
                        src={product.immagine}
                        alt={nome}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info prodotto */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {highlightMatch(nome, searchQuery)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{product.codice}</p>
                    {/* Attributi varianti */}
                    {product.attributi && Object.keys(product.attributi).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {/* Mostra solo gli attributi configurati come qualifiers (varianti) */}
                        {variantQualifiers
                          .filter(key => product.attributi[key])
                          .map(key => {
                            const value = product.attributi[key];
                            let displayValue = '';
                            if (typeof value === 'object' && value !== null && 'value' in value) {
                              const rawValue = (value as any).value;
                              if (typeof rawValue === 'boolean') {
                                return null; // Skip boolean attributes
                              } else if (typeof rawValue === 'object') {
                                displayValue = getTranslatedValue(rawValue, currentLang);
                              } else {
                                displayValue = String(rawValue);
                              }
                            } else if (typeof value === 'boolean') {
                              return null; // Skip boolean attributes
                            } else {
                              displayValue = String(value);
                            }

                            return displayValue ? (
                              <span key={key} className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                {displayValue}
                              </span>
                            ) : null;
                          })}
                      </div>
                    )}
                  </div>

                  {/* Prezzo */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald-600">
                      €{product.prezzo.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  {/* Indicatore selezione tastiera */}
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Nessun risultato */}
      {showNoResults && (
        <div className="px-4 py-8 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            {getLabel('search.no_results', currentLang)}
          </p>
          <p className="text-xs text-gray-500">
            {getLabel('search.try_different', currentLang)}
          </p>
        </div>
      )}

      {/* Bottone "Mostra tutti i risultati" - SOLO DESKTOP (nascosto su mobile per evitare overlap con tastiera) */}
      {totalResults > 0 && searchQuery && searchQuery.length >= 2 && (
        <div className="hidden md:block border-t border-gray-100 p-4">
          <button
            onClick={handleViewAllResults}
            className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            <span>
              {exactResultsCount > 0 ? (
                // Ci sono risultati esatti (100% match) → "Mostra tutti i N risultati"
                <>
                  {currentLang === 'it' && `Mostra tutti i ${totalResults} risultati`}
                  {currentLang === 'en' && `Show all ${totalResults} results`}
                  {currentLang === 'de' && `Alle ${totalResults} Ergebnisse anzeigen`}
                  {currentLang === 'fr' && `Afficher les ${totalResults} résultats`}
                  {currentLang === 'es' && `Mostrar los ${totalResults} resultados`}
                  {currentLang === 'pt' && `Mostrar todos os ${totalResults} resultados`}
                </>
              ) : (
                // Solo suggerimenti (≥50% match) → "Vedi N prodotti correlati"
                <>
                  {currentLang === 'it' && `Vedi ${totalResults} prodotti correlati`}
                  {currentLang === 'en' && `View ${totalResults} related products`}
                  {currentLang === 'de' && `${totalResults} verwandte Produkte anzeigen`}
                  {currentLang === 'fr' && `Voir ${totalResults} produits associés`}
                  {currentLang === 'es' && `Ver ${totalResults} productos relacionados`}
                  {currentLang === 'pt' && `Ver ${totalResults} produtos relacionados`}
                </>
              )}
            </span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Footer suggerimenti - Solo desktop (mobile ha bottone "Cerca" nell'header) */}
      {productSuggestions.length > 0 && (
        <div className="hidden md:block px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 text-center">
            {getLabel('search.keyboard_hint', currentLang)} ·
            <span className="font-semibold"> Enter</span> {currentLang === 'it' ? 'per vedere tutti' : 'to view all'}
          </p>
        </div>
      )}
    </div>
  );
}
