'use client';

// components/CompareBar.tsx
import { useCompare } from '@/contexts/CompareContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLabel } from '@/lib/ui-labels';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function CompareBar() {
  const { compareProducts, clearCompare, maxCompareItems } = useCompare();
  const { currentLang } = useLanguage();
  const pathname = usePathname();
  const [isMinimized, setIsMinimized] = useState(false);

  // Non mostrare la barra se non ci sono prodotti
  if (compareProducts.length === 0) {
    return null;
  }

  // Non mostrare la barra se siamo nella pagina di confronto
  if (pathname === '/compare') {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-2xl z-50 transition-transform duration-300 ${isMinimized ? 'translate-y-full' : 'translate-y-0'}`}>
      {/* Pulsante per minimizzare/espandere - sempre visibile */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute -top-10 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-2 rounded-t-lg shadow-lg hover:shadow-xl transition-all"
        aria-label={isMinimized ? getLabel('compare.show_compare_bar', currentLang) : getLabel('compare.hide_compare_bar', currentLang)}
      >
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${isMinimized ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Info prodotti selezionati */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="bg-white text-green-600 rounded-full p-1.5 sm:p-2 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base sm:text-lg truncate">
                {compareProducts.length} {compareProducts.length === 1 ? getLabel('compare.product', currentLang) : getLabel('compare.products', currentLang)}
              </p>
              <p className="text-xs sm:text-sm text-green-100 truncate">
                {getLabel('compare.selected_for_comparison', currentLang)} ({compareProducts.length}/{maxCompareItems})
              </p>
            </div>
          </div>

          {/* Azioni */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Pulsante Svuota */}
            <button
              onClick={clearCompare}
              className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-xs sm:text-sm font-medium shadow-md flex-shrink-0"
            >
              <span className="hidden xs:inline">{getLabel('compare.clear_all', currentLang)}</span>
              <span className="xs:hidden">{getLabel('compare.clear_all_short', currentLang)}</span>
            </button>

            {/* Pulsante Confronta (minimo 2 prodotti) */}
            {compareProducts.length >= 2 ? (
              <Link
                href="/compare"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-green-600 hover:bg-green-50 rounded-lg transition-colors font-bold shadow-lg flex items-center justify-center gap-2 text-xs sm:text-base flex-1 sm:flex-initial"
              >
                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden xs:inline">{getLabel('compare.compare_now', currentLang)}</span>
                <span className="xs:hidden">{getLabel('compare.compare_now_short', currentLang)}</span>
              </Link>
            ) : (
              <div className="px-3 sm:px-6 py-2 sm:py-3 bg-white/10 rounded-lg text-xs sm:text-sm text-green-100 flex-1 sm:flex-initial text-center">
                <span className="hidden xs:inline">{getLabel('compare.add_more_products', currentLang)}</span>
                <span className="xs:hidden">{getLabel('compare.add_more_short', currentLang)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
