"use client";

import React from "react";
import Link from "next/link";
import { ArrowUp, Share2, Camera, Send, Globe } from "lucide-react";


export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full bg-[#0A0B0E] text-gray-300 pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
        {/* Main Footer Links Columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl md:text-3xl font-extrabold tracking-widest text-white">
                LUXORA
              </span>
            </Link>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              Discover premium products curated for a luxurious lifestyle. Elevate your everyday style with timeless craftsmanship and modern design.
            </p>

            <div className="flex items-center space-x-4 text-gray-400 pt-2">
              <a href="#" className="hover:text-white transition" aria-label="Share">
                <Share2 size={18} />
              </a>
              <a href="#" className="hover:text-white transition" aria-label="Follow">
                <Camera size={18} />
              </a>
              <a href="#" className="hover:text-white transition" aria-label="Message">
                <Send size={18} />
              </a>
            </div>
          </div>

          {/* Column 1: Shop */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Shop
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="/products?category=women" className="hover:text-white transition">Women</Link></li>
              <li><Link href="/products?category=men" className="hover:text-white transition">Men</Link></li>
              <li><Link href="/products?category=shoes" className="hover:text-white transition">Shoes</Link></li>
              <li><Link href="/products?category=bags" className="hover:text-white transition">Bags</Link></li>
              <li><Link href="/products?category=accessories" className="hover:text-white transition">Accessories</Link></li>
              <li><Link href="/products?sale=true" className="hover:text-white transition text-red-400">Sale</Link></li>
            </ul>
          </div>

          {/* Column 2: Customer Service */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Customer Service
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
              <li><Link href="/track-order" className="hover:text-white transition">Track Order</Link></li>
              <li><Link href="/returns" className="hover:text-white transition">Returns & Exchanges</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition">Shipping Info</Link></li>
              <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
            </ul>
          </div>

          {/* Column 3: About & Help */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              About Us
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="/about" className="hover:text-white transition">Our Story</Link></li>
              <li><Link href="/careers" className="hover:text-white transition">Careers</Link></li>
              <li><Link href="/press" className="hover:text-white transition">Press</Link></li>
              <li><Link href="/sustainability" className="hover:text-white transition">Sustainability</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Payment Icons Strip & Disclaimer */}
        <div className="border-t border-gray-800/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} LUXORA. All rights reserved.</p>

          <div className="flex items-center space-x-3 text-[11px] font-bold text-gray-400">
            <span className="px-2 py-1 bg-white/10 rounded-sm">BANK TRANSFER</span>
            <span className="px-2 py-1 bg-white/10 rounded-sm">MASTERCARD</span>
            <span className="px-2 py-1 bg-white/10 rounded-sm">VISA</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 border border-gray-800 rounded-full px-3 py-1 text-xs">
              <Globe size={13} />
              <span>PAKISTAN</span>
            </div>

            <button
              onClick={scrollToTop}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition"
              aria-label="Scroll back to top"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
