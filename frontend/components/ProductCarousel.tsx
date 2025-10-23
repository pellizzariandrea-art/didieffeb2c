'use client';

// components/ProductCarousel.tsx - Carousel semplice per prodotti correlati
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import { getTranslatedValue } from '@/lib/product-utils';

interface ProductCarouselProps {
  products: Product[];
  title: string;
  lang?: string;
}

export default function ProductCarousel({
  products,
  title,
  lang = 'it',
}: ProductCarouselProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Titolo */}
      <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>

      {/* Carousel - Scroll orizzontale */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="flex gap-3 md:gap-4">
          {products.map((product) => {
            const nome = getTranslatedValue(product.nome, lang);
            const immagine = product.immagine || product.immagini?.[0];

            return (
              <Link
                key={product.codice}
                href={`/products/${product.codice}`}
                className="group flex-shrink-0 w-40 md:w-48 bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-emerald-500 hover:shadow-lg transition-all duration-200"
              >
                {/* Immagine prodotto */}
                <div className="relative aspect-square bg-gray-100">
                  {immagine ? (
                    <Image
                      src={immagine}
                      alt={nome}
                      fill
                      className="object-contain p-3 group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 768px) 160px, 192px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-4xl">
                      📦
                    </div>
                  )}
                </div>

                {/* Info prodotto */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5 group-hover:text-emerald-600 transition-colors">
                    {nome}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mb-2">{product.codice}</p>
                  {product.prezzo !== undefined && (
                    <p className="text-base md:text-lg font-bold text-emerald-600">
                      €{product.prezzo.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Hint scroll su mobile */}
      <p className="md:hidden text-xs text-gray-500 text-center">
        ← Scorri per vedere altri prodotti →
      </p>
    </div>
  );
}
