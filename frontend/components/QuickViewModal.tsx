'use client';

// components/QuickViewModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLabel } from '@/lib/ui-labels';
import { getTranslatedValue } from '@/lib/product-utils';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { currentLang } = useLanguage();
  const { addItem, openCart } = useCartStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantCode, setSelectedVariantCode] = useState<string>('');

  // Reset quando il prodotto cambia
  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setSelectedVariantCode(product.codice);
    }
  }, [product]);

  // Previeni scroll del body quando modal è aperto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!product) return null;

  // Determina variante selezionata o prodotto master
  const selectedVariant = product.variants?.find(v => v.codice === selectedVariantCode);
  const displayProduct = selectedVariant || product;

  // Immagini da mostrare
  const images = displayProduct.immagini && displayProduct.immagini.length > 0
    ? displayProduct.immagini
    : displayProduct.immagine
    ? [displayProduct.immagine]
    : ['/placeholder.svg'];

  const handleAddToCart = () => {
    addItem({
      code: displayProduct.codice,
      name: getTranslatedValue(product.nome, currentLang), // Always use product name (variants don't have nome)
      price: displayProduct.prezzo,
      image: displayProduct.immagine || displayProduct.immagini?.[0],
    }, 1);

    toast.success(getLabel('cart.added_to_cart', currentLang), {
      action: {
        label: getLabel('cart.view_cart', currentLang),
        onClick: () => openCart(),
      },
    });
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-4 sm:inset-8 md:inset-12 lg:inset-16 xl:inset-24 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-6xl max-h-[90vh] overflow-hidden pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-4">
                  {getLabel('product.quick_view', currentLang)}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Left: Image Gallery */}
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                    <Image
                      src={images[selectedImageIndex]}
                      alt={getTranslatedValue(product.nome, currentLang)}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />

                    {/* Navigation Arrows - solo se più immagini */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-800" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-800" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {selectedImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                            idx === selectedImageIndex
                              ? 'border-blue-600 ring-2 ring-blue-200'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <Image
                            src={img}
                            alt={`${getTranslatedValue(product.nome, currentLang)} - ${idx + 1}`}
                            fill
                            className="object-contain p-1"
                            sizes="80px"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Product Info */}
                <div className="flex flex-col space-y-4">
                  {/* Product Code */}
                  <div className="text-sm text-gray-500">
                    {getLabel('product.code', currentLang)} {displayProduct.codice}
                  </div>

                  {/* Product Name */}
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {getTranslatedValue(product.nome, currentLang)}
                  </h1>

                  {/* Price */}
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-600">
                    €{displayProduct.prezzo.toFixed(2).replace('.', ',')}
                    <span className="text-sm text-gray-500 ml-2 font-normal">
                      {getLabel('product.price_suffix', currentLang)}
                    </span>
                  </div>

                  {/* Description */}
                  {product.descrizione && (
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <p className="line-clamp-4">
                        {getTranslatedValue(product.descrizione, currentLang)}
                      </p>
                    </div>
                  )}

                  {/* Variant Selector - se ci sono varianti */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {getLabel('product.select_variant', currentLang)}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {product.variants.map((variant) => (
                          <button
                            key={variant.codice}
                            onClick={() => setSelectedVariantCode(variant.codice)}
                            className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                              selectedVariantCode === variant.codice
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {variant.codice}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Actions */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    {/* Add to Cart */}
                    <button
                      onClick={handleAddToCart}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>{getLabel('product.add_to_cart', currentLang)}</span>
                    </button>

                    {/* View Full Details */}
                    <Link
                      href={`/products/${product.codice}`}
                      onClick={onClose}
                      className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>{getLabel('product.view_details', currentLang)}</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
