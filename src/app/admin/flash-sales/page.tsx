"use client";

import React from "react";
import Image from "next/image";
import { Zap, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/currency";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  isFlashSale: boolean;
  badge?: string | null;
  images?: { url: string }[];
}

export default function AdminFlashSalesPage() {
  const { data: products = [], isLoading } = useQuery<ProductItem[]>({
    queryKey: ["admin", "products"],
    queryFn: () => fetchApi("/api/admin/products"),
  });

  const flashSaleProducts = products.filter((p) => p.isFlashSale);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Zap className="text-purple-600 fill-purple-600" size={24} /> Flash Sales Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage flash sale products, promotional discounts, and limited-time deals on the homepage.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200/70 rounded-3xl p-6 space-y-4 shadow-2xs">
        <h2 className="text-base font-serif font-bold text-gray-900 border-b border-gray-100 pb-3">
          Active Flash Sale Items ({flashSaleProducts.length})
        </h2>

        {isLoading ? (
          <div className="p-12 flex justify-center items-center text-purple-600 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs font-bold">Loading flash sale catalog...</span>
          </div>
        ) : flashSaleProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No products currently marked as Flash Sale. You can feature items from Product Management.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {flashSaleProducts.map((prod) => {
              const primaryImg = prod.images?.[0]?.url || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80";

              return (
                <div key={prod.id} className="bg-gray-50/80 border border-gray-200/80 p-4 rounded-2xl flex items-center space-x-3">
                  <div className="relative w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    <Image src={primaryImg} alt={prod.name} fill className="object-contain p-1" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 line-clamp-1">{prod.name}</h3>
                    <p className="text-xs font-semibold text-purple-600">{formatCurrency(prod.price)}</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      Active Promotion
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
