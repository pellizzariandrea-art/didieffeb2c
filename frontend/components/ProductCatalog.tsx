'use client';

// components/ProductCatalog.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import CategoryBar from './CategoryBar';
import FilterSidebar from './FilterSidebar';
import LanguageSelector from './LanguageSelector';
import CartIcon from './CartIcon';
import WishlistIcon from './WishlistIcon';
import UserIcon from './UserIcon';
import RecentlyViewedCarousel from './RecentlyViewedCarousel';
import SearchAutocomplete from './SearchAutocomplete';
import WizardSearch from './WizardSearch';
import { getLabel } from '@/lib/ui-labels';
import { formatAttributeValue, getTranslatedValue } from '@/lib/product-utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProductNavigation } from '@/contexts/ProductNavigationContext';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { getCatalogText, getCatalogTextFn, Language } from '@/lib/catalog-translations';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowUp, ChevronDown, Sparkles, Settings, LogOut } from 'lucide-react';
import uiLabels from '@/config/ui-labels.json';

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

interface SettingsResponse {
  success: boolean;
  settings: {
    company: {
      name: string;
    };
    logo?: {
      base64: string;
      type: string;
    };
  };
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
  const { user, logout } = useAuth();
  const { setNavigationProducts, saveCatalogState, getCatalogState, clearCatalogState } = useProductNavigation();
  const { trackSearch, trackFilter } = useAnalyticsStore();
  const labels = uiLabels.auth;

