'use client';

// components/RecentlyViewedCarousel.tsx
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { getLabel } from '@/lib/ui-labels';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslatedValue } from '@/lib/product-utils';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export default function RecentlyViewedCarousel() {
  const { recentProducts } = useRecentlyViewed();
  const { currentLang } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || recentProducts.length === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12 border-t border-gray-100">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {getLabel('recently_viewed.title', currentLang)}
              </h2>
              <p className="text-sm text-gray-600">
                {getLabel('recently_viewed.subtitle', currentLang)}
              </p>
            </div>
          </div>

          {/* Navigation Buttons - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        >
          {recentProducts.map((product) => (
            <Link
              key={product.codice}
              href={`/products/${product.codice}`}
              className="group flex-shrink-0 w-48 sm:w-56 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
                <Image
                  src={product.immagine || '/placeholder.svg'}
                  alt={getTranslatedValue(product.nome, currentLang)}
                  fill
                  className="object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 640px) 192px, 224px"
                />
              </div>

              {/* Info */}
              <div className="p-3 sm:p-4">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors min-h-[2.5rem]">
                  {getTranslatedValue(product.nome, currentLang)}
                </h3>
                <p className="text-lg font-bold text-emerald-600">
                  €{product.prezzo.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
