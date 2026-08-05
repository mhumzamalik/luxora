import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata = {
  title: "Privacy Policy | LUXORA",
  description: "LUXORA Privacy Policy and data protection commitment.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-12 space-y-8 text-gray-800">
        <Breadcrumb items={[{ label: "Privacy Policy" }]} />
        <h1 className="text-3xl font-serif font-extrabold text-gray-900">Privacy Policy</h1>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-xs leading-relaxed text-gray-600">
          <p>Effective Date: January 1, 2026</p>
          <h2 className="text-sm font-bold text-gray-900 border-b pb-2">1. Data Protection Overview</h2>
          <p>
            At LUXORA, we prioritize your privacy. Personal information collected during account registration, checkout, or newsletter subscription is used solely to process orders, fulfill legal requirements, and personalize your luxury shopping experience.
          </p>
          <h2 className="text-sm font-bold text-gray-900 border-b pb-2">2. Information Collection</h2>
          <p>
            We collect personal identity data (name, email, shipping address), payment details (encrypted tokens), and browsing analytics via cookies to optimize website performance.
          </p>
          <h2 className="text-sm font-bold text-gray-900 border-b pb-2">3. Data Sharing & Security</h2>
          <p>
            Your information is never sold to third parties. Data is transmitted securely using end-to-end TLS 1.3 encryption and stored in compliant database clusters.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
