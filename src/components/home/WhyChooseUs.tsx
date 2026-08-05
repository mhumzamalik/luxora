"use client";

import React from "react";
import { Truck, ShieldCheck, RefreshCw, Headphones, Award } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Free delivery on orders over $150",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "100% secure payment guaranteed",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "30-day hassle-free returns",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated support anytime",
  },
  {
    icon: Award,
    title: "Premium Quality",
    description: "Carefully curated luxury products",
  },
];

export function WhyChooseUs() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-2xs">
        <h3 className="text-xl font-serif font-bold text-center text-gray-900 mb-6 md:mb-8">
          Why Choose Us
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center space-y-2 p-3 rounded-2xl hover:bg-gray-50/80 transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center mb-1">
                  <Icon size={22} />
                </div>
                <h4 className="text-xs font-bold text-gray-900">{feat.title}</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed max-w-[140px]">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
