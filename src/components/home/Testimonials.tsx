"use client";

import React from "react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

const reviews = [
  {
    name: "Sarah J.",
    role: "Verified Buyer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    text: "Luxora never disappoints! The quality is outstanding and customer service is exceptional.",
  },
  {
    name: "Michael T.",
    role: "Verified Buyer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    text: "Fast shipping, beautiful packaging, and amazing products. Highly recommended!",
  },
  {
    name: "Emily R.",
    role: "Verified Buyer",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    text: "Love the new collection! Everything is so stylish and fits perfectly.",
  },
];

export function Testimonials() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            What Our Customers Say
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-700 transition"
            aria-label="Previous Testimonial"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-700 transition"
            aria-label="Next Testimonial"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((rev, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-2xs space-y-4 hover:shadow-md transition"
          >
            <div className="flex items-center space-x-3">
              <div className="relative w-11 h-11 rounded-full overflow-hidden">
                <Image
                  src={rev.avatar}
                  alt={rev.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">{rev.name}</h4>
                <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 size={12} />
                  <span>{rev.role}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center text-amber-400">
              {[...Array(rev.rating)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>

            <p className="text-xs text-gray-600 leading-relaxed italic">
              &ldquo;{rev.text}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
