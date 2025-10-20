'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Brand = 'group' | 'didieffe' | 'antologia' | 'hnox' | 'xtrend';

interface BrandConfig {
  id: Brand;
  name: string;
  fullName: string;
  domain: string;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  description: string;
}

export const brandConfigs: Record<Brand, BrandConfig> = {
  group: {
    id: 'group',
    name: 'Didieffe Group',
    fullName: 'Didieffe Group',
    domain: 'didieffegroup.com',
    primaryColor: '#059669', // emerald-600
    secondaryColor: '#10b981', // emerald-500
    logo: '/images/logos/didieffe-group.png',
    description: 'Il gruppo leader nella produzione di ferramenta e accessori per serramenti'
  },
  didieffe: {
    id: 'didieffe',
    name: 'Didieffe',
    fullName: 'Didieffe S.r.l.',
    domain: 'didieffe.com',
    primaryColor: '#059669', // emerald-600 - verde Didieffe
    secondaryColor: '#10b981', // emerald-500
    description: 'Ferramenta di qualità per serramenti in legno'
  },
  antologia: {
    id: 'antologia',
    name: 'Antologia Classica',
    fullName: 'Antologia Classica',
    domain: 'antologiaclassica.it',
    primaryColor: '#7c3aed', // violet-600
    secondaryColor: '#8b5cf6', // violet-500
    description: 'Eleganza classica per i tuoi serramenti'
  },
  hnox: {
    id: 'hnox',
    name: 'Hìnox',
    fullName: 'Hìnox',
    domain: 'hnox.it',
    primaryColor: '#0891b2', // cyan-600
    secondaryColor: '#06b6d4', // cyan-500
    description: 'Ferramenta per persiane in acciaio inox'
  },
  xtrend: {
    id: 'xtrend',
    name: 'X-Trend',
    fullName: 'X-Trend',
    domain: 'x-trend.it',
    primaryColor: '#ea580c', // orange-600
    secondaryColor: '#f97316', // orange-500
    description: 'Design made ideas'
  }
};

interface BrandContextType {
  currentBrand: Brand;
  brandConfig: BrandConfig;
  setBrand: (brand: Brand) => void;
  isGroup: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

interface BrandProviderProps {
  children: ReactNode;
  initialBrand?: Brand;
}

export function BrandProvider({ children, initialBrand = 'group' }: BrandProviderProps) {
  const [currentBrand, setCurrentBrand] = useState<Brand>(initialBrand);

  // Detect brand from URL on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const brandParam = params.get('brand') as Brand;

      if (brandParam && brandParam in brandConfigs) {
        setCurrentBrand(brandParam);
      }
    }
  }, []);

  const setBrand = (brand: Brand) => {
    setCurrentBrand(brand);
    // Update URL without reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('brand', brand);
      window.history.pushState({}, '', url);
    }
  };

  const value: BrandContextType = {
    currentBrand,
    brandConfig: brandConfigs[currentBrand],
    setBrand,
    isGroup: currentBrand === 'group'
  };

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
