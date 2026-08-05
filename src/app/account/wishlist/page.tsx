"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useWishlistStore } from "@/store/wishlist-store";
import { ProductCard } from "@/components/product/ProductCard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const wishlistStore = useWishlistStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        <Breadcrumb items={[{ label: "Account", href: "/account" }, { label: "My Wishlist" }]} />

        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold text-gray-900">Saved Wishlist</h1>
            <p className="text-xs text-gray-500">
              Items you&apos;ve bookmarked to purchase later ({wishlistStore.items.length}).
            </p>
          </div>

          {wishlistStore.items.length > 0 && (
            <button
              onClick={() => wishlistStore.clearWishlist()}
              className="text-xs text-red-600 font-bold hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {wishlistStore.items.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-4 shadow-2xs">
            <Heart size={48} className="text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">Your Wishlist is Empty</h3>
            <p className="text-xs text-gray-500">Save items while browsing to view them here later.</p>
            <Link href="/products" className="inline-block bg-black text-white text-xs font-bold px-6 py-3 rounded-xl">
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {wishlistStore.items.map((item) => (
              <ProductCard
                key={item.id}
                product={{
                  id: item.id,
                  name: item.name,
                  slug: item.slug,
                  price: item.price,
                  comparePrice: item.comparePrice,
                  rating: 5.0,
                  reviewCount: 12,
                  image: item.image,
                }}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
