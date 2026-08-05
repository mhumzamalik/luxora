"use client";

import React from "react";

const brands = [
  "NIKE",
  "ZARA",
  "GUCCI",
  "ADIDAS",
  "PRADA",
  "H&M",
  "CALVIN KLEIN",
  "DIOR",
];

export function BrandLogoStrip() {
  return (
    <section className="w-full border-y border-gray-100 bg-white py-8 my-6">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-wrap items-center justify-between gap-6 md:gap-8 opacity-75">
        {brands.map((brand) => (
          <span
            key={brand}
            className="font-serif font-black tracking-widest text-lg md:text-xl text-gray-400 hover:text-black transition cursor-pointer"
          >
            {brand}
          </span>
        ))}
      </div>
    </section>
  );
}
