"use client";

import React from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Landmark,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/Skeleton";

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockVariants?: Array<{ id: string; name?: string }>;
  recentOrders: RecentOrder[];
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  bankReference?: string | null;
  total: number;
  user?: { name: string | null } | null;
  guestEmail?: string | null;
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => fetchApi<AdminStats>("/api/admin/stats"),
  });

  const statCards = [
    {
      title: "Total Revenue",
      value: stats ? `$${stats.totalRevenue.toFixed(2)}` : "$0.00",
      change: "Live Revenue Metrics",
      icon: DollarSign,
      color: "bg-emerald-500/20 text-emerald-400",
    },
    {
      title: "Total Orders",
      value: stats ? `${stats.totalOrders}` : "0",
      change: `${stats?.pendingOrders || 0} Pending Verification`,
      icon: ShoppingBag,
      color: "bg-purple-500/20 text-purple-400",
    },
    {
      title: "Total Customers",
      value: stats ? `${stats.totalCustomers}` : "0",
      change: "Registered Customer Base",
      icon: Users,
      color: "bg-indigo-500/20 text-indigo-400",
    },
    {
      title: "Low Stock Items",
      value: stats ? `${stats.lowStockVariants?.length || 0} Variants` : "0",
      change: "Inventory Alert Level",
      icon: AlertTriangle,
      color: "bg-red-500/20 text-red-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-white">
            Dashboard Overview
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time sales performance, bank transfer verification queue, and store metrics.
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-lg flex items-center gap-2"
        >
          <Landmark size={16} />
          <span>Manage Orders ({stats?.pendingOrders || 0} Pending)</span>
        </Link>
      </div>

      {/* Stats Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-[#161722] border border-white/10 p-6 rounded-2xl space-y-3 shadow-md"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-400">{stat.title}</span>
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {isLoading ? <Skeleton className="h-8 w-24 bg-white/10" /> : stat.value}
              </div>
              <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                <span>{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Datatable */}
      <div className="bg-[#161722] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-serif font-bold text-white">
            Recent Orders & Payment Queue
          </h3>
          <Link
            href="/admin/orders"
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-white/5 uppercase text-[10px] text-gray-400 tracking-wider">
              <tr>
                <th className="p-3.5 rounded-l-xl">Order Number</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Bank Ref</th>
                <th className="p-3.5">Total</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5 rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">Loading orders...</td>
                </tr>
              ) : !stats?.recentOrders || stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">No orders found.</td>
                </tr>
              ) : (
                stats.recentOrders.map((order: RecentOrder) => (
                  <tr key={order.id} className="hover:bg-white/5 transition">
                    <td className="p-3.5 font-mono font-bold text-white">{order.orderNumber}</td>
                    <td className="p-3.5">{order.user?.name || order.guestEmail || "Guest"}</td>
                    <td className="p-3.5 font-mono text-purple-400 font-bold">{order.bankReference}</td>
                    <td className="p-3.5 font-bold text-white">${order.total.toFixed(2)}</td>
                    <td className="p-3.5">
                      {order.paymentStatus === "PAID" ? (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> PAID
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <Clock size={12} /> {order.paymentStatus}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 underline"
                      >
                        Inspect & Verify
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
