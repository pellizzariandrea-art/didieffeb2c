// hooks/useRecentlyViewed.ts
import { useEffect, useState } from 'react';
import { Product } from '@/types/product';

const MAX_RECENT_ITEMS = 12;
const STORAGE_KEY = 'recently-viewed-products';

interface RecentProduct {
  codice: string;
  nome: any;
  prezzo: number;
  immagine?: string;
  timestamp: number;
}

export function useRecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentProducts(parsed);
      } catch (e) {
        console.error('Error parsing recently viewed:', e);
      }
    }
  }, []);

  const addProduct = (product: Product) => {
    const newProduct: RecentProduct = {
      codice: product.codice,
      nome: product.nome,
      prezzo: product.prezzo,
      immagine: product.immagine,
      timestamp: Date.now(),
    };

    setRecentProducts((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.codice !== product.codice);

      // Add to beginning
      const updated = [newProduct, ...filtered];

      // Keep only MAX_RECENT_ITEMS
      const trimmed = updated.slice(0, MAX_RECENT_ITEMS);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

      return trimmed;
    });
  };

  const clearRecent = () => {
    setRecentProducts([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    recentProducts,
    addProduct,
    clearRecent,
  };
}
