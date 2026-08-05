"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PromoBanners() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Promo Card - Summer Collection */}
        <div className="relative rounded-3xl overflow-hidden bg-[#F5F2EC] min-h-[300px] md:min-h-[340px] p-8 flex flex-col justify-between group shadow-xs">
          <div className="z-10 max-w-xs space-y-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest block">
              Summer Collection
            </span>
            <h3 className="text-3xl md:text-4xl font-serif font-extrabold text-gray-900 leading-tight">
              Up to 40% Off
            </h3>
            <p className="text-xs text-gray-600">On selected items</p>
            <div className="pt-2">
              <Link
                href="/products?category=women"
                className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-5 py-3 rounded-full inline-flex items-center gap-2 transition shadow-md"
              >
                <span>Shop Women</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 top-0 w-1/2 md:w-3/5 h-full">
            <Image
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
              alt="Summer Collection"
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Right Promo Card - Men's Collection */}
        <div className="relative rounded-3xl overflow-hidden bg-[#1D212A] text-white min-h-[300px] md:min-h-[340px] p-8 flex flex-col justify-between group shadow-xs">
          <div className="z-10 max-w-xs space-y-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">
              Men&apos;s Collection
            </span>
            <h3 className="text-3xl md:text-4xl font-serif font-extrabold text-white leading-tight">
              New Season Styles
            </h3>
            <p className="text-xs text-gray-300">Modern looks for every occasion</p>
            <div className="pt-2">
              <Link
                href="/products?category=men"
                className="bg-white hover:bg-gray-100 text-black text-xs font-semibold px-5 py-3 rounded-full inline-flex items-center gap-2 transition shadow-md"
              >
                <span>Shop Men</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 top-0 w-1/2 md:w-3/5 h-full">
            <Image
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
              alt="Men's Collection"
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
