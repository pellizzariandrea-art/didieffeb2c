'use client';

// components/ProductGrid.tsx - Grid prodotti con paginazione
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Product } from '@/types/product';
import { getTranslatedValue } from '@/lib/product-utils';
import { getLabel } from '@/lib/ui-labels';

interface ProductGridProps {
  products: Product[];
  title: string;
  viewAllLink?: string;
  viewAllText?: string;
  lang?: string;
  itemsPerPage?: number; // Mobile: 4, Desktop: 8
}

export default function ProductGrid({
  products,
  title,
  viewAllLink,
  viewAllText = 'Vedi tutti',
  lang = 'it',
  itemsPerPage = 8,
}: ProductGridProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Calcola paginazione
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header con titolo e link "Vedi tutti" */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="flex items-center gap-1.5 text-sm md:text-base text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            {viewAllText}
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Grid prodotti */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {currentProducts.map((product) => {
          const nome = getTranslatedValue(product.nome, lang);
          const immagine = product.immagine || product.immagini?.[0];

          return (
            <Link
              key={product.codice}
              href={`/products/${product.codice}`}
              className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-emerald-500 hover:shadow-lg transition-all duration-200"
            >
              {/* Immagine prodotto */}
              <div className="relative aspect-square bg-gray-100">
                {immagine ? (
                  <Image
                    src={immagine}
                    alt={nome}
                    fill
                    className="object-contain p-3 group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
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

      {/* Paginazione */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          {/* Pulsante Precedente */}
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{getLabel('pagination.previous', lang)}</span>
          </button>

          {/* Indicatore pagina */}
          <span className="text-sm text-gray-600">
            {startIndex + 1}-{Math.min(endIndex, products.length)} {getLabel('pagination.of', lang)} {products.length}
          </span>

          {/* Pulsante Successivo */}
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden sm:inline">{getLabel('pagination.next', lang)}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
