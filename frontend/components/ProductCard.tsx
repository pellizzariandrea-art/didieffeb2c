'use client';

// components/ProductCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';
import { getTranslatedValue } from '@/lib/product-utils';
import { getLabel } from '@/lib/ui-labels';
import { useCompare } from '@/contexts/CompareContext';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { toast } from 'sonner';
import { ShoppingCart, Eye, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import QuickViewModal from './QuickViewModal';

interface ProductCardProps {
  product: Product;
  lang?: string;
  viewMode?: 'grid' | 'list';
  priority?: boolean;
}

export default function ProductCard({ product, lang = 'it', viewMode = 'grid', priority = false }: ProductCardProps) {
  const nome = getTranslatedValue(product.nome, lang);
  const imageUrl = product.immagine || '/placeholder.svg';
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { addItem, openCart, getItem } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const inCompare = isInCompare(product.codice);
  const [cartItem, setCartItem] = useState<ReturnType<typeof getItem> | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  // Calculate wishlist status (reactive with Zustand) - only after mount to avoid hydration mismatch
  const inWishlist = isClient ? isInWishlist(product.codice) : false;

  // Load cart item on client side only
  useEffect(() => {
    setIsClient(true);
    setCartItem(getItem(product.codice));
  }, [product.codice, getItem]);

  // Subscribe to cart changes
  useEffect(() => {
    if (!isClient) return;

    const unsubscribe = useCartStore.subscribe(() => {
      setCartItem(getItem(product.codice));
    });

    return unsubscribe;
  }, [isClient, product.codice, getItem]);

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inCompare) {
      removeFromCompare(product.codice);
    } else {
      addToCompare(product.codice);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      code: product.codice,
      name: nome,
      price: product.prezzo,
      image: product.immagine,
    }, 1);

    toast.success(getLabel('cart.added_to_cart', lang), {
      description: nome,
      action: {
        label: getLabel('cart.view_cart', lang),
        onClick: () => openCart(),
      },
    });
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const wasInWishlist = isInWishlist(product.codice);
    toggleItem(product.codice);

    if (wasInWishlist) {
      toast.success(getLabel('product.remove_from_wishlist', lang), {
        description: nome,
      });
    } else {
      toast.success(getLabel('product.add_to_wishlist', lang), {
        description: nome,
      });
    }
  };

  // Costruisci il titolo completo con i qualificatori della variante
  const getEnhancedTitle = () => {
    let title = nome;

    // Se ha qualificatori di variante, aggiungi al titolo
    if (product.variantQualifiers && Object.keys(product.variantQualifiers).length > 0 && product.attributi) {
      const qualifierParts: string[] = [];

      Object.entries(product.variantQualifiers).forEach(([key, value]) => {
        // Cerca il valore tradotto negli attributi
        if (product.attributi && product.attributi[key]) {
          const attr = product.attributi[key];
          if (attr.value) {
            // Se il valore è un oggetto con traduzioni, usa la lingua corrente
            const translatedValue = typeof attr.value === 'object' && attr.value !== null && lang in attr.value
              ? attr.value[lang]
              : (typeof attr.value === 'string' ? attr.value : String(value));

            if (translatedValue) {
              qualifierParts.push(translatedValue);
            }
          }
        } else {
          // Fallback: usa il valore grezzo dai qualifiers
          qualifierParts.push(String(value));
        }
      });

      if (qualifierParts.length > 0) {
        title = `${nome} - ${qualifierParts.join(' - ')}`;
      }
    }

    return title;
  };

  const enhancedTitle = getEnhancedTitle();

  // Costruisci il tooltip per il badge varianti
  const getVariantTooltip = () => {
    if (!product.variantQualifiers || !product.attributi) {
      return `${getLabel('variants.badge_long', lang)} ${product.variantOrder} ${getLabel('variants.badge_of', lang)} ${product.variantGroupTotal}`;
    }

    const qualifierParts: string[] = [];

    Object.entries(product.variantQualifiers).forEach(([key, value]) => {
      // Cerca la label e il valore tradotti negli attributi
      if (product.attributi && product.attributi[key]) {
        const attr = product.attributi[key];

        // Label tradotta
        const label = attr.label && typeof attr.label === 'object' && lang in attr.label
          ? attr.label[lang]
          : key;

        // Valore tradotto
        let translatedValue = '';
        if (attr.value) {
          translatedValue = typeof attr.value === 'object' && attr.value !== null && lang in attr.value
            ? attr.value[lang]
            : (typeof attr.value === 'string' ? attr.value : String(value));
        }

        if (label && translatedValue) {
          qualifierParts.push(`${label}: ${translatedValue}`);
        }
      }
    });

    if (qualifierParts.length > 0) {
      return `${getLabel('variants.badge_long', lang)} ${product.variantOrder}/${product.variantGroupTotal}\n${qualifierParts.join('\n')}`;
    }

    return `${getLabel('variants.badge_long', lang)} ${product.variantOrder} ${getLabel('variants.badge_of', lang)} ${product.variantGroupTotal}`;
  };

  // Vista lista
  if (viewMode === 'list') {
    return (
      <div className="relative">
        <Link
          href={`/products/${product.codice}`}
          className={`group flex flex-col sm:flex-row rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1 ${
            cartItem && cartItem.quantity > 0
              ? 'bg-gradient-to-r from-emerald-50 via-white to-white border-2 border-emerald-500 shadow-emerald-200'
              : 'bg-white border border-gray-200 hover:border-emerald-300'
          }`}
        >
          {/* Immagine Prodotto - responsive */}
          <div className="relative w-full sm:w-40 md:w-48 h-48 sm:h-auto sm:aspect-square flex-shrink-0 bg-white">
            <Image
              src={imageUrl}
              alt={nome}
              fill
              className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, 192px"
              priority={priority}
            />
          </div>

          {/* Info Prodotto - espansa */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Header: Codice e Badges */}
              <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-mono font-semibold rounded-md">
                  {product.codice}
                </span>

                <div className="flex flex-wrap gap-2">
                  {/* Badge Varianti - mostrato solo se fa parte di un gruppo varianti */}
                  {product.variantGroupTotal && product.variantGroupTotal > 1 && (
                    <div
                      className="bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm border-2 border-purple-300 cursor-help"
                      title={getVariantTooltip()}
                    >
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className="text-purple-900">
                          {product.variantOrder}/{product.variantGroupTotal}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Badge Risorse */}
                  {product.risorse && product.risorse.length > 0 && (
                    <div className="bg-orange-50 text-orange-700 text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm border-2 border-orange-300">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden xs:inline text-orange-900">
                          {product.risorse.length} {product.risorse.length === 1 ? getLabel('product.file', lang) : getLabel('product.files', lang)}
                        </span>
                        <span className="xs:hidden text-orange-900">{product.risorse.length}</span>
                      </span>
                    </div>
                  )}

                  {/* Badge In Carrello o Aggiungi al carrello */}
                  {cartItem && cartItem.quantity > 0 ? (
                    <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm border-2 border-emerald-400 animate-in fade-in zoom-in duration-300">
                      <span className="flex items-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-900">
                          {getLabel('cart.in_cart', lang)}: {cartItem.quantity}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm border-2 transition-all hover:scale-105 bg-emerald-50 text-emerald-700 border-emerald-400 hover:bg-emerald-100"
                      title={getLabel('product.add_to_cart', lang)}
                    >
                      <span className="flex items-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden xs:inline text-emerald-900">
                          {getLabel('product.add_to_cart', lang)}
                        </span>
                        <span className="xs:hidden text-emerald-900">+</span>
                      </span>
                    </button>
                  )}

                  {/* Badge Quick View */}
                  <button
                    onClick={handleQuickView}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm border-2 bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 transition-all hover:scale-105"
                    title={getLabel('product.quick_view', lang)}
                  >
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-gray-600" />
                      <span className="hidden sm:inline text-gray-900">
                        {getLabel('product.quick_view', lang)}
                      </span>
                      <span className="sm:hidden text-gray-900">👁</span>
                    </span>
                  </button>

                  {/* Badge Confronta - disponibile per tutti i prodotti */}
                  <button
                    onClick={handleCompareClick}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm border-2 transition-all hover:scale-105 ${
                      inCompare
                        ? 'bg-blue-50 text-blue-700 border-blue-400 hover:bg-blue-100'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                    title={inCompare ? getLabel('compare.remove', lang) : getLabel('compare.add', lang)}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className={`w-3.5 h-3.5 ${inCompare ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <span className={`hidden xs:inline ${inCompare ? 'text-blue-900' : 'text-gray-900'}`}>
                        {inCompare ? getLabel('compare.added', lang) : getLabel('compare.add_short', lang)}
                      </span>
                      <span className={`xs:hidden ${inCompare ? 'text-blue-900' : 'text-gray-900'}`}>
                        {inCompare ? '✓' : '+'}
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Nome con qualificatori variante */}
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                {enhancedTitle}
              </h3>
            </div>

            {/* Footer: Prezzo e CTA */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mt-4">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">{getLabel('home.price_label', lang)}</p>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  €{product.prezzo.toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* CTA Button */}
              <div className="bg-emerald-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl group-hover:bg-emerald-800 transition-colors shadow-md group-hover:shadow-xl flex items-center gap-2 font-semibold text-sm sm:text-base w-full xs:w-auto justify-center">
                <span className="hidden sm:inline">{getLabel('home.view_details', lang)}</span>
                <span className="sm:hidden">Dettagli</span>
                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Vista griglia (default)
  return (
    <div className="relative">
      <Link
        href={`/products/${product.codice}`}
        className={`group block rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1 ${
          cartItem && cartItem.quantity > 0
            ? 'bg-gradient-to-b from-emerald-50 via-emerald-50/50 to-white border-2 border-emerald-500 shadow-emerald-200'
            : 'bg-white border border-gray-200 hover:border-emerald-300'
        }`}
      >
        {/* Immagine Prodotto - padding ridotto su mobile */}
        <div className="relative aspect-square bg-white">
          <Image
            src={imageUrl}
            alt={nome}
            fill
            className="object-contain p-3 sm:p-6 group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />

          {/* Quick View Hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
            <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <div className="bg-white rounded-full px-6 py-3 shadow-xl flex items-center gap-2 font-semibold text-sm text-gray-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {getLabel('home.view_details', lang)}
              </div>
            </div>
          </div>
        </div>

        {/* Info Prodotto - padding ridotto su mobile */}
        <div className="p-3 sm:p-5">
          {/* Codice */}
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 text-[9px] sm:text-xs font-mono font-semibold rounded-md">
              {product.codice}
            </span>
          </div>

          {/* Nome con qualificatori variante - testo più piccolo su mobile */}
          <h3 className="text-xs sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-3 line-clamp-2 min-h-[2rem] sm:min-h-[3rem] group-hover:text-emerald-700 transition-colors">
            {enhancedTitle}
          </h3>

          {/* Footer con Prezzo - più compatto su mobile */}
          <div className="flex items-center justify-between pt-1.5 sm:pt-3 border-t border-gray-100">
            <div>
              <p className="text-[8px] sm:text-xs text-gray-500 font-medium mb-0.5">{getLabel('home.price_label', lang)}</p>
              <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                €{product.prezzo.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>

          {/* Action Buttons - centrati sotto al prezzo per tutti i dispositivi */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 justify-center">
            {/* Wishlist Heart */}
            <button
              onClick={handleWishlistToggle}
              className="bg-white hover:bg-gray-50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 border-2 border-emerald-500"
              title={inWishlist ? getLabel('product.remove_from_wishlist', lang) : getLabel('product.add_to_wishlist', lang)}
            >
              <Heart
                className={`w-4 h-4 transition-all ${inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
              />
            </button>

            {/* Quick View Button */}
            <button
              onClick={handleQuickView}
              className="bg-gray-700 hover:bg-gray-800 text-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
              title={getLabel('product.quick_view', lang)}
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Compare Button */}
            <button
              onClick={handleCompareClick}
              className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 border-2 ${
                inCompare
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-400'
              }`}
              title={inCompare ? getLabel('compare.remove', lang) : getLabel('compare.add', lang)}
            >
              <svg className={`w-4 h-4 ${inCompare ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </button>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
              title={getLabel('product.add_to_cart', lang)}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>

      {/* Badges informativi - fuori dal Link per mostrare i tooltip */}
      <div className="absolute top-3 left-3 right-3 flex items-start gap-2 flex-wrap pointer-events-none z-10">
        {/* Badge Varianti */}
        {product.variantGroupTotal && product.variantGroupTotal > 1 && (
          <div
            className="bg-purple-50/95 backdrop-blur-sm text-purple-700 text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg border-2 border-purple-400 cursor-help pointer-events-auto"
            title={getVariantTooltip()}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-purple-900">
                {product.variantOrder}/{product.variantGroupTotal}
              </span>
            </span>
          </div>
        )}

        {/* Badge Risorse */}
        {product.risorse && product.risorse.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm text-orange-700 text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg border-2 border-orange-400 pointer-events-auto">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-orange-900">
                {product.risorse.length} {product.risorse.length === 1 ? getLabel('product.file', lang) : getLabel('product.files', lang)}
              </span>
            </span>
          </div>
        )}

        {/* Badge In Carrello */}
        {cartItem && cartItem.quantity > 0 && (
          <div className="bg-emerald-50/95 backdrop-blur-sm text-emerald-700 text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg border-2 border-emerald-400 pointer-events-auto animate-in fade-in zoom-in duration-300">
            <span className="flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-900">
                {getLabel('cart.in_cart', lang)}: {cartItem.quantity}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />
    </div>
  );
}
