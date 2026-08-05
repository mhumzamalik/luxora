"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/product/QuickViewModal";
import { ProductCard } from "@/components/product/ProductCard";
import { SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { Pagination } from "@/components/ui/Pagination";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  badge?: string | null;
  rating: number;
  reviewCount: number;
  category?: { name: string; slug: string } | null;
  images?: { url: string; isPrimary?: boolean }[];
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category") || "all";
  const searchParam = searchParams.get("search") || "";
  const sortParam = searchParams.get("sortBy") || "featured";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const isFlashSale = searchParams.get("isFlashSale") === "true";
  const isBestSeller = searchParams.get("isBestSeller") === "true";
  const isNewArrival = searchParams.get("isNewArrival") === "true";

  const [maxPrice, setMaxPrice] = useState<number>(500);

  const queryKey = [
    "products",
    categoryParam,
    searchParam,
    sortParam,
    maxPrice,
    pageParam,
    isFlashSale,
    isBestSeller,
    isNewArrival,
  ];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams();
      if (categoryParam && categoryParam !== "all") params.set("category", categoryParam);
      if (searchParam) params.set("search", searchParam);
      if (sortParam) params.set("sortBy", sortParam);
      if (maxPrice) params.set("maxPrice", maxPrice.toString());
      if (isFlashSale) params.set("isFlashSale", "true");
      if (isBestSeller) params.set("isBestSeller", "true");
      if (isNewArrival) params.set("isNewArrival", "true");
      params.set("page", pageParam.toString());
      params.set("limit", "12");

      return fetchApi<{
        products: ProductListItem[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>(`/api/products?${params.toString()}`);
    },
  });

  const updateUrlParam = (key: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (!value || value === "all") {
      current.delete(key);
    } else {
      current.set(key, value);
    }
    current.set("page", "1"); // Reset to page 1 on filter change
    router.push(`/products?${current.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("page", newPage.toString());
    router.push(`/products?${current.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
        <Breadcrumb items={[{ label: "Products", href: "/products" }]} />

        <div className="mb-6 space-y-1">
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            {searchParam
              ? `Search results for "${searchParam}"`
              : categoryParam !== "all"
              ? `${categoryParam.toUpperCase()} Collection`
              : "Luxury Catalog Collection"}
          </h1>
          <p className="text-xs text-gray-500">
            Explore world-class craftsmanship and signature designer pieces.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="space-y-6 bg-white p-6 rounded-2xl border border-gray-100 h-fit shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal size={16} /> Filters
              </span>
              <button
                onClick={() => router.push("/products")}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Category
              </h3>
              <div className="space-y-1 text-xs">
                {["all", "women", "men", "shoes", "bags", "accessories", "beauty", "home-living"].map((cat) => (
                  <label key={cat} className="flex items-center space-x-2 capitalize cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={categoryParam === cat}
                      onChange={() => updateUrlParam("category", cat)}
                      className="accent-black"
                    />
                    <span className={categoryParam === cat ? "font-bold text-black" : "text-gray-600"}>
                      {cat.replace("-", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Slider */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs font-bold text-gray-800">
                <span>Max Price:</span>
                <span className="text-indigo-600">${maxPrice}</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="25"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-500">
                Showing <strong className="text-gray-900">{data?.products.length || 0}</strong> of{" "}
                <strong className="text-gray-900">{data?.pagination.total || 0}</strong> items
              </span>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Sort by:</span>
                  <select
                    value={sortParam}
                    onChange={(e) => updateUrlParam("sortBy", e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 font-semibold text-gray-800 outline-hidden cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="low-to-high">Price: Low to High</option>
                    <option value="high-to-low">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : isError || !data || data.products.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center space-y-3">
                <p className="text-sm font-bold text-gray-800">No products match your filter criteria.</p>
                <p className="text-xs text-gray-500">Try adjusting your price range or clearing category filters.</p>
                <button
                  onClick={() => router.push("/products")}
                  className="mt-2 inline-block bg-black text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  View All Products
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {data.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <QuickViewModal />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA]" />}>
      <ProductsContent />
    </Suspense>
  );
}
