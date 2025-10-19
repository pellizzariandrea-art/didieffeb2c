// stores/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  code: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantInfo?: string; // es: "Rame bugnato • Ferro • 155x125mm"
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (code: string) => void;
  updateQuantity: (code: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItem: (code: string) => CartItem | undefined;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item, quantity = 1) => {
        const existingItem = get().items.find(i => i.code === item.code);

        if (existingItem) {
          // Aggiorna quantità se esiste
          set({
            items: get().items.map(i =>
              i.code === item.code
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          // Aggiungi nuovo item
          set({
            items: [...get().items, { ...item, quantity }],
          });
        }
      },

      removeItem: (code) => {
        set({
          items: get().items.filter(i => i.code !== code),
        });
      },

      updateQuantity: (code, quantity) => {
        if (quantity <= 0) {
          get().removeItem(code);
          return;
        }

        set({
          items: get().items.map(i =>
            i.code === code ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getItem: (code) => {
        return get().items.find(i => i.code === code);
      },
    }),
    {
      name: 'cart-storage', // localStorage key
      skipHydration: false,
    }
  )
);
