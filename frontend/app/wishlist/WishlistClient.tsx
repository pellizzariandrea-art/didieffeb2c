'use client';

// app/wishlist/WishlistClient.tsx
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLabel } from '@/lib/ui-labels';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslatedValue } from '@/lib/product-utils';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { Product } from '@/types/product';
import CartIcon from '@/components/CartIcon';

interface WishlistClientProps {
  allProducts: Product[];
}

export default function WishlistClient({ allProducts }: WishlistClientProps) {
  const router = useRouter();
  const wishlistItems = useWishlistStore((state) => state.items);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const { currentLang } = useLanguage();
  const { addItem, openCart } = useCartStore();
  const [isClient, setIsClient] = useState(false);

  // Client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filter products based on wishlist codes
  const products = useMemo(() => {
    if (!isClient || wishlistItems.length === 0) {
      console.log('👁️ Wishlist: No items or not client-side yet', { isClient, itemsCount: wishlistItems.length });
      return [];
    }

    const wishlistCodes = wishlistItems.map((item) => item.codice);
    console.log('🔍 Wishlist codes:', wishlistCodes);
    console.log('📦 Total products available:', allProducts.length);

    const matchedProducts: Product[] = [];

    wishlistCodes.forEach(code => {
      // Try to match product directly
      const directMatch = allProducts.find((product) => product.codice === code);

      if (directMatch) {
        console.log(`✅ Direct match: ${code}`);
        matchedProducts.push(directMatch);
      } else {
        // Not found as master product, check if it's a variant
        let variantFound = false;

        for (const product of allProducts) {
          if (product.variants && product.variants.length > 0) {
            const variantMatch = product.variants.find(v => v.codice === code);

            if (variantMatch) {
              console.log(`🔄 Found ${code} as variant of ${product.codice}`);

              // Create a "virtual product" from the variant
              const virtualProduct: Product = {
                ...product, // Copy master product data
                codice: variantMatch.codice, // Use variant code
                nome: product.nome, // Use master product name (variants don't have nome)
                prezzo: variantMatch.prezzo, // Use variant price
                immagine: variantMatch.immagine || product.immagine, // Use variant image
                immagini: variantMatch.immagini || product.immagini,
                attributi: variantMatch.attributi || product.attributi,
                disponibilita: product.disponibilita, // Use master disponibilita (variants don't have it)
                variants: undefined, // Remove variants from virtual product
              };

              matchedProducts.push(virtualProduct);
              variantFound = true;
              break;
            }
          }
        }

        if (!variantFound) {
          console.warn(`⚠️ Product not found: ${code}`);
        }
      }
    });

    console.log('🎯 Total matches:', matchedProducts.length, matchedProducts.map(p => p.codice));

    return matchedProducts;
  }, [wishlistItems, allProducts, isClient]);

  const handleAddToCart = (product: Product) => {
    addItem({
      code: product.codice,
      name: getTranslatedValue(product.nome, currentLang),
      price: product.prezzo,
      image: product.immagine,
    }, 1);

    // Remove from wishlist after adding to cart
    removeItem(product.codice);

    toast.success(getLabel('cart.added_to_cart', currentLang), {
      description: getTranslatedValue(product.nome, currentLang),
      action: {
        label: getLabel('cart.view_cart', currentLang),
        onClick: () => openCart(),
      },
    });
  };

  const handleRemove = (codice: string, nome: any) => {
    removeItem(codice);
    toast.success(getLabel('product.remove_from_wishlist', currentLang), {
      description: getTranslatedValue(nome, currentLang),
    });
  };

  const handleClearAll = () => {
    toast(getLabel('wishlist.clear_all', currentLang) + '?', {
      description: `${wishlistItems.length} ${wishlistItems.length === 1 ? getLabel('cart.item', currentLang) : getLabel('cart.items', currentLang)}`,
      action: {
        label: getLabel('wishlist.clear_all', currentLang),
        onClick: () => {
          clearWishlist();
          toast.success(getLabel('wishlist.cleared', currentLang));
        },
      },
      cancel: {
        label: getLabel('common.cancel', currentLang) || 'Annulla',
        onClick: () => {},
      },
    });
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {getLabel('wishlist.title', currentLang)}
                  </h1>
                  {products.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {products.length} {products.length === 1 ? getLabel('home.product', currentLang) : getLabel('home.products', currentLang)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CartIcon />
              {products.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {getLabel('wishlist.clear_all', currentLang)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {getLabel('wishlist.empty_title', currentLang)}
            </h2>
            <p className="text-gray-600 mb-8 text-center max-w-md">
              {getLabel('wishlist.empty_message', currentLang)}
            </p>
            <Link
              href="/"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              {getLabel('cart.continue_shopping', currentLang)}
            </Link>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.codice}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden group"
              >
                {/* Image */}
                <Link href={`/products/${product.codice}`} className="block">
                  <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
                    <Image
                      src={product.immagine || '/placeholder.svg'}
                      alt={getTranslatedValue(product.nome, currentLang)}
                      fill
                      className="object-contain p-6 group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  {/* Code */}
                  <div className="text-xs text-gray-500 font-mono mb-2">
                    {product.codice}
                  </div>

                  {/* Name */}
                  <Link href={`/products/${product.codice}`}>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 line-clamp-2 min-h-[2.5rem] hover:text-emerald-600 transition-colors">
                      {getTranslatedValue(product.nome, currentLang)}
                    </h3>
                  </Link>

                  {/* Price */}
                  <p className="text-xl font-bold text-emerald-600 mb-4">
                    €{product.prezzo.toFixed(2).replace('.', ',')}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm font-semibold"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {getLabel('product.add_to_cart', currentLang)}
                      </span>
                      <span className="sm:hidden">+</span>
                    </button>

                    <button
                      onClick={() => handleRemove(product.codice, product.nome)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-lg transition-all"
                      title={getLabel('product.remove_from_wishlist', currentLang)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clear All Button - Mobile */}
        {products.length > 0 && (
          <div className="sm:hidden mt-8 flex justify-center">
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {getLabel('wishlist.clear_all', currentLang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
