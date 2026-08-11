"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { getPrimaryImage } from "@/lib/images";

interface InventoryVariant {
  id: string;
  sku: string;
  stock: number;
  color?: string | null;
  size?: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    category?: { name: string } | null;
    images?: { url: string }[];
  };
}

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);

  const { data: variants = [], isLoading } = useQuery<InventoryVariant[]>({
    queryKey: ["admin", "inventory", filter],
    queryFn: () => fetchApi<{ variants: InventoryVariant[] }>(`/api/admin/inventory?filter=${filter}`).then((res) => res.variants),
  });

  const updateMutation = useMutation({
    mutationFn: ({ variantId, stock }: { variantId: string; stock: number }) =>
      fetchApi("/api/admin/inventory", {
        method: "PUT",
        body: JSON.stringify({ variantId, stock }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      setEditingId(null);
    },
  });

  const handleSaveStock = (variantId: string) => {
    updateMutation.mutate({ variantId, stock: Number(editStock) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Inventory & Variant Stock Control
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time stock tracking across all product variants, SKU levels, and reorder thresholds.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex items-center space-x-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            filter === "all" ? "bg-purple-600 text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All Stock Levels
        </button>
        <button
          onClick={() => setFilter("low")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            filter === "low" ? "bg-amber-500 text-white font-bold shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Low Stock (&le; 10)
        </button>
        <button
          onClick={() => setFilter("out")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            filter === "out" ? "bg-rose-600 text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Out of Stock (0)
        </button>
      </div>

      <div className="bg-white border border-gray-200/70 rounded-3xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center text-purple-600 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs font-bold">Loading inventory items...</span>
          </div>
        ) : variants.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No inventory variants found matching filter.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 uppercase text-[10px] text-gray-500 font-bold tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4">Product Variant</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Stock Level</th>
                <th className="p-4 text-center">Stock Status</th>
                <th className="p-4 text-center">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {variants.map((varItem) => {
                const primaryImg = getPrimaryImage(varItem.product);

                const isEditing = editingId === varItem.id;

                return (
                  <tr key={varItem.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                          <Image src={primaryImg} alt={varItem.product.name} fill sizes="40px" className="object-contain p-1" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block leading-tight">{varItem.product.name}</span>
                          {(varItem.color || varItem.size) && (
                            <span className="text-[11px] text-gray-400">
                              {[varItem.color, varItem.size].filter(Boolean).join(" / ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-purple-600 font-bold">{varItem.sku}</td>
                    <td className="p-4 text-gray-500">{varItem.product.category?.name || "General"}</td>
                    <td className="p-4 text-center font-extrabold text-gray-900">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(Number(e.target.value))}
                          className="w-20 bg-gray-50 border border-purple-400 rounded-lg p-1 text-center font-mono font-bold"
                        />
                      ) : (
                        varItem.stock
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-block ${
                          varItem.stock === 0
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : varItem.stock <= 10
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {varItem.stock === 0 ? "Out of Stock" : varItem.stock <= 10 ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveStock(varItem.id)}
                          disabled={updateMutation.isPending}
                          className="bg-purple-600 text-white font-bold px-3 py-1 rounded-lg text-xs hover:bg-purple-700 transition"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(varItem.id);
                            setEditStock(varItem.stock);
                          }}
                          className="text-xs text-purple-600 hover:underline font-semibold"
                        >
                          Edit Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
