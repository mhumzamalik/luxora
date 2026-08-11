"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Trash2, Edit3, Loader2, Sparkles, Zap, Flame } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/components/ui/ToastProvider";
import { getPrimaryImage } from "@/lib/images";

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFlashSale?: boolean;
  category?: { name: string };
  images?: { url: string; isPrimary?: boolean }[];
  variants?: { stock: number }[];
}

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: products = [], isLoading } = useQuery<AdminProduct[]>({
    queryKey: ["admin", "products"],
    queryFn: () => fetchApi("/api/admin/products"),
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: (data: { id: string; isBestSeller?: boolean; isNewArrival?: boolean; isFlashSale?: boolean }) =>
      fetchApi("/api/admin/products", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (updated: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
      toastSuccess("Visibility Updated", `Homepage visibility settings updated for ${updated.name || "product"}.`);
    },
    onError: () => {
      toastError("Update Failed", "Failed to update product visibility flags.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/api/admin/products?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
      toastSuccess("Product Deleted", "The product has been removed from catalog.");
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleVisibility = (
    id: string,
    field: "isBestSeller" | "isNewArrival" | "isFlashSale",
    currentValue: boolean | undefined
  ) => {
    updateVisibilityMutation.mutate({
      id,
      [field]: !currentValue,
    });
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Product &amp; Catalog Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage catalog items, stock levels, and control homepage section visibility.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-md flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name..."
            className="w-full bg-gray-50 text-xs text-gray-900 border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 outline-hidden focus:border-purple-600"
          />
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
        </div>

        <div className="text-[11px] text-gray-500 flex items-center gap-4 font-medium">
          <span className="flex items-center gap-1.5"><Flame size={13} className="text-amber-500" /> Best Seller</span>
          <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-blue-500" /> New Arrival</span>
          <span className="flex items-center gap-1.5"><Zap size={13} className="text-purple-500" /> Flash Sale</span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gray-200/70 rounded-3xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center text-purple-600 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs font-bold">Loading admin catalog...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No products found in catalog.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 uppercase text-[10px] text-gray-500 font-bold tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4 text-center">Homepage Section Visibility</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredProducts.map((prod) => {
                const totalStock = prod.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
                const primaryImg = getPrimaryImage(prod);

                return (
                  <tr key={prod.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden shrink-0">
                          <Image src={primaryImg} alt={prod.name} fill className="object-contain p-1" sizes="40px" />
                        </div>
                        <span className="font-bold text-gray-900 line-clamp-1">{prod.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{prod.category?.name || "General"}</td>
                    <td className="p-4 font-extrabold text-gray-900">{formatCurrency(prod.price)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                          totalStock < 10
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {totalStock} units
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        {/* Best Seller Toggle */}
                        <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold cursor-pointer transition select-none ${
                          prod.isBestSeller
                            ? "bg-amber-50 border-amber-300 text-amber-800"
                            : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
                        }`}>
                          <input
                            type="checkbox"
                            checked={Boolean(prod.isBestSeller)}
                            onChange={() => handleToggleVisibility(prod.id, "isBestSeller", prod.isBestSeller)}
                            className="sr-only"
                          />
                          <Flame size={12} className={prod.isBestSeller ? "text-amber-500 fill-amber-500" : "text-gray-400"} />
                          <span>Best Seller</span>
                        </label>

                        {/* New Arrival Toggle */}
                        <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold cursor-pointer transition select-none ${
                          prod.isNewArrival
                            ? "bg-blue-50 border-blue-300 text-blue-800"
                            : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
                        }`}>
                          <input
                            type="checkbox"
                            checked={Boolean(prod.isNewArrival)}
                            onChange={() => handleToggleVisibility(prod.id, "isNewArrival", prod.isNewArrival)}
                            className="sr-only"
                          />
                          <Sparkles size={12} className={prod.isNewArrival ? "text-blue-500 fill-blue-500" : "text-gray-400"} />
                          <span>New Arrival</span>
                        </label>

                        {/* Flash Sale Toggle */}
                        <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold cursor-pointer transition select-none ${
                          prod.isFlashSale
                            ? "bg-purple-50 border-purple-300 text-purple-800"
                            : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
                        }`}>
                          <input
                            type="checkbox"
                            checked={Boolean(prod.isFlashSale)}
                            onChange={() => handleToggleVisibility(prod.id, "isFlashSale", prod.isFlashSale)}
                            className="sr-only"
                          />
                          <Zap size={12} className={prod.isFlashSale ? "text-purple-500 fill-purple-500" : "text-gray-400"} />
                          <span>Flash Sale</span>
                        </label>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/products/${prod.id}`}
                          className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
                          title="Edit Product"
                        >
                          <Edit3 size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
