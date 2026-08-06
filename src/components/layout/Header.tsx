"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  ChevronDown,
  Menu,
  X,
  Truck,
  HelpCircle,
  LogOut,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { formatCurrency } from "@/lib/currency";

const emptySubscribe = () => () => { };
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const isMounted = useIsMounted();

  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();

  const cartCount = cartStore.getItemCount();
  const cartSubtotal = cartStore.getSubtotal();
  const wishlistCount = wishlistStore.getItemCount();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const categories = [
    { name: "New In", href: "/products?isNewArrival=true" },
    { name: "Women", href: "/products?category=women" },
    { name: "Men", href: "/products?category=men" },
    { name: "Shoes", href: "/products?category=shoes" },
    { name: "Bags", href: "/products?category=bags" },
    { name: "Accessories", href: "/products?category=accessories" },
    { name: "Beauty", href: "/products?category=beauty" },
    { name: "Home & Living", href: "/products?category=home-living" },
    { name: "Best Sellers", href: "/products?isBestSeller=true" },
    { name: "$ Flash Sale", href: "/products?isFlashSale=true", isSale: true },
  ];

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-40 shadow-xs">
      {/* 1. Announcement Bar */}
      <div className="bg-[#fafafa] border-b border-gray-100 text-xs text-gray-600 py-2 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-800">
              Free shipping on orders over $150
            </span>
            <span className="hidden md:inline text-gray-300">•</span>
            <span className="hidden md:inline">30-day easy returns</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex items-center space-x-1 cursor-pointer hover:text-black">
              <span>English</span>
              <ChevronDown size={12} />
            </div>
            <div className="hidden sm:flex items-center space-x-1 cursor-pointer hover:text-black">
              <span>PKR</span>
              <ChevronDown size={12} />
            </div>
            <div
              className="flex items-center gap-1 text-gray-400 cursor-not-allowed opacity-60 select-none"
              title="Coming Soon"
            >
              <Truck size={13} />
              <span>Track Order</span>
            </div>
            <Link
              href="/help"
              className="hidden sm:flex items-center gap-1 hover:text-black"
            >
              <HelpCircle size={13} />
              <span>Help Center</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-gray-700 hover:text-black"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Brand Logo */}
        <Link href="/" className="flex items-center group">
          <span className="font-serif text-2xl md:text-3xl font-extrabold tracking-widest text-black group-hover:opacity-90 transition">
            LUXORA
          </span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-xl mx-8 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for luxury items, brands and collections..."
            className="w-full bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-sm text-gray-900 border border-gray-200 focus:border-black rounded-full py-2.5 pl-4 pr-10 outline-hidden transition"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition"
            aria-label="Submit Search"
          >
            <Search size={18} />
          </button>
        </form>

        {/* Action Icons */}
        <div className="flex items-center space-x-5 md:space-x-6">
          {/* Wishlist */}
          <Link
            href="/account/wishlist"
            className="relative flex items-center gap-1.5 text-gray-800 hover:text-black group transition"
          >
            <div className="relative">
              <Heart size={22} className="group-hover:scale-105 transition" />
              {isMounted && wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-black text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="hidden xl:inline text-xs font-medium">Wishlist</span>
          </Link>

          {/* Cart */}
          <button
            onClick={() => cartStore.openCart()}
            className="relative flex items-center gap-2 text-gray-800 hover:text-black group transition cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag size={22} className="group-hover:scale-105 transition" />
              {isMounted && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-black text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                Bag ({isMounted ? cartCount : 0})
              </span>
              <span className="text-xs font-bold text-gray-900">
                {isMounted ? formatCurrency(cartSubtotal) : formatCurrency(0)}
              </span>
            </div>
          </button>

          {/* Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="flex items-center gap-1.5 text-gray-800 hover:text-black transition py-1 cursor-pointer"
            >
              <User size={22} />
              <span className="hidden md:inline text-xs font-medium">
                {session?.user ? session.user.name || "Account" : "My Account"}
              </span>
              <ChevronDown size={14} className="hidden md:inline text-gray-400" />
            </button>

            {accountMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-[11px] text-gray-400">
                    {session?.user ? "Signed in as" : "Welcome to Luxora"}
                  </p>
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {session?.user ? session.user.email : "Guest Account"}
                  </p>
                </div>

                {session?.user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setAccountMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User size={14} /> My Profile
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setAccountMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Package size={14} /> My Orders
                    </Link>

                    {(session.user.role === "ADMIN" || session.user.role === "MANAGER") && (
                      <Link
                        href="/admin"
                        onClick={() => setAccountMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-50 flex items-center gap-2"
                      >
                        <LayoutDashboard size={14} /> Admin Dashboard
                      </Link>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setAccountMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-black hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User size={14} /> Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setAccountMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User size={14} /> Create Account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Mega Navigation Bar */}
      <nav className="hidden lg:block border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-center space-x-8 text-xs font-medium tracking-wide">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className={`py-3 transition relative hover:text-black group ${cat.isSale
                ? "text-red-500 font-bold hover:text-red-600"
                : "text-gray-700"
                }`}
            >
              {cat.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-200 group-hover:w-full"></span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-gray-50 text-sm border border-gray-200 rounded-lg py-2 pl-4 pr-10"
            />
            <Search size={16} className="absolute right-3 top-2.5 text-gray-400" />
          </form>
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 text-sm font-medium ${cat.isSale ? "text-red-500 font-bold" : "text-gray-800"
                }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
