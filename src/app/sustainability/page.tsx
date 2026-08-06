import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Leaf, Recycle, HeartHandshake } from "lucide-react";

export const metadata = {
  title: "Sustainability | LUXORA",
  description: "Learn about LUXORA's commitment to eco-friendly packaging, ethical sourcing, and sustainable luxury.",
};

export default function SustainabilityPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-12 space-y-12">
        <Breadcrumb items={[{ label: "Sustainability" }]} />

        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Ethical Luxury</span>
          <h1 className="text-4xl font-serif font-extrabold text-gray-900">Conscious Craftsmanship</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            True luxury is timeless and responsible. We are committed to reducing environmental impact across our supply chain, packaging, and product lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-3">
            <Leaf size={28} className="text-emerald-600" />
            <h3 className="text-base font-serif font-bold text-gray-900">Ethical Sourcing</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              We partner exclusively with certified artisan suppliers who adhere to fair labor practices and sustainable material sourcing.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-3">
            <Recycle size={28} className="text-emerald-600" />
            <h3 className="text-base font-serif font-bold text-gray-900">100% Recyclable Packaging</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              All signature LUXORA delivery boxes, cotton dust bags, and protective wrapping are made from 100% recycled or biodegradable materials.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-3">
            <HeartHandshake size={28} className="text-emerald-600" />
            <h3 className="text-base font-serif font-bold text-gray-900">Carbon-Neutral Shipping</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              We offset 100% of carbon emissions generated from international logistics through verified global reforestation projects.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
