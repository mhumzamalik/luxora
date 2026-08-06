"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Eye, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/currency";

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  bankReference?: string | null;
  total: number;
  createdAt: string;
  user?: { name: string | null; email: string } | null;
  guestEmail?: string | null;
}

export default function AdminOrdersPage() {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: () => fetchApi<AdminOrder[]>("/api/admin/orders"),
  });

  const filteredOrders = (orders || []).filter((ord) => {
    if (filterStatus === "PENDING" && ord.paymentStatus === "PAID") return false;
    if (filterStatus === "PAID" && ord.paymentStatus !== "PAID") return false;
    if (
      searchQuery &&
      !ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(ord.bankReference?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-serif font-extrabold text-white">
            Orders & Payment Verification
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review incoming bank transfer payments, inspect proofs, and update order statuses.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#161722] p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterStatus === "ALL" ? "bg-purple-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            All Orders ({orders?.length || 0})
          </button>
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterStatus === "PENDING" ? "bg-amber-500 text-black font-bold" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            Pending Verification
          </button>
          <button
            onClick={() => setFilterStatus("PAID")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterStatus === "PAID" ? "bg-emerald-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            Verified Paid
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID or Ref..."
            className="w-full bg-white/5 text-xs text-white border border-white/10 rounded-xl py-2.5 pl-9 pr-3 outline-hidden"
          />
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Orders Datatable */}
      <div className="bg-[#161722] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-white/5 uppercase text-[10px] text-gray-400 tracking-wider">
            <tr>
              <th className="p-4">Order Number</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Bank Ref</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Payment Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">Loading orders...</td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No orders found.</td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition">
                  <td className="p-4 font-mono font-bold text-white">{order.orderNumber}</td>
                  <td className="p-4">
                    <div className="font-semibold text-white">{order.user?.name || order.guestEmail || "Guest"}</div>
                    <div className="text-[11px] text-gray-500">{order.user?.email || order.guestEmail}</div>
                  </td>
                  <td className="p-4 font-mono text-purple-400 font-bold">{order.bankReference}</td>
                  <td className="p-4 font-extrabold text-white">{formatCurrency(order.total)}</td>
                  <td className="p-4">
                    {order.paymentStatus === "PAID" ? (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> PAID
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                        <Clock size={12} /> {order.paymentStatus}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition"
                    >
                      <Eye size={13} /> View & Verify
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
