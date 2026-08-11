"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useWishlistStore } from "@/store/wishlist-store";
import { formatCurrency } from "@/lib/currency";
import { getPrimaryImage } from "@/lib/images";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  badge?: string | null;
  category: string;
  image: string;
  stock: number;
}

interface HomepageData {
  newArrivals: ProductItem[];
}

export function NewArrivalsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wishlistStore = useWishlistStore();

  const { data, isLoading } = useQuery<HomepageData>({
    queryKey: ["homepage"],
    queryFn: () => fetchApi("/api/homepage"),
  });

  const newArrivals = data?.newArrivals || [];

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            New Arrivals
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/products?isNewArrival=true"
            className="text-xs md:text-sm font-semibold text-gray-800 hover:text-black flex items-center gap-1 transition group"
          >
            <span>View All</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Carousel Container */}
      {isLoading ? (
        <div className="p-12 flex justify-center items-center text-purple-600 gap-2">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-xs font-bold">Loading new arrivals...</span>
        </div>
      ) : newArrivals.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-400 bg-white border border-gray-100 rounded-2xl">
          No new arrivals currently available.
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex items-center gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4"
          style={{ scrollbarWidth: "none" }}
        >
          {newArrivals.map((product) => {
            const isWishlisted = wishlistStore.isInWishlist(product.id);
            const primaryImg = getPrimaryImage(product);

            return (
              <div
                key={product.id}
                className="min-w-[220px] max-w-[240px] md:min-w-[250px] bg-white border border-gray-100 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg flex-shrink-0 group"
              >
                <div className="relative w-full aspect-square rounded-xl bg-gray-50 overflow-hidden mb-3">
                  <span
                    className={`absolute top-2.5 left-2.5 z-10 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      product.badge === "Trending"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {product.badge || "New"}
                  </span>

                  <button
                    onClick={() =>
                      wishlistStore.toggleWishlist({
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        image: primaryImg,
                      })
                    }
                    className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-2xs cursor-pointer"
                  >
                    <Heart size={14} fill={isWishlisted ? "#ef4444" : "none"} />
                  </button>

                  <Link href={`/products/${product.slug}`}>
                    <Image
                      src={primaryImg}
                      alt={product.name}
                      fill
                      className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                </div>

                <Link
                  href={`/products/${product.slug}`}
                  className="text-xs font-bold text-gray-900 block hover:text-gray-600 truncate"
                >
                  {product.name}
                </Link>
                <span className="text-sm font-extrabold text-gray-900 block mt-1">
                  {formatCurrency(product.price)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
