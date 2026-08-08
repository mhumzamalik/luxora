"use client";

import React from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

export default function AdminNewsletterPage() {
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["admin", "customers"],
    queryFn: () => fetchApi("/api/admin/customers"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Mail className="text-purple-600" size={24} /> Newsletter Subscribers
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track email subscribers, campaign lists, and customer marketing preferences.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200/70 rounded-3xl overflow-hidden shadow-2xs">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-900">
            Subscribed Customer Contacts ({customers.length})
          </h2>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 size={12} /> Active Subscribers
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-xs">Loading subscribers...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 uppercase text-[10px] text-gray-500 font-bold tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4">Subscriber Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Subscribed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition">
                  <td className="p-4 font-bold text-gray-900">{c.name || "Subscriber"}</td>
                  <td className="p-4 font-mono text-purple-600">{c.email}</td>
                  <td className="p-4 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
