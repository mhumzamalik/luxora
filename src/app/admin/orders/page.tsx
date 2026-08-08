"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Eye, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/currency";
import { Skeleton } from "@/components/ui/Skeleton";

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
      !(ord.bankReference?.toLowerCase() || "").includes(searchQuery.toLowerCase()) &&
      !(ord.user?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) &&
      !(ord.user?.email?.toLowerCase() || ord.guestEmail?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Orders & Payment Verification
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review incoming bank transfer payments, inspect proofs, and update order statuses.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterStatus === "ALL" ? "bg-purple-600 text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Orders ({orders?.length || 0})
          </button>
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterStatus === "PENDING" ? "bg-amber-500 text-white font-bold shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Pending Verification
          </button>
          <button
            onClick={() => setFilterStatus("PAID")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterStatus === "PAID" ? "bg-emerald-600 text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            placeholder="Search Order, Name, or Bank Ref..."
            className="w-full bg-gray-50 text-xs text-gray-900 border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 outline-hidden focus:border-purple-600"
          />
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Orders Datatable */}
      <div className="bg-white border border-gray-200/70 rounded-3xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/80 uppercase text-[10px] text-gray-500 font-bold tracking-wider border-b border-gray-100">
            <tr>
              <th className="p-4">Order Number</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Bank Ref</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Payment Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="p-4">
                    <Skeleton className="h-6 w-full rounded-md" />
                  </td>
                </tr>
              ))
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">No matching orders found.</td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/60 transition">
                  <td className="p-4 font-mono font-bold text-gray-900">{order.orderNumber}</td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{order.user?.name || order.guestEmail || "Guest"}</div>
                    <div className="text-[11px] text-gray-400">{order.user?.email || order.guestEmail}</div>
                  </td>
                  <td className="p-4 font-mono text-purple-600 font-bold">{order.bankReference}</td>
                  <td className="p-4 font-extrabold text-gray-900">{formatCurrency(order.total)}</td>
                  <td className="p-4">
                    {order.paymentStatus === "PAID" ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> PAID
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1">
                        <Clock size={12} /> {order.paymentStatus}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-2xs"
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
