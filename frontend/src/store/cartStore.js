import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ product, variant, quantity, price }]

      addItem: (product, variant = null, quantity = 1) => {
        const { items } = get();
        const key = `${product.id}-${variant?.id ?? 'none'}`;
        const existing = items.find(
          (i) => `${i.product.id}-${i.variant?.id ?? 'none'}` === key
        );
        if (existing) {
          set({
            items: items.map((i) =>
              `${i.product.id}-${i.variant?.id ?? 'none'}` === key
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          const unitPrice =
            Number(product.price) + Number(variant?.price_adjustment ?? 0);
          set({ items: [...items, { product, variant, quantity, price: unitPrice }] });
        }
      },

      removeItem: (productId, variantId = null) => {
        set({
          items: get().items.filter(
            (i) => !(i.product.id === productId && (i.variant?.id ?? null) === variantId)
          ),
        });
      },

      updateQuantity: (productId, variantId = null, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId && (i.variant?.id ?? null) === variantId
              ? { ...i, quantity }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      // Dérivés
      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
      get totalPrice() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
    }),
    { name: 'golden-pousso-cart' }
  )
);

export default useCartStore;
