"use client";

import React from "react";
import Image from "next/image";
import { Camera } from "lucide-react";

const socialImages = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80",
];

export function InstagramGrid() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
      <h3 className="text-xl font-serif font-bold text-center text-gray-900 mb-6">
        Follow Us @Luxora
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {socialImages.map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer"
          >
            <Image
              src={img}
              alt={`Luxora Instagram Post ${idx + 1}`}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 24vw, 12vw"
              className="object-cover group-hover:scale-110 transition duration-500"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
              <Camera size={20} />
            </div>
          </div>
        ))}

        {/* 8th Tile - View More Action */}
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          className="relative aspect-square rounded-2xl bg-gray-900 text-white flex flex-col items-center justify-center p-2 text-center group hover:bg-black transition shadow-xs"
        >
          <Camera size={22} className="mb-1 text-purple-400 group-hover:scale-110 transition" />
          <span className="text-xs font-bold">View More</span>
        </a>
      </div>
    </section>
  );
}
