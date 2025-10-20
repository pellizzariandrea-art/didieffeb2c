'use client';

// components/ProductCatalog.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@/types/product';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import CategoryBar from './CategoryBar';
import FilterSidebar from './FilterSidebar';
import LanguageSelector from './LanguageSelector';
import CartIcon from './CartIcon';
import WishlistIcon from './WishlistIcon';
import RecentlyViewedCarousel from './RecentlyViewedCarousel';
import SearchAutocomplete from './SearchAutocomplete';
import { getLabel } from '@/lib/ui-labels';
import { formatAttributeValue } from '@/lib/product-utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProductNavigation } from '@/contexts/ProductNavigationContext';

// Helper per tradurre valori booleani
const translateBooleanValue = (value: string, lang: string): string => {
  const normalizedValue = value.toLowerCase().trim();
  if (normalizedValue === '1' || normalizedValue === 'true') {
    return getLabel('filters.boolean.yes', lang) || 'Sì';
  }
  if (normalizedValue === '0' || normalizedValue === 'false') {
    return getLabel('filters.boolean.no', lang) || 'No';
  }
  return value;
};

interface Category {
  field: string;
  label: string;
  translations: Record<string, string>;
  icon?: string;
  image?: string; // URL immagine categoria
  color?: string;
  description?: string;
  count?: number;
}

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  filters: Array<{ key: string; values: string[]; type?: string }>;
}

