'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  currentLang: string;
  setLanguage: (lang: string) => void;
  availableLanguages: string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLang = 'it',
  availableLanguages = ['it', 'en', 'de', 'fr', 'es', 'pt']
}: {
  children: ReactNode;
  initialLang?: string;
  availableLanguages?: string[];
}) {
  const [currentLang, setCurrentLang] = useState(initialLang);
  const [isClient, setIsClient] = useState(false);

  // Dopo il mount, leggi la lingua da localStorage
  useEffect(() => {
    setIsClient(true);
    const savedLang = localStorage.getItem('preferred_language');
    if (savedLang && availableLanguages.includes(savedLang)) {
      setCurrentLang(savedLang);
    }
  }, [availableLanguages]);

  const setLanguage = (lang: string) => {
    if (availableLanguages.includes(lang)) {
      setCurrentLang(lang);
      if (isClient) {
        localStorage.setItem('preferred_language', lang);
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage, availableLanguages }}>
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
