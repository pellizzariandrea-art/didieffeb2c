'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

interface LanguageContextType {
  currentLang: string;
  setLanguage: (lang: string) => void;
  availableLanguages: string[];
  syncWithUserProfile: (userLang?: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLang = 'it',
  availableLanguages = ['it', 'en', 'de', 'fr', 'es', 'pt', 'hr', 'sl', 'el']
}: {
  children: ReactNode;
  initialLang?: string;
  availableLanguages?: string[];
}) {
  const [currentLang, setCurrentLang] = useState(initialLang);
  const [isClient, setIsClient] = useState(false);

  // Dopo il mount, leggi la lingua da localStorage (come fallback temporaneo)
  useEffect(() => {
    setIsClient(true);
    const savedLang = localStorage.getItem('preferred_language');
    if (savedLang && availableLanguages.includes(savedLang)) {
      setCurrentLang(savedLang);
    }
  }, [availableLanguages]);

  const setLanguage = useCallback((lang: string) => {
    if (availableLanguages.includes(lang)) {
      setCurrentLang(lang);
      if (isClient) {
        localStorage.setItem('preferred_language', lang);
      }
    }
  }, [availableLanguages, isClient]);

  // Sync language with user profile (called when user logs in or profile updates)
  const syncWithUserProfile = useCallback((userLang?: string) => {
    if (userLang && availableLanguages.includes(userLang)) {
      setCurrentLang(userLang);
      if (isClient) {
        localStorage.setItem('preferred_language', userLang);
      }
    }
  }, [availableLanguages, isClient]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentLang,
    setLanguage,
    availableLanguages,
    syncWithUserProfile
  }), [currentLang, setLanguage, availableLanguages, syncWithUserProfile]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
