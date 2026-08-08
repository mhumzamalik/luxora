"use client";

import React, { useState } from "react";
import { Plus, Loader2, Ticket, Edit3, Trash2, Power, AlertCircle, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/components/ui/ToastProvider";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  /* Create/Edit Form State */
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["admin", "coupons"],
    queryFn: () => fetchApi("/api/admin/coupons"),
  });

  const resetForm = () => {
    setCode("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setMinOrderAmount("");
    setMaxDiscount("");
    setUsageLimit("");
    setExpiresAt("");
    setIsActive(true);
    setShowCreateModal(false);
    setEditingCoupon(null);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue.toString());
    setMinOrderAmount(coupon.minOrderAmount ? coupon.minOrderAmount.toString() : "");
    setMaxDiscount(coupon.maxDiscount ? coupon.maxDiscount.toString() : "");
    setUsageLimit(coupon.usageLimit ? coupon.usageLimit.toString() : "");
    setExpiresAt(coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "");
    setIsActive(coupon.isActive);
  };

  /* Mutations */
  const createMutation = useMutation({
    mutationFn: (newCoupon: any) =>
      fetchApi("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify(newCoupon),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toastSuccess("Coupon Created", "New promo coupon created successfully.");
      resetForm();
    },
    onError: (err: any) => {
      toastError("Failed to Create", err?.message || "Could not create coupon");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetchApi(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toastSuccess("Coupon Updated", "Coupon details saved successfully.");
      resetForm();
    },
    onError: (err: any) => {
      toastError("Failed to Update", err?.message || "Could not update coupon");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetchApi(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toastSuccess("Status Changed", "Coupon active status updated.");
    },
    onError: (err: any) => {
      toastError("Error", err?.message || "Failed to change status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toastSuccess("Deleted", "Coupon removed successfully.");
    },
    onError: (err: any) => {
      toastError("Error", err?.message || "Failed to delete coupon");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: code.toUpperCase().trim(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || null,
      maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null,
      expiresAt: expiresAt || null,
      isActive,
    };

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Coupons &amp; Discount Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Create, edit, toggle, and set rules for promotional discount codes.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer shrink-0"
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Create / Edit Modal */}
      {(showCreateModal || editingCoupon) && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-purple-200 p-6 md:p-8 rounded-3xl space-y-4 max-w-xl shadow-xl animate-in fade-in"
        >
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Ticket size={18} className="text-purple-600" />
              {editingCoupon ? `Edit Coupon (${editingCoupon.code})` : "New Promo Coupon"}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="LUXORA20"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 font-mono uppercase focus:border-purple-600 outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Discount Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 focus:border-purple-600 outline-hidden"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (PKR)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Discount Value {discountType === "PERCENTAGE" ? "(%)" : "(PKR)"} *
              </label>
              <input
                type="number"
                step="any"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "PERCENTAGE" ? "20" : "500"}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 focus:border-purple-600 outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Min Order Amount (PKR)</label>
              <input
                type="number"
                step="any"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="e.g. 5000 (optional)"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 focus:border-purple-600 outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Max Discount Cap (PKR)</label>
              <input
                type="number"
                step="any"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="e.g. 2000 (for % type)"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 focus:border-purple-600 outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Usage Limit (Total Uses)</label>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="e.g. 100 (optional)"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 focus:border-purple-600 outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Expiration Date</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 focus:border-purple-600 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <label className="font-bold text-gray-700 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                Active Coupon
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-3 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{isSaving ? "Saving..." : editingCoupon ? "Update Coupon" : "Save Coupon"}</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-3 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Coupons Table */}
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 uppercase text-[10px] text-gray-500 font-bold tracking-wider border-b border-gray-100">
                <tr>
                  <th className="p-4">Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Min Order</th>
                  <th className="p-4">Usage</th>
                  <th className="p-4">Expiration</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {coupons.map((c) => {
                  const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                  const isLimitReached = c.usageLimit !== null && c.usedCount >= c.usageLimit;

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition">
                      <td className="p-4 font-mono font-extrabold text-purple-600">
                        {c.code}
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        {c.discountType === "PERCENTAGE"
                          ? `${c.discountValue}% OFF`
                          : formatCurrency(c.discountValue) + " OFF"}
                        {c.maxDiscount ? (
                          <span className="text-[10px] text-gray-400 font-normal block">
                            Max: {formatCurrency(c.maxDiscount)}
                          </span>
                        ) : null}
                      </td>
                      <td className="p-4 text-gray-500">
                        {c.minOrderAmount ? formatCurrency(c.minOrderAmount) : "No minimum"}
                      </td>
                      <td className="p-4 text-gray-700">
                        {c.usedCount} {c.usageLimit !== null ? `/ ${c.usageLimit}` : ""} uses
                      </td>
                      <td className="p-4 text-gray-500">
                        {c.expiresAt ? (
                          <span className={isExpired ? "text-rose-600 font-bold" : ""}>
                            {new Date(c.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          "Never"
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                            c.isActive && !isExpired && !isLimitReached
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {!c.isActive
                            ? "Inactive"
                            : isExpired
                            ? "Expired"
                            : isLimitReached
                            ? "Limit Reached"
                            : "Active"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              toggleStatusMutation.mutate({ id: c.id, isActive: !c.isActive })
                            }
                            title={c.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              c.isActive
                                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(c)}
                            title="Edit Coupon"
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete coupon ${c.code}?`)) {
                                deleteMutation.mutate(c.id);
                              }
                            }}
                            title="Delete Coupon"
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