  // Settings per logo
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Load company settings per logo
  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setIsLoadingSettings(false);
      })
      .catch(err => {
        console.error('Error loading settings:', err);
        setIsLoadingSettings(false);
      });
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Load More function with analytics
  const loadMore = () => {
    setVisibleCount(prev => prev + 24);
    // Track Load More click in analytics (custom event)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'load_more_click', {
        current_count: visibleCount,
        remaining: remainingCount
      });
    }
  };

  // Reset visible count when filters/search change
  const resetVisibleCount = () => setVisibleCount(24);

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
    const systemParams = ['q', 'category', 'view', 'sort', 'page']; // Parametri riservati al sistema

    // 1. Leggi parametri con prefisso f_ (formato complesso)
    searchParams.forEach((value, key) => {
      if (key.startsWith('f_')) {
        const filterKey = key.substring(2); // Rimuovi prefisso "f_"
        filters[filterKey] = value.split(',');
      }
    });

    // 2. Se non ci sono filtri con prefisso, leggi parametri diretti (formato semplice)
    // Questo permette link tipo /products?Serie=Giotto che resettano tutto il resto
    if (Object.keys(filters).length === 0) {
      searchParams.forEach((value, key) => {
        if (!systemParams.includes(key)) {
          filters[key] = value.split(',');
        }
      });
    }

    return filters;
  };

  // Inizializza lo stato dai parametri URL (o valori di default)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [visibleCount, setVisibleCount] = useState(24); // Load More: mostra 24 prodotti inizialmente
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('price-asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false); // Floating button
  const [showSortModal, setShowSortModal] = useState(false); // Mobile sort modal
  const [isWizardOpen, setIsWizardOpen] = useState(false); // Wizard search modal
  const [variantQualifiers, setVariantQualifiers] = useState<string[]>([]); // Nomi degli attributi varianti

  // Load variant qualifiers configuration
  useEffect(() => {
    fetch('/api/get-variant-config')
      .then(res => res.json())
      .then(config => {
        if (config.qualifiers && Array.isArray(config.qualifiers)) {
          const qualifierNames = config.qualifiers.map((q: any) => q.attributeName);
          setVariantQualifiers(qualifierNames);
          console.log('[VARIANT CONFIG] Loaded qualifiers:', qualifierNames);
        }
      })
      .catch(err => console.error('Failed to load variant config:', err));
  }, []);

  // Debug: track selectedProduct changes
  useEffect(() => {
    console.log('[SELECTED PRODUCT] Changed to:', selectedProduct ? selectedProduct.codice : 'null');
    console.log('[SELECTED PRODUCT] isLoading:', isLoading);
  }, [selectedProduct, isLoading]);

  // Count active filters for mobile badge
  const activeFiltersCount = Object.values(selectedFilters).flat().length +
    (selectedCategory ? 1 : 0);

  // Al mount, prova a ripristinare lo stato salvato dal localStorage (solo una volta)
  useEffect(() => {
    // Check if URL has any filters - URL always takes precedence
    const urlFilters = getFiltersFromURL();
    const hasUrlParams = Object.keys(urlFilters).length > 0 ||
                         searchParams.get('q') ||
                         searchParams.get('category');

    if (hasUrlParams) {
      console.log('🔗 Reading from URL (has params - URL takes precedence)', urlFilters);
      setSelectedCategory(searchParams.get('category') || null);
      setSelectedFilters(urlFilters);
      setViewMode((searchParams.get('view') as 'grid' | 'list') || 'grid');
      setSortBy(searchParams.get('sort') || 'price-asc');
      setSearchQuery(searchParams.get('q') || '');
      setIsInitialized(true);
      // Clear any saved state since we're using URL
      clearCatalogState();
    } else {
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
        setTimeout(() => {
          console.log('🧹 Clearing saved catalog state');
          clearCatalogState();
        }, 500);
      } else {
        console.log('🔄 No URL params, no saved state - using defaults');
        setIsInitialized(true);
      }
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
  }, [selectedCategory, selectedFilters, viewMode, sortBy, searchQuery, isInitialized]);

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

  // Track search queries in analytics (debounced to avoid tracking every keystroke)
  useEffect(() => {
    if (!isInitialized) return; // Don't track initial state restore

    if (searchQuery && searchQuery.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        trackSearch(searchQuery.trim(), filteredProducts.length + suggestedProducts.length);
      }, 1000); // Track after 1 second of no typing

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, filteredProducts.length, suggestedProducts.length, isInitialized]);

  // Track filter usage in analytics
  useEffect(() => {
    if (!isInitialized) return; // Don't track initial state restore

    // Track each active filter
    Object.entries(selectedFilters).forEach(([filterKey, filterValues]) => {
      filterValues.forEach((filterValue) => {
        trackFilter(filterKey, filterValue);
      });
    });
  }, [selectedFilters, isInitialized]);

  // Reset visible count when filters, category, or search change
  useEffect(() => {
    if (isInitialized) {
      resetVisibleCount();
    }
  }, [selectedCategory, selectedFilters, searchQuery, sortBy]);

  // Track scroll position for Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 800);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Load More: mostra progressivamente i prodotti
  // Se c'è un prodotto selezionato, escludilo dai risultati (verrà mostrato separatamente in cima)
  const productsToShow = selectedProduct
    ? sortedProducts.filter(p => p.codice !== selectedProduct.codice)
    : sortedProducts;

  const visibleProducts = productsToShow.slice(0, visibleCount);
  const hasMore = visibleCount < productsToShow.length;
  const remainingCount = productsToShow.length - visibleCount;

  // Calcola filtri disponibili dinamicamente (solo opzioni che hanno almeno 1 prodotto)
  const dynamicFilters = useMemo(() => {
    return filters.map(filter => {
      // Per ogni filtro, calcola quali valori sono disponibili
      // considerando gli altri filtri già selezionati (ma non questo)
      const availableValues = new Set<string>();
      const valueCounts = new Map<string, number>(); // NEW: Conta prodotti per valore
      const availableOptions: any[] = [];

      // Filtra prodotti escludendo solo il filtro corrente
      const productsForThisFilter = expandedProducts.filter(product => {
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
        // Permetti anche valori booleani false, ma salta undefined/null
        if (productValue === undefined || productValue === null) return;

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
    })
    // Filtra i filtri che hanno SOLO valori con 0 prodotti
    .filter(filter => {
      // Se non abbiamo valueCounts o è vuoto, rimuovi il filtro
      if (!filter.valueCounts || Object.keys(filter.valueCounts).length === 0) {
        return false; // Nessun prodotto per questo filtro, rimuovilo
      }

      // Controlla se almeno un valore ha prodotti
      const hasProductsInAnyValue = Object.values(filter.valueCounts).some(count => count > 0);
      return hasProductsInAnyValue;
    });
  }, [filters, expandedProducts, selectedCategory, selectedFilters, currentLang]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header - Compact on Mobile, Full on Desktop */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-3">
          {/* Mobile: Single Row Layout */}
          <div className="md:hidden">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Link href="/" className="flex-1 min-w-0">
                {isLoadingSettings ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : settings?.settings?.logo ? (
                  <img
                    src={settings.settings.logo.base64.startsWith('data:')
                      ? settings.settings.logo.base64
                      : `data:${settings.settings.logo.type};base64,${settings.settings.logo.base64}`}
                    alt={settings?.settings?.company?.name || 'Logo'}
                    className="h-8 w-auto object-contain max-w-[150px]"
                  />
                ) : (
                  <h1 className="text-base font-bold text-gray-900 truncate">
                    {settings?.settings?.company?.name || getLabel('home.title', currentLang)}
                  </h1>
                )}
              </Link>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <WishlistIcon />
                <CartIcon />
                <UserIcon />
                <LanguageSelector />
              </div>
            </div>

            {/* Search Bar - Mobile */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setShowAutocomplete(false);
                    setSelectedProduct(null);
                  }
                }}
                placeholder={getLabel('home.search', currentLang)}
                className="w-full px-3 py-2 pl-9 pr-20 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
              />
              <svg
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                <>
                  {/* Bottone X per cancellare */}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowAutocomplete(false);
                    }}
                    className="absolute right-14 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Bottone Cerca - sempre visibile quando c'è testo */}
                  <button
                    onClick={() => {
                      setShowAutocomplete(false);
                      setSelectedProduct(null);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md transition-colors text-xs font-semibold"
                  >
                    {getCatalogText('searchButton', currentLang as Language)}
                  </button>
                </>
              )}

              {/* Dropdown Autocomplete */}
              <SearchAutocomplete
                searchQuery={searchQuery}
                products={expandedProducts}
                categories={categories}
                currentLang={currentLang}
                variantQualifiers={variantQualifiers}
                onSelect={(productCode) => {
                  console.log('[SEARCH] Selected product code:', productCode);
                  const product = expandedProducts.find(p => p.codice === productCode);
                  console.log('[SEARCH] Found product:', product);
                  if (product) {
                    console.log('[SEARCH] Setting selected product:', product.codice);
                    setSelectedProduct(product);
                    setShowAutocomplete(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    console.error('[SEARCH] Product not found in expandedProducts!', productCode);
                  }
                }}
                onSearchSubmit={(query) => {
                  setSearchQuery(query);
                  setShowAutocomplete(false);
                  setSelectedProduct(null);
                }}
                isVisible={showAutocomplete}
                onClose={() => setShowAutocomplete(false)}
              />
            </div>

            {/* Wizard Helper Button - Below Search */}
            <button
              onClick={() => setIsWizardOpen(true)}
              className="mt-2 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-semibold text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{getLabel('wizard.button', currentLang)}</span>
            </button>
          </div>

          {/* Desktop: Single Row Layout - Logo + Search + Icons */}
          <div className="hidden md:block">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                {isLoadingSettings ? (
                  <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
                ) : settings?.settings?.logo ? (
                  <img
                    src={settings.settings.logo.base64.startsWith('data:')
                      ? settings.settings.logo.base64
                      : `data:${settings.settings.logo.type};base64,${settings.settings.logo.base64}`}
                    alt={settings?.settings?.company?.name || 'Logo'}
                    className="h-10 w-auto object-contain max-w-[180px]"
                  />
                ) : (
                  <h1 className="text-xl font-bold text-gray-900">
                    {settings?.settings?.company?.name || getLabel('home.title', currentLang)}
                  </h1>
                )}
              </Link>

              {/* Search Bar - Centro */}
              <div className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowAutocomplete(true);
                  }}
                  onFocus={() => setShowAutocomplete(true)}
                  placeholder={getLabel('home.search', currentLang)}
                  className="w-full px-4 py-2 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                      setShowAutocomplete(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  variantQualifiers={variantQualifiers}
                  onSelect={(productCode) => {
                    console.log('[SEARCH DESKTOP] Selected product code:', productCode);
                    const product = expandedProducts.find(p => p.codice === productCode);
                    console.log('[SEARCH DESKTOP] Found product:', product);
                    if (product) {
                      console.log('[SEARCH DESKTOP] Setting selected product:', product.codice);
                      setSelectedProduct(product);
                      setShowAutocomplete(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      console.error('[SEARCH DESKTOP] Product not found in expandedProducts!', productCode);
                    }
                  }}
                  onSearchSubmit={(query) => {
                    setSearchQuery(query);
                    setShowAutocomplete(false);
                    setSelectedProduct(null);
                  }}
                  isVisible={showAutocomplete}
                  onClose={() => setShowAutocomplete(false)}
                />
              </div>
              </div>

              {/* Icons - Destra */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <UserIcon />

                {/* User Menu Links (when logged in) */}
                {user && (
                  <>
                    {/* User Panel (B2C/B2B) */}
                    {(user.role === 'b2c' || user.role === 'b2b') && (
                      <Link
                        href="/orders"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 text-gray-700"
                      >
                        <Settings className="w-4 h-4" />
                        <span>{labels.user_panel[currentLang as Language]}</span>
                      </Link>
                    )}

                    {/* Admin Panel */}
                    {user.role === 'admin' && (
                      <Link
                        href="/admin-panel"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 text-gray-700"
                      >
                        <Settings className="w-4 h-4" />
                        <span>{labels.admin_panel[currentLang as Language]}</span>
                      </Link>
                    )}

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-red-50 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{labels.logout[currentLang as Language]}</span>
                    </button>
                  </>
                )}

                <WishlistIcon />
                <CartIcon />
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Category Bar - Desktop */}
      {categories.length > 0 && (
        <div className="hidden md:block">
          <CategoryBar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            lang={currentLang}
          />
        </div>
      )}

      {/* Category Bar - Mobile (Circular Scroll) */}
      {categories.length > 0 && (
        <div className="md:hidden bg-gray-50 border-b border-gray-200">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 px-4 py-4">
              {/* Tutte le categorie */}
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex-shrink-0 text-center"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-1.5 transition-all ${
                  !selectedCategory
                    ? 'bg-emerald-600 shadow-lg scale-110'
                    : 'bg-gray-200'
                }`}>
                  <svg className={`w-7 h-7 ${!selectedCategory ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <span className={`text-xs font-medium ${
                  !selectedCategory ? 'text-emerald-700' : 'text-gray-600'
                }`}>
                  Tutte
                </span>
              </button>

              {/* Categorie con immagini */}
              {categories.map((category) => (
                <button
                  key={category.field}
                  onClick={() => setSelectedCategory(category.field)}
                  className="flex-shrink-0 text-center"
                >
                  <div className={`w-16 h-16 rounded-full overflow-hidden mb-1.5 transition-all border-2 ${
                    selectedCategory === category.field
                      ? 'border-emerald-600 shadow-lg scale-110'
                      : 'border-transparent'
                  }`}>
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.translations?.[currentLang] || category.label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-2xl">{category.icon || '📦'}</span>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium line-clamp-2 leading-tight ${
                    selectedCategory === category.field ? 'text-emerald-700' : 'text-gray-600'
                  }`}>
                    {category.translations?.[currentLang] || category.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Sidebar */}
      <main className="container mx-auto px-4 lg:px-8 py-8 pb-32 md:pb-8">
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

                    {/* Wizard Helper Button - Top of Filters */}
                    <div className="px-6 pt-4 pb-2 border-b border-gray-100">
                      <button
                        onClick={() => {
                          setIsWizardOpen(true);
                          setIsMobileFiltersOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{getLabel('wizard.button', currentLang)}</span>
                      </button>
                    </div>

                    {/* Sidebar Content */}
                    <div className="p-6 pb-32">
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

                    {/* Sticky Footer - Mobile Only */}
                    <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg space-y-2">
                      <motion.button
                        onClick={() => setIsMobileFiltersOpen(false)}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <span>
                          {getLabel('home.show_results', currentLang, { count: sortedProducts.length })}
                        </span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.button>

                      {/* Clear Filters Button - Only if filters are active */}
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={() => {
                            setSelectedFilters({});
                            setSelectedCategory(null);
                          }}
                          className="w-full text-gray-600 hover:text-gray-900 font-medium py-2 text-sm transition-colors"
                        >
                          {getLabel('filters.clear', currentLang)}
                        </button>
                      )}
                    </div>
                  </aside>
                </div>
              )}
            </>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {/* Mobile-Only Header: Product Count */}
            <div className="md:hidden mb-4">
              <div className="flex items-center justify-between px-2">
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
              </div>

              {/* Active Filters Chips - Mobile */}
              {(selectedCategory || Object.entries(selectedFilters).some(([_, values]) => values.length > 0)) && (
                <div className="mt-3 flex items-center gap-2 flex-wrap px-2">
                  {/* Categoria selezionata */}
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200">
                      {categories.find(c => c.field === selectedCategory)?.translations[currentLang] || selectedCategory}
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="hover:text-emerald-900"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}

                  {/* Filtri attributi */}
                  {Object.entries(selectedFilters).map(([key, values]) =>
                    values.slice(0, 2).map((value) => {
                      // Trova il filtro e traduci il valore
                      const filter = dynamicFilters.find(f => f.key === key);
                      let translatedValue = translateBooleanValue(value, currentLang);

                      // Ottieni label tradotta del filtro
                      let filterLabel = '';
                      if (filter && (filter as any).options && (filter as any).options.length > 0 && (filter as any).options[0].label) {
                        const labelObj = (filter as any).options[0].label;
                        filterLabel = typeof labelObj === 'object' ? (labelObj[currentLang] || labelObj['it'] || Object.values(labelObj)[0]) : key;
                      }

                      if (filter && (filter as any).options) {
                        const option = (filter as any).options.find((opt: any) => {
                          const optValueIt = typeof opt.value === 'object' ? opt.value.it : opt.value;
                          return String(optValueIt).trim().toLowerCase() === String(value).trim().toLowerCase();
                        });
                        if (option && option.value && typeof option.value === 'object') {
                          translatedValue = option.value[currentLang] || option.value.it || value;
                        }
                      }

                      // Per booleani, mostra anche la label
                      const isBooleanFilter = value === 'true' || value === 'false' || value === '1' || value === '0' ||
                                              translatedValue.toLowerCase() === 'yes' || translatedValue.toLowerCase() === 'no' ||
                                              translatedValue.toLowerCase() === 'si' || translatedValue.toLowerCase() === 'sì';
                      const displayText = isBooleanFilter && filterLabel ? `${filterLabel}: ${translatedValue}` : translatedValue;

                      return (
                        <span
                          key={`${key}-${value}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200"
                        >
                          {displayText}
                          <button
                            onClick={() => {
                              const newValues = selectedFilters[key].filter(v => v !== value);
                              setSelectedFilters({
                                ...selectedFilters,
                                [key]: newValues,
                              });
                            }}
                            className="hover:text-emerald-900"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      );
                    })
                  )}

                  {/* Show more indicator if there are many filters */}
                  {activeFiltersCount > 3 && (
                    <span className="text-xs text-gray-500 font-medium">
                      +{activeFiltersCount - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Toolbar - Contatore e controlli (DESKTOP ONLY) */}
            <div className="hidden md:block space-y-4 mb-6">
              {/* Prima riga: Contatore e controlli visualizzazione */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl px-4 sm:px-6 py-4 shadow-sm border border-gray-100">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
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

                      // Traduci il valore cercandolo nelle options del filtro
                      let translatedValue = translateBooleanValue(value, currentLang);
                      if (filter && (filter as any).options) {
                        // Cerca il valore nelle options per trovare la traduzione
                        const option = (filter as any).options.find((opt: any) => {
                          const optValueIt = typeof opt.value === 'object' ? opt.value.it : opt.value;
                          return String(optValueIt).trim().toLowerCase() === String(value).trim().toLowerCase();
                        });
                        if (option && option.value && typeof option.value === 'object') {
                          translatedValue = option.value[currentLang] || option.value.it || value;
                        }
                      }

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
                        {getCatalogTextFn('foundExactResults', currentLang as Language, filteredProducts.length, searchQuery)}
                      </p>
                      <p className="text-xs text-blue-700">
                        {getCatalogTextFn('alsoShowingRelated', currentLang as Language, suggestedProducts.length)}
                      </p>
                    </>
                  ) : (
                    /* Solo suggerimenti, nessun risultato esatto */
                    <>
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        {getCatalogTextFn('noExactResults', currentLang as Language, searchQuery)}
                      </p>
                      <p className="text-xs text-blue-700">
                        {getCatalogTextFn('showingRelatedProducts', currentLang as Language, suggestedProducts.length)}
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
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <ProductCardSkeleton key={idx} viewMode="grid" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <ProductCardSkeleton key={idx} viewMode="list" />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Sezione Prodotto Selezionato - Layout Compatto */}
                {selectedProduct && (
                  <div className="mb-8 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base md:text-lg font-bold text-emerald-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {getCatalogText('selectedProduct', currentLang as Language)}
                      </h2>
                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="text-sm text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {getCatalogText('removeButton', currentLang as Language)}
                      </button>
                    </div>

                    {/* Layout orizzontale compatto su desktop, verticale su mobile */}
                    <div className="flex flex-col md:flex-row gap-4 bg-white rounded-lg p-3 border border-emerald-100">
                      {/* Immagine prodotto - compatta */}
                      <Link href={`/products/${selectedProduct.codice}`} className="shrink-0">
                        <div className="relative w-full md:w-40 h-40 bg-gray-50 rounded-lg overflow-hidden group">
                          {selectedProduct.immagine ? (
                            <Image
                              src={selectedProduct.immagine}
                              alt={getTranslatedValue(selectedProduct.nome, currentLang)}
                              fill
                              className="object-contain p-2 group-hover:scale-105 transition-transform"
                              sizes="(max-width: 768px) 100vw, 160px"
                              priority
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-5xl">📦</div>
                          )}
                        </div>
                      </Link>

                      {/* Info prodotto */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <Link href={`/products/${selectedProduct.codice}`}>
                            <h3 className="text-base md:text-lg font-bold text-gray-900 hover:text-emerald-600 transition-colors mb-1 line-clamp-2">
                              {getTranslatedValue(selectedProduct.nome, currentLang)}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-500 font-mono mb-2">{selectedProduct.codice}</p>

                          {/* Attributi varianti del prodotto selezionato */}
                          {selectedProduct.attributi && variantQualifiers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {variantQualifiers
                                .filter(key => selectedProduct.attributi[key])
                                .map(key => {
                                  const value = selectedProduct.attributi[key];
                                  let displayValue = '';
                                  if (typeof value === 'object' && value !== null && 'value' in value) {
                                    const rawValue = (value as any).value;
                                    if (typeof rawValue === 'boolean') return null;
                                    if (typeof rawValue === 'object') {
                                      displayValue = getTranslatedValue(rawValue, currentLang);
                                    } else {
                                      displayValue = String(rawValue);
                                    }
                                  } else if (typeof value === 'boolean') {
                                    return null;
                                  } else {
                                    displayValue = String(value);
                                  }
                                  return displayValue ? (
                                    <span key={key} className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded">
                                      {displayValue}
                                    </span>
                                  ) : null;
                                })}
                            </div>
                          )}
                        </div>

                        {/* Prezzo e azioni */}
                        <div className="flex items-center justify-between gap-4 mt-2">
                          {selectedProduct.prezzo !== undefined && (
                            <p className="text-xl md:text-2xl font-bold text-emerald-600">
                              €{selectedProduct.prezzo.toFixed(2).replace('.', ',')}
                            </p>
                          )}
                          <Link
                            href={`/products/${selectedProduct.codice}`}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium whitespace-nowrap"
                          >
                            {getCatalogText('viewDetailsButton', currentLang as Language)}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products Grid/List con divisore tra esatti e correlati */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {visibleProducts.map((product, index) => {
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
                                {getCatalogText('relatedProducts', currentLang as Language)}
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
                    {visibleProducts.map((product, index) => {
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
                                {getCatalogText('relatedProducts', currentLang as Language)}
                              </h2>
                            </div>
                          )}
                          <ProductCard product={product} lang={currentLang} viewMode="list" priority={index === 0} />
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                {/* Load More Button - Premium Design */}
                {hasMore && (
                  <div className="mt-12 flex flex-col items-center gap-6">
                    {/* Progress Indicator */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        {getLabel('home.showing', currentLang)}{' '}
                        <span className="font-bold text-emerald-700">{visibleCount}</span>{' '}
                        {getLabel('home.of', currentLang)}{' '}
                        <span className="font-bold text-gray-900">{productsToShow.length}</span>{' '}
                        {getLabel('home.products', currentLang)}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-3 w-full max-w-md mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(visibleCount / productsToShow.length) * 100}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* Load More Button */}
                    <motion.button
                      onClick={loadMore}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative w-full max-w-md px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden"
                    >
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative flex items-center justify-center gap-3">
                        <ChevronDown className="w-5 h-5 group-hover:animate-bounce" />
                        <span className="font-bold text-lg">
                          {getLabel('home.load_more', currentLang)}
                        </span>
                        <ChevronDown className="w-5 h-5 group-hover:animate-bounce" />
                      </div>

                      <p className="relative text-xs text-emerald-100 mt-1.5">
                        {remainingCount} {getLabel('home.remaining', currentLang)}
                      </p>
                    </motion.button>

                    {/* Show All Option */}
                    {remainingCount > 48 && (
                      <button
                        onClick={() => setVisibleCount(productsToShow.length)}
                        className="text-sm text-gray-600 hover:text-emerald-700 font-medium underline transition-colors"
                      >
                        {getLabel('home.show_all', currentLang)}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Sezione suggerimenti rimossa - ora i suggerimenti vengono mostrati come risultati principali con paginazione completa */}
          </div>
        </div>
      </main>

      {/* Recently Viewed Section */}
      <RecentlyViewedCarousel />

      {/* Wizard Search Button - Desktop Only (Always Visible) */}
      <motion.button
        onClick={() => setIsWizardOpen(true)}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        className="hidden md:flex fixed bottom-8 right-8 z-40 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3.5 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all items-center gap-2 font-bold text-sm group"
      >
        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span>{getLabel('wizard.button', currentLang)}</span>
      </motion.button>

      {/* Floating Action Buttons - Mobile Only */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-40">
        <div className="flex gap-3">
          {/* Filtri Button */}
          <motion.button
            onClick={() => setIsMobileFiltersOpen(true)}
            whileTap={{ scale: 0.95 }}
            className="flex-1 bg-white border-2 border-emerald-600 text-emerald-700 py-4 px-6 rounded-xl shadow-2xl hover:bg-emerald-50 transition-colors font-bold text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>{getLabel('filters.title', currentLang)}</span>
            {activeFiltersCount > 0 && (
              <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </motion.button>

          {/* Ordina Button */}
          <motion.button
            onClick={() => setShowSortModal(true)}
            whileTap={{ scale: 0.95 }}
            className="flex-1 bg-emerald-600 text-white py-4 px-6 rounded-xl shadow-2xl hover:bg-emerald-700 transition-colors font-bold text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span>{getLabel('home.sort_button', currentLang)}</span>
          </motion.button>
        </div>
      </div>

      {/* Bottom Sheet Sort Modal - Mobile Only */}
      <AnimatePresence>
        {showSortModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSortModal(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-50"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto"
            >
              {/* Handle Bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{getLabel('home.sort_by', currentLang)}</h3>
                  <button
                    onClick={() => setShowSortModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Sort Options */}
              <div className="p-4">
                {[
                  { value: 'price-asc', label: getLabel('home.sort.price_asc', currentLang) },
                  { value: 'price-desc', label: getLabel('home.sort.price_desc', currentLang) },
                  { value: 'name-asc', label: getLabel('home.sort.name_asc', currentLang) },
                  { value: 'name-desc', label: getLabel('home.sort.name_desc', currentLang) },
                  { value: 'code-asc', label: getLabel('home.sort.code_asc', currentLang) },
                  { value: 'code-desc', label: getLabel('home.sort.code_desc', currentLang) },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortModal(false);
                    }}
                    className={`w-full text-left px-6 py-4 rounded-xl mb-2 transition-all ${
                      sortBy === option.value
                        ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-900 font-bold'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {sortBy === option.value && (
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Bottom Padding for Safe Area */}
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 md:bottom-8 right-8 z-50 p-4 bg-emerald-600 text-white rounded-full shadow-2xl hover:bg-emerald-700 hover:scale-110 transition-all group"
            aria-label="Torna su"
          >
            <ArrowUp className="w-6 h-6 group-hover:animate-bounce" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Wizard Search Modal */}
      <WizardSearch
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        categories={categories}
        filters={dynamicFilters}
        products={expandedProducts}
        currentLang={currentLang}
        onApplyFilters={({ category, selectedFilters: wizardFilters }) => {
          if (category) {
            setSelectedCategory(category);
          }
          setSelectedFilters(wizardFilters);
          resetVisibleCount();
        }}
      />
    </div>
  );
}
