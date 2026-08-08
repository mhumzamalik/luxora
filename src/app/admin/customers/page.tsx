"use client";

import React, { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/currency";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  _count: { orders: number; reviews: number };
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["admin", "customers"],
    queryFn: () => fetchApi("/api/admin/customers"),
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Customer Directory
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Registered customer accounts, order history totals, and lifetime value.
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or email..."
            className="w-full bg-gray-50 text-xs text-gray-900 border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 outline-hidden focus:border-purple-600"
          />
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white border border-gray-200/70 rounded-3xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center text-purple-600 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs font-bold">Loading customer directory...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No customers found matching search criteria.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 uppercase text-[10px] text-gray-500 font-bold tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-gray-50/60 transition">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{cust.name || "Anonymous User"}</div>
                    <div className="text-[11px] text-gray-400">{cust.email}</div>
                  </td>
                  <td className="p-4 font-bold text-purple-600">{cust._count.orders} orders</td>
                  <td className="p-4 font-extrabold text-gray-900">{formatCurrency(cust.totalSpent)}</td>
                  <td className="p-4 text-gray-500">
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
