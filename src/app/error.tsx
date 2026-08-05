"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 flex flex-col justify-center items-center px-4 text-center py-20 space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Something Went Wrong</h1>
        <p className="text-xs text-gray-500 max-w-md">
          An unhandled error occurred while processing your request. Please try refreshing.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="bg-black hover:bg-gray-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2"
          >
            <RefreshCw size={15} /> Try Again
          </button>
          <Link
            href="/"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs px-6 py-3 rounded-xl transition"
          >
            Go Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
