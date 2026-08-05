import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";

export const metadata = {
  title: "Returns & Exchanges | LUXORA",
  description: "Complimentary 30-day returns and white-glove exchange service.",
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-12 space-y-8">
        <Breadcrumb items={[{ label: "Returns & Exchanges" }]} />
        <h1 className="text-3xl font-serif font-extrabold text-gray-900">Returns & Exchanges</h1>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-xs leading-relaxed text-gray-600">
          <p>
            LUXORA offers complimentary 30-day returns on all unworn items in their original packaging with security seals intact.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="bg-gray-50 p-4 rounded-2xl text-center space-y-2">
              <RotateCcw size={24} className="mx-auto text-purple-600" />
              <h4 className="font-bold text-gray-900">30-Day Window</h4>
              <p className="text-[11px] text-gray-500">Initiate returns online from your Account Dashboard.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl text-center space-y-2">
              <Truck size={24} className="mx-auto text-purple-600" />
              <h4 className="font-bold text-gray-900">Prepaid Shipping</h4>
              <p className="text-[11px] text-gray-500">Insured return shipping labels are generated automatically.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl text-center space-y-2">
              <ShieldCheck size={24} className="mx-auto text-purple-600" />
              <h4 className="font-bold text-gray-900">Rapid Refunds</h4>
              <p className="text-[11px] text-gray-500">Refunds are issued to original payment source within 24h.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
