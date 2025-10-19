'use client';

// components/ProductNavigationBar.tsx
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Product } from '@/types/product';
import { getTranslatedValue } from '@/lib/product-utils';
import { getLabel } from '@/lib/ui-labels';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProductNavigationBarProps {
  products: Product[];
  currentProductCode: string;
  lang: string;
  onCollapseChange?: (collapsed: boolean, button: React.ReactNode) => void;
}

export default function ProductNavigationBar({
  products,
  currentProductCode,
  lang,
  onCollapseChange,
}: ProductNavigationBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const galleryRef = useRef<HTMLDivElement>(null);
  const onCollapseChangeRef = useRef(onCollapseChange);

  // Trova l'indice del prodotto corrente
  const currentIndex = products.findIndex(p => p.codice === currentProductCode);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < products.length - 1;

  // Limita i prodotti visualizzati nella galleria (max 50: 25 prima + 25 dopo)
  const MAX_VISIBLE_PRODUCTS = 50;
  const visibleProducts = useMemo(() => {
    if (products.length <= MAX_VISIBLE_PRODUCTS) {
      return products; // Mostra tutti se sono pochi
    }

    // Calcola il range: 25 prima e 25 dopo il prodotto corrente
    const halfRange = Math.floor(MAX_VISIBLE_PRODUCTS / 2);
    let startIdx = Math.max(0, currentIndex - halfRange);
    let endIdx = Math.min(products.length, currentIndex + halfRange + 1);

    // Aggiusta se siamo vicino all'inizio o alla fine
    if (endIdx - startIdx < MAX_VISIBLE_PRODUCTS) {
      if (startIdx === 0) {
        endIdx = Math.min(products.length, MAX_VISIBLE_PRODUCTS);
      } else if (endIdx === products.length) {
        startIdx = Math.max(0, products.length - MAX_VISIBLE_PRODUCTS);
      }
    }

    return products.slice(startIdx, endIdx);
  }, [products, currentIndex]);

  // Centra il prodotto corrente quando cambia o quando la galleria viene espansa
  useEffect(() => {
    if (!isCollapsed && galleryRef.current) {
      const currentElement = galleryRef.current.querySelector(`[data-product-index="${currentIndex}"]`);
      if (currentElement) {
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentIndex, isCollapsed]);

  const goToPrev = () => {
    if (hasPrev) {
      router.push(`/products/${products[currentIndex - 1].codice}`);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      router.push(`/products/${products[currentIndex + 1].codice}`);
    }
  };

  // Aggiorna il ref quando cambia la callback
  useEffect(() => {
    onCollapseChangeRef.current = onCollapseChange;
  }, [onCollapseChange]);

  // Notifica il parent quando lo stato collapsed cambia
  useEffect(() => {
    const callback = onCollapseChangeRef.current;
    if (callback && isCollapsed) {
      const expandButton = (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium flex-shrink-0 text-xs sm:text-sm"
          title={getLabel('navigation.expand_gallery', lang, { count: visibleProducts.length })}
        >
          <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="hidden sm:inline">{getLabel('navigation.expand_gallery', lang, { count: visibleProducts.length })}</span>
          <span className="sm:hidden">Galleria</span>
        </button>
      );
      callback(true, expandButton);
    } else if (callback && !isCollapsed) {
      callback(false, null);
    }
  }, [isCollapsed, visibleProducts.length, lang]);

  if (products.length <= 1) {
    return null; // Non mostrare se c'è solo un prodotto
  }

  return (
    <>
      {/* Desktop: Galleria completa riducibile */}
      <div className={`hidden md:block ${isCollapsed ? 'relative' : 'sticky top-[120px]'} z-40 bg-gradient-to-r from-gray-50 to-white shadow-md`}>
        <div className="container mx-auto px-4 py-2 border-b border-gray-200">
          {!isCollapsed ? (
            // Vista espansa con galleria
            <div className="flex flex-col gap-1">
              {/* Pulsante Riduci centrato e più evidente */}
              <div className="flex justify-center">
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-md font-semibold"
                  title={getLabel('navigation.collapse_gallery', lang)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span className="text-sm">{getLabel('navigation.collapse_gallery', lang)}</span>
                </button>
              </div>

              {/* Galleria con frecce */}
              <div className="flex items-center gap-4">
                {/* Freccia Prev */}
              <button
                onClick={goToPrev}
                disabled={!hasPrev}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                  hasPrev
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Galleria scrollabile */}
              <div ref={galleryRef} className="flex-1 overflow-x-auto overflow-y-visible">
                <div className="flex gap-2 py-6 px-12">
                  {visibleProducts.map((product) => {
                    const isCurrent = product.codice === currentProductCode;
                    // Trova l'indice reale nel catalogo completo
                    const realIdx = products.findIndex(p => p.codice === product.codice);
                    return (
                      <Link
                        key={product.codice}
                        href={`/products/${product.codice}`}
                        data-product-index={realIdx}
                        className={`flex-shrink-0 w-32 group transition-all duration-300 hover:scale-[1.3] hover:z-50 ${
                          isCurrent ? 'ring-2 ring-emerald-500 rounded-lg' : ''
                        }`}
                      >
                        <div className={`relative w-24 h-24 bg-gray-50 rounded-lg overflow-hidden mx-auto ${
                          isCurrent ? 'shadow-md' : 'group-hover:shadow-xl'
                        } transition-shadow`}>
                          <Image
                            src={product.immagine || '/placeholder.svg'}
                            alt=""
                            fill
                            className="object-contain p-2"
                            sizes="96px"
                          />
                          {isCurrent && (
                            <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none"></div>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-sm font-bold text-gray-800">{realIdx + 1}.</span>
                          <p className="text-xs text-gray-600 line-clamp-1 flex-1 font-medium">
                            {getTranslatedValue(product.nome, lang)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Freccia Next */}
              <button
                onClick={goToNext}
                disabled={!hasNext}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                  hasNext
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile: Solo frecce prev/next */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-3 py-2 flex items-center justify-between">
          <button
            onClick={goToPrev}
            disabled={!hasPrev}
            className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
              hasPrev
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
            aria-label={getLabel('navigation.previous', lang)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-sm font-semibold text-gray-700">
            {currentIndex + 1} / {products.length}
          </span>

          <button
            onClick={goToNext}
            disabled={!hasNext}
            className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
              hasNext
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
            aria-label={getLabel('navigation.next', lang)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
