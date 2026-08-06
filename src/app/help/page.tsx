import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { HelpCircle, MessageSquare, Truck, RotateCcw, ShieldCheck, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Help Center | LUXORA",
  description: "Find answers to common questions, order assistance, shipping info, and contact support.",
};

export default function HelpPage() {
  const topics = [
    {
      icon: Truck,
      title: "Orders & Shipping",
      desc: "Track package status, estimated delivery times, and shipping rates.",
      link: "/shipping",
    },
    {
      icon: RotateCcw,
      title: "Returns & Exchanges",
      desc: "Read our 30-day return policy and request easy returns or item exchanges.",
      link: "/returns",
    },
    {
      icon: ShieldCheck,
      title: "Bank Transfer Verification",
      desc: "How to complete direct bank transfers and submit payment proofs.",
      link: "/faq",
    },
    {
      icon: MessageSquare,
      title: "Customer Concierge",
      desc: "Contact our dedicated client advisors for instant assistance.",
      link: "/contact",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-12 space-y-12">
        <Breadcrumb items={[{ label: "Help Center" }]} />

        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Client Support</span>
          <h1 className="text-4xl font-serif font-extrabold text-gray-900">How Can We Help You?</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Welcome to the LUXORA Help Center. Explore support guides or get in touch with our luxury client services team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {topics.map((topic, i) => {
            const Icon = topic.icon;
            return (
              <Link
                key={i}
                href={topic.link}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xs hover:shadow-md transition space-y-3 group"
              >
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Icon size={24} />
                </div>
                <h2 className="text-base font-serif font-bold text-gray-900 flex items-center justify-between">
                  <span>{topic.title}</span>
                  <ArrowRight size={16} className="text-gray-400 group-hover:text-black group-hover:translate-x-1 transition" />
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed">{topic.desc}</p>
              </Link>
            );
          })}
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xs text-center space-y-4 max-w-xl mx-auto">
          <HelpCircle size={32} className="mx-auto text-indigo-600" />
          <h3 className="text-lg font-serif font-bold text-gray-900">Still Need Assistance?</h3>
          <p className="text-xs text-gray-500">
            Our concierge team is available 24/7 to assist with orders, product inquiries, and custom requests.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/contact"
              className="bg-black text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition"
            >
              Contact Support
            </Link>
            <Link
              href="/faq"
              className="bg-gray-100 text-gray-800 text-xs font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition"
            >
              Browse FAQs
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