export default function ProductCatalog({
  products,
  categories,
  filters,
}: ProductCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentLang } = useLanguage();
  const { setNavigationProducts, saveCatalogState, getCatalogState, clearCatalogState } = useProductNavigation();

  // Funzione per "esplodere" le varianti: trasforma prodotti raggruppati in varianti separate
  const explodeVariants = (products: Product[]): Product[] => {
    const exploded: Product[] = [];

    products.forEach(product => {
      // Se il prodotto ha varianti, crea una card per ogni variante
      if (product.variants && product.variants.length > 0) {
        const totalVariants = product.variants.length;

        product.variants.forEach((variant, index) => {
          exploded.push({
            ...product, // Mantieni dati del master (nome base, descrizione base, ecc.)
            codice: variant.codice, // Sovrascrivi con codice variante
            prezzo: variant.prezzo, // Sovrascrivi con prezzo variante
            immagine: variant.immagine, // Sovrascrivi con immagine variante
            immagini: variant.immagini, // Sovrascrivi con gallery variante
            attributi: variant.attributi || product.attributi, // Usa attributi variante se presenti
            // Mantieni riferimento al gruppo originale
            variantGroupId: product.variantGroupId,
            isVariantGroup: false, // Non è più un gruppo, è una variante singola
            variantOrder: variant.variantOrder || index + 1,
            variantGroupTotal: totalVariants, // Numero totale di varianti nel gruppo
            variantQualifiers: variant.qualifiers, // Qualificatori specifici di questa variante
            variants: undefined, // Rimuovi l'array variants per evitare confusione
          });
        });
      } else {
        // Prodotto senza varianti, aggiungilo così com'è
        exploded.push(product);
      }
    });

    return exploded;
  };

  // Applica l'esplosione delle varianti a tutti i prodotti
  const expandedProducts = useMemo(() => explodeVariants(products), [products]);

  // Debug: verifica categorie (client-side)
  useEffect(() => {
    console.log('=== PRODUCT CATALOG DEBUG ===');
    console.log('Categories received:', categories);
    console.log('Categories count:', categories.length);
    categories.forEach(c => {
      console.log(`  - ${c.label}:`);
      console.log(`    field: ${c.field}`);
      console.log(`    image: ${c.image}`);
      console.log(`    icon: ${c.icon}`);
    });
  }, []); // Solo al mount

  // Funzione per leggere i filtri dall'URL
  const getFiltersFromURL = () => {
    const filters: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('f_')) {
        const filterKey = key.substring(2); // Rimuovi prefisso "f_"
        filters[filterKey] = value.split(',');
      }
    });
    return filters;
  };

  // Inizializza lo stato dai parametri URL (o valori di default)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('price-asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Al mount, prova a ripristinare lo stato salvato dal localStorage (solo una volta)
  useEffect(() => {
    const savedState = getCatalogState();
    if (savedState) {
      console.log('📥 Restoring saved catalog state from localStorage', savedState);
      setSearchQuery(savedState.searchQuery || '');
      setSelectedFilters(savedState.selectedFilters || {});
      setIsInitialized(true);
      // Scroll alla posizione salvata
      if (savedState.scrollPosition > 0) {
        setTimeout(() => window.scrollTo(0, savedState.scrollPosition), 100);
      }
      // Pulisci il localStorage DOPO che i filtri sono stati applicati
      // Usiamo un timeout per assicurarci che lo stato sia stato sincronizzato
      setTimeout(() => {
        console.log('🧹 Clearing saved catalog state');
        clearCatalogState();
      }, 500);
    } else {
      console.log('🔄 Reading from URL (no saved state)');
      setSelectedCategory(searchParams.get('category') || null);
      setSelectedFilters(getFiltersFromURL());
      setCurrentPage(parseInt(searchParams.get('page') || '1', 10));
      setItemsPerPage(parseInt(searchParams.get('perPage') || '12', 10));
      setViewMode((searchParams.get('view') as 'grid' | 'list') || 'grid');
      setSortBy(searchParams.get('sort') || 'price-asc');
      setSearchQuery(searchParams.get('q') || '');
      setIsInitialized(true);
    }
    // Simula loading iniziale per mostrare skeleton
    setTimeout(() => setIsLoading(false), 800);
  }, []); // Esegui solo al mount iniziale

  // Funzione per aggiornare l'URL (chiamata manualmente quando cambia lo stato)
  const syncURLWithState = () => {
    if (!isInitialized) {
      console.log('⏸️ Sync skipped: not initialized yet');
      return;
    }

    const params = new URLSearchParams();

    // Aggiungi categoria
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }

    // Aggiungi filtri
    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(`f_${key}`, values.join(','));
      }
    });

    // Aggiungi altri parametri solo se diversi dai default
    if (currentPage !== 1) params.set('page', String(currentPage));
    if (itemsPerPage !== 12) params.set('perPage', String(itemsPerPage));
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (sortBy !== 'price-asc') params.set('sort', sortBy);
    if (searchQuery) params.set('q', searchQuery);

    // Aggiorna l'URL
    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    console.log('💾 Syncing state to URL:', newURL);
    router.replace(newURL, { scroll: false });
  };

  // Sincronizza URL quando lo stato cambia (solo dopo l'inizializzazione)
  useEffect(() => {
    syncURLWithState();
  }, [selectedCategory, selectedFilters, currentPage, itemsPerPage, viewMode, sortBy, searchQuery, isInitialized]);

  // Helper per ottenere valore tradotto
  const getTranslatedValue = (value: any, lang: string): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      return value[lang] || value['it'] || Object.values(value)[0] || '';
    }
    return String(value);
  };

  // Funzione per normalizzare testo (rimuove accenti, lowercase, trim)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
      .replace(/[^\w\s]/g, ' ') // Sostituisce punteggiatura con spazi
      .trim();
  };

  // Calcola score di rilevanza per la ricerca
  // SUPPORTA PREFISSI: usa includes() invece di regex per trovare sottostringhe
  const calculateSearchScore = (product: Product, searchTerms: string[]): number => {
    if (searchTerms.length === 0) return 0;

    let score = 0;

    // Prepara campi normalizzati
    const codice = normalizeText(product.codice);
    const nome = normalizeText(getTranslatedValue(product.nome, currentLang));
    const descrizione = product.descrizione
      ? normalizeText(getTranslatedValue(product.descrizione, currentLang))
      : '';
    const attributi = Object.values(product.attributi || {})
      .filter(v => v != null) // Filtra valori null/undefined
      .map(v => normalizeText(formatAttributeValue(v, currentLang)))
      .join(' ');

    searchTerms.forEach(term => {
      // Codice esatto match (massima priorità)
      if (codice === term) {
        score += 1000;
        return;
      }

      // Codice contiene termine (come sottostringa)
      if (codice.includes(term)) {
        // Conta le occorrenze manualmente
        let count = 0;
        let pos = 0;
        while ((pos = codice.indexOf(term, pos)) !== -1) {
          count++;
          pos += term.length;
        }
        score += 100 * count;
        // Bonus se inizia con il termine
        if (codice.startsWith(term)) score += 50;
      }

      // Nome contiene termine (come sottostringa)
      if (nome.includes(term)) {
        let count = 0;
        let pos = 0;
        while ((pos = nome.indexOf(term, pos)) !== -1) {
          count++;
          pos += term.length;
        }
        score += 50 * count;
        // Bonus se inizia con il termine
        if (nome.startsWith(term)) score += 25;
      }

      // Descrizione contiene termine (come sottostringa)
      if (descrizione.includes(term)) {
        let count = 0;
        let pos = 0;
        while ((pos = descrizione.indexOf(term, pos)) !== -1) {
          count++;
          pos += term.length;
        }
        score += 20 * count;
      }

      // Attributi contengono termine (come sottostringa)
      if (attributi.includes(term)) {
        let count = 0;
        let pos = 0;
        while ((pos = attributi.indexOf(term, pos)) !== -1) {
          count++;
          pos += term.length;
        }
        score += 10 * count;
      }
    });

    return score;
  };

  // Filtra prodotti in base a ricerca, categoria e filtri
  // Separa in risultati "stretti" (AND 100%) e "suggeriti" (50%)
  const { filteredProducts, suggestedProducts } = useMemo(() => {
    // Prepara termini di ricerca
    const searchTerms = searchQuery
      ? normalizeText(searchQuery)
          .split(/[\s,]+/)
          .filter(t => t.length > 0) // Accetta tutti i termini, anche numeri singoli
      : [];

    // Funzione per calcolare match percentage
    // SUPPORTA PREFISSI: "borc" trova "borchia"
    const getMatchPercentage = (product: Product): number => {
      if (searchTerms.length === 0) return 1.0; // 100% se non c'è ricerca

      // Costruisci un array di campi testuali separati (non join!)
      const searchableFields = [
        normalizeText(product.codice),
        normalizeText(getTranslatedValue(product.nome, currentLang)),
        product.descrizione ? normalizeText(getTranslatedValue(product.descrizione, currentLang)) : '',
        ...Object.values(product.attributi || {})
          .filter(v => v != null)
          .map(v => normalizeText(formatAttributeValue(v, currentLang)))
      ];

      // Conta quanti termini di ricerca sono presenti (come sottostringa in ALMENO UN campo)
      const matchingTerms = searchTerms.filter(term => {
        // Cerca il termine in almeno uno dei campi
        return searchableFields.some(field => field.includes(term));
      });

      return matchingTerms.length / searchTerms.length;
    };

    // Applica filtri e categoria
    const applyFilters = (product: Product): boolean => {
      // Filtro per categoria (le categorie sono attributi booleani)
      if (selectedCategory) {
        const categoryAttr = product.attributi?.[selectedCategory];
        if (!categoryAttr) return false;

        // Estrai il valore booleano
        const categoryValue = typeof categoryAttr === 'object' && 'value' in categoryAttr
          ? categoryAttr.value
          : categoryAttr;

        // Il prodotto deve avere questo attributo = true
        if (categoryValue !== true && categoryValue !== 'true' && categoryValue !== 1 && categoryValue !== '1') {
          return false;
        }
      }

      // Filtro per attributi
      for (const [filterKey, filterValues] of Object.entries(selectedFilters)) {
        if (filterValues.length === 0) continue;

        // Gestione filtro range (prezzo)
        if (filterKey === 'prezzo' && filterValues[0]?.includes('-')) {
          const [minStr, maxStr] = filterValues[0].split('-');
          const min = parseFloat(minStr);
          const max = parseFloat(maxStr);
          const productPrice = product.prezzo;

          if (productPrice < min || productPrice > max) return false;
          continue;
        }

        const productValue = product.attributi?.[filterKey];
        if (!productValue) return false;

        const strValue = formatAttributeValue(productValue, 'it').trim();
        if (!filterValues.includes(strValue)) return false;
      }

      return true;
    };

    // Processa tutti i prodotti (varianti esplose)
    const strictResults: Array<{ product: Product; score: number }> = [];
    const relaxedResults: Array<{ product: Product; score: number }> = [];

    expandedProducts.forEach(product => {
      // Applica filtri di categoria e attributi
      if (!applyFilters(product)) return;

      // Calcola match percentage e score
      const matchPercentage = getMatchPercentage(product);
      const score = searchTerms.length > 0 ? calculateSearchScore(product, searchTerms) : 0;

      // Se c'è ricerca attiva, categorizza
      if (searchTerms.length > 0) {
        if (matchPercentage === 1.0) {
          // Risultati stretti: TUTTI i termini presenti
          strictResults.push({ product, score });
        } else if (matchPercentage >= 0.5) {
          // Risultati suggeriti: almeno 50% dei termini
          relaxedResults.push({ product, score });
        }
        // Altrimenti ignora (meno del 50%)
      } else {
        // Nessuna ricerca: tutto va nei risultati stretti
        strictResults.push({ product, score });
      }
    });

    // Ordina per score (più rilevante prima) se c'è ricerca
    if (searchTerms.length > 0) {
      strictResults.sort((a, b) => b.score - a.score);
      relaxedResults.sort((a, b) => b.score - a.score);
    }

    return {
      filteredProducts: strictResults.map(r => r.product),
      suggestedProducts: relaxedResults.map(r => r.product)
    };
  }, [expandedProducts, selectedCategory, selectedFilters, currentLang, searchQuery]);

  // Reset pagina quando cambiano filtri o categoria
  const resetPage = () => setCurrentPage(1);

  // Applica ordinamento ai prodotti filtrati
  // UNISCE risultati esatti + suggerimenti (mostrando SEMPRE prima gli esatti)
  const sortedProducts = useMemo(() => {
    // Ordina separatamente i risultati esatti e i suggerimenti
    const sortFunction = (a: Product, b: Product) => {
      switch (sortBy) {
        case 'price-asc':
          return a.prezzo - b.prezzo;
        case 'price-desc':
          return b.prezzo - a.prezzo;
        case 'name-asc': {
          const nameA = getTranslatedValue(a.nome, currentLang).toLowerCase();
          const nameB = getTranslatedValue(b.nome, currentLang).toLowerCase();
          return nameA.localeCompare(nameB);
        }
        case 'name-desc': {
          const nameA = getTranslatedValue(a.nome, currentLang).toLowerCase();
          const nameB = getTranslatedValue(b.nome, currentLang).toLowerCase();
          return nameB.localeCompare(nameA);
        }
        case 'code-asc':
          return a.codice.localeCompare(b.codice);
        case 'code-desc':
          return b.codice.localeCompare(a.codice);
        default:
          return 0;
      }
    };

    // Ordina i due gruppi separatamente
    const sortedExact = [...filteredProducts].sort(sortFunction);
    const sortedSuggested = [...suggestedProducts].sort(sortFunction);

    // SEMPRE esatti prima, poi suggerimenti
    return [...sortedExact, ...sortedSuggested];
  }, [filteredProducts, suggestedProducts, sortBy, currentLang]);

  // Flag per sapere se stiamo mostrando suggerimenti invece di risultati esatti
  const showingSuggestionsAsResults = useMemo(() => {
    return searchQuery && filteredProducts.length === 0 && suggestedProducts.length > 0;
  }, [searchQuery, filteredProducts.length, suggestedProducts.length]);

  // Update navigation context with sorted products when they change
  useEffect(() => {
    setNavigationProducts(sortedProducts);
  }, [sortedProducts, setNavigationProducts]);

  // Salva lo stato del catalogo quando l'utente sta per navigare verso un prodotto
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCatalogState({
        searchQuery,
        selectedFilters,
        scrollPosition: window.scrollY,
      });
    };

    // Intercetta i click sui link dei prodotti
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/products/"]');
      if (link) {
        console.log('💾 Saving catalog state before navigation');
        saveCatalogState({
          searchQuery,
          selectedFilters,
          scrollPosition: window.scrollY,
        });
      }
    };

    document.addEventListener('click', handleLinkClick);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('click', handleLinkClick);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [searchQuery, selectedFilters, saveCatalogState]);

  // Calcola paginazione
  // Se c'è un prodotto selezionato, escludilo dai risultati paginati (verrà mostrato separatamente in cima)
  const productsForPagination = selectedProduct
    ? sortedProducts.filter(p => p.codice !== selectedProduct.codice)
    : sortedProducts;

  const totalPages = Math.ceil(productsForPagination.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = productsForPagination.slice(startIndex, endIndex);

  // Calcola filtri disponibili dinamicamente (solo opzioni che hanno almeno 1 prodotto)
  const dynamicFilters = useMemo(() => {
    return filters.map(filter => {
      // Per ogni filtro, calcola quali valori sono disponibili
      // considerando gli altri filtri già selezionati (ma non questo)
      const availableValues = new Set<string>();
      const valueCounts = new Map<string, number>(); // NEW: Conta prodotti per valore
      const availableOptions: any[] = [];

      // Filtra prodotti escludendo solo il filtro corrente
      const productsForThisFilter = products.filter(product => {
        // Applica filtro categoria (le categorie sono attributi booleani)
        if (selectedCategory) {
          const categoryAttr = product.attributi?.[selectedCategory];
          if (!categoryAttr) return false;

          const categoryValue = typeof categoryAttr === 'object' && 'value' in categoryAttr
            ? categoryAttr.value
            : categoryAttr;

          if (categoryValue !== true && categoryValue !== 'true' && categoryValue !== 1 && categoryValue !== '1') {
            return false;
          }
        }

        // Applica tutti gli ALTRI filtri (non quello corrente)
        for (const [filterKey, filterValues] of Object.entries(selectedFilters)) {
          if (filterKey === filter.key) continue; // Skip filtro corrente
          if (filterValues.length === 0) continue;

          // Gestione filtro range (prezzo)
          if (filterKey === 'prezzo' && filterValues[0]?.includes('-')) {
            const [minStr, maxStr] = filterValues[0].split('-');
            const min = parseFloat(minStr);
            const max = parseFloat(maxStr);
            const productPrice = product.prezzo;
            if (productPrice < min || productPrice > max) return false;
            continue;
          }

          const productValue = product.attributi?.[filterKey];
          if (!productValue) return false;
          const strValue = formatAttributeValue(productValue, 'it').trim();
          if (!filterValues.includes(strValue)) return false;
        }

        return true;
      });

      // Estrai valori disponibili da questi prodotti
      if (filter.type === 'range') {
        // Per range, calcola min/max effettivi
        const prices = productsForThisFilter.map(p => p.prezzo).filter(p => p != null);
        if (prices.length > 0) {
          return {
            ...filter,
            min: Math.min(...prices),
            max: Math.max(...prices),
            availableCount: prices.length
          };
        }
        return { ...filter, availableCount: 0 };
      }

      // Per altri tipi di filtro, raccogli valori unici DISPONIBILI e contali
      productsForThisFilter.forEach(product => {
        const productValue = product.attributi?.[filter.key];
        if (!productValue) return;

        const italianValue = formatAttributeValue(productValue, 'it').trim();
        availableValues.add(italianValue);

        // NEW: Incrementa il contatore per questo valore
        valueCounts.set(italianValue, (valueCounts.get(italianValue) || 0) + 1);
      });

      // Ritorna filtro con informazioni su valori disponibili
      // MANTENIAMO le opzioni e i values originali, aggiungiamo availableValues e valueCounts
      return {
        ...filter,
        availableValues: Array.from(availableValues),
        availableCount: availableValues.size,
        valueCounts: Object.fromEntries(valueCounts) // NEW: Converti Map in oggetto
      };
    });
  }, [filters, products, selectedCategory, selectedFilters, currentLang]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header Moderno */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
          {/* Prima riga: Titolo e Language Selector */}
          <div className="flex items-center justify-between gap-3 sm:gap-6 mb-3 lg:mb-0">
            <div className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                {getLabel('home.title', currentLang)}
              </h1>
              <p className="text-gray-500 mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium">
                {getLabel('home.products_count', currentLang, { count: products.length })}
              </p>
            </div>

            {/* Wishlist, Cart, and Language Selector */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <WishlistIcon />
              <CartIcon />
              <LanguageSelector />
            </div>
          </div>

          {/* Seconda riga: Search Bar (full width su mobile) */}
          <div className="w-full lg:max-w-2xl lg:mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  resetPage();
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                placeholder={getLabel('home.search', currentLang)}
                className="w-full px-4 sm:px-5 py-2.5 sm:py-3 pl-10 sm:pl-12 pr-10 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
              />
              <svg
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    resetPage();
                    setShowAutocomplete(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Dropdown Autocomplete */}
              <SearchAutocomplete
                searchQuery={searchQuery}
                products={expandedProducts}
                categories={categories}
                currentLang={currentLang}
                onSelect={(productCode) => {
                  // Trova il prodotto selezionato e mostralo in cima ai risultati
                  const product = expandedProducts.find(p => p.codice === productCode);
                  if (product) {
                    setSelectedProduct(product);
                    setShowAutocomplete(false);
                    // MANTIENI la searchQuery attiva per mostrare i risultati correlati
                    // La query è già impostata, non fare nulla
                    // Scroll in alto per mostrare il prodotto selezionato
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                onSearchSubmit={(query) => {
                  setSearchQuery(query);
                  setShowAutocomplete(false);
                  // Reset prodotto selezionato quando si fa una nuova ricerca
                  setSelectedProduct(null);
                }}
                isVisible={showAutocomplete}
                onClose={() => setShowAutocomplete(false)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Category Bar */}
      {categories.length > 0 && (
        <CategoryBar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          lang={currentLang}
        />
      )}

      {/* Main Content with Sidebar */}
      <main className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar Filtri - DESKTOP */}
          {filters.length > 0 && (
            <>
              {/* Desktop Sidebar */}
              <aside className="w-80 flex-shrink-0 hidden xl:block">
                <div className="sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto">
                  <FilterSidebar
                    filters={dynamicFilters.map(f => ({
                      key: f.key,
                      values: f.values,
                      availableValues: (f as any).availableValues,
                      options: (f as any).options,
                      type: f.type as 'checkbox' | 'tags' | 'select' | 'range' | undefined,
                      min: (f as any).min,
                      max: (f as any).max,
                      availableCount: (f as any).availableCount,
                      valueCounts: (f as any).valueCounts,
                    }))}
                    selectedFilters={selectedFilters}
                    onFiltersChange={setSelectedFilters}
                    lang={currentLang}
                  />
                </div>
              </aside>

              {/* Mobile Sidebar - Overlay */}
              {isMobileFiltersOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-50 xl:hidden"
                  onClick={() => setIsMobileFiltersOpen(false)}
                >
                  <aside
                    className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header Mobile */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                      <h3 className="text-lg font-bold text-gray-900">{getLabel('filters.title', currentLang)}</h3>
                      <button
                        onClick={() => setIsMobileFiltersOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Sidebar Content */}
                    <div className="p-6">
                      <FilterSidebar
                        filters={dynamicFilters.map(f => ({
                          key: f.key,
                          values: f.values,
                          availableValues: (f as any).availableValues,
                          options: (f as any).options,
                          type: f.type as 'checkbox' | 'tags' | 'select' | 'range' | undefined,
                          min: (f as any).min,
                          max: (f as any).max,
                          availableCount: (f as any).availableCount,
                          valueCounts: (f as any).valueCounts,
                        }))}
                        selectedFilters={selectedFilters}
                        onFiltersChange={setSelectedFilters}
                        lang={currentLang}
                      />
                    </div>
                  </aside>
                </div>
              )}
            </>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar - Contatore e controlli */}
            <div className="space-y-4 mb-6">
              {/* Prima riga: Contatore e controlli visualizzazione */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl px-4 sm:px-6 py-4 shadow-sm border border-gray-100">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  {/* Pulsante Filtri Mobile */}
                  {filters.length > 0 && (
                    <button
                      onClick={() => setIsMobileFiltersOpen(true)}
                      className="xl:hidden flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span className="text-sm font-semibold">{getLabel('filters.title', currentLang)}</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span className="text-sm font-bold text-gray-900">
                      {sortedProducts.length}
                    </span>
                    <span className="text-sm text-gray-600">
                      {sortedProducts.length === 1
                        ? getLabel('home.product', currentLang)
                        : getLabel('home.products', currentLang)}
                    </span>
                  </div>

                  {/* Separator - Hidden on mobile */}
                  <div className="hidden sm:block h-6 w-px bg-gray-300"></div>

                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 hidden sm:inline">{getLabel('home.show', currentLang)}:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="text-sm text-gray-900 border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                      <option value={96}>96</option>
                    </select>
                  </div>

                  {/* Separator - Hidden on mobile */}
                  <div className="hidden sm:block h-6 w-px bg-gray-300"></div>

                  {/* Sort selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 hidden sm:inline">{getLabel('home.sort_by', currentLang)}:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-sm text-gray-900 border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="price-asc">{getLabel('home.sort.price_asc', currentLang)}</option>
                      <option value="price-desc">{getLabel('home.sort.price_desc', currentLang)}</option>
                      <option value="name-asc">{getLabel('home.sort.name_asc', currentLang)}</option>
                      <option value="name-desc">{getLabel('home.sort.name_desc', currentLang)}</option>
                      <option value="code-asc">{getLabel('home.sort.code_asc', currentLang)}</option>
                      <option value="code-desc">{getLabel('home.sort.code_desc', currentLang)}</option>
                    </select>
                  </div>
                </div>

                {/* View mode toggle */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 ml-auto sm:ml-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white shadow-sm text-emerald-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Vista griglia"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list'
                        ? 'bg-white shadow-sm text-emerald-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Vista lista"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Seconda riga: Active filters chips */}
              {(selectedCategory || Object.entries(selectedFilters).some(([_, values]) => values.length > 0)) && (
                <div className="flex items-center gap-2 flex-wrap bg-white rounded-xl px-6 py-3 shadow-sm border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{getLabel('home.active_filters', currentLang)}</span>

                  {/* Categoria selezionata */}
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200">
                      {categories.find(c => c.field === selectedCategory)?.translations[currentLang] || selectedCategory}
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          resetPage();
                        }}
                        className="hover:text-emerald-900"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}

                  {/* Filtri attributi */}
                  {Object.entries(selectedFilters).map(([key, values]) =>
                    values.map((value) => {
                      // Trova il filtro corrispondente
                      const filter = dynamicFilters.find(f => f.key === key);

                      // Ottieni label tradotta del filtro
                      let filterLabel = key;
                      if (filter) {
                        // Se è il filtro prezzo, usa label tradotta
                        if (key === 'prezzo' || key.toLowerCase() === 'price') {
                          filterLabel = getLabel('home.price_label', currentLang);
                        } else if ((filter as any).options && (filter as any).options.length > 0 && (filter as any).options[0].label) {
                          // Se ha options con label tradotta, usala
                          const labelObj = (filter as any).options[0].label;
                          filterLabel = typeof labelObj === 'object' ? (labelObj[currentLang] || labelObj['it'] || Object.values(labelObj)[0]) : key;
                        }
                      }

                      const translatedValue = translateBooleanValue(value, currentLang);

                      return (
                        <span
                          key={`${key}-${value}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200"
                        >
                          {filterLabel}: {translatedValue}
                          <button
                            onClick={() => {
                              const newValues = selectedFilters[key].filter(v => v !== value);
                              setSelectedFilters({
                                ...selectedFilters,
                                [key]: newValues,
                              });
                              resetPage();
                            }}
                            className="hover:text-emerald-900"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Banner di avviso: stiamo mostrando anche prodotti correlati oltre ai risultati esatti */}
            {searchQuery && suggestedProducts.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  {filteredProducts.length > 0 ? (
                    /* Ci sono risultati esatti + suggerimenti */
                    <>
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        {currentLang === 'it' && `Trovati ${filteredProducts.length} risultati esatti per "${searchQuery}"`}
                        {currentLang === 'en' && `Found ${filteredProducts.length} exact results for "${searchQuery}"`}
                        {currentLang === 'de' && `${filteredProducts.length} exakte Ergebnisse für "${searchQuery}" gefunden`}
                        {currentLang === 'fr' && `${filteredProducts.length} résultats exacts trouvés pour "${searchQuery}"`}
                        {currentLang === 'es' && `${filteredProducts.length} resultados exactos encontrados para "${searchQuery}"`}
                        {currentLang === 'pt' && `${filteredProducts.length} resultados exatos encontrados para "${searchQuery}"`}
                      </p>
                      <p className="text-xs text-blue-700">
                        {currentLang === 'it' && `Mostriamo anche ${suggestedProducts.length} prodotti correlati`}
                        {currentLang === 'en' && `Also showing ${suggestedProducts.length} related products`}
                        {currentLang === 'de' && `Zeige auch ${suggestedProducts.length} verwandte Produkte`}
                        {currentLang === 'fr' && `Affiche également ${suggestedProducts.length} produits associés`}
                        {currentLang === 'es' && `También mostrando ${suggestedProducts.length} productos relacionados`}
                        {currentLang === 'pt' && `Também mostrando ${suggestedProducts.length} produtos relacionados`}
                      </p>
                    </>
                  ) : (
                    /* Solo suggerimenti, nessun risultato esatto */
                    <>
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        {currentLang === 'it' && `Nessun risultato esatto per "${searchQuery}"`}
                        {currentLang === 'en' && `No exact results for "${searchQuery}"`}
                        {currentLang === 'de' && `Keine exakten Ergebnisse für "${searchQuery}"`}
                        {currentLang === 'fr' && `Aucun résultat exact pour "${searchQuery}"`}
                        {currentLang === 'es' && `No hay resultados exactos para "${searchQuery}"`}
                        {currentLang === 'pt' && `Nenhum resultado exato para "${searchQuery}"`}
                      </p>
                      <p className="text-xs text-blue-700">
                        {currentLang === 'it' && `Mostriamo ${suggestedProducts.length} prodotti correlati che potrebbero interessarti`}
                        {currentLang === 'en' && `Showing ${suggestedProducts.length} related products that might interest you`}
                        {currentLang === 'de' && `Zeige ${suggestedProducts.length} verwandte Produkte, die Sie interessieren könnten`}
                        {currentLang === 'fr' && `Affichage de ${suggestedProducts.length} produits associés qui pourraient vous intéresser`}
                        {currentLang === 'es' && `Mostrando ${suggestedProducts.length} productos relacionados que podrían interesarte`}
                        {currentLang === 'pt' && `Mostrando ${suggestedProducts.length} produtos relacionados que podem interessar`}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Sezione risultati principali */}
            {sortedProducts.length === 0 ? (
              /* Empty State Moderno - Solo se NON ci sono nemmeno suggerimenti */
              (!searchQuery || suggestedProducts.length === 0) && (
                <div className="text-center py-20 px-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-12 inline-block mb-6">
                    <svg className="w-20 h-20 text-emerald-700 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {getLabel('home.no_products', currentLang)}
                  </h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {getLabel('home.no_products_message', currentLang)}
                  </p>
                </div>
              )
            ) : isLoading ? (
              <>
                {/* Loading Skeletons */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: itemsPerPage }).map((_, idx) => (
                      <ProductCardSkeleton key={idx} viewMode="grid" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.from({ length: itemsPerPage }).map((_, idx) => (
                      <ProductCardSkeleton key={idx} viewMode="list" />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Sezione Prodotto Selezionato */}
                {selectedProduct && (
                  <div className="mb-12 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {currentLang === 'it' && 'Prodotto selezionato'}
                        {currentLang === 'en' && 'Selected product'}
                        {currentLang === 'de' && 'Ausgewähltes Produkt'}
                        {currentLang === 'fr' && 'Produit sélectionné'}
                        {currentLang === 'es' && 'Producto seleccionado'}
                        {currentLang === 'pt' && 'Produto selecionado'}
                      </h2>
                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="text-sm text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {currentLang === 'it' && 'Rimuovi'}
                        {currentLang === 'en' && 'Remove'}
                        {currentLang === 'de' && 'Entfernen'}
                        {currentLang === 'fr' && 'Supprimer'}
                        {currentLang === 'es' && 'Eliminar'}
                        {currentLang === 'pt' && 'Remover'}
                      </button>
                    </div>
                    <div className={viewMode === 'grid' ? 'max-w-sm' : 'w-full'}>
                      <ProductCard
                        product={selectedProduct}
                        lang={currentLang}
                        viewMode={viewMode}
                        priority={true}
                      />
                    </div>
                  </div>
                )}

                {/* Products Grid/List con divisore tra esatti e correlati */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {paginatedProducts.map((product, index) => {
                      // Calcola se questo è il primo prodotto correlato (dopo gli esatti)
                      const isFirstSuggested = searchQuery &&
                        filteredProducts.length > 0 &&
                        suggestedProducts.length > 0 &&
                        index === filteredProducts.length;

                      return (
                        <React.Fragment key={`${product.codice}-${index}`}>
                          {/* Divisore prima del primo prodotto correlato */}
                          {isFirstSuggested && (
                            <div className="col-span-full my-8 border-t-2 border-gray-200 pt-6">
                              <h2 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {currentLang === 'it' && `Prodotti correlati`}
                                {currentLang === 'en' && `Related products`}
                                {currentLang === 'de' && `Verwandte Produkte`}
                                {currentLang === 'fr' && `Produits associés`}
                                {currentLang === 'es' && `Productos relacionados`}
                                {currentLang === 'pt' && `Produtos relacionados`}
                              </h2>
                            </div>
                          )}
                          <ProductCard product={product} lang={currentLang} priority={index === 0} />
                        </React.Fragment>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedProducts.map((product, index) => {
                      // Calcola se questo è il primo prodotto correlato (dopo gli esatti)
                      const isFirstSuggested = searchQuery &&
                        filteredProducts.length > 0 &&
                        suggestedProducts.length > 0 &&
                        index === filteredProducts.length;

                      return (
                        <React.Fragment key={`${product.codice}-${index}`}>
                          {/* Divisore prima del primo prodotto correlato */}
                          {isFirstSuggested && (
                            <div className="my-8 border-t-2 border-gray-200 pt-6">
                              <h2 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {currentLang === 'it' && `Prodotti correlati`}
                                {currentLang === 'en' && `Related products`}
                                {currentLang === 'de' && `Verwandte Produkte`}
                                {currentLang === 'fr' && `Produits associés`}
                                {currentLang === 'es' && `Productos relacionados`}
                                {currentLang === 'pt' && `Produtos relacionados`}
                              </h2>
                            </div>
                          )}
                          <ProductCard product={product} lang={currentLang} viewMode="list" priority={index === 0} />
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                    {/* Previous button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200'
                      }`}
                    >
                      <span className="hidden sm:inline">← {getLabel('home.previous', currentLang)}</span>
                      <span className="sm:hidden">←</span>
                    </button>

                    {/* Page numbers */}
                    <div className="flex gap-1 sm:gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Su mobile mostra solo: 1, current-1, current, current+1, last
                        // Su desktop mostra: 1, current-2, current-1, current, current+1, current+2, last
                        const showOnMobile = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                        const showOnDesktop = page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2);

                        if (showOnDesktop) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                                currentPage === page
                                  ? 'bg-emerald-700 text-white shadow-md'
                                  : 'bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200'
                              } ${!showOnMobile ? 'hidden sm:inline-block' : ''}`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          (page === currentPage - 3 || page === currentPage + 3)
                        ) {
                          return <span key={page} className="px-1 sm:px-2 py-2 text-gray-400 hidden sm:inline">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    {/* Next button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200'
                      }`}
                    >
                      <span className="hidden sm:inline">{getLabel('home.next', currentLang)} →</span>
                      <span className="sm:hidden">→</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Sezione suggerimenti rimossa - ora i suggerimenti vengono mostrati come risultati principali con paginazione completa */}
          </div>
        </div>
      </main>

      {/* Footer Moderno */}
      <footer className="bg-white border-t border-gray-100 mt-20">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm font-medium">
              {getLabel('home.footer', currentLang)}
            </p>
          </div>
        </div>
      </footer>

      {/* Recently Viewed Section */}
      <RecentlyViewedCarousel />
    </div>
  );
}
