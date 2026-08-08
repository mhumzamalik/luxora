"use client";

import React, { useState } from "react";
import { Plus, Loader2, Ticket } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/currency";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number | null;
  usedCount: number;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["admin", "coupons"],
    queryFn: () => fetchApi("/api/admin/coupons"),
  });

  const createMutation = useMutation({
    mutationFn: (newCoupon: { code: string; discountType: string; discountValue: string; minOrderAmount: string | null }) =>
      fetchApi("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify(newCoupon),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setShowModal(false);
      setCode("");
      setDiscountValue("");
      setMinOrder("");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      code,
      discountType: "PERCENTAGE",
      discountValue,
      minOrderAmount: minOrder || null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Coupons & Discount Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Create and toggle promo codes, usage limits, and percentage discounts.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {showModal && (
        <form onSubmit={handleCreate} className="bg-white border border-purple-200 p-6 rounded-3xl space-y-4 max-w-md shadow-lg animate-in fade-in">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Ticket size={18} className="text-purple-600" /> New Promo Coupon
          </h3>
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Coupon Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="LUXORA20"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 text-xs outline-hidden uppercase font-mono focus:border-purple-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Discount %</label>
              <input
                type="number"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="20"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 text-xs outline-hidden focus:border-purple-600"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Min Order (PKR)</label>
              <input
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="5000"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 text-xs outline-hidden focus:border-purple-600"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs cursor-pointer"
            >
              {createMutation.isPending ? "Creating..." : "Save Coupon"}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200/70 rounded-3xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center text-purple-600 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs font-bold">Loading coupons...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No coupons created yet. Click &quot;Create Coupon&quot; above.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 uppercase text-[10px] text-gray-500 font-bold tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Min Order</th>
                <th className="p-4">Times Used</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition">
                  <td className="p-4 font-mono font-extrabold text-purple-600">{c.code}</td>
                  <td className="p-4 font-bold text-gray-900">{c.discountValue}% OFF</td>
                  <td className="p-4 text-gray-500">
                    {c.minOrderAmount ? formatCurrency(c.minOrderAmount) : "No minimum"}
                  </td>
                  <td className="p-4 text-gray-700">{c.usedCount} uses</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                        c.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
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
