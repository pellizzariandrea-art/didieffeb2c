'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getCommonText, Language } from '@/lib/common-translations';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Category {
  name: string;
  productCount: number;
  image: string;
  link: string;
}

interface CategoryGridProps {
  categories: Category[];
  title: string;
  type: 'serie' | 'linea' | 'applicazione';
}

export default function CategoryGrid({ categories, title, type }: CategoryGridProps) {
  const { currentLang } = useLanguage();

  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-24 px-4 bg-white">
      <div className="container mx-auto">
        {/* Intestazione */}
        <div className="max-w-3xl mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {title}
          </h2>
          <p className="text-xl text-gray-600">
            {getCommonText('precisionComponents', currentLang as Language)}
          </p>
        </div>

        {/* Grid Categorie - Layout Moderno e Pulito */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.link}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-green-300 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              {/* Immagine con background pulito */}
              <div className="relative h-80 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-contain p-12 transition-all duration-700 group-hover:scale-110 group-hover:p-8"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Gradient leggero solo in basso */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
              </div>

              {/* Content sotto immagine con sfondo bianco */}
              <div className="relative bg-white p-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="inline-block px-3 py-1 rounded-full bg-green-50 border border-green-200 mb-3">
                      <span className="text-xs uppercase tracking-wider text-green-600 font-bold">
                        {type === 'serie' && getCommonText('serie', currentLang as Language)}
                        {type === 'linea' && getCommonText('linea', currentLang as Language)}
                        {type === 'applicazione' && getCommonText('applicazione', currentLang as Language)}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {category.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                      <p className="text-sm text-gray-600 font-medium">
                        {category.productCount}{' '}
                        {getCommonText('products', currentLang as Language)}
                      </p>
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/20">
                    <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All - Minimal */}
        <div className="mt-16 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-gray-900 hover:text-green-600 font-semibold text-lg group transition-colors"
          >
            {getCommonText('exploreAllProducts', currentLang as Language)}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
