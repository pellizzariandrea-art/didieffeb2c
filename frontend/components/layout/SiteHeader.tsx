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
import { Package } from 'lucide-react';

export default function SiteHeader() {
  const { currentLang } = useLanguage();
  const { currentBrand, setBrand, brandConfig } = useBrand();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === '/';

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
            className={`flex items-center gap-3 font-bold text-xl transition-colors ${
              isTransparent ? 'text-white' : 'text-gray-900'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isTransparent
                ? 'bg-white/10 backdrop-blur-sm'
                : 'bg-gradient-to-br from-green-500 to-emerald-600'
            }`}>
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="hidden md:block">{brandConfig.name}</span>
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
          </div>
        </div>
        </div>
      </header>
    </>
  );
}
