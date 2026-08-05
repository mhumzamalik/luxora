import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartProduct } from "./cart-store";

interface WishlistStore {
  items: CartProduct[];
  toggleWishlist: (product: CartProduct) => void;
  isInWishlist: (productId: string) => boolean;
  getItemCount: () => number;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [
        {
          id: "p1",
          name: "Sony WH-1000XM5 Wireless Headphones",
          slug: "sony-wh-1000xm5",
          price: 299.0,
          comparePrice: 375.0,
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        },
        {
          id: "p2",
          name: "Apple Watch Series 9 GPS 45mm",
          slug: "apple-watch-series-9",
          price: 382.0,
          comparePrice: 449.0,
          image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80",
        },
        {
          id: "p3",
          name: "Bleu de Chanel Parfum 100ml",
          slug: "bleu-de-chanel-parfum",
          price: 129.0,
          image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80",
        },
      ],
      toggleWishlist: (product) => {
        set((state) => {
          const exists = state.items.some((item) => item.id === product.id);
          if (exists) {
            return { items: state.items.filter((item) => item.id !== product.id) };
          } else {
            return { items: [...state.items, product] };
          }
        });
      },
      isInWishlist: (productId) => {
        return get().items.some((item) => item.id === productId);
      },
      getItemCount: () => {
        return get().items.length;
      },
      clearWishlist: () => set({ items: [] }),
    }),

    {
      name: "luxora-wishlist-storage",
    }
  )
);
