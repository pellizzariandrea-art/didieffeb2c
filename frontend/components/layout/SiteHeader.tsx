'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useBrand } from '@/contexts/BrandContext';
import { getCommonText, Language } from '@/lib/common-translations';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import LanguageSelector from '../LanguageSelector';
import CartIcon from '../CartIcon';
import WishlistIcon from '../WishlistIcon';
import UserIcon from '../UserIcon';
import { Package } from 'lucide-react';

interface SettingsResponse {
  success: boolean;
  settings: {
    company: {
      name: string;
      address?: string;
      city?: string;
      postalCode?: string;
      province?: string;
      country?: string;
      website?: string;
      email?: string;
      phone?: string;
      vatNumber?: string;
      taxCode?: string;
    };
    logo?: {
      base64: string;
      type: string;
    };
  };
}

export default function SiteHeader() {
  const { currentLang } = useLanguage();
  const { currentBrand, setBrand, brandConfig } = useBrand();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isHome = pathname === '/';

  // Load company settings
  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading settings:', err);
        setIsLoading(false);
      });
  }, []);

  // Traccia lo scroll per cambiare l'header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Header è trasparente solo in homepage SENZA scroll E solo per brand NON group (group ha sfondo bianco)
  const isTransparent = isHome && !scrolled && currentBrand !== 'group';

  // Check if base64 already includes the data URI prefix
  const logoSrc = settings?.settings?.logo
    ? (settings.settings.logo.base64.startsWith('data:')
        ? settings.settings.logo.base64
        : `data:${settings.settings.logo.type};base64,${settings.settings.logo.base64}`)
    : null;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isTransparent
          ? 'bg-transparent'
          : 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center gap-3 transition-colors ${
              isTransparent ? 'text-white' : 'text-gray-900'
            }`}
          >
            {isLoading ? (
              // Skeleton placeholder durante caricamento
              <div className="h-12 w-32 bg-gray-200 animate-pulse rounded"></div>
            ) : logoSrc ? (
              <img
                src={logoSrc}
                alt={settings?.settings?.company?.name || 'Logo'}
                className="h-12 w-auto object-contain max-w-[200px]"
              />
            ) : (
              <span className="text-xl font-bold">
                {settings?.settings?.company?.name || 'Company'}
              </span>
            )}
          </Link>

          {/* Center: Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`font-medium whitespace-nowrap transition-colors hover:text-green-600 ${
                isTransparent
                  ? 'text-white hover:text-green-400'
                  : pathname === '/'
                    ? 'text-green-600'
                    : 'text-gray-700'
              }`}
            >
              {getCommonText('navHome', currentLang as Language)}
</Link>

            <Link
              href="/about"
              className={`font-medium whitespace-nowrap transition-colors hover:text-green-600 ${
                isTransparent
                  ? 'text-white hover:text-green-400'
                  : pathname === '/about'
                    ? 'text-green-600'
                    : 'text-gray-700'
              }`}
            >
              {getCommonText('navCompany', currentLang as Language)}
</Link>

            <Link
              href="/products"
              className={`font-medium whitespace-nowrap transition-colors hover:text-green-600 ${
                isTransparent
                  ? 'text-white hover:text-green-400'
                  : pathname === '/products'
                    ? 'text-green-600'
                    : 'text-gray-700'
              }`}
            >
              {getCommonText('navCatalog', currentLang as Language)}
</Link>

            <Link
              href="/download"
              className={`font-medium whitespace-nowrap transition-colors hover:text-green-600 ${
                isTransparent
                  ? 'text-white hover:text-green-400'
                  : pathname === '/download'
                    ? 'text-green-600'
                    : 'text-gray-700'
              }`}
            >
              Download
            </Link>

            <Link
              href="/gallery"
              className={`font-medium whitespace-nowrap transition-colors hover:text-green-600 ${
                isTransparent
                  ? 'text-white hover:text-green-400'
                  : pathname === '/gallery'
                    ? 'text-green-600'
                    : 'text-gray-700'
              }`}
            >
              Gallery
            </Link>

            <Link
              href="/careers"
              className={`font-medium whitespace-nowrap transition-colors hover:text-green-600 ${
                isTransparent
                  ? 'text-white hover:text-green-400'
                  : pathname === '/careers'
                    ? 'text-green-600'
                    : 'text-gray-700'
              }`}
            >
              {getCommonText('navCareers', currentLang as Language)}
</Link>

            <Link
              href="/contact"
              className={`font-medium whitespace-nowrap transition-colors hover:text-green-600 ${
                isTransparent
                  ? 'text-white hover:text-green-400'
                  : pathname === '/contact'
                    ? 'text-green-600'
                    : 'text-gray-700'
              }`}
            >
              {getCommonText('navContact', currentLang as Language)}
</Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <WishlistIcon />
            <CartIcon />
            <UserIcon />
          </div>
        </div>
        </div>
      </header>
    </>
  );
}
