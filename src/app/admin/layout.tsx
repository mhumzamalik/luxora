"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Users,
  Star,
  Ticket,
  Zap,
  Image as ImageIcon,
  Mail,
  Boxes,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  Store,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
  { name: "Coupons", href: "/admin/coupons", icon: Ticket },
  { name: "Flash Sales", href: "/admin/flash-sales", icon: Zap },
  { name: "Banners", href: "/admin/banners", icon: ImageIcon },
  { name: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { name: "Inventory", href: "/admin/inventory", icon: Boxes },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fetch pending stats for notification counter
  const { data: stats } = useQuery({
    queryKey: ["adminStatsNotification"],
    queryFn: () => fetchApi<{ kpis?: { orders?: { pending?: number } } }>("/api/admin/stats"),
    refetchInterval: 30000,
  });

  const pendingCount = stats?.kpis?.orders?.pending || 0;

  // Keyboard shortcut Ctrl+K listener for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("admin-global-search");
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-gray-800 flex font-sans selection:bg-purple-600 selection:text-white antialiased">
      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* 1. Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-200/80 flex flex-col justify-between transition-transform duration-300 shadow-sm ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand Logo Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30 group-hover:scale-105 transition">
                <ShoppingBag size={20} />
              </div>
              <div>
                <span className="font-serif text-lg font-bold tracking-tight text-gray-900 block leading-none">
                  Admin Panel
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block mt-1">
                  LUXORA Store
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition"
              aria-label="Close Sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-purple-50 text-purple-600 font-bold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={isActive ? "text-purple-600" : "text-gray-400 group-hover:text-gray-600"}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.name === "Orders" && pendingCount > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Sidebar Controls */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition"
            >
              <Store size={16} />
              <span>View Storefront</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-2 text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navigation Header */}
        <header className="h-16 bg-white border-b border-gray-200/80 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          {/* Left: Mobile Toggle & Global Search */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-black rounded-lg hover:bg-gray-100 transition"
              aria-label="Open Sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="admin-global-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="w-full bg-gray-50/80 focus:bg-white text-xs text-gray-900 border border-gray-200 focus:border-purple-600 rounded-xl py-2 pl-9 pr-16 outline-hidden transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-gray-400 bg-gray-200/60 px-1.5 py-0.5 rounded border border-gray-300/50">
                Ctrl + K
              </span>
            </form>
          </div>

          {/* Right Controls: Notifications & User Profile */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-gray-500 hover:text-purple-600 rounded-xl hover:bg-gray-100 transition relative cursor-pointer"
                aria-label="Notifications"
              >
                <Bell size={19} />
                {pendingCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 z-50 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-bold text-gray-900">Notifications</h4>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      {pendingCount} New
                    </span>
                  </div>

                  {pendingCount > 0 ? (
                    <Link
                      href="/admin/orders"
                      onClick={() => setNotificationsOpen(false)}
                      className="block bg-purple-50/60 p-3 rounded-xl hover:bg-purple-100/60 transition space-y-1"
                    >
                      <p className="text-xs font-bold text-gray-900">Bank Transfers Pending</p>
                      <p className="text-[11px] text-gray-500">
                        {pendingCount} order(s) waiting for receipt & payment verification.
                      </p>
                    </Link>
                  ) : (
                    <p className="text-xs text-gray-400 py-2 text-center">No pending notifications.</p>
                  )}
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-gray-200" />

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-1 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0">
                  {session?.user?.image ? (
                    <Image src={session.user.image} alt="Admin Avatar" fill sizes="32px" className="object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-purple-700">
                      {session?.user?.name ? session.user.name[0].toUpperCase() : "A"}
                    </span>
                  )}
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-gray-900 leading-tight">
                    {session?.user?.name || "Admin"}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 leading-tight">
                    {session?.user?.role || "Super Admin"}
                  </span>
                </div>

                <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-[11px] text-gray-400">Signed in as</p>
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {session?.user?.email || "admin@luxora.com"}
                    </p>
                  </div>

                  <Link
                    href="/admin/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Settings size={14} /> Admin Settings
                  </Link>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 3. Page Content Container */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>

        {/* Footer info */}
        <footer className="px-8 py-4 border-t border-gray-200/60 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} LUXORA Admin Panel. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
