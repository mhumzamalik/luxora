"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-12 space-y-12">
        <Breadcrumb items={[{ label: "Contact Us" }]} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-600">Client Services</span>
              <h1 className="text-3xl font-serif font-extrabold text-gray-900 mt-1">Get in Touch</h1>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Our luxury advisors are available 24/7 to assist with product inquiries, order tracking, and bank transfer verifications.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <Mail size={18} className="text-purple-600" />
                <div>
                  <span className="text-gray-400 block text-[10px]">Email Concierge</span>
                  <span className="font-bold text-gray-900">support@luxora.com</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <Phone size={18} className="text-purple-600" />
                <div>
                  <span className="text-gray-400 block text-[10px]">VIP Direct Line</span>
                  <span className="font-bold text-gray-900">+1 (800) 589-6721</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <MapPin size={18} className="text-purple-600" />
                <div>
                  <span className="text-gray-400 block text-[10px]">Flagship Showroom</span>
                  <span className="font-bold text-gray-900">740 Fifth Avenue, New York, NY 10019</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            {submitted ? (
              <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center space-y-4 shadow-sm animate-in fade-in">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
                <h3 className="text-xl font-serif font-bold text-gray-900">Message Received</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to LUXORA. A luxury advisor will review your message and reply within 2 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white border border-gray-100 p-8 rounded-3xl space-y-4 text-xs shadow-sm">
                <h3 className="text-base font-bold text-gray-900">Send an Inquiry</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Order Inquiry or Product Question"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Message</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="How can our concierge team assist you today?"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Send size={16} /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
