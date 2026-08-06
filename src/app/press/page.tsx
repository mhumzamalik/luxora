import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Newspaper, Mail, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Press & Media | LUXORA",
  description: "LUXORA newsroom, press releases, media coverage, and brand assets.",
};

export default function PressPage() {
  const articles = [
    {
      date: "August 2026",
      title: "LUXORA Expands Premium Direct Bank Transfer & Instant Verification Gateway",
      outlet: "Global Retail & Tech Digest",
    },
    {
      date: "June 2026",
      title: "How LUXORA is Redefining Curated E-Commerce Luxury for Discerning Buyers",
      outlet: "Haute Fashion Weekly",
    },
    {
      date: "April 2026",
      title: "The Next Era of Certified Authentic High-End Apparel and Accessories",
      outlet: "Luxury Business Insider",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-12 space-y-12">
        <Breadcrumb items={[{ label: "Press & Media" }]} />

        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Newsroom</span>
          <h1 className="text-4xl font-serif font-extrabold text-gray-900">LUXORA in the Press</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Read the latest news, press releases, media announcements, and coverage highlighting LUXORA&apos;s journey.
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
              <Newspaper size={20} /> Featured Press Releases
            </h2>
          </div>

          <div className="space-y-4">
            {articles.map((art, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase">{art.date}</span>
                  <h3 className="text-sm font-bold text-gray-900">{art.title}</h3>
                  <span className="text-xs text-gray-400 block">{art.outlet}</span>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
                >
                  Read Release <ExternalLink size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xs text-center space-y-3 max-w-lg mx-auto">
          <Mail size={28} className="mx-auto text-indigo-600" />
          <h3 className="text-base font-serif font-bold text-gray-900">Media & Inquiries</h3>
          <p className="text-xs text-gray-500">
            For press kits, interviews, or high-res brand assets, please reach out to our media relations team.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-black text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-gray-800 transition mt-2"
          >
            Contact Press Office
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
