"use client";

import React, { useState } from "react";
import { Plus, Tag, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

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
      <div className="flex justify-between items-center border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-serif font-extrabold text-white">
            Coupons & Discounts
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Create and toggle promo codes, usage limits, and percentage discounts.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {showModal && (
        <form onSubmit={handleCreate} className="bg-[#161722] border border-purple-500/30 p-6 rounded-2xl space-y-4 max-w-md">
          <h3 className="text-sm font-bold text-white">New Promo Coupon</h3>
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Coupon Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="LUX25"
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs outline-hidden uppercase font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Discount %</label>
              <input
                type="number"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="20"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Min Order ($)</label>
              <input
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="100"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs outline-hidden"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-purple-600 text-white text-xs font-bold py-2 rounded-xl"
            >
              {createMutation.isPending ? "Creating..." : "Save Coupon"}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="bg-white/5 text-gray-300 text-xs px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="p-12 flex justify-center items-center text-purple-400 gap-2">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-xs">Loading coupons...</span>
        </div>
      ) : coupons.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-xs bg-[#161722] rounded-2xl border border-white/10">
          No coupons created yet. Click &quot;Create Coupon&quot; above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="bg-[#161722] border border-white/10 p-6 rounded-2xl space-y-3 shadow-md flex justify-between items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-purple-400" />
                  <span className="font-mono font-extrabold text-white text-base">
                    {c.code}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {c.discountValue}% OFF
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Min Order: {c.minOrderAmount ? `$${c.minOrderAmount}` : "None"}
                </p>
                <p className="text-[11px] text-purple-400">Used {c.usedCount} times</p>
              </div>

              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
                {c.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
