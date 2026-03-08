import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      event: null,

      addItem: (ticketType, quantity, newEvent) => {
        const { items, event } = get();
        if (newEvent && event && event._id !== newEvent._id && items.length > 0) {
          return 'CONFLICT';
        }
        if (newEvent && !event) {
          set({ event: newEvent });
        }
        const existingItem = items.find(item => item.ticketType._id === ticketType._id);
        if (existingItem) {
          set({
            items: items.map(item =>
              item.ticketType._id === ticketType._id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ items: [...items, { ticketType, quantity }] });
        }
      },

      updateQuantity: (ticketTypeId, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          set({ items: items.filter(item => item.ticketType._id !== ticketTypeId) });
        } else {
          set({
            items: items.map(item =>
              item.ticketType._id === ticketTypeId
                ? { ...item, quantity }
                : item
            ),
          });
        }
      },

      removeItem: (ticketTypeId) => {
        set({ items: get().items.filter(item => item.ticketType._id !== ticketTypeId) });
      },

      setEvent: (eventData) => {
        set({ event: eventData });
      },

      clearCart: () => {
        set({ items: [], event: null });
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + (item.ticketType.price * item.quantity),
          0
        );
      },

      getTotalQuantity: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Sync từ localStorage khi tab khác thay đổi
      syncFromStorage: () => {
        try {
          const raw = localStorage.getItem('cart-storage');
          if (!raw) {
            set({ items: [], event: null });
            return;
          }
          const parsed = JSON.parse(raw);
          const state = parsed?.state;
          if (state) {
            set({
              items: state.items || [],
              event: state.event || null,
            });
          }
        } catch { /* silent */ }
      },
    }),
    { name: 'cart-storage' }
  )
);

// Lắng nghe thay đổi localStorage từ tab khác
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'cart-storage') {
      useCartStore.getState().syncFromStorage();
    }
  });
}

export default useCartStore;