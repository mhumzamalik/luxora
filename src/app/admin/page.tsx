"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Wallet,
  ShoppingBag,
  Users,
  Package,
  ArrowUpRight,
  Eye,
  FolderPlus,
  Ticket,
  AlertCircle,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/currency";

interface AdminStatsResponse {
  period: string;
  periodLabel: string;
  kpis: {
    revenue: { value: number; change: number };
    orders: { value: number; pending: number; change: number };
    customers: { value: number; change: number };
    products: { value: number; change: number };
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
    user?: { name: string | null; email: string } | null;
    guestEmail?: string | null;
  }>;
  bestSellers: Array<{
    id: string;
    name: string;
    image: string;
    unitsSold: number;
    revenue: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    image: string;
    stock: number;
    status: string;
  }>;
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<string>("30d");

  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<AdminStatsResponse>({
    queryKey: ["adminStats", period],
    queryFn: () => fetchApi<AdminStatsResponse>(`/api/admin/stats?period=${period}`),
  });

  const periodLabel = stats?.periodLabel || "last 30 days";

  const getStatusBadge = (status: string, paymentStatus: string) => {
    const s = paymentStatus === "PAID" ? "Paid" : status;

    switch (s.toUpperCase()) {
      case "PAID":
      case "DELIVERED":
        return (
          <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200/60 inline-block">
            {s}
          </span>
        );
      case "PROCESSING":
      case "SHIPPED":
        return (
          <span className="bg-purple-50 text-purple-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-purple-200/60 inline-block">
            {s}
          </span>
        );
      case "PENDING":
      case "PROOF_SUBMITTED":
        return (
          <span className="bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200/60 inline-block">
            {s === "PROOF_SUBMITTED" ? "Proof Verification" : "Pending"}
          </span>
        );
      case "CANCELLED":
      case "FAILED":
        return (
          <span className="bg-rose-50 text-rose-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-rose-200/60 inline-block">
            {s}
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200 inline-block">
            {s}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner & Period Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        {/* Date Filter & Refresh Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 text-xs font-semibold text-gray-700">
            <Calendar size={14} className="text-gray-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent outline-hidden cursor-pointer font-bold text-gray-800"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-2xl transition cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin text-purple-600" : ""} />
          </button>
        </div>
      </div>

      {/* Error state alert */}
      {isError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs font-semibold text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>Failed to load store statistics. Please try refreshing.</span>
          </div>
          <button
            onClick={() => refetch()}
            className="bg-rose-600 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. KPI Cards Grid (Matching reference screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs hover:shadow-md transition space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500">Total Revenue</span>
            <div className="p-3 bg-purple-100/70 text-purple-600 rounded-2xl">
              <Wallet size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-gray-900 tracking-tight">
              {isLoading ? (
                <Skeleton className="h-8 w-32 rounded-lg" />
              ) : (
                formatCurrency(stats?.kpis?.revenue?.value || 0)
              )}
            </div>
            {!isLoading && (
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <span
                  className={`font-bold flex items-center text-[11px] px-2 py-0.5 rounded-full ${
                    (stats?.kpis?.revenue?.change || 0) >= 0
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-rose-700 bg-rose-50"
                  }`}
                >
                  {(stats?.kpis?.revenue?.change || 0) >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(stats?.kpis?.revenue?.change || 0)}%
                </span>
                <span className="text-gray-400 text-[11px]">vs {periodLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs hover:shadow-md transition space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500">Total Orders</span>
            <div className="p-3 bg-emerald-100/70 text-emerald-600 rounded-2xl">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-gray-900 tracking-tight">
              {isLoading ? (
                <Skeleton className="h-8 w-24 rounded-lg" />
              ) : (
                (stats?.kpis?.orders?.value || 0).toLocaleString()
              )}
            </div>
            {!isLoading && (
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <span
                  className={`font-bold flex items-center text-[11px] px-2 py-0.5 rounded-full ${
                    (stats?.kpis?.orders?.change || 0) >= 0
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-rose-700 bg-rose-50"
                  }`}
                >
                  {(stats?.kpis?.orders?.change || 0) >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(stats?.kpis?.orders?.change || 0)}%
                </span>
                <span className="text-gray-400 text-[11px]">vs {periodLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Total Customers */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs hover:shadow-md transition space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500">Total Customers</span>
            <div className="p-3 bg-blue-100/70 text-blue-600 rounded-2xl">
              <Users size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-gray-900 tracking-tight">
              {isLoading ? (
                <Skeleton className="h-8 w-24 rounded-lg" />
              ) : (
                (stats?.kpis?.customers?.value || 0).toLocaleString()
              )}
            </div>
            {!isLoading && (
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <span
                  className={`font-bold flex items-center text-[11px] px-2 py-0.5 rounded-full ${
                    (stats?.kpis?.customers?.change || 0) >= 0
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-rose-700 bg-rose-50"
                  }`}
                >
                  {(stats?.kpis?.customers?.change || 0) >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(stats?.kpis?.customers?.change || 0)}%
                </span>
                <span className="text-gray-400 text-[11px]">vs {periodLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Total Products */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs hover:shadow-md transition space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500">Total Products</span>
            <div className="p-3 bg-amber-100/70 text-amber-600 rounded-2xl">
              <Package size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-gray-900 tracking-tight">
              {isLoading ? (
                <Skeleton className="h-8 w-24 rounded-lg" />
              ) : (
                (stats?.kpis?.products?.value || 0).toLocaleString()
              )}
            </div>
            {!isLoading && (
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <span
                  className={`font-bold flex items-center text-[11px] px-2 py-0.5 rounded-full ${
                    (stats?.kpis?.products?.change || 0) >= 0
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-rose-700 bg-rose-50"
                  }`}
                >
                  {(stats?.kpis?.products?.change || 0) >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(stats?.kpis?.products?.change || 0)}%
                </span>
                <span className="text-gray-400 text-[11px]">vs {periodLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Recent Orders & Best Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders Datatable */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-base font-serif font-bold text-gray-900">
                Recent Orders
              </h2>
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-purple-600 hover:text-purple-700 transition"
              >
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Order ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-xl text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="p-3">
                          <Skeleton className="h-6 w-full rounded-md" />
                        </td>
                      </tr>
                    ))
                  ) : !stats?.recentOrders || stats.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    stats.recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50/60 transition">
                        <td className="p-3 font-mono font-bold text-gray-900">{ord.orderNumber}</td>
                        <td className="p-3 text-gray-800 truncate max-w-[120px]">
                          {ord.user?.name || ord.guestEmail || "Guest"}
                        </td>
                        <td className="p-3 text-gray-500 text-[11px]">
                          {new Date(ord.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-3 font-bold text-gray-900">{formatCurrency(ord.total)}</td>
                        <td className="p-3">{getStatusBadge(ord.status, ord.paymentStatus)}</td>
                        <td className="p-3 text-center">
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="p-1.5 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition inline-block"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 text-center">
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-purple-600 hover:underline inline-flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Best Selling Products */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-base font-serif font-bold text-gray-900">
                Best Selling Products
              </h2>
              <Link
                href="/admin/products"
                className="text-xs font-bold text-purple-600 hover:text-purple-700 transition"
              >
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Product</th>
                    <th className="p-3 text-center">Sold</th>
                    <th className="p-3 text-right rounded-r-xl">Revenue (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={3} className="p-3">
                          <Skeleton className="h-6 w-full rounded-md" />
                        </td>
                      </tr>
                    ))
                  ) : !stats?.bestSellers || stats.bestSellers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-gray-400">
                        No sales data available yet.
                      </td>
                    </tr>
                  ) : (
                    stats.bestSellers.map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50/60 transition">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                              <Image
                                src={prod.image}
                                alt={prod.name}
                                fill
                                className="object-contain p-1"
                              />
                            </div>
                            <span className="font-bold text-gray-900 line-clamp-1">{prod.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-gray-700">{prod.unitsSold}</td>
                        <td className="p-3 text-right font-extrabold text-gray-900">
                          {formatCurrency(prod.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 text-center">
            <Link
              href="/admin/products"
              className="text-xs font-bold text-purple-600 hover:underline inline-flex items-center gap-1"
            >
              <span>Explore All Products</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Low Stock Products & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Products */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h2 className="text-base font-serif font-bold text-gray-900">
              Low Stock Products
            </h2>
            <Link
              href="/admin/inventory"
              className="text-xs font-bold text-purple-600 hover:text-purple-700 transition"
            >
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3 text-center">Stock</th>
                  <th className="p-3 text-right rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="p-3">
                        <Skeleton className="h-6 w-full rounded-md" />
                      </td>
                    </tr>
                  ))
                ) : !stats?.lowStockProducts || stats.lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-emerald-600 font-semibold">
                      All product inventory levels are healthy!
                    </td>
                  </tr>
                ) : (
                  stats.lowStockProducts.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition">
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <span className="font-bold text-gray-900 line-clamp-1">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-gray-500">{item.sku}</td>
                      <td className="p-3 text-center font-bold text-gray-900">{item.stock}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-block ${
                            item.stock === 0
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions (Matching reference design) */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-serif font-bold text-gray-900">
              Quick Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Box 1: Add Product */}
            <div className="bg-purple-50/40 p-5 rounded-2xl border border-purple-100/60 flex flex-col justify-between items-center text-center space-y-4 hover:bg-purple-50/80 transition">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                <Package size={24} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900">Add Product</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Create a new product</p>
              </div>
              <Link
                href="/admin/products/new"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition"
              >
                Add Product
              </Link>
            </div>

            {/* Box 2: Add Category */}
            <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100/60 flex flex-col justify-between items-center text-center space-y-4 hover:bg-emerald-50/80 transition">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <FolderPlus size={24} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900">Add Category</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Create a new category</p>
              </div>
              <Link
                href="/admin/categories"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition"
              >
                Add Category
              </Link>
            </div>

            {/* Box 3: Create Coupon */}
            <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-100/60 flex flex-col justify-between items-center text-center space-y-4 hover:bg-rose-50/80 transition">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <Ticket size={24} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900">Create Coupon</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Create a new coupon</p>
              </div>
              <Link
                href="/admin/coupons"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition"
              >
                Create Coupon
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
