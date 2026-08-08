import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  image: string;
  selectedColor?: string;
  selectedSize?: string;
  variantId?: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

export interface AppliedCoupon {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxDiscount?: number | null;
  minOrderAmount?: number | null;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  coupon: AppliedCoupon | null;
  couponCode: string | null; // legacy backward compatibility
  discountPercentage: number; // legacy backward compatibility

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  applyCoupon: (coupon: AppliedCoupon | { code: string; discountType?: string; discountValue: number }) => void;
  removeCoupon: () => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getShippingFee: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      coupon: null,
      couponCode: null,
      discountPercentage: 0,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.product.id === product.id && item.product.variantId === product.variantId
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex].quantity += quantity;
            return { items: updatedItems };
          } else {
            return { items: [...state.items, { product, quantity }] };
          }
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.product.id === productId && item.product.variantId === variantId)
          ),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) => {
            if (item.product.id === productId && item.product.variantId === variantId) {
              return { ...item, quantity };
            }
            return item;
          }),
        }));
      },

      clearCart: () =>
        set({
          items: [],
          coupon: null,
          couponCode: null,
          discountPercentage: 0,
        }),

      applyCoupon: (couponData) => {
        const fullCoupon: AppliedCoupon = {
          code: couponData.code.toUpperCase().trim(),
          discountType: (couponData.discountType === "FIXED" ? "FIXED" : "PERCENTAGE") as "PERCENTAGE" | "FIXED",
          discountValue: couponData.discountValue,
          maxDiscount: "maxDiscount" in couponData ? couponData.maxDiscount : null,
          minOrderAmount: "minOrderAmount" in couponData ? couponData.minOrderAmount : null,
        };

        set({
          coupon: fullCoupon,
          couponCode: fullCoupon.code,
          discountPercentage: fullCoupon.discountType === "PERCENTAGE" ? fullCoupon.discountValue : 0,
        });
      },

      removeCoupon: () =>
        set({
          coupon: null,
          couponCode: null,
          discountPercentage: 0,
        }),

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
      },

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const coupon = get().coupon;
        if (!coupon || subtotal <= 0) return 0;

        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
          return 0; // Minimum order not met
        }

        let discount = 0;
        if (coupon.discountType === "PERCENTAGE") {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = Math.min(subtotal, coupon.discountValue);
        }

        return Math.max(0, discount);
      },

      getShippingFee: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        return subtotal >= 150 ? 0 : 15;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const shipping = get().getShippingFee();
        return Math.max(0, subtotal - discount + shipping);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "luxora-cart-storage",
    }
  )
);
