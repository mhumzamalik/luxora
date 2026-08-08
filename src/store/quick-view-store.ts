import { create } from "zustand";

export interface QuickViewProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  badge?: string | null;
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
  category: string;
  colors?: Array<{ name: string; hex: string }>;
  sizes?: string[];
  stock: number;
  isFlashSale?: boolean;
  flashSaleTitle?: string;
  flashSaleEndDate?: string;
}

interface QuickViewStore {
  product: QuickViewProduct | null;
  isOpen: boolean;
  openQuickView: (product: QuickViewProduct) => void;
  closeQuickView: () => void;
}

export const useQuickViewStore = create<QuickViewStore>((set) => ({
  product: null,
  isOpen: false,
  openQuickView: (product) => set({ product, isOpen: true }),
  closeQuickView: () => set({ product: null, isOpen: false }),
}));
