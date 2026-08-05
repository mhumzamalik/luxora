import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata = {
  title: "Shipping & Delivery | LUXORA",
  description: "Global insured delivery options and order processing timeline.",
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-12 space-y-8">
        <Breadcrumb items={[{ label: "Shipping & Delivery" }]} />
        <h1 className="text-3xl font-serif font-extrabold text-gray-900">Shipping & Delivery</h1>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-xs leading-relaxed text-gray-600">
          <p>
            LUXORA ships globally via insured express couriers (DHL Express, FedEx Priority). All orders over $150 qualify for complimentary express delivery.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
