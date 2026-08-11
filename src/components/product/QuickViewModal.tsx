"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Star, ShoppingBag, Heart, Zap } from "lucide-react";
import { useQuickViewStore } from "@/store/quick-view-store";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/components/ui/ToastProvider";

export function QuickViewModal() {
  const { product, isOpen, closeQuickView } = useQuickViewStore();
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const { success: toastSuccess } = useToast();

  const [quantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors?.[0]?.name
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>("M");

  if (!isOpen || !product) return null;

  const isWishlisted = wishlistStore.isInWishlist(product.id);

  const handleAddToCart = () => {
    cartStore.addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        comparePrice: product.comparePrice,
        image: product.images[0],
        selectedColor,
        selectedSize,
      },
      quantity
    );
    toastSuccess("Added to Bag", `${product.name} has been added to your shopping bag.`);
    closeQuickView();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={closeQuickView}
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl z-10 grid grid-cols-1 md:grid-cols-2 animate-in zoom-in-95 duration-200">
          {/* Close Button */}
          <button
            onClick={closeQuickView}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-black shadow-xs transition"
            aria-label="Close Modal"
          >
            <X size={20} />
          </button>

          {/* Product Image Panel */}
          <div className="relative aspect-square bg-[#F8F8F8] p-6 flex items-center justify-center">
            {product.badge && (
              <span className="absolute top-4 left-4 z-10 bg-black text-white text-xs font-extrabold px-3 py-1 rounded-full">
                {product.badge}
              </span>
            )}
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 384px"
              className="object-contain p-6"
            />
          </div>

          {/* Product Details & Purchase Form */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest block">
                {product.category}
              </span>
              <h2 className="text-lg md:text-xl font-serif font-extrabold text-gray-900 mt-1">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center space-x-1.5 mt-2">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < Math.floor(product.rating) ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 font-semibold">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>

              {/* Flash Sale Banner */}
              {product.isFlashSale && product.flashSaleTitle && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl mt-3">
                  <Zap size={12} className="fill-amber-500 text-amber-500 shrink-0" />
                  <span>{product.flashSaleTitle} — Limited Time</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline space-x-2 mt-3">
                <span className={`text-2xl font-extrabold ${product.isFlashSale ? "text-purple-700" : "text-gray-900"}`}>
                  {formatCurrency(product.price)}
                </span>
                {product.comparePrice && product.comparePrice > product.price && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatCurrency(product.comparePrice)}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-600 leading-relaxed mt-3 line-clamp-3">
                {product.description}
              </p>
            </div>

            {/* Colors & Sizes Selectors */}
            <div className="space-y-3">
              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1.5">
                    Color: <span className="font-normal text-gray-600">{selectedColor}</span>
                  </label>
                  <div className="flex space-x-2">
                    {product.colors.map((col, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(col.name)}
                        style={{ backgroundColor: col.hex }}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          selectedColor === col.name
                            ? "border-black scale-110 shadow-xs"
                            : "border-transparent"
                        }`}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1.5">
                    Size: <span className="font-normal text-gray-600">{selectedSize || product.sizes[0]}</span>
                  </label>
                  <div className="flex space-x-2">
                    {product.sizes.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                          (selectedSize || product.sizes?.[0]) === sz
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-black hover:bg-gray-800 text-white text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                >
                  <ShoppingBag size={16} />
                  <span>Add to Shopping Bag</span>
                </button>
                <button
                  onClick={() =>
                    wishlistStore.toggleWishlist({
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      image: product.images[0],
                    })
                  }
                  className={`p-3.5 rounded-xl border transition ${
                    isWishlisted
                      ? "border-red-200 bg-red-50 text-red-500"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart size={18} fill={isWishlisted ? "#ef4444" : "none"} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
