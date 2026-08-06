"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { Package, Heart, MapPin, Settings, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { formatCurrency } from "@/lib/currency";

interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: string;
}

interface UserProfileData {
  id: string;
  name: string | null;
  email: string;
  orders?: RecentOrderSummary[];
}

export default function AccountPage() {
  const { data: session } = useSession();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => fetchApi<UserProfileData>("/api/users/me"),
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        <Breadcrumb items={[{ label: "Account Overview" }]} />

        {/* Welcome Banner */}
        <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center font-serif text-2xl font-bold uppercase shadow-md">
              {session?.user?.name?.[0] || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-serif font-extrabold text-gray-900">
                Welcome back, {session?.user?.name || "Member"}
              </h1>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/account/settings"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition"
            >
              <Settings size={15} /> Settings
            </Link>
          </div>
        </div>

        {/* Quick Nav Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/account/orders"
            className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-gray-300 shadow-2xs transition group"
          >
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-4 group-hover:scale-110 transition">
              <Package size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">My Orders</h3>
            <p className="text-xs text-gray-500 mt-1">Track purchases and order history</p>
          </Link>

          <Link
            href="/account/wishlist"
            className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-gray-300 shadow-2xs transition group"
          >
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl w-fit mb-4 group-hover:scale-110 transition">
              <Heart size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Wishlist</h3>
            <p className="text-xs text-gray-500 mt-1">View saved favorite items</p>
          </Link>

          <Link
            href="/account/addresses"
            className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-gray-300 shadow-2xs transition group"
          >
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4 group-hover:scale-110 transition">
              <MapPin size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Address Book</h3>
            <p className="text-xs text-gray-500 mt-1">Manage delivery locations</p>
          </Link>

          <Link
            href="/account/settings"
            className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-gray-300 shadow-2xs transition group"
          >
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-4 group-hover:scale-110 transition">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Account Security</h3>
            <p className="text-xs text-gray-500 mt-1">Password & login preferences</p>
          </Link>
        </div>

        {/* Recent Orders Overview */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h3 className="text-lg font-serif font-bold text-gray-900">Recent Orders</h3>
            <Link href="/account/orders" className="text-xs font-bold text-indigo-600 hover:underline">
              View All Orders
            </Link>
          </div>

          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : (userData?.orders?.length ?? 0) > 0 ? (
            <div className="divide-y divide-gray-100">
              {userData?.orders?.map((ord: RecentOrderSummary) => (
                <div key={ord.id} className="py-4 first:pt-0 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-gray-900">{ord.orderNumber}</span>
                    <span className="text-gray-400 block text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="font-extrabold text-gray-900">{formatCurrency(ord.total)}</span>
                  <span className="uppercase text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-gray-100 text-gray-800">
                    {ord.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 py-4 text-center">No orders placed yet.</p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
