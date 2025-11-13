'use client';

// components/ProductDetail.tsx
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTranslatedValue, formatAttributeValue, getAttributeLabel, getAttributeValue } from '@/lib/product-utils';
import ImageGallery from '@/components/ImageGallery';
import VariantSelector from '@/components/VariantSelector';
import LanguageSelector from '@/components/LanguageSelector';
import CartIcon from '@/components/CartIcon';
import WishlistIcon from '@/components/WishlistIcon';
import AIDescription from '@/components/AIDescription';
import Accordion from '@/components/Accordion';
import ProductGrid from '@/components/ProductGrid';
import { getLabel } from '@/lib/ui-labels';
import { Product, Variant } from '@/types/product';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompare } from '@/contexts/CompareContext';
import { useProductNavigation } from '@/contexts/ProductNavigationContext';
import ProductNavigationBar from '@/components/ProductNavigationBar';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { toast } from 'sonner';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { GalleryConfig } from '@/lib/variant-config';
import { ShoppingCart, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lightbox from 'yet-another-react-lightbox';
import { Counter, Zoom } from 'yet-another-react-lightbox/plugins';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

interface ProductDetailProps {
  product: Product;
  groupProducts?: Product[];
}

export default function ProductDetail({ product, groupProducts }: ProductDetailProps) {
  const { currentLang } = useLanguage();
  const router = useRouter();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { navigationProducts, clearCatalogState } = useProductNavigation();
  const { addItem, openCart } = useCartStore();
  const { addProduct, recentProducts } = useRecentlyViewed();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const getRelatedProducts = useAnalyticsStore(state => state.getRelatedProducts);

  // Track product view
  useEffect(() => {
    addProduct(product);
  }, [product.codice]); // Only re-run if product code changes

  // Sticky cart scroll handler + variant info auto-collapse
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Sticky cart logic
      if (priceRef.current) {
        const rect = priceRef.current.getBoundingClientRect();
        setShowStickyCart(rect.bottom < 0);
      }

      // Variant info auto-collapse: se scroll > 100px, riduce automaticamente
      if (currentScrollY > 100) {
        setIsScrolled(true);
        // Auto-collapse quando scrolli verso il basso
        if (currentScrollY > lastScrollY) {
          setIsVariantInfoExpanded(false);
        }
      } else {
        setIsScrolled(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // State per tracciare la variante selezionata
  const [selectedVariantCode, setSelectedVariantCode] = useState<string>(product.codice);

  // State per il pulsante "Mostra Galleria" quando la galleria è ridotta
  const [galleryExpandButton, setGalleryExpandButton] = useState<React.ReactNode>(null);

  // State e ref per sticky add to cart
  const [showStickyCart, setShowStickyCart] = useState(false);
  const addToCartButtonRef = useRef<HTMLButtonElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);

  // State per sticky variant info
  const [isVariantInfoExpanded, setIsVariantInfoExpanded] = useState(false); // Collassato di default
  const [isScrolled, setIsScrolled] = useState(false); // Traccia se l'utente ha scrollato
  const variantInfoRef = useRef<HTMLDivElement>(null);

  // State for client-side hydration
  const [mounted, setMounted] = useState(false);

  // State per lightbox mobile
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // State per configurazione gallery
  const [galleryConfig, setGalleryConfig] = useState<GalleryConfig | null>(null);

  // Wait for client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch gallery configuration (solo al primo caricamento, cached per 1 ora)
  useEffect(() => {
    fetch('/api/get-variant-config')
      .then(res => res.json())
      .then(config => {
        if (config.success) {
          setGalleryConfig(config);
        }
      })
      .catch(err => console.error('Failed to load gallery config:', err));
  }, []);

  // Reset scroll state quando cambia variante (ma mantieni collapsed)
  useEffect(() => {
    if (selectedVariantCode) {
      setIsScrolled(false);
    }
  }, [selectedVariantCode]);

  // Determina il codice del prodotto da usare per il confronto
  // Se ci sono varianti, usa la variante selezionata, altrimenti usa il prodotto master
  const compareCode = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      return selectedVariantCode;
    }
    return product.codice;
  }, [product.variants, product.codice, selectedVariantCode]);

  const inCompare = isInCompare(compareCode);

  // Calculate wishlist status (reactive with Zustand) - only after mount to avoid hydration mismatch
  const inWishlist = mounted ? isInWishlist(compareCode) : false;

  const handleCompareClick = () => {
    if (inCompare) {
      removeFromCompare(compareCode);
    } else {
      addToCompare(compareCode);
    }
  };

  const handleWishlistClick = () => {
    const wasInWishlist = isInWishlist(compareCode);
    toggleItem(compareCode);
    const productName = getTranslatedValue((selectedVariant || product).nome, currentLang);

    if (wasInWishlist) {
      toast.success(getLabel('product.remove_from_wishlist', currentLang), {
        description: productName,
      });
    } else {
      toast.success(getLabel('product.add_to_wishlist', currentLang), {
        description: productName,
      });
    }
  };

  const handleAddToCart = () => {
    // Determina quale prodotto/variante stiamo aggiungendo
    const productToAdd = selectedVariant || product;

    // Crea le informazioni sulla variante se presente
    let variantInfo = '';
    if (selectedVariant && product.variants && product.variants.length > 0) {
      // Costruisci una stringa descrittiva della variante
      const variantDetails: string[] = [];

      // Estrai gli attributi rilevanti dalla variante
      Object.entries(selectedVariant.attributi || {}).forEach(([key, value]) => {
        const translatedKey = getAttributeLabel(key, currentLang, product.attributi);

        // Usa getAttributeValue per tradurre il valore
        let translatedValue = '';

        if (typeof value === 'boolean') {
          translatedValue = value ? getLabel('common.yes', currentLang) : getLabel('common.no', currentLang);
        } else if (value === null || value === undefined) {
          translatedValue = '';
        } else {
          // Cerca la traduzione negli attributi del master product, varianti o in tutti i prodotti
          translatedValue = getAttributeValue(key, value, currentLang, product.attributi, product.variants, groupProducts);
        }

        if (translatedValue) {
          variantDetails.push(`${translatedKey}: ${translatedValue}`);
        }
      });

      variantInfo = variantDetails.join(' • ');
    }

    // Aggiungi al carrello
    addItem({
      code: productToAdd.codice,
      name: getTranslatedValue(productToAdd.nome, currentLang),
      price: productToAdd.prezzo,
      image: productToAdd.immagine || productToAdd.immagini?.[0],
      variantInfo: variantInfo || undefined,
    }, 1);

    // Mostra toast di successo
    toast.success(getLabel('cart.added_to_cart', currentLang), {
      description: getTranslatedValue(productToAdd.nome, currentLang),
      action: {
        label: getLabel('cart.view_cart', currentLang),
        onClick: () => openCart(),
      },
    });
  };

  // Handler per aprire lightbox con immagini variante (mobile)
  const handleOpenGallery = (images: string[]) => {
    setLightboxImages(images);
    setLightboxIndex(0);
    setIsLightboxOpen(true);
  };

  // Trova la variante selezionata (o usa il prodotto corrente se non ci sono varianti)
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return null;
    }
    return product.variants.find(v => v.codice === selectedVariantCode) || product.variants[0];
  }, [product.variants, selectedVariantCode]);

  // Nome del prodotto (sempre dal master)
  const nome = getTranslatedValue(product.nome, currentLang);

  // Costruisci descrizione dinamica strutturata: nome + qualifiers + attributi variante (escluse categorie)
  const descrizioneData = useMemo(() => {
    // Usa gli attributi della variante se esiste, altrimenti quelli del prodotto master
    const attributiDaUsare = selectedVariant?.attributi || product.attributi;

    if (!attributiDaUsare) {
      return [];
    }

    // Lista campi da escludere (categorie dal _meta)
    const categoryFields = new Set([
      'Scuri alla Veneta',
      'Persiane a Muro',
      'Persiane con Telaio'
    ]);

    const parts: Array<{label: string, value: string, isBoolean: boolean, booleanValue: boolean}> = [];

    // Aggiungi tutti gli attributi (qualifiers + altri attributi)
    Object.entries(attributiDaUsare).forEach(([key, attrValue]) => {
      // Escludi le categorie
      if (categoryFields.has(key)) {
        return;
      }

      // Ottieni la label tradotta
      // Prima prova ui-labels per attributi comuni
      const normalizedKey = key.toLowerCase();
      let label = getLabel(`attributes.${normalizedKey}`, currentLang);

      // Se non trovata in ui-labels, prova dal valore stesso
      if (!label && typeof attrValue === 'object' && attrValue !== null && 'label' in attrValue) {
        label = getTranslatedValue(attrValue.label, currentLang);
      }

      // Fallback: usa la chiave originale
      if (!label) {
        label = key;
      }

      // Ottieni il valore formattato
      let displayValue = '';
      let isBoolean = false;
      let booleanValue = false;

      if (typeof attrValue === 'boolean') {
        isBoolean = true;
        booleanValue = attrValue;
        displayValue = attrValue ? getLabel('common.yes', currentLang) : getLabel('common.no', currentLang);
      } else if (attrValue === null || attrValue === undefined) {
        displayValue = '';
      } else {
        // Usa getAttributeValue per cercare la traduzione
        displayValue = getAttributeValue(key, attrValue, currentLang, product.attributi, product.variants, groupProducts);

        // Check se il valore finale è un Yes/No per i booleani mascherati da stringa
        if (displayValue && typeof displayValue === 'string') {
          const strValue = displayValue.toLowerCase();
          if (strValue === 'yes' || strValue === 'sì' || strValue === 'si') {
            isBoolean = true;
            booleanValue = true;
            displayValue = getLabel('common.yes', currentLang);
          } else if (strValue === 'no') {
            isBoolean = true;
            booleanValue = false;
            displayValue = getLabel('common.no', currentLang);
          }
        }
      }

      parts.push({ label, value: displayValue, isBoolean, booleanValue });
    });

    return parts;
  }, [selectedVariant, product.attributi, currentLang]);

  // Prepara array immagini per gallery
  // Se c'è una variante selezionata, usa le sue immagini, altrimenti usa quelle del master
  const galleryImages = useMemo(() => {
    // Se c'è una variante selezionata, prova a usare le sue immagini
    if (selectedVariant) {
      // Prima prova con l'array immagini della variante
      if (selectedVariant.immagini && selectedVariant.immagini.length > 0) {
        return selectedVariant.immagini;
      }
      // Altrimenti usa l'immagine singola della variante
      if (selectedVariant.immagine) {
        return [selectedVariant.immagine];
      }
    }

    // Fallback: usa le immagini del prodotto master
    if (product.immagini && product.immagini.length > 0) {
      return product.immagini;
    }
    if (product.immagine) {
      return [product.immagine];
    }

    return [];
  }, [selectedVariant, product.immagini, product.immagine]);

  // Dynamic product galleries - max 2 basate su attributi configurati
  const dynamicGalleries = useMemo(() => {
    if (!groupProducts || groupProducts.length === 0 || !galleryConfig) return [];
    if (!galleryConfig.success || galleryConfig.count === 0) return [];

    const currentProduct = selectedVariant || product;
    const galleries: Array<{
      attribute: string;
      attributeLabel: string;
      value: string;
      valueIt: string; // Valore in italiano per i filtri URL
      products: Product[];
    }> = [];

    // Usa solo i 2 attributi configurati dall'admin (max 2)
    galleryConfig.galleryAttributes.forEach(configAttr => {
      const attrName = configAttr.name;
      const currentAttr = currentProduct.attributi?.[attrName];
      if (!currentAttr) return;

      // Get attribute value and label (lingua corrente per display)
      let attrValue: string;
      let attrValueIt: string; // Valore in italiano per filtri
      let attrLabel: string = attrName;

      if (typeof currentAttr === 'object' && 'value' in currentAttr) {
        attrValue = getTranslatedValue(currentAttr.value, currentLang);
        attrValueIt = getTranslatedValue(currentAttr.value, 'it'); // Sempre italiano per filtri
        if ('label' in currentAttr) {
          attrLabel = getTranslatedValue(currentAttr.label, currentLang);
        }
      } else {
        attrValue = String(currentAttr);
        attrValueIt = String(currentAttr);
      }

      if (!attrValue || !attrValueIt) return;

      // Filter products: SAME value for this attribute, DIFFERENT for others
      const filtered = groupProducts.filter(p => {
        if (p.codice === product.codice) return false; // Exclude current product

        const pAttr = p.attributi?.[attrName];
        if (!pAttr) return false;

        let pValue: string;
        if (typeof pAttr === 'object' && 'value' in pAttr) {
          pValue = getTranslatedValue(pAttr.value, currentLang);
        } else {
          pValue = String(pAttr);
        }

        return pValue === attrValue;
      });

      // Only add gallery if there are products
      if (filtered.length > 0) {
        galleries.push({
          attribute: attrName,
          attributeLabel: attrLabel,
          value: attrValue, // Valore tradotto per display
          valueIt: attrValueIt, // Valore italiano per filtri URL
          products: filtered.sort((a, b) => a.codice.localeCompare(b.codice)),
        });
      }
    });

    return galleries;
  }, [groupProducts, product, selectedVariant, currentLang, galleryConfig]);

  // Also viewed products from analytics
  const alsoViewedProducts = useMemo(() => {
    if (!groupProducts || groupProducts.length === 0) return [];
    if (!mounted) return []; // Wait for client-side hydration to avoid mismatch

    const MIN_PRODUCTS = 10;
    const result: Product[] = [];
    const usedCodes = new Set<string>();

    // 1. Start with analytics data (only on client)
    const relatedCodes = getRelatedProducts(product.codice, MIN_PRODUCTS);
    relatedCodes.forEach(code => {
      const p = groupProducts.find(prod => prod.codice === code);
      if (p && !usedCodes.has(p.codice)) {
        result.push(p);
        usedCodes.add(p.codice);
      }
    });

    // 2. If we need more, add from dynamic galleries (Serie, then Tipologia)
    if (result.length < MIN_PRODUCTS && dynamicGalleries.length > 0) {
      for (const gallery of dynamicGalleries) {
        if (result.length >= MIN_PRODUCTS) break;

        // Use gallery products in their sorted order (already sorted by codice)
        for (const p of gallery.products) {
          if (result.length >= MIN_PRODUCTS) break;
          if (!usedCodes.has(p.codice)) {
            result.push(p);
            usedCodes.add(p.codice);
          }
        }
      }
    }

    // 3. Final deterministic sort to avoid hydration issues
    return result.sort((a, b) => a.codice.localeCompare(b.codice)).slice(0, MIN_PRODUCTS);
  }, [groupProducts, product, getRelatedProducts, dynamicGalleries, mounted]);

  // Variant Pills per sticky cart - mostra solo attributi chiave
  const variantPills = useMemo(() => {
    if (!selectedVariant?.attributi) return [];

    const pills: string[] = [];
    const priorityAttributes = ['Colore', 'Materiale', 'Specifiche tecniche'];

    priorityAttributes.forEach(attrKey => {
      const attrValue = selectedVariant.attributi?.[attrKey];
      if (!attrValue) return;

      let displayValue = '';
      if (typeof attrValue === 'boolean') {
        displayValue = attrValue ? getLabel('common.yes', currentLang) : getLabel('common.no', currentLang);
      } else if (typeof attrValue === 'object' && attrValue !== null) {
        if ('value' in attrValue) {
          // Old structure: {value: ...}
          const rawValue = attrValue.value;
          if (typeof rawValue === 'object') {
            displayValue = getTranslatedValue(rawValue, currentLang);
          } else {
            displayValue = String(rawValue);
          }
        } else {
          // New structure: multilingual object {it: "...", en: "...", ...}
          displayValue = getTranslatedValue(attrValue, currentLang);
        }
      } else {
        displayValue = String(attrValue);
      }

      // Truncate a 12 caratteri per compattezza
      pills.push(displayValue.length > 12 ? displayValue.substring(0, 12) + '...' : displayValue);
    });

    return pills;
  }, [selectedVariant, currentLang]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con breadcrumb e back button */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="relative flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 z-10">
              <Link
                href="/"
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs sm:text-sm font-medium flex-shrink-0"
              >
                <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden xs:inline">{getLabel('product.back_to_catalog', currentLang)}</span>
                <span className="xs:hidden">{getLabel('product.back_to_catalog', currentLang)}</span>
              </Link>

              <nav className="text-xs sm:text-sm text-gray-600 hidden md:block truncate">
                <Link href="/" className="hover:text-gray-900">
                  {getLabel('breadcrumb.home', currentLang)}
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900">{getLabel('breadcrumb.products', currentLang)}</span>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium truncate">{product.codice}</span>
              </nav>
            </div>

            {/* Pulsante Espandi Galleria (quando ridotta) - CENTRATO ASSOLUTO */}
            {galleryExpandButton && (
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {galleryExpandButton}
              </div>
            )}

            {/* Wishlist, Cart and Language Selector */}
            <div className="flex items-center gap-2 flex-shrink-0 z-10">
              <WishlistIcon />
              <CartIcon />
              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar for filtered products */}
      {navigationProducts.length > 0 && (
        <ProductNavigationBar
          products={navigationProducts}
          currentProductCode={product.codice}
          lang={currentLang}
          onCollapseChange={(collapsed, button) => {
            setGalleryExpandButton(collapsed ? button : null);
          }}
        />
      )}

      <main className="container mx-auto px-0 sm:px-4 py-0 sm:py-8">
        <div className="bg-white sm:rounded-lg sm:shadow-lg overflow-hidden">
          {/* Layout Mobile-First: Stack su mobile, Grid su desktop */}
          <div className="md:grid md:grid-cols-2 md:gap-6 lg:gap-8">
            {/* Colonna SINISTRA Desktop: Galleria Immagini tradizionale */}
            <div className="hidden md:block p-3 sm:p-6 md:p-8">
              {galleryImages.length > 0 ? (
                <ImageGallery images={galleryImages} productName={nome} />
              ) : (
                <div className="h-[240px] md:h-auto md:aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl sm:text-6xl mb-2">📦</div>
                    <p className="text-sm sm:text-base">{getLabel('product.no_image', currentLang)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Colonna DESTRA: Info Prodotto + Varianti */}
            <div className="flex flex-col space-y-1.5 sm:space-y-4 md:space-y-6 p-3 sm:p-6 md:p-8 md:pt-8">
              {/* Gallery Varianti GRANDE - Solo mobile, al posto della foto */}
              {product.variants && product.variants.length > 0 ? (
                <div className="md:hidden mb-2">
                  <VariantSelector
                    variants={product.variants}
                    currentCode={selectedVariantCode}
                    productAttributes={product.attributi}
                    groupProducts={groupProducts}
                    lang={currentLang}
                    onVariantChange={setSelectedVariantCode}
                    onOpenGallery={handleOpenGallery}
                    compact={true}
                  />
                </div>
              ) : galleryImages.length > 0 && (
                <div className="md:hidden mb-2">
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={galleryImages[0]}
                      alt={nome}
                      fill
                      className="object-contain p-2"
                      priority
                    />
                  </div>
                </div>
              )}
              {/* Nome + Prezzo + Azioni - ULTRA COMPATTO */}
              <div className="space-y-2" ref={priceRef}>
                {/* Riga 1: Nome + Prezzo */}
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 flex-1">
                    {nome}
                  </h1>
                  {selectedVariant ? (
                    <span className="text-xl font-bold text-green-600 flex-shrink-0">
                      €{selectedVariant.prezzo.toFixed(2).replace('.', ',')}
                    </span>
                  ) : product.prezzo !== undefined && (
                    <span className="text-xl font-bold text-green-600 flex-shrink-0">
                      €{product.prezzo.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>

                {/* Riga 2: Disponibilità */}
                {product.disponibilita !== undefined && (
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${product.disponibilita > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-xs font-medium ${product.disponibilita > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {product.disponibilita > 0 ? `✓ ${getLabel('product.availability.available', currentLang)}` : getLabel('product.availability.not_available', currentLang)}
                    </span>
                  </div>
                )}

                {/* Descrizione composta variante - Solo Desktop */}
                {descrizioneData.length > 0 && (
                  <div className="hidden md:block pt-2">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {descrizioneData.map((attr, idx) => (
                        <span key={idx}>
                          <span className="font-semibold text-gray-900">{attr.label}:</span>{' '}
                          <span className="text-gray-700">{attr.value}</span>
                          {idx < descrizioneData.length - 1 && <span className="text-gray-400 mx-1.5">•</span>}
                        </span>
                      ))}
                    </p>
                  </div>
                )}

                {/* Riga 3: Tutti i pulsanti INLINE */}
                <div className="md:hidden flex items-center gap-2 flex-wrap pt-1">
                  {/* Carrello */}
                  <button
                    ref={addToCartButtonRef}
                    onClick={handleAddToCart}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg shadow-lg flex items-center gap-1.5 text-xs"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{getLabel('product.add', currentLang)}</span>
                  </button>

                  {/* Downloads */}
                  {product.risorse && product.risorse.length > 0 && (
                    <>
                      {product.risorse.map((resource, idx) => (
                        <a
                          key={idx}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors flex items-center gap-1"
                        >
                          📄 {resource.extension.toUpperCase()}
                        </a>
                      ))}
                    </>
                  )}

                  {/* Wishlist */}
                  <button
                    onClick={handleWishlistClick}
                    className={`p-2 rounded-lg border transition-all ${
                      inWishlist
                        ? 'bg-red-50 border-red-500 text-red-600'
                        : 'bg-white border-gray-300 text-gray-600'
                    }`}
                    title={inWishlist ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
                  </button>

                  {/* Compare */}
                  <button
                    onClick={handleCompareClick}
                    className={`p-2 rounded-lg border transition-all ${
                      inCompare
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-600'
                    }`}
                    title={inCompare ? 'Rimuovi dal confronto' : 'Aggiungi al confronto'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Varianti Desktop: Pulsanti normali */}
              {product.variants && product.variants.length > 0 && (
                <div className="hidden md:block pt-0.5 sm:pt-2">
                  <VariantSelector
                    variants={product.variants}
                    currentCode={selectedVariantCode}
                    productAttributes={product.attributi}
                    groupProducts={groupProducts}
                    lang={currentLang}
                    onVariantChange={setSelectedVariantCode}
                    compact={false}
                  />
                </div>
              )}

              {/* Sezione Desktop - Layout Migliorato */}
              <div className="hidden md:block pt-4">
                {/* Card Downloads + Azioni Raggruppate */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                  {/* Downloads */}
                  {product.risorse && product.risorse.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                        📥 {getLabel('product.downloads_title', currentLang)}
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        {product.risorse.map((resource, idx) => (
                          <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${resource.category} (${resource.extension.toUpperCase()})`}
                            className="px-4 py-2 text-sm font-bold bg-white hover:bg-green-50 border-2 border-gray-300 hover:border-green-500 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                          >
                            📄 {resource.extension.toUpperCase()}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Azioni */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                      🎯 {getLabel('product.actions_title', currentLang)}
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {/* Pulsante Wishlist */}
                      <button
                        onClick={handleWishlistClick}
                        className={`flex-1 min-w-[120px] font-bold py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm border-2 ${
                          inWishlist
                            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                            : 'bg-white hover:bg-red-50 text-gray-700 border-gray-300 hover:border-red-500'
                        }`}
                        title={inWishlist ? getLabel('product.remove_from_wishlist', currentLang) : getLabel('product.add_to_wishlist', currentLang)}
                      >
                        <Heart className={`w-5 h-5 flex-shrink-0 ${inWishlist ? 'fill-current' : ''}`} />
                        <span>
                          {inWishlist ? `❤️ ${getLabel('product.in_wishlist', currentLang)}` : getLabel('product.add_to_wishlist_short', currentLang)}
                        </span>
                      </button>

                      {/* Pulsante Confronta */}
                      <button
                        onClick={handleCompareClick}
                        className={`flex-1 min-w-[120px] font-bold py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm border-2 ${
                          inCompare
                            ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                            : 'bg-white hover:bg-blue-50 text-gray-700 border-gray-300 hover:border-blue-500'
                        }`}
                        title={inCompare ? getLabel('compare.remove', currentLang) : getLabel('compare.add', currentLang)}
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>
                          {inCompare ? `✓ ${getLabel('compare.added', currentLang)}` : getLabel('compare.add_short', currentLang)}
                        </span>
                      </button>

                      {/* Pulsante Aggiungi al carrello */}
                      <button
                        onClick={handleAddToCart}
                        className="flex-1 min-w-[200px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm border-2 border-emerald-600"
                      >
                        <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                        <span>{getLabel('product.add_to_cart', currentLang)}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info prodotto statico (solo per prodotti senza varianti) */}
                {(!product.variants || product.variants.length === 0) && product.prezzo !== undefined && (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-mono">
                          {getLabel('product.code', currentLang)} {product.codice}
                        </p>
                        {product.attributi && Object.keys(product.attributi).length > 0 && (
                          <p className="text-xs sm:text-sm text-gray-700 mt-1 line-clamp-2">
                            {Object.entries(product.attributi)
                              .filter(([key]) => !['Scuri alla Veneta', 'Persiane a Muro', 'Persiane con Telaio'].includes(key))
                              .slice(0, 3)
                              .map(([key, value]) => {
                                const translatedKey = getAttributeLabel(key, currentLang, product.attributi);
                                let displayValue = '';

                                if (typeof value === 'boolean') {
                                  displayValue = value ? getLabel('common.yes', currentLang) : getLabel('common.no', currentLang);
                                } else if (value === null || value === undefined) {
                                  displayValue = '';
                                } else {
                                  // Usa getAttributeValue per tradurre
                                  displayValue = getAttributeValue(key, value, currentLang, product.attributi, product.variants, groupProducts);
                                }

                                return `${translatedKey}: ${displayValue}`;
                              })
                              .join(' • ')}
                          </p>
                        )}
                      </div>
                      <div className="text-left xs:text-right flex-shrink-0">
                        <p className="text-xl sm:text-2xl font-bold text-green-600">
                          €{product.prezzo.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {getLabel('product.price_suffix', currentLang)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sezione full-width: Descrizione AI */}
          <div className="border-t border-gray-200 px-3 sm:px-6 md:px-8 py-4 sm:py-8 bg-white">
            <Accordion
              title={getLabel('product.ai_description_title', currentLang) || 'Descrizione'}
              defaultOpen={false}
              icon={<span className="text-xl">🤖</span>}
            >
              <AIDescription
                productCode={product.codice}
                productData={{
                  nome: product.nome,
                  descrizione: product.descrizione,
                  immagine: product.immagine,
                  attributi: selectedVariant?.attributi || product.attributi
                }}
              />
            </Accordion>
          </div>

          {/* Sezione full-width: Specifiche tecniche dinamiche dalla variante */}
          {(() => {
            // Usa gli attributi della variante selezionata, altrimenti quelli del prodotto master
            const attributiToShow = selectedVariant?.attributi || product.attributi;

            // Lista campi da escludere (categorie dal _meta)
            const categoryFields = new Set([
              'Scuri alla Veneta',
              'Persiane a Muro',
              'Persiane con Telaio'
            ]);

            // Filtra gli attributi per escludere le categorie
            const filteredAttributes = Object.entries(attributiToShow || {}).filter(
              ([key]) => !categoryFields.has(key)
            );

            if (filteredAttributes.length === 0) return null;

            return (
              <div className="border-t border-gray-200 px-3 sm:px-6 md:px-8 py-4 sm:py-8 bg-gradient-to-br from-gray-50 via-white to-gray-50">
                <Accordion
                  title={getLabel('product.specifications_title', currentLang)}
                  defaultOpen={false}
                  icon={<span className="text-xl">📋</span>}
                >
                  <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredAttributes.map(([key, value]) => {
                    // Ottieni la label tradotta
                    // Prima prova ui-labels per attributi comuni
                    const normalizedKey = key.toLowerCase();
                    let attributeLabel = getLabel(`attributes.${normalizedKey}`, currentLang);

                    // Se non trovata in ui-labels, prova dal valore stesso
                    if (!attributeLabel && typeof value === 'object' && value !== null && 'label' in value) {
                      attributeLabel = getTranslatedValue(value.label, currentLang);
                    }

                    // Fallback: usa la chiave originale
                    if (!attributeLabel) {
                      attributeLabel = key;
                    }

                    // Ottieni il valore formattato e determina se è boolean
                    let displayValue = '';
                    let isBoolean = false;
                    let booleanValue = false;

                    if (typeof value === 'boolean') {
                      isBoolean = true;
                      booleanValue = value;
                      displayValue = value ? getLabel('common.yes', currentLang) : getLabel('common.no', currentLang);
                    } else if (typeof value === 'object' && value !== null) {
                      if ('value' in value) {
                        // Old structure: {value: ...}
                        const rawValue = value.value;
                        if (typeof rawValue === 'boolean') {
                          isBoolean = true;
                          booleanValue = rawValue;
                          displayValue = rawValue ? getLabel('common.yes', currentLang) : getLabel('common.no', currentLang);
                        } else if (typeof rawValue === 'object') {
                          // Valore multilingue - traduci
                          displayValue = getTranslatedValue(rawValue, currentLang);
                        } else {
                          // Stringa semplice - controlla se è "Yes"/"No"
                          const strValue = String(rawValue).toLowerCase();
                          if (strValue === 'yes' || strValue === 'sì' || strValue === 'si') {
                            isBoolean = true;
                            booleanValue = true;
                            displayValue = getLabel('common.yes', currentLang);
                          } else if (strValue === 'no') {
                            isBoolean = true;
                            booleanValue = false;
                            displayValue = getLabel('common.no', currentLang);
                          } else {
                            displayValue = String(rawValue);
                          }
                        }
                      } else {
                        // New structure: multilingual object {it: "...", en: "...", ...}
                        displayValue = getTranslatedValue(value, currentLang);
                      }
                    } else {
                      // Valore diretto (stringa o numero)
                      // Se è una stringa e esiste negli attributi del master come oggetto multilingua, usa quello
                      if (typeof value === 'string' && product.attributi && product.attributi[key]) {
                        const masterAttr = product.attributi[key];
                        if (typeof masterAttr === 'object' && masterAttr !== null && !('value' in masterAttr) && !('label' in masterAttr)) {
                          // È un oggetto multilingua diretto nel master
                          displayValue = getTranslatedValue(masterAttr, currentLang);
                        } else {
                          // Non è multilingua nel master, usa il valore così com'è
                          const strValue = value.toLowerCase();
                          if (strValue === 'yes' || strValue === 'sì' || strValue === 'si') {
                            isBoolean = true;
                            booleanValue = true;
                            displayValue = getLabel('common.yes', currentLang);
                          } else if (strValue === 'no') {
                            isBoolean = true;
                            booleanValue = false;
                            displayValue = getLabel('common.no', currentLang);
                          } else {
                            displayValue = String(value);
                          }
                        }
                      } else {
                        // Check for Yes/No
                        const strValue = String(value).toLowerCase();
                        if (strValue === 'yes' || strValue === 'sì' || strValue === 'si') {
                          isBoolean = true;
                          booleanValue = true;
                          displayValue = getLabel('common.yes', currentLang);
                        } else if (strValue === 'no') {
                          isBoolean = true;
                          booleanValue = false;
                          displayValue = getLabel('common.no', currentLang);
                        } else {
                          displayValue = String(value);
                        }
                      }
                    }

                    return (
                      <div
                        key={key}
                        className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-lg hover:border-green-300 transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <dt className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                          {attributeLabel}
                        </dt>
                        <dd className="text-sm sm:text-base font-semibold">
                          {isBoolean ? (
                            <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-bold shadow-sm ${
                              booleanValue
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700'
                            }`}>
                              {booleanValue ? '✓' : '✗'} {displayValue}
                            </span>
                          ) : (
                            <span className="text-gray-900 group-hover:text-green-600 transition-colors break-words">
                              {displayValue}
                            </span>
                          )}
                        </dd>
                        {/* Decorazione hover */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    );
                  })}
                  </dl>
                </Accordion>
              </div>
            );
          })()}

          {/* Dynamic Galleries - Generate based on variant configuration */}
          {dynamicGalleries.map((gallery, index) => (
            <div
              key={gallery.attribute}
              className={`border-t border-gray-200 px-3 sm:px-6 md:px-8 py-4 sm:py-8 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            >
              <ProductGrid
                products={gallery.products}
                title={`${getLabel('product.other', currentLang) || 'Altri'} ${gallery.attributeLabel}: ${gallery.value}`}
                viewAllLink={`/products?${gallery.attribute}=${encodeURIComponent(gallery.valueIt)}`}
                viewAllText={getLabel('product.view_all', currentLang) || 'Vedi tutti'}
                lang={currentLang}
                itemsPerPage={8}
              />
            </div>
          ))}

          {/* Sezione full-width: Altri hanno visto anche */}
          {mounted && alsoViewedProducts.length > 0 && (
            <div className="border-t border-gray-200 px-3 sm:px-6 md:px-8 py-4 sm:py-8 bg-white">
              <ProductGrid
                products={alsoViewedProducts}
                title={getLabel('product.also_viewed_title', currentLang) || 'Altri hanno visto anche'}
                lang={currentLang}
                itemsPerPage={8}
              />
            </div>
          )}

          {/* Sezione full-width: Visti di recente */}
          {mounted && recentProducts.length > 0 && (
            <div className="border-t border-gray-200 px-3 sm:px-6 md:px-8 py-4 sm:py-8 bg-gray-50">
              <ProductGrid
                products={recentProducts}
                title={getLabel('recently_viewed.title', currentLang) || 'Visti di recente'}
                lang={currentLang}
                itemsPerPage={8}
              />
            </div>
          )}

        </div>
      </main>

      {/* Sticky Add to Cart Bar - Mobile First */}
      <AnimatePresence>
        {showStickyCart && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50"
          >
            <div className="container mx-auto px-3 lg:px-6 py-2.5 lg:py-3">
              <div className="flex items-center gap-2 lg:gap-3">
              {/* Product Image - Hidden on mobile */}
              <div className="hidden sm:block relative w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={(selectedVariant?.immagine || product.immagine || product.immagini?.[0]) ?? '/placeholder.svg'}
                  alt={getTranslatedValue(product.nome, currentLang)}
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                />
              </div>

              {/* Product Info + Variant Pills */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 truncate">
                  {getTranslatedValue(product.nome, currentLang)}
                </h3>

                {/* Variant Pills - Mobile only */}
                {variantPills.length > 0 && (
                  <div className="flex gap-1 mt-1 lg:hidden">
                    {variantPills.map((pill, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price - Desktop only */}
              <div className="hidden lg:block text-right flex-shrink-0">
                <p className="text-lg font-bold text-emerald-600">
                  €{(selectedVariant?.prezzo || product.prezzo).toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* Wishlist Button */}
                <button
                  onClick={handleWishlistClick}
                  className={`font-bold py-2 px-2 sm:py-2.5 sm:px-2.5 lg:py-3 lg:px-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center ${
                    inWishlist
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
                  }`}
                  aria-label={inWishlist ? getLabel('product.remove_from_wishlist', currentLang) : getLabel('product.add_to_wishlist', currentLang)}
                >
                  <Heart className={`w-4 h-4 lg:w-5 lg:h-5 ${inWishlist ? 'fill-current' : ''}`} />
                </button>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2.5 sm:py-2.5 sm:px-3 lg:py-3 lg:px-5 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-1 lg:gap-2 text-xs sm:text-sm lg:text-base"
                >
                  <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">{getLabel('product.add', currentLang)}</span>
                  <span className="hidden lg:inline">{getLabel('product.add_to_cart', currentLang)}</span>
                </button>
              </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox per mobile (apertura da variante) */}
      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        slides={lightboxImages.map(img => ({ src: img, alt: nome }))}
        index={lightboxIndex}
        plugins={[Counter, Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
        on={{
          view: ({ index }) => setLightboxIndex(index),
        }}
      />

    </div>
  );
}
