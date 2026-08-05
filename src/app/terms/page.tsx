import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata = {
  title: "Terms & Conditions | LUXORA",
  description: "LUXORA Terms of Service and sales policies.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-12 space-y-8 text-gray-800">
        <Breadcrumb items={[{ label: "Terms & Conditions" }]} />
        <h1 className="text-3xl font-serif font-extrabold text-gray-900">Terms & Conditions</h1>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-xs leading-relaxed text-gray-600">
          <p>Effective Date: January 1, 2026</p>
          <h2 className="text-sm font-bold text-gray-900 border-b pb-2">1. Terms of Agreement</h2>
          <p>
            By accessing or making a purchase on LUXORA, you agree to be bound by these Terms of Service. All items offered are subject to stock availability and price verification.
          </p>
          <h2 className="text-sm font-bold text-gray-900 border-b pb-2">2. Bank Transfers & Payment</h2>
          <p>
            Bank transfer orders are held for 48 hours pending receipt of verification proof. Stock allocation is confirmed upon administrator validation.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
