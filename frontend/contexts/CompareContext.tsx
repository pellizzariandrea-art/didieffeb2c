'use client';

// contexts/CompareContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLanguage } from './LanguageContext';
import { getLabel } from '@/lib/ui-labels';

interface CompareContextType {
  compareProducts: string[]; // Array di codici prodotto
  addToCompare: (code: string) => void;
  removeFromCompare: (code: string) => void;
  clearCompare: () => void;
  isInCompare: (code: string) => boolean;
  maxCompareItems: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_ITEMS = 4; // Massimo 4 prodotti confrontabili

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareProducts, setCompareProducts] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const { currentLang } = useLanguage();

  // Carica dal localStorage al mount (solo client-side)
  useEffect(() => {
    const saved = localStorage.getItem('compareProducts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCompareProducts(parsed);
        }
      } catch (error) {
        console.error('Error loading compare products from localStorage:', error);
      }
    }
    setIsHydrated(true);
  }, []);

  // Salva nel localStorage quando cambia
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('compareProducts', JSON.stringify(compareProducts));
    }
  }, [compareProducts, isHydrated]);

  const addToCompare = (code: string) => {
    setCompareProducts((prev) => {
      // Non aggiungere se già presente
      if (prev.includes(code)) return prev;

      // Non aggiungere se abbiamo raggiunto il limite
      if (prev.length >= MAX_COMPARE_ITEMS) {
        setShowAlert(true);
        return prev;
      }

      return [...prev, code];
    });
  };

  const removeFromCompare = (code: string) => {
    setCompareProducts((prev) => prev.filter((c) => c !== code));
  };

  const clearCompare = () => {
    setCompareProducts([]);
  };

  const isInCompare = (code: string) => {
    return compareProducts.includes(code);
  };

  return (
    <CompareContext.Provider
      value={{
        compareProducts,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        maxCompareItems: MAX_COMPARE_ITEMS,
      }}
    >
      {children}

      {/* Custom Alert Modal */}
      {showAlert && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] animate-fade-in"
          onClick={() => setShowAlert(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">
                {getLabel('compare.max_products_alert.title', currentLang)}
              </h3>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-gray-700 text-base leading-relaxed">
                {getLabel('compare.max_products_alert.message', currentLang).replace('{max}', MAX_COMPARE_ITEMS.toString())}
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowAlert(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                {getLabel('compare.max_products_alert.ok', currentLang)}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
