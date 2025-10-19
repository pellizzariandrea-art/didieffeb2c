'use client';

// contexts/ProductNavigationContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@/types/product';

interface CatalogState {
  searchQuery: string;
  selectedFilters: Record<string, string[]>;
  scrollPosition: number;
}

interface ProductNavigationContextType {
  navigationProducts: Product[];
  setNavigationProducts: (products: Product[]) => void;
  clearNavigation: () => void;
  saveCatalogState: (state: CatalogState) => void;
  getCatalogState: () => CatalogState | null;
  clearCatalogState: () => void;
}

const ProductNavigationContext = createContext<ProductNavigationContextType | undefined>(undefined);

const CATALOG_STATE_KEY = 'catalog_state';

export function ProductNavigationProvider({ children }: { children: ReactNode }) {
  const [navigationProducts, setNavigationProducts] = useState<Product[]>([]);

  const clearNavigation = () => {
    setNavigationProducts([]);
  };

  const saveCatalogState = (state: CatalogState) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CATALOG_STATE_KEY, JSON.stringify(state));
    }
  };

  const getCatalogState = (): CatalogState | null => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CATALOG_STATE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing catalog state:', e);
          return null;
        }
      }
    }
    return null;
  };

  const clearCatalogState = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CATALOG_STATE_KEY);
    }
  };

  return (
    <ProductNavigationContext.Provider
      value={{
        navigationProducts,
        setNavigationProducts,
        clearNavigation,
        saveCatalogState,
        getCatalogState,
        clearCatalogState,
      }}
    >
      {children}
    </ProductNavigationContext.Provider>
  );
}

export function useProductNavigation() {
  const context = useContext(ProductNavigationContext);
  if (context === undefined) {
    throw new Error('useProductNavigation must be used within a ProductNavigationProvider');
  }
  return context;
}
