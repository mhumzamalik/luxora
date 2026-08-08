"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { ProductCard } from "@/components/product/ProductCard";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  badge?: string | null;
  rating: number;
  reviewCount: number;
  category: string;
  image: string;
  stock: number;
}

interface HomepageData {
  bestSellers: ProductItem[];
}

export function BestSellersGrid() {
  const { data, isLoading } = useQuery<HomepageData>({
    queryKey: ["homepage"],
    queryFn: () => fetchApi("/api/homepage"),
  });

  const bestSellers = data?.bestSellers || [];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Best Sellers
          </h2>
        </div>
        <Link
          href="/products?isBestSeller=true"
          className="text-xs md:text-sm font-semibold text-gray-800 hover:text-black flex items-center gap-1 transition group"
        >
          <span>View All</span>
          <ArrowRight
            size={14}
            className="group-hover:translate-x-1 transition"
          />
        </Link>
      </div>

      {/* Loading Skeleton or Products Grid */}
      {isLoading ? (
        <div className="p-12 flex justify-center items-center text-purple-600 gap-2">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-xs font-bold">Loading best sellers...</span>
        </div>
      ) : bestSellers.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-400 bg-white border border-gray-100 rounded-2xl">
          No best sellers currently available.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
