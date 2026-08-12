"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Bot, X, Send, ShoppingBag, Star, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  rating: number;
  reviewCount: number;
  badge?: string | null;
  category?: { name: string };
  images?: { url: string; isPrimary: boolean }[];
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  products?: Product[];
  timestamp: Date;
}

export function AIShoppingAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Welcome to LUXORA Personal AI Shopping Assistant. How may I assist your style search today?",
      timestamp: new Date(),
    },
  ]);

  const quickPrompts = [
    "Luxury dresses under $250",
    "Silk & premium evening wear",
    "Best sellers for special events",
    "Tailored outerwear & coats",
  ];

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/shopping-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI recommendation");
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: data.message || "Here are the top matches from our catalog:",
        products: data.products || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "ai",
          text: "I encountered a minor issue retrieving recommendations. Please try again or check our featured collections.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-semibold rounded-full shadow-xl hover:shadow-amber-500/20 hover:scale-105 transition-all duration-300 group cursor-pointer"
        aria-label="Open AI Shopping Assistant"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
        </div>
        <span className="text-sm font-bold tracking-wide">LUXORA AI</span>
      </button>

      {/* Slide-over Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl h-full">
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    LUXORA Stylist AI
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                      Live Catalog
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Personalized Luxury Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                aria-label="Close Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-amber-500 text-slate-950 font-medium rounded-tr-none"
                        : "bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none shadow-md"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Recommended Products Grid inside AI turn */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2.5 w-full">
                      {msg.products.map((product) => {
                        const primaryImg =
                          product.images?.find((img) => img.isPrimary)?.url ||
                          product.images?.[0]?.url ||
                          "/placeholder.jpg";
                        return (
                          <div
                            key={product.id}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-amber-500/40 transition-colors group"
                          >
                            <Link
                              href={`/products/${product.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="block relative aspect-square w-full rounded-lg overflow-hidden bg-slate-900 mb-2"
                            >
                              <Image
                                src={primaryImg}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </Link>
                            <div>
                              <p className="text-xs font-semibold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                                {product.name}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs font-bold text-amber-400">
                                  {formatCurrency(product.price)}
                                </span>
                                <div className="flex items-center text-[10px] text-slate-400 gap-0.5">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  <span>{product.rating}</span>
                                </div>
                              </div>
                            </div>
                            <Link
                              href={`/products/${product.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="mt-2.5 w-full py-1.5 text-center text-xs font-medium text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors flex items-center justify-center gap-1"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              View Item
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 p-3 text-xs text-amber-400 bg-slate-800/50 rounded-xl border border-slate-700/50 max-w-[70%]">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Searching real product catalog...</span>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto flex gap-1.5 no-scrollbar">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qp)}
                  className="whitespace-nowrap px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/40 border border-slate-700 rounded-full transition-all"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask about dresses, sizes, prices..."
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-sm rounded-xl px-4 py-2.5 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!prompt.trim() || loading}
                  className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-xl transition-colors font-bold"
                  aria-label="Send prompt"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
