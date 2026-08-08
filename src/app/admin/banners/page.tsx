"use client";

import React from "react";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";

export default function AdminBannersPage() {
  const activeBanners = [
    {
      id: "b1",
      title: "Spring Luxury Collection 2026",
      subtitle: "Up to 30% OFF Limited Edition Handbags & Apparel",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
      status: "Active (Hero Banner)",
    },
    {
      id: "b2",
      title: "Signature Timepieces & Fine Jewelry",
      subtitle: "Handcrafted Elegance from European Fashion Houses",
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
      status: "Active (Promo Strip)",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="text-purple-600" size={24} /> Banners & Marketing Assets
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure homepage hero carousel slides, seasonal banners, and promo graphics.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {activeBanners.map((b) => (
          <div key={b.id} className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{b.title}</h3>
                <p className="text-xs text-gray-500">{b.subtitle}</p>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                {b.status}
              </span>
            </div>

            <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              <Image src={b.image} alt={b.title} fill className="object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
