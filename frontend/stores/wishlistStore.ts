// stores/wishlistStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  codice: string;
  timestamp: number;
}

interface WishlistStore {
  items: WishlistItem[];

  // Actions
  addItem: (codice: string) => void;
  removeItem: (codice: string) => void;
  toggleItem: (codice: string) => void;
  clearWishlist: () => void;

  // Computed
  isInWishlist: (codice: string) => boolean;
  getCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (codice) => {
        const exists = get().items.some(item => item.codice === codice);
        if (exists) {
          console.log('⚠️ Item already in wishlist:', codice);
          return;
        }

        const newItem: WishlistItem = {
          codice,
          timestamp: Date.now(),
        };

        set({ items: [...get().items, newItem] });
        console.log('❤️ Added to wishlist:', codice, 'New count:', get().items.length);
      },

      removeItem: (codice) => {
        set({ items: get().items.filter(item => item.codice !== codice) });
        console.log('🗑️ Removed from wishlist:', codice, 'New count:', get().items.length);
      },

      toggleItem: (codice) => {
        const exists = get().items.some(item => item.codice === codice);
        if (exists) {
          get().removeItem(codice);
        } else {
          get().addItem(codice);
        }
      },

      clearWishlist: () => {
        set({ items: [] });
        console.log('🗑️ Wishlist cleared');
      },

      isInWishlist: (codice) => {
        return get().items.some(item => item.codice === codice);
      },

      getCount: () => {
        return get().items.length;
      },
    }),
    {
      name: 'wishlist-products', // localStorage key (keep same as old hook for compatibility)

      // Migrate old format to new format
      migrate: (persistedState: any, version: number) => {
        // Check if it's the old format (array directly, not wrapped in state object)
        if (Array.isArray(persistedState)) {
          console.log('🔄 Migrating old wishlist format to new format');
          return {
            items: persistedState,
          } as WishlistStore;
        }
        return persistedState as WishlistStore;
      },

      onRehydrateStorage: () => (state) => {
        console.log('📂 Wishlist rehydrated from localStorage:', state?.items.length || 0, 'items');
      },
    }
  )
);
