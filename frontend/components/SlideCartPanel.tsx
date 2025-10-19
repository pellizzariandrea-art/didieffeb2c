'use client';

// components/SlideCartPanel.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getLabel } from '@/lib/ui-labels';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export default function SlideCartPanel() {
  const { isOpen, closeCart, items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCartStore();
  const { currentLang } = useLanguage();
  const { addItem: addToWishlist } = useWishlistStore();

  const handleSaveForLater = (item: typeof items[0]) => {
    // Add to wishlist
    addToWishlist(item.code);
    // Remove from cart
    removeItem(item.code);
    // Show toast
    toast.success(getLabel('cart.saved_for_later', currentLang), {
      description: item.name,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Slide Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {getLabel('cart.title', currentLang)}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {getTotalItems()} {getTotalItems() === 1 ? getLabel('cart.item', currentLang) : getLabel('cart.items', currentLang)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {items.length === 0 ? (
                // Empty State
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {getLabel('cart.empty_title', currentLang)}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {getLabel('cart.empty_message', currentLang)}
                  </p>
                  <button
                    onClick={closeCart}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                  >
                    {getLabel('cart.continue_shopping', currentLang)}
                  </button>
                </div>
              ) : (
                // Items List
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.code}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      {/* Product Image */}
                      <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden shadow-sm">
                        <Image
                          src={item.image || '/placeholder.svg'}
                          alt={item.name}
                          fill
                          className="object-contain p-2"
                          sizes="80px"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-0.5">
                          {item.name || 'Prodotto'}
                        </h3>
                        <p className="text-xs text-gray-500 mb-1">
                          {getLabel('product.code', currentLang)} {item.code}
                        </p>
                        {item.variantInfo && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                            {item.variantInfo}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.code, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center bg-white rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3 text-gray-700" />
                            </button>
                            <span className="w-8 text-center font-semibold text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.code, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center bg-white rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3 text-gray-700" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-700">
                              €{(item.price * item.quantity).toFixed(2).replace('.', ',')}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-xs text-gray-500">
                                €{item.price.toFixed(2).replace('.', ',')} cad.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Save for Later Button */}
                        <button
                          onClick={() => handleSaveForLater(item)}
                          className="mt-2 flex items-center gap-1.5 text-xs text-gray-600 hover:text-emerald-600 transition-colors group"
                        >
                          <Heart className="w-3.5 h-3.5 group-hover:fill-emerald-600 transition-all" />
                          <span className="font-medium">{getLabel('cart.save_for_later', currentLang)}</span>
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.code)}
                        className="flex-shrink-0 p-2 hover:bg-red-50 rounded-lg transition-colors self-start"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Only show if cart has items */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-4 sm:p-6 bg-white">
                {/* Total */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-900">
                    {getLabel('cart.total', currentLang)}
                  </span>
                  <span className="text-2xl font-bold text-emerald-700">
                    €{getTotalPrice().toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 sm:py-4 px-6 rounded-lg font-bold text-center transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {getLabel('cart.checkout', currentLang)}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={closeCart}
                    className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors"
                  >
                    {getLabel('cart.continue_shopping', currentLang)}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
