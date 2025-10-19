'use client';

// hooks/useRecentSearches.ts
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Carica ricerche recenti da localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Aggiungi una ricerca recente
  const addRecentSearch = (query: string) => {
    if (typeof window === 'undefined') return;
    if (!query || query.trim().length < 2) return;

    const trimmedQuery = query.trim().toLowerCase();

    setRecentSearches((prev) => {
      // Rimuovi duplicati e aggiungi in testa
      const filtered = prev.filter(s => s.toLowerCase() !== trimmedQuery);
      const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recent searches:', error);
      }

      return updated;
    });
  };

  // Rimuovi una ricerca specifica
  const removeRecentSearch = (query: string) => {
    if (typeof window === 'undefined') return;

    setRecentSearches((prev) => {
      const updated = prev.filter(s => s.toLowerCase() !== query.toLowerCase());

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error removing recent search:', error);
      }

      return updated;
    });
  };

  // Cancella tutte le ricerche recenti
  const clearRecentSearches = () => {
    if (typeof window === 'undefined') return;

    setRecentSearches([]);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}
