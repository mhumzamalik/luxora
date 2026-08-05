import { z } from "zod";

// --- Authentication Schemas ---
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// --- Address & Checkout Schemas ---
export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  address: addressSchema,
  paymentMethod: z.enum(["BANK_TRANSFER", "CREDIT_CARD", "PAYPAL"]).default("BANK_TRANSFER"),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// --- Product & Variant Schemas ---
export const productVariantSchema = z.object({
  id: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  colorHex: z.string().optional(),
  sku: z.string().min(3, "SKU is required"),
  stock: z.number().min(0, "Stock cannot be negative"),
  price: z.number().optional(),
});

export type ProductVariantInput = z.infer<typeof productVariantSchema>;

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be greater than 0"),
  comparePrice: z.number().optional(),
  categoryId: z.string().min(1, "Category is required"),
  badge: z.string().optional(),
  isFlashSale: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  images: z.array(z.string().url("Valid image URL required")).min(1, "At least one image is required"),
  variants: z.array(productVariantSchema).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

// --- Coupon Schema ---
export const couponSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters").toUpperCase(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive("Discount value must be positive"),
  minOrderAmount: z.number().optional(),
  maxDiscount: z.number().optional(),
  usageLimit: z.number().optional(),
  expiresAt: z.string().optional(),
});

export type CouponInput = z.infer<typeof couponSchema>;

// --- Review Schema ---
export const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().min(5, "Comment must be at least 5 characters"),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
