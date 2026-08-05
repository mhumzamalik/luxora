"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Skeleton } from "@/components/ui/Skeleton";
import { Package, ExternalLink } from "lucide-react";

interface UserOrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: { name: string } | null;
}

interface UserOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: string;
  items?: UserOrderItem[];
}

export default function AccountOrdersPage() {
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ["userOrders"],
    queryFn: () => fetchApi<UserOrder[]>("/api/orders"),
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        <Breadcrumb items={[{ label: "Account", href: "/account" }, { label: "My Orders" }]} />

        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-gray-900">Order History</h1>
          <p className="text-xs text-gray-500">View and track all your previous purchases.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-3xl" />
            ))}
          </div>
        ) : isError || !orders || orders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-4 shadow-2xs">
            <Package size={48} className="text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">No Orders Found</h3>
            <p className="text-xs text-gray-500">You haven&apos;t placed any orders with LUXORA yet.</p>
            <Link href="/products" className="inline-block bg-black text-white text-xs font-bold px-6 py-3 rounded-xl">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: UserOrder) => (
              <div
                key={order.id}
                className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-2">
                  <div>
                    <span className="text-xs text-gray-400 block">Order Reference</span>
                    <span className="font-mono font-bold text-sm text-gray-900">{order.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Placed On</span>
                    <span className="text-xs font-semibold text-gray-800">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Total</span>
                    <span className="text-xs font-extrabold text-gray-900">${order.total.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                      {order.status}
                    </span>
                  </div>
                  <Link
                    href={`/order-confirmation/${order.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                  >
                    View Details <ExternalLink size={14} />
                  </Link>
                </div>

                <div className="divide-y divide-gray-100">
                  {order.items?.map((item: UserOrderItem) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{item.product?.name}</p>
                        <p className="text-gray-500">Qty: {item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                      </div>
                      <span className="font-bold text-gray-900">${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
