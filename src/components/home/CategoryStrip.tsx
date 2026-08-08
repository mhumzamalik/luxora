import React from "react";
import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    name: "Women",
    slug: "women",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Men",
    slug: "men",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Shoes",
    slug: "shoes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Bags",
    slug: "bags",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Accessories",
    slug: "accessories",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Beauty",
    slug: "beauty",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Home & Living",
    slug: "home-living",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Gifts",
    slug: "gifts",
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=300&q=80",
  },
];

export function CategoryStrip() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 md:gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/products?category=${cat.slug}`}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-2xl overflow-hidden bg-gray-100 p-1 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md border border-gray-200/80">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover rounded-xl"
              />
            </div>
            <span className="mt-2.5 text-xs font-semibold text-gray-800 group-hover:text-black transition">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
