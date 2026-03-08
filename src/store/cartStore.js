import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useAuthStore from './authStore';

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
    }),
    {
      // ← Key riêng theo userId, không bị share giữa các acc
      name: `cart-storage-${useAuthStore.getState().user?._id || 'guest'}`,
    }
  )
);

export default useCartStore;