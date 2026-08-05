"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    id: 1,
    tagline: "NEW COLLECTION",
    title: "Elevate Your Everyday",
    description:
      "Discover timeless pieces crafted with premium materials for a luxurious lifestyle.",
    primaryCta: "Shop Now",
    primaryLink: "/products",
    secondaryCta: "Explore Collection",
    secondaryLink: "/products?category=bags",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
    promoTitle: "Spring Sale",
    promoDiscount: "30% OFF",
    promoText: "Limited time offer",
  },
  {
    id: 2,
    tagline: "SUMMER ESSENTIALS",
    title: "Modern Luxury Defined",
    description:
      "Unveiling our newest designer apparel and accessories crafted for effortless elegance.",
    primaryCta: "Discover Women",
    primaryLink: "/products?category=women",
    secondaryCta: "View Lookbook",
    secondaryLink: "/products",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
    promoTitle: "New Arrivals",
    promoDiscount: "HOT",
    promoText: "Curated fashion pieces",
  },
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="relative w-full rounded-3xl overflow-hidden bg-[#F5F4F0] min-h-[460px] md:min-h-[520px] flex items-center shadow-xs">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="w-full grid grid-cols-1 lg:grid-cols-12 items-center min-h-[460px] md:min-h-[520px] p-6 md:p-12 gap-8"
          >
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-5 z-10">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-gray-500">
                {slide.tagline}
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-extrabold text-gray-900 leading-tight">
                {slide.title}
              </h1>

              <p className="text-sm md:text-base text-gray-600 max-w-md leading-relaxed">
                {slide.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href={slide.primaryLink}
                  className="bg-black hover:bg-gray-800 text-white text-xs md:text-sm font-semibold px-6 py-3.5 rounded-full flex items-center gap-2 transition shadow-md group"
                >
                  <span>{slide.primaryCta}</span>
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition"
                  />
                </Link>

                <Link
                  href={slide.secondaryLink}
                  className="bg-white/80 hover:bg-white text-gray-900 border border-gray-300 text-xs md:text-sm font-semibold px-6 py-3.5 rounded-full transition shadow-xs"
                >
                  {slide.secondaryCta}
                </Link>
              </div>
            </div>

            {/* Right Image & Floating Sale Card Column */}
            <div className="lg:col-span-6 relative h-[320px] md:h-[440px] w-full rounded-2xl overflow-hidden">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority
                className="object-cover object-center rounded-2xl"
              />

              {/* Floating Soft Blue/Purple Sale Widget (Matching Reference Screenshot) */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute top-6 right-6 bg-[#EEF2FF]/95 backdrop-blur-md p-5 rounded-2xl border border-indigo-100 shadow-xl max-w-[180px] text-center"
              >
                <span className="text-[11px] font-medium text-indigo-600 uppercase tracking-wider block">
                  {slide.promoTitle}
                </span>
                <div className="text-3xl md:text-4xl font-extrabold text-indigo-950 my-1">
                  {slide.promoDiscount}
                </div>
                <span className="text-[10px] text-gray-500 block mb-3">
                  {slide.promoText}
                </span>
                <Link
                  href="/products?sale=true"
                  className="inline-block text-[11px] font-semibold text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full shadow-2xs transition"
                >
                  Shop the Sale
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === idx ? "w-8 bg-black" : "w-2 bg-gray-300"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
