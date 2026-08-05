"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  _count: { orders: number; reviews: number };
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["admin", "customers"],
    queryFn: () => fetchApi("/api/admin/customers"),
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-serif font-extrabold text-white">
          Customer Directory
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Registered customer accounts, order history totals, and lifetime value.
        </p>
      </div>

      <div className="bg-[#161722] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center text-purple-400 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs">Loading customer directory...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No customers registered yet.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-white/5 uppercase text-[10px] text-gray-400 tracking-wider">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customers.map((cust) => (
                <tr key={cust.id} className="hover:bg-white/5 transition">
                  <td className="p-4">
                    <div className="font-bold text-white">{cust.name || "Anonymous User"}</div>
                    <div className="text-[11px] text-gray-400">{cust.email}</div>
                  </td>
                  <td className="p-4 font-semibold text-purple-400">{cust._count.orders} orders</td>
                  <td className="p-4 font-bold text-white">${cust.totalSpent.toFixed(2)}</td>
                  <td className="p-4 text-gray-400">
                    {new Date(cust.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
