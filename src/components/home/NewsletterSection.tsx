"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-blue-50/80 rounded-3xl p-8 md:p-12 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xs">
        {/* Left Info */}
        <div className="flex items-start space-x-4 max-w-md">
          <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center shadow-xs flex-shrink-0">
            <Mail size={22} />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900">
              Stay Updated
            </h3>
            <p className="text-xs md:text-sm text-gray-600 mt-1 leading-relaxed">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
          </div>
        </div>

        {/* Right Input Form */}
        <div className="w-full md:w-auto flex-1 max-w-md">
          {subscribed ? (
            <div className="bg-white border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center space-x-3 text-xs font-semibold">
              <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
              <span>Thank you for subscribing! Check your inbox for exclusive VIP perks.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full px-4 py-2.5 text-xs text-gray-900 outline-hidden bg-transparent"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-xs whitespace-nowrap"
                >
                  Subscribe
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center sm:text-left">
                By subscribing, you agree to our{" "}
                <a href="/privacy" className="underline hover:text-gray-600">
                  Privacy Policy
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
