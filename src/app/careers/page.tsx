import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Briefcase, Compass, Users, Sparkles } from "lucide-react";

export const metadata = {
  title: "Careers | LUXORA",
  description: "Join the LUXORA team. Explore career opportunities in luxury fashion, e-commerce, and technology.",
};

export default function CareersPage() {
  const openings = [
    { title: "Senior E-Commerce Product Manager", dept: "Product & Strategy", location: "Remote / Hybrid" },
    { title: "Luxury Client Concierge Specialist", dept: "Customer Experience", location: "Full-Time" },
    { title: "Lead Full-Stack Engineer (Next.js / Node)", dept: "Engineering", location: "Remote" },
    { title: "High-Fashion Brand Merchandiser", dept: "Curations", location: "Milan / Paris" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-12 space-y-12">
        <Breadcrumb items={[{ label: "Careers" }]} />

        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Work With Us</span>
          <h1 className="text-4xl font-serif font-extrabold text-gray-900">Shape the Future of Luxury</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            At LUXORA, we are redefining modern luxury e-commerce. We empower creative thinkers, technologists, and fashion enthusiasts to craft extraordinary experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-2">
            <Sparkles size={24} className="text-indigo-600" />
            <h3 className="text-sm font-serif font-bold text-gray-900">Innovation & Craft</h3>
            <p className="text-xs text-gray-500">We blend high-fashion artistry with modern e-commerce engineering.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-2">
            <Users size={24} className="text-indigo-600" />
            <h3 className="text-sm font-serif font-bold text-gray-900">Global Culture</h3>
            <p className="text-xs text-gray-500">Work alongside passionate teammates operating across global fashion capitals.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-2">
            <Compass size={24} className="text-indigo-600" />
            <h3 className="text-sm font-serif font-bold text-gray-900">Unbounded Growth</h3>
            <p className="text-xs text-gray-500">Continuous learning, competitive benefits, and career mobility opportunities.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
              <Briefcase size={20} /> Open Positions
            </h2>
          </div>

          <div className="space-y-4">
            {openings.map((job, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{job.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{job.dept}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="bg-black text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-800 transition"
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
