"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ShoppingBag, Eye } from "lucide-react";
import { useCartStore, CartProduct } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useQuickViewStore, QuickViewProduct } from "@/store/quick-view-store";
import { formatCurrency } from "@/lib/currency";

import { useToast } from "@/components/ui/ToastProvider";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    comparePrice?: number | null;
    badge?: string | null;
    rating: number;
    reviewCount: number;
    category?: string | { name: string; slug: string } | null;
    variants?: Array<{ id: string; stock: number }>;
    image?: string;
    images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
    colors?: Array<{ name: string; hex: string }>;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const quickViewStore = useQuickViewStore();
  const { success: toastSuccess, error: toastError } = useToast();

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    product.image ||
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80";

  const isWishlisted = wishlistStore.isInWishlist(product.id);

  const defaultVariant = product.variants?.[0];
  const totalStock = product.variants
    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
    : undefined;
  const isOutOfStock = totalStock !== undefined && totalStock <= 0;

  const cartProduct: CartProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    comparePrice: product.comparePrice,
    image: primaryImage,
    variantId: defaultVariant?.id,
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const quickViewItem: QuickViewProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      comparePrice: product.comparePrice,
      badge: product.badge,
      rating: product.rating,
      reviewCount: product.reviewCount,
      images: product.images?.map((i) => i.url) || [primaryImage],
      description:
        product.description ||
        "Handcrafted luxury item made with high precision and finest materials.",
      category: typeof product.category === "string" ? product.category : product.category?.name || "Luxury",
      colors: product.colors,
      stock: 25,
    };
    quickViewStore.openQuickView(quickViewItem);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wishlistStore.toggleWishlist(cartProduct);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toastError("Out of Stock", `${product.name} is currently out of stock.`);
      return;
    }
    cartStore.addItem(cartProduct, 1);
    toastSuccess("Added to Bag", `${product.name} has been added to your shopping bag.`);
  };

  return (
    <div className="group relative bg-white border border-gray-100/80 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:border-gray-200 flex flex-col justify-between">
      <div>
        {/* Image & Badges Wrapper */}
        <div className="relative w-full aspect-square rounded-xl bg-[#F8F8F8] overflow-hidden mb-4 flex items-center justify-center">
          {/* Discount/Status Badge */}
          {product.badge ? (
            <span
              className={`absolute top-3 left-3 z-10 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-2xs ${
                product.badge.startsWith("-")
                  ? "bg-red-500 text-white"
                  : product.badge === "Trending"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-black text-white"
              }`}
            >
              {product.badge}
            </span>
          ) : isOutOfStock ? (
            <span className="absolute top-3 left-3 z-10 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500 text-white shadow-2xs">
              Out of Stock
            </span>
          ) : null}

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition shadow-xs cursor-pointer ${
              isWishlisted
                ? "bg-red-50 text-red-500"
                : "bg-white/80 hover:bg-white text-gray-700 hover:text-black"
            }`}
            aria-label="Add to Wishlist"
          >
            <Heart size={16} fill={isWishlisted ? "#ef4444" : "none"} />
          </button>

          {/* Product Image */}
          <Link href={`/products/${product.slug}`} className="w-full h-full relative block">
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

          {/* Quick View Button on Hover */}
          <button
            onClick={handleQuickView}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/95 text-black hover:bg-black hover:text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md z-10 cursor-pointer"
          >
            <Eye size={14} /> Quick View
          </button>
        </div>

        {/* Product Meta & Details */}
        <div className="space-y-1.5">
          <Link
            href={`/products/${product.slug}`}
            className="text-xs font-bold text-gray-900 hover:text-gray-600 line-clamp-1 transition"
          >
            {product.name}
          </Link>

          {/* Star Rating */}
          <div className="flex items-center space-x-1 text-xs">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  fill={i < Math.floor(product.rating) ? "currentColor" : "none"}
                  className={i < Math.floor(product.rating) ? "" : "text-gray-200"}
                />
              ))}
            </div>
            <span className="text-[11px] text-gray-400 font-medium">
              ({product.reviewCount.toLocaleString()})
            </span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline space-x-2 pt-1">
            <span className="text-sm md:text-base font-extrabold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-xs text-gray-400 line-through font-normal">
                {formatCurrency(product.comparePrice)}
              </span>
            )}
          </div>

          {/* Color Swatch Dots if available */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center space-x-1.5 pt-1">
              {product.colors.map((col, idx) => (
                <span
                  key={idx}
                  style={{ backgroundColor: col.hex }}
                  className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                  title={col.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add to Cart Actions */}
      <div className="flex items-center space-x-2 pt-4 mt-2">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Add to cart icon"
        >
          <ShoppingBag size={16} />
        </button>
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-1 bg-black hover:bg-gray-800 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-xs disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
