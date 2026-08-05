"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Search, CheckCircle2, Clock, Truck } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

interface TrackedOrder {
  id: string;
  orderNumber?: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  shippedAt?: string | null;
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const data = await fetchApi<TrackedOrder>(`/api/orders/${orderId.trim()}`);
      setOrder(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Order not found. Check your Order ID.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-12 space-y-8">
        <Breadcrumb items={[{ label: "Track Order" }]} />
        <div className="text-center space-y-2 max-w-md mx-auto">
          <h1 className="text-3xl font-serif font-extrabold text-gray-900">Track Your Order</h1>
          <p className="text-xs text-gray-500">Enter your order ID and account email to trace shipping status.</p>
        </div>

        <form onSubmit={handleTrack} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm max-w-md mx-auto space-y-4 text-xs">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl font-bold">{error}</div>}
          <div>
            <label className="font-bold text-gray-700 block mb-1">Order ID / Order Number</label>
            <input
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. LX-2026-883911"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden font-mono"
            />
          </div>
          <div>
            <label className="font-bold text-gray-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sophia@example.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <Search size={16} /> {loading ? "Searching..." : "Track Package"}
          </button>
        </form>

        {order && (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-md mx-auto space-y-6 text-xs animate-in fade-in">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="text-[10px] text-gray-400 uppercase">Order Status</span>
                <h3 className="font-bold text-gray-900 text-base">{order.status}</h3>
              </div>
              <span className="font-mono text-xs font-extrabold text-purple-600">{order.orderNumber || order.id}</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className={order.status !== "CANCELLED" ? "text-emerald-500" : "text-gray-300"} />
                <div>
                  <span className="font-bold block text-gray-900">Order Placed</span>
                  <span className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock size={18} className={order.paymentStatus === "PAID" ? "text-emerald-500" : "text-amber-500"} />
                <div>
                  <span className="font-bold block text-gray-900">Payment Status</span>
                  <span className="text-[10px] text-gray-400">{order.paymentStatus}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Truck size={18} className={order.status === "SHIPPED" || order.status === "DELIVERED" ? "text-emerald-500" : "text-gray-300"} />
                <div>
                  <span className="font-bold block text-gray-900">Dispatched via Express</span>
                  <span className="text-[10px] text-gray-400">{order.shippedAt ? new Date(order.shippedAt).toLocaleString() : "Processing"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
