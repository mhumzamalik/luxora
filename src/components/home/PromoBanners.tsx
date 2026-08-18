"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

interface DBBanner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  ctaText: string | null;
}

const defaultPromos = [
  {
    id: "default-p1",
    subtitle: "Summer Collection",
    title: "Up to 40% Off",
    description: "On selected items",
    linkUrl: "/products?category=women",
    ctaText: "Shop Women",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-[#F5F2EC]",
    textColor: "text-gray-900",
    btnColor: "bg-black hover:bg-gray-800 text-white",
  },
  {
    id: "default-p2",
    subtitle: "Men's Collection",
    title: "New Season Styles",
    description: "Modern looks for every occasion",
    linkUrl: "/products?category=men",
    ctaText: "Shop Men",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-[#1D212A]",
    textColor: "text-white",
    btnColor: "bg-white hover:bg-gray-100 text-black",
  },
];

interface HomepageData {
  promoBanners?: DBBanner[];
}

export function PromoBanners() {
  const { data } = useQuery<HomepageData>({
    queryKey: ["homepage"],
    queryFn: () => fetchApi("/api/homepage"),
  });

  const dbBanners = data?.promoBanners || [];

  const promos =
    dbBanners.length > 0
      ? dbBanners.map((b, idx) => ({
          id: b.id,
          subtitle: b.subtitle || "Exclusive Offer",
          title: b.title,
          description: b.description || "Limited time promotional items",
          linkUrl: b.linkUrl || "/products",
          ctaText: b.ctaText || "Explore",
          imageUrl: b.imageUrl,
          bgColor: idx % 2 === 0 ? "bg-[#F5F2EC]" : "bg-[#1D212A]",
          textColor: idx % 2 === 0 ? "text-gray-900" : "text-white",
          btnColor: idx % 2 === 0 ? "bg-black hover:bg-gray-800 text-white" : "bg-white hover:bg-gray-100 text-black",
        }))
      : defaultPromos;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promos.map((card) => (
          <div
            key={card.id}
            className={`relative rounded-3xl overflow-hidden ${card.bgColor} ${card.textColor} min-h-[300px] md:min-h-[340px] p-8 flex flex-col justify-between group shadow-xs`}
          >
            <div className="z-10 max-w-xs space-y-3">
              <span className="text-xs font-semibold uppercase tracking-widest block opacity-70">
                {card.subtitle}
              </span>
              <h3 className="text-3xl md:text-4xl font-serif font-extrabold leading-tight">
                {card.title}
              </h3>
              <p className="text-xs opacity-80">{card.description}</p>
              <div className="pt-2">
                <Link
                  href={card.linkUrl}
                  className={`${card.btnColor} text-xs font-semibold px-5 py-3 rounded-full inline-flex items-center gap-2 transition shadow-md`}
                >
                  <span>{card.ctaText}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="absolute right-0 bottom-0 top-0 w-1/2 md:w-3/5 h-full">
              <Image
                src={card.imageUrl}
                alt={card.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
