'use client';

// components/WishlistIcon.tsx
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function WishlistIcon() {
  const count = useWishlistStore((state) => state.getCount());
  const [mounted, setMounted] = useState(false);

  // Wait for client-side hydration to avoid mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use 0 during SSR to match server-rendered HTML
  const displayCount = mounted ? count : 0;

  return (
    <Link
      href="/wishlist"
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label={`Wishlist with ${displayCount} items`}
    >
      {/* Heart Icon */}
      <Heart className={`w-6 h-6 transition-colors ${displayCount > 0 ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />

      {/* Badge - only show after hydration */}
      {mounted && (
        <AnimatePresence>
          {displayCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg"
            >
              <motion.span
                key={displayCount}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {displayCount > 99 ? '99+' : displayCount}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Link>
  );
}
