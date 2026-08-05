"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  category?: { name: string };
  images?: { url: string }[];
  variants?: { stock: number }[];
}

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<AdminProduct[]>({
    queryKey: ["admin", "products"],
    queryFn: () => fetchApi("/api/admin/products"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/api/admin/products?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-serif font-extrabold text-white">
            Product & Inventory Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage catalog items, monitor stock levels, and upload product variants.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-lg flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Search Toolbar */}
      <div className="bg-[#161722] p-4 rounded-2xl border border-white/10 flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name..."
            className="w-full bg-white/5 text-xs text-white border border-white/10 rounded-xl py-2.5 pl-9 pr-3 outline-hidden"
          />
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#161722] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center text-purple-400 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs">Loading admin catalog...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No products found in catalog.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-white/5 uppercase text-[10px] text-gray-400 tracking-wider">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map((prod) => {
                const totalStock = prod.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
                const primaryImg = prod.images?.[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80";

                return (
                  <tr key={prod.id} className="hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={primaryImg} alt={prod.name} fill className="object-contain p-1" />
                        </div>
                        <span className="font-bold text-white line-clamp-1">{prod.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{prod.category?.name || "General"}</td>
                    <td className="p-4 font-bold text-white">${prod.price.toFixed(2)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          totalStock < 20
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {totalStock} units
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDelete(prod.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                        >
                          <Trash2 size={15} />
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
