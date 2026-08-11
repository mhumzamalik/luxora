"use client";

import React, { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/product/QuickViewModal";
import { Zap } from "lucide-react";
import { Star, ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, Send } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCard } from "@/components/product/ProductCard";
import { formatCurrency } from "@/lib/currency";
import { getOrderedImages } from "@/lib/images";

interface ProductReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { name: string | null } | null;
}

interface ProductVariantData {
  id: string;
  sku: string;
  stock: number;
  reserved?: number | null;
  price?: number | null;
  size?: string | null;
  color?: string | null;
  colorHex?: string | null;
}

interface ProductDetailData {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    comparePrice?: number | null;
    badge?: string | null;
    rating: number;
    reviewCount: number;
    isFlashSale?: boolean;
    flashSaleTitle?: string;
    flashSaleEndDate?: string;
    originalPrice?: number;
    category?: { name: string; slug: string } | null;
    images: { url: string; isPrimary?: boolean }[];
    variants?: ProductVariantData[];
    reviews?: ProductReview[];
  };
  relatedProducts: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    badge?: string | null;
    rating: number;
    reviewCount: number;
    images?: { url: string; isPrimary?: boolean }[];
  }[];
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchApi<ProductDetailData>(`/api/products/${slug}`),
  });

  const product = data?.product;
  const relatedProducts = data?.relatedProducts || [];

  const orderedImageList = getOrderedImages(product);
  const images: string[] = orderedImageList.map((img) => img.url);
  const activeImage = images[activeImageIndex] || images[0];
  const isWishlisted = product ? wishlistStore.isInWishlist(product.id) : false;

  // Determine available variants, color/size options, and active variant stock
  const variants = product?.variants || [];
  const availableColors = Array.from(
    new Set(variants.map((v) => v.color).filter((c): c is string => Boolean(c)))
  );
  const availableSizes = Array.from(
    new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s)))
  );

  const activeColor = selectedColor || availableColors[0] || null;

  // Helper to calculate available stock (stock - reserved) for a specific size given current active color
  const getSizeAvailableStock = (size: string, colorCtx: string | null = activeColor) => {
    const matching = variants.filter((v) => {
      if (colorCtx && v.color !== colorCtx) return false;
      if (v.size !== size) return false;
      return true;
    });
    if (matching.length === 0) {
      const sizeOnly = variants.filter((v) => v.size === size);
      return sizeOnly.reduce((sum, v) => sum + Math.max(0, v.stock - (v.reserved || 0)), 0);
    }
    return matching.reduce((sum, v) => sum + Math.max(0, v.stock - (v.reserved || 0)), 0);
  };

  // Determine active size (must be in stock for activeColor if possible)
  const getValidActiveSize = (colorCtx: string | null) => {
    if (selectedSize && getSizeAvailableStock(selectedSize, colorCtx) > 0) {
      return selectedSize;
    }
    const inStockSize = availableSizes.find((s) => getSizeAvailableStock(s, colorCtx) > 0);
    return inStockSize || selectedSize || availableSizes[0] || null;
  };

  const activeSize = getValidActiveSize(activeColor);

  // Find exact selected variant matching active color and size
  const selectedVariant = variants.find((v) => {
    if (activeColor && v.color !== activeColor) return false;
    if (activeSize && v.size !== activeSize) return false;
    return true;
  }) || variants[0];

  const availableStock = selectedVariant
    ? Math.max(0, selectedVariant.stock - (selectedVariant.reserved || 0))
    : variants.reduce((acc, v) => acc + Math.max(0, v.stock - (v.reserved || 0)), 0);

  const isOutOfStock = availableStock <= 0;

  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    const validSize = getValidActiveSize(newColor);
    if (validSize) {
      setSelectedSize(validSize);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (isOutOfStock) {
      toastError("Out of Stock", "This item/variant is currently out of stock.");
      return;
    }

    const existingCartItem = cartStore.items.find(
      (item) =>
        item.product.id === product.id &&
        item.product.variantId === (selectedVariant?.id || undefined)
    );
    const existingQty = existingCartItem ? existingCartItem.quantity : 0;

    if (existingQty + quantity > availableStock) {
      toastError(
        "Stock Limit Reached",
        `Only ${availableStock} item(s) available in stock. You already have ${existingQty} in your bag.`
      );
      return;
    }

    cartStore.addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        comparePrice: product.comparePrice,
        image: activeImage,
        selectedColor: activeColor || selectedVariant?.color || undefined,
        selectedSize: activeSize || selectedVariant?.size || undefined,
        variantId: selectedVariant?.id,
      },
      quantity
    );
    toastSuccess("Added to Bag", `${product.name} has been added to your shopping bag.`);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!reviewComment.trim()) {
      toastError("Error", "Please provide a review comment");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await fetchApi("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      toastSuccess("Review Submitted", "Thank you for your review!");
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["product", slug] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Please sign in to leave a review.";
      toastError("Submission Failed", msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-6">
          <Skeleton className="h-6 w-1/4" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white p-10 rounded-3xl">
            <Skeleton className="lg:col-span-7 aspect-square rounded-2xl" />
            <div className="lg:col-span-5 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-4 max-w-md">
            <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
            <p className="text-xs text-gray-500">The product you are looking for does not exist or has been removed.</p>
            <Link href="/products" className="inline-block bg-black text-white text-xs font-bold px-6 py-3 rounded-xl">
              Back to Catalog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-12">
        <Breadcrumb
          items={[
            { label: "Products", href: "/products" },
            { label: product.category?.name || "Catalog", href: `/products?category=${product.category?.slug}` },
            { label: product.name },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white p-6 md:p-10 rounded-3xl border border-gray-100 shadow-2xs">
          {/* Gallery Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative w-full aspect-square bg-[#F8F8F8] rounded-2xl overflow-hidden group">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-contain p-8 transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No image</div>
              )}
            </div>
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 bg-[#F8F8F8] rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                    activeImageIndex === idx ? "border-black" : "border-transparent"
                  }`}
                >
                  {img && <Image src={img} alt="Thumbnail" fill sizes="80px" className="object-contain p-2" />}
                </button>
              ))}
            </div>
          </div>

          {/* Details Column */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {product.category?.name || "Luxury"}
              </span>
              <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-gray-900">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center space-x-2">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < Math.floor(product.rating) ? "currentColor" : "none"}
                      className={i < Math.floor(product.rating) ? "" : "text-gray-200"}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-900">{product.rating}</span>
                <span className="text-xs text-gray-400">({product.reviewCount} verified reviews)</span>
              </div>

              {/* Flash Sale Banner */}
              {product.isFlashSale && product.flashSaleTitle && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                  <Zap size={13} className="fill-amber-500 text-amber-500 shrink-0" />
                  <span>{product.flashSaleTitle} — Limited Time Offer</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline space-x-3 pt-2">
                <span className={`text-3xl font-extrabold ${product.isFlashSale ? "text-purple-700" : "text-gray-900"}`}>
                  {formatCurrency(product.price)}
                </span>
                {product.comparePrice && product.comparePrice > product.price && (
                  <span className="text-sm text-gray-400 line-through">{formatCurrency(product.comparePrice)}</span>
                )}
                {product.badge && (
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full text-white ${product.isFlashSale ? "bg-purple-600" : "bg-red-500"}`}>
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Stock Status Badge */}
              <div className="pt-1">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Out of Stock
                  </span>
                ) : availableStock <= 10 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Only {availableStock} left in stock - order soon
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    In Stock ({availableStock} available)
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-600 leading-relaxed pt-2">
                {product.description}
              </p>

              {/* Color Variant Selector */}
              {availableColors.length > 0 && (
                <div className="pt-2 space-y-2">
                  <label className="text-xs font-bold text-gray-900 block">
                    Color: <span className="text-gray-600 font-normal">{activeColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
                      const colorStock = variants
                        .filter((v) => v.color === color)
                        .reduce((sum, v) => sum + Math.max(0, v.stock - (v.reserved || 0)), 0);
                      const isColorDisabled = colorStock <= 0;
                      const isSelected = activeColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          disabled={isColorDisabled}
                          onClick={() => !isColorDisabled && handleColorChange(color)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                            isSelected
                              ? "bg-black text-white border-black shadow-xs"
                              : isColorDisabled
                              ? "bg-gray-100 text-gray-300 border-gray-200 line-through cursor-not-allowed opacity-60"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400 cursor-pointer"
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Variant Selector */}
              {availableSizes.length > 0 && (
                <div className="pt-2 space-y-2">
                  <label className="text-xs font-bold text-gray-900 block">
                    Size: <span className="text-gray-600 font-normal">{activeSize}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      const sizeStock = getSizeAvailableStock(size, activeColor);
                      const isSizeDisabled = sizeStock <= 0;
                      const isSelected = activeSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={isSizeDisabled}
                          onClick={() => !isSizeDisabled && setSelectedSize(size)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                            isSelected
                              ? "bg-black text-white border-black shadow-xs"
                              : isSizeDisabled
                              ? "bg-gray-100 text-gray-300 border-gray-200 line-through cursor-not-allowed opacity-60"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400 cursor-pointer"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="pt-2 space-y-2">
                <label className="text-xs font-bold text-gray-900">Quantity</label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{isOutOfStock ? 0 : quantity}</span>
                  <button
                    type="button"
                    disabled={isOutOfStock || quantity >= availableStock}
                    onClick={() => {
                      if (quantity < availableStock) {
                        setQuantity(quantity + 1);
                      } else {
                        toastError("Stock Limit", `Cannot exceed available stock of ${availableStock}.`);
                      }
                    }}
                    className="w-9 h-9 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Actions & Inventory */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 bg-black hover:bg-gray-800 text-white text-xs font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ShoppingBag size={18} />
                  <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                </button>

                <button
                  onClick={() =>
                    wishlistStore.toggleWishlist({
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      image: activeImage,
                    })
                  }
                  className="p-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition cursor-pointer"
                >
                  <Heart size={20} fill={isWishlisted ? "#ef4444" : "none"} />
                </button>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-gray-600 font-medium text-center">
                <div className="p-3 rounded-xl bg-gray-50 flex flex-col items-center gap-1">
                  <Truck size={16} className="text-indigo-600" /> Free Shipping
                </div>
                <div className="p-3 rounded-xl bg-gray-50 flex flex-col items-center gap-1">
                  <RotateCcw size={16} className="text-indigo-600" /> 30-Day Returns
                </div>
                <div className="p-3 rounded-xl bg-gray-50 flex flex-col items-center gap-1">
                  <ShieldCheck size={16} className="text-indigo-600" /> 2 Year Warranty
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="bg-white p-8 rounded-3xl border border-gray-100 space-y-6">
          <h2 className="text-xl font-serif font-bold text-gray-900">
            Customer Reviews ({product.reviews?.length || 0})
          </h2>

          {/* Write a review form */}
          <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-6 rounded-2xl space-y-4 text-xs">
            <h3 className="font-bold text-gray-800">Leave a Review</h3>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-700">Rating:</span>
              <div className="flex text-amber-400 space-x-1 cursor-pointer">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-hidden"
                  >
                    <Star size={18} fill={star <= reviewRating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              required
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this item..."
              className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black transition"
            />

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="bg-black text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer"
            >
              <Send size={14} /> Submit Review
            </button>
          </form>

          {/* Reviews List */}
          <div className="space-y-4">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((rev: ProductReview) => (
                <div key={rev.id} className="border-b border-gray-100 pb-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900">{rev.user?.name || "Verified Customer"}</span>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{rev.comment}</p>
                  <span className="text-[10px] text-gray-400">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
        </section>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
      <CartDrawer />
      <QuickViewModal />
    </div>
  );
}
