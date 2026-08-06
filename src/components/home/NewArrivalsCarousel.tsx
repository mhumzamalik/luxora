"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist-store";
import { formatCurrency } from "@/lib/currency";

const newArrivals = [
  {
    id: "na1",
    name: "Mini Shoulder Bag",
    slug: "mini-shoulder-bag",
    price: 89.0,
    badge: "New",
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "na2",
    name: "Adidas Samba OG",
    slug: "adidas-samba-og",
    price: 198.0,
    badge: "Trending",
    image: "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "na3",
    name: "Jo Malone Peony",
    slug: "jo-malone-peony",
    price: 135.0,
    badge: "New",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "na4",
    name: "Denim Jacket",
    slug: "classic-denim-jacket",
    price: 179.0,
    badge: "New",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "na5",
    name: "Ray-Ban Wayfarer",
    slug: "ray-ban-wayfarer",
    price: 149.0,
    badge: "Trending",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "na6",
    name: "Travel Backpack",
    slug: "travel-backpack-canvas",
    price: 129.0,
    badge: "New",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80",
  },
];

export function NewArrivalsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wishlistStore = useWishlistStore();

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
            href="/products?sort=newest"
            className="text-xs md:text-sm font-semibold text-gray-800 hover:text-black flex items-center gap-1 transition group"
          >
            <span>View All</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-700 transition"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-700 transition"
              aria-label="Next Slide"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Carousel Container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {newArrivals.map((product) => {
          const isWishlisted = wishlistStore.isInWishlist(product.id);
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
                  {product.badge}
                </span>

                <button
                  onClick={() =>
                    wishlistStore.toggleWishlist({
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      image: product.image,
                    })
                  }
                  className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-2xs"
                >
                  <Heart size={14} fill={isWishlisted ? "#ef4444" : "none"} />
                </button>

                <Link href={`/products/${product.slug}`}>
                  <Image
                    src={product.image}
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
    </section>
  );
}
