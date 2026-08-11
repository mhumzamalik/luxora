"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, ShoppingBag, ArrowRight, Loader2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/components/ui/ToastProvider";

interface FlashSaleProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number;
  badge: string;
  image: string;
  stock: number;
  category?: string;
}

interface HomepageData {
  flashSale: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    products: FlashSaleProduct[];
  } | null;
}

export function FlashSaleBlock() {
  const cartStore = useCartStore();
  const { success: toastSuccess, error: toastError } = useToast();

  const { data, isLoading } = useQuery<HomepageData>({
    queryKey: ["homepage"],
    queryFn: () => fetchApi("/api/homepage"),
  });

  const flashSale = data?.flashSale;

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    ms: 0,
  });

  useEffect(() => {
    if (!flashSale?.endDate) return;

    const targetTime = new Date(flashSale.endDate).getTime();

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, ms: 0 });
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const ms = Math.floor((diff % 1000) / 10);
        setTimeLeft({ hours, minutes, seconds, ms });
      }
    }, 10);

    return () => clearInterval(timer);
  }, [flashSale?.endDate]);

  if (isLoading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="bg-[#0F1016] text-white rounded-3xl p-10 flex justify-center items-center gap-3">
          <Loader2 className="animate-spin text-amber-400" size={24} />
          <span className="text-xs font-bold text-gray-300">Loading flash sale deals...</span>
        </div>
      </section>
    );
  }

  if (!flashSale || !flashSale.products || flashSale.products.length === 0) {
    return null; // Gracefully hide section if no flash sale campaign active
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="bg-[#0F1016] text-white rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden border border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Flash Sale Banner Info */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-amber-400 font-extrabold text-2xl md:text-3xl">
                <span>{flashSale.title || "Flash Sale"}</span>
                <Zap size={28} className="fill-amber-400 text-amber-400 animate-pulse shrink-0" />
              </div>
              <p className="text-gray-400 text-xs md:text-sm mt-1 flex items-center gap-1">
                <Clock size={14} className="text-amber-400" /> Hurry up! Limited time offer
              </p>
            </div>

            {/* Live Countdown Timer Grid */}
            <div className="grid grid-cols-4 gap-2 text-center max-w-xs">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                <span className="text-xl md:text-2xl font-extrabold font-mono block text-white">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mt-0.5 font-bold">
                  Hours
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                <span className="text-xl md:text-2xl font-extrabold font-mono block text-white">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mt-0.5 font-bold">
                  Minutes
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                <span className="text-xl md:text-2xl font-extrabold font-mono block text-white">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mt-0.5 font-bold">
                  Seconds
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                <span className="text-xl md:text-2xl font-extrabold font-mono text-indigo-400 block">
                  {String(timeLeft.ms).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mt-0.5 font-bold">
                  ms
                </span>
              </div>
            </div>

            {/* Action CTA Button */}
            <Link
              href="/products?isFlashSale=true"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs md:text-sm px-6 py-3.5 rounded-full shadow-lg transition"
            >
              <span>Shop All Deals</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Right Flash Products Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {flashSale.products.map((item) => {
              const isOutOfStock = item.stock <= 0;

              return (
                <div
                  key={item.id}
                  className="bg-white text-gray-900 rounded-2xl p-3.5 flex flex-col justify-between hover:scale-103 transition-transform duration-300 shadow-md relative"
                >
                  <div className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
                    <span className="absolute top-2 left-2 z-10 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                      {item.badge}
                    </span>

                    {isOutOfStock && (
                      <span className="absolute top-2 right-2 z-10 bg-gray-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Sold Out
                      </span>
                    )}

                    <Link href={`/products/${item.slug}`}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"
                        className={`object-contain p-2 transition duration-300 ${isOutOfStock ? "opacity-60 grayscale" : ""}`}
                      />
                    </Link>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-xs font-bold text-gray-900 truncate block hover:text-purple-600"
                    >
                      {item.name}
                    </Link>

                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-sm font-extrabold text-purple-700">
                        {formatCurrency(item.price)}
                      </span>
                      {item.comparePrice > item.price && (
                        <span className="text-[11px] text-gray-400 line-through">
                          {formatCurrency(item.comparePrice)}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-gray-500 font-semibold">
                      {isOutOfStock ? (
                        <span className="text-rose-600 font-bold">Out of Stock</span>
                      ) : (
                        <span className="text-emerald-700 font-bold">{item.stock} in stock</span>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={isOutOfStock}
                    onClick={() => {
                      if (isOutOfStock) {
                        toastError("Out of Stock", `${item.name} is currently out of stock.`);
                        return;
                      }
                      cartStore.addItem({
                        id: item.id,
                        name: item.name,
                        slug: item.slug,
                        price: item.price,
                        comparePrice: item.comparePrice,
                        image: item.image,
                      });
                      toastSuccess("Added to Bag", `${item.name} has been added to your shopping bag.`);
                    }}
                    className={`mt-3 w-full text-[11px] font-bold py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
                      isOutOfStock
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 hover:bg-black hover:text-white text-gray-800"
                    }`}
                  >
                    <ShoppingBag size={12} />
                    <span>{isOutOfStock ? "Sold Out" : "Quick Add"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
