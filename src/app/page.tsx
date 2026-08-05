import React from "react";
import { Header } from "@/components/layout/Header";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { BestSellersGrid } from "@/components/home/BestSellersGrid";
import { FlashSaleBlock } from "@/components/home/FlashSaleBlock";
import { NewArrivalsCarousel } from "@/components/home/NewArrivalsCarousel";
import { PromoBanners } from "@/components/home/PromoBanners";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { Testimonials } from "@/components/home/Testimonials";
import { BrandLogoStrip } from "@/components/home/BrandLogoStrip";
import { InstagramGrid } from "@/components/home/InstagramGrid";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/product/QuickViewModal";

export const metadata = {
  title: "LUXORA — Elevate Your Everyday | Luxury E-Commerce Platform",
  description:
    "Discover timeless pieces, designer apparel, footwear, handbags, and accessories crafted with premium materials for a luxurious lifestyle.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-gray-900 font-sans selection:bg-black selection:text-white">
      {/* Header with Navigation */}
      <Header />

      {/* Main Home Content */}
      <main className="flex-1 space-y-4 md:space-y-6">
        <HeroCarousel />
        <CategoryStrip />
        <BestSellersGrid />
        <FlashSaleBlock />
        <NewArrivalsCarousel />
        <PromoBanners />
        <WhyChooseUs />
        <Testimonials />
        <BrandLogoStrip />
        <InstagramGrid />
        <NewsletterSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Interactive Modals */}
      <CartDrawer />
      <QuickViewModal />
    </div>
  );
}
