'use client';

// components/CartIcon.tsx
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CartIcon() {
  const { openCart, getTotalItems } = useCartStore();
  const [prevCount, setPrevCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Ensure we only read from store on client side
  useEffect(() => {
    setIsClient(true);
    setTotalItems(getTotalItems());
  }, [getTotalItems]);

  // Subscribe to cart changes
  useEffect(() => {
    if (!isClient) return;

    const unsubscribe = useCartStore.subscribe((state) => {
      setTotalItems(state.getTotalItems());
    });

    return unsubscribe;
  }, [isClient]);

  // Trigger pulse animation when count changes
  useEffect(() => {
    if (totalItems > prevCount && totalItems > 0) {
      // Item was added
      const timeout = setTimeout(() => setPrevCount(totalItems), 300);
      return () => clearTimeout(timeout);
    }
    setPrevCount(totalItems);
  }, [totalItems, prevCount]);

  const shouldPulse = totalItems > prevCount;

  return (
    <button
      onClick={openCart}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label={`Open cart with ${totalItems} items`}
    >
      {/* Cart Icon */}
      <motion.div
        animate={shouldPulse ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <ShoppingCart className="w-6 h-6 text-gray-700" />
      </motion.div>

      {/* Badge */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg"
          >
            <motion.span
              key={totalItems}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {totalItems > 99 ? '99+' : totalItems}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse ring when item added */}
      {shouldPulse && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-emerald-400 rounded-lg"
        />
      )}
    </button>
  );
}
