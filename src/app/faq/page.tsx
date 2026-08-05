import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata = {
  title: "Frequently Asked Questions | LUXORA",
  description: "Answers to common questions about orders, payments, and authenticity.",
};

export default function FAQPage() {
  const faqs = [
    {
      q: "How do I verify a bank transfer payment?",
      a: "Upload your transaction receipt screenshot or PDF on the order confirmation page or within your Account Orders page using your bank reference number.",
    },
    {
      q: "Are all products guaranteed authentic?",
      a: "Yes. Every item is sourced directly from luxury brands or verified authorized distributors.",
    },
    {
      q: "What is your return policy?",
      a: "We offer complimentary 30-day returns on unworn items with security seals attached.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-12 space-y-8">
        <Breadcrumb items={[{ label: "FAQ" }]} />
        <h1 className="text-3xl font-serif font-extrabold text-gray-900">Frequently Asked Questions</h1>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <h3 className="text-sm font-bold text-gray-900">{faq.q}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
