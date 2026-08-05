"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 flex flex-col justify-center items-center px-4 text-center py-20 space-y-6">
        <span className="font-serif text-8xl font-extrabold text-gray-200">404</span>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Page Not Found</h1>
        <p className="text-xs md:text-sm text-gray-500 max-w-md leading-relaxed">
          The luxury item or page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="bg-black hover:bg-gray-800 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-lg transition flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Return to Homepage
        </Link>
      </main>
      <Footer />
    </div>
  );
}
