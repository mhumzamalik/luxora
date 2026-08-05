"use client";

import React, { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/product/QuickViewModal";
import { Star, ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, Send } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCard } from "@/components/product/ProductCard";

interface ProductReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { name: string | null } | null;
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
    stock: number;
    category?: { name: string; slug: string } | null;
    images: { url: string; isPrimary?: boolean }[];
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
  const [selectedColor] = useState<string | null>(null);
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

  const images = product?.images?.map((i: { url: string }) => i.url) || [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80",
  ];

  const activeImage = images[activeImageIndex] || images[0];
  const isWishlisted = product ? wishlistStore.isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    if (!product) return;
    cartStore.addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        comparePrice: product.comparePrice,
        image: activeImage,
        selectedColor: selectedColor || undefined,
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
              <Image
                src={activeImage}
                alt={product.name}
                fill
                priority
                className="object-contain p-8 transition-transform duration-500 group-hover:scale-110"
              />
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
                  <Image src={img} alt="Thumbnail" fill className="object-contain p-2" />
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

              {/* Price */}
              <div className="flex items-baseline space-x-3 pt-2">
                <span className="text-3xl font-extrabold text-gray-900">${product.price.toFixed(2)}</span>
                {product.comparePrice && (
                  <span className="text-sm text-gray-400 line-through">${product.comparePrice.toFixed(2)}</span>
                )}
                {product.badge && (
                  <span className="bg-red-500 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    {product.badge}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-600 leading-relaxed pt-2">
                {product.description}
              </p>

              {/* Quantity Selector */}
              <div className="pt-2 space-y-2">
                <label className="text-xs font-bold text-gray-900">Quantity</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-center cursor-pointer"
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
                  onClick={handleAddToCart}
                  className="flex-1 bg-black hover:bg-gray-800 text-white text-xs font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <ShoppingBag size={18} /> Add to Cart
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
