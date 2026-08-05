import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Award, Sparkles, Gem } from "lucide-react";

export const metadata = {
  title: "About Us | LUXORA",
  description: "Learn about LUXORA's heritage, commitment to luxury craftsmanship, and curated catalog.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-12 space-y-12">
        <Breadcrumb items={[{ label: "About Us" }]} />

        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-600">Our Heritage</span>
          <h1 className="text-4xl font-serif font-extrabold text-gray-900">Crafting Timeless Elegance</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            LUXORA was founded on a simple principle: to connect discerning clientele with hand-selected luxury apparel, fine timepieces, and rare fragrances from world-renowned fashion houses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <Gem size={28} className="text-purple-600" />
            <h3 className="text-base font-serif font-bold text-gray-900">Authenticity Guaranteed</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Every single product in our catalog undergoes rigorous multi-point inspection by certified luxury appraisers.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <Sparkles size={28} className="text-purple-600" />
            <h3 className="text-base font-serif font-bold text-gray-900">Curated Excellence</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              We partner directly with elite luxury houses across Paris, Milan, and Tokyo to deliver limited-edition collections.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <Award size={28} className="text-purple-600" />
            <h3 className="text-base font-serif font-bold text-gray-900">White-Glove Concierge</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Enjoy dedicated personal shopping assistance, insured global courier delivery, and seamless bank transfer verification.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
