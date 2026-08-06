"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/components/ui/ToastProvider";

const flashSaleProducts = [
  {
    id: "fs1",
    name: "Leather Handbag",
    slug: "leather-handbag-luxury",
    price: 69.0,
    comparePrice: 99.0,
    badge: "-30%",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "fs2",
    name: "Galaxy Buds2 Pro",
    slug: "galaxy-buds2-pro",
    price: 129.0,
    comparePrice: 169.0,
    badge: "-25%",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "fs3",
    name: "Oversized Hoodie",
    slug: "oversized-hoodie-cotton",
    price: 44.0,
    comparePrice: 69.0,
    badge: "-35%",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "fs4",
    name: "Fossil Chronograph",
    slug: "fossil-chronograph-watch",
    price: 119.0,
    comparePrice: 199.0,
    badge: "-40%",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=500&q=80",
  },
];

export function FlashSaleBlock() {
  const cartStore = useCartStore();
  const { success: toastSuccess } = useToast();
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 18,
    seconds: 34,
    ms: 56,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.ms > 0) return { ...prev, ms: prev.ms - 1 };
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1, ms: 99 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59, ms: 99 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59, ms: 99 };
        return prev;
      });
    }, 10);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="bg-[#0F1016] text-white rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden border border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Flash Sale Banner Info */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-amber-400 font-extrabold text-2xl md:text-3xl">
                <span>Flash Sale</span>
                <Zap size={28} className="fill-amber-400 text-amber-400 animate-pulse" />
              </div>
              <p className="text-gray-400 text-xs md:text-sm mt-1">
                Hurry up! Limited time offer
              </p>
            </div>

            {/* Live Countdown Timer Grid */}
            <div className="grid grid-cols-4 gap-2 text-center max-w-xs">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                <span className="text-xl md:text-2xl font-extrabold font-mono block">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mt-0.5">
                  Hours
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                <span className="text-xl md:text-2xl font-extrabold font-mono block">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mt-0.5">
                  Minutes
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                <span className="text-xl md:text-2xl font-extrabold font-mono block">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mt-0.5">
                  Seconds
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                <span className="text-xl md:text-2xl font-extrabold font-mono text-indigo-400 block">
                  {String(timeLeft.ms).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mt-0.5">
                  ms
                </span>
              </div>
            </div>

            {/* Action CTA Button */}
            <Link
              href="/products?sale=flash"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs md:text-sm px-6 py-3.5 rounded-full shadow-lg transition"
            >
              <span>Shop All Deals</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Right Flash Products Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {flashSaleProducts.map((item) => (
              <div
                key={item.id}
                className="bg-white text-gray-900 rounded-2xl p-3.5 flex flex-col justify-between hover:scale-103 transition-transform duration-300 shadow-md"
              >
                <div className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
                  <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-900 truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-sm font-extrabold text-gray-900">
                      {formatCurrency(item.price)}
                    </span>
                    <span className="text-[11px] text-gray-400 line-through">
                      {formatCurrency(item.comparePrice)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
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
                  className="mt-3 w-full bg-gray-100 hover:bg-black hover:text-white text-gray-800 text-[11px] font-bold py-2 rounded-xl transition flex items-center justify-center gap-1"
                >
                  <ShoppingBag size={12} />
                  <span>Quick Add</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
