"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";

const bestSellers = [
  {
    id: "p1",
    name: "Sony WH-1000XM5",
    slug: "sony-wh-1000xm5",
    description: "Industry-leading noise canceling headphones with two processors and 8 microphones.",
    price: 299.0,
    comparePrice: 375.0,
    badge: "-20%",
    rating: 4.8,
    reviewCount: 1248,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Silver", hex: "#E5E5E5" },
      { name: "Midnight", hex: "#1E293B" },
    ],
  },
  {
    id: "p2",
    name: "Apple Watch Series 9",
    slug: "apple-watch-series-9",
    description: "Smarter, brighter, and mightier with Double tap gesture interaction.",
    price: 382.0,
    comparePrice: 449.0,
    badge: "-15%",
    rating: 4.9,
    reviewCount: 856,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "Midnight", hex: "#0F172A" },
      { name: "Starlight", hex: "#F8FAFC" },
      { name: "Pink", hex: "#F472B6" },
    ],
  },
  {
    id: "p3",
    name: "Bleu de Chanel Parfum",
    slug: "bleu-de-chanel-parfum",
    description: "An aromatic, deeply woody fragrance embodying independence and elegance.",
    price: 129.0,
    comparePrice: null,
    badge: null,
    rating: 4.9,
    reviewCount: 2410,
    category: "Beauty",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "p4",
    name: "Nike Air Force 1 '07",
    slug: "nike-air-force-1-07",
    description: "The classic basketball original with crisp leather accents and iconic style.",
    price: 88.0,
    comparePrice: 118.0,
    badge: "-25%",
    rating: 4.7,
    reviewCount: 652,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80",
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Black", hex: "#111111" },
    ],
  },
];

export function BestSellersGrid() {
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
          href="/products?sort=bestseller"
          className="text-xs md:text-sm font-semibold text-gray-800 hover:text-black flex items-center gap-1 transition group"
        >
          <span>View All</span>
          <ArrowRight
            size={14}
            className="group-hover:translate-x-1 transition"
          />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {bestSellers.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
