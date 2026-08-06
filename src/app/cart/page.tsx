"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/currency";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Truck, Tag, Lock } from "lucide-react";

export default function CartPage() {
  const cartStore = useCartStore();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const subtotal = cartStore.getSubtotal();
  const freeShippingThreshold = 150;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");

    if (couponInput.trim().toUpperCase() === "LUXORA20") {
      cartStore.applyCoupon("LUXORA20", 20);
      setCouponInput("");
    } else {
      setCouponError("Invalid promo code. Try LUXORA20");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        <Breadcrumb items={[{ label: "Shopping Bag" }]} />

        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h1 className="text-3xl font-serif font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag size={28} /> Shopping Bag ({cartStore.getItemCount()})
          </h1>
          {cartStore.items.length > 0 && (
            <button
              onClick={() => cartStore.clearCart()}
              className="text-xs text-red-500 font-semibold hover:underline cursor-pointer"
            >
              Clear Bag
            </button>
          )}
        </div>

        {cartStore.items.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-4 max-w-md mx-auto my-12 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Your bag is empty</h2>
            <p className="text-xs text-gray-500">
              Discover our latest luxury collection and add timeless pieces to your bag.
            </p>
            <Link
              href="/products"
              className="inline-block bg-black text-white text-xs font-semibold px-6 py-3 rounded-full hover:bg-gray-800 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Free Shipping Progress */}
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100/50 text-xs">
                {amountToFreeShipping > 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-medium text-indigo-900">
                      <span className="flex items-center gap-1.5">
                        <Truck size={15} className="text-indigo-600" /> Add {formatCurrency(amountToFreeShipping)} for FREE Shipping
                      </span>
                      <span>{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 font-bold text-emerald-700">
                    <Truck size={16} /> You&apos;ve unlocked FREE Shipping!
                  </div>
                )}
              </div>

              {/* Items Card List */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 divide-y divide-gray-100 shadow-2xs">
                {cartStore.items.map((item, idx) => (
                  <div key={idx} className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="text-sm font-bold text-gray-900 hover:underline"
                        >
                          {item.product.name}
                        </Link>
                        {item.product.selectedColor && (
                          <span className="text-xs text-gray-400 block">
                            Color: {item.product.selectedColor}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-gray-700 block">
                          Unit Price: {formatCurrency(item.product.price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto space-x-6">
                      <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50">
                        <button
                          onClick={() =>
                            cartStore.updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.product.variantId
                            )
                          }
                          className="p-2 hover:bg-gray-200 text-gray-600 rounded-l-xl transition cursor-pointer"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-4 text-xs font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            cartStore.updateQuantity(
                              item.product.id,
                              item.quantity + 1,
                              item.product.variantId
                            )
                          }
                          className="p-2 hover:bg-gray-200 text-gray-600 rounded-r-xl transition cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-gray-900 block">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                        <button
                          onClick={() =>
                            cartStore.removeItem(item.product.id, item.product.variantId)
                          }
                          className="text-xs text-gray-400 hover:text-red-500 transition cursor-pointer inline-flex items-center gap-1 mt-1"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs h-fit space-y-6">
              <h2 className="text-base font-serif font-bold text-gray-900 border-b border-gray-100 pb-3">
                Order Summary
              </h2>

              {/* Promo Code Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Promo Code (e.g. LUXORA20)"
                      className="w-full bg-gray-50 text-xs border border-gray-200 rounded-xl py-2.5 pl-8 pr-3 uppercase"
                    />
                    <Tag size={14} className="absolute left-2.5 top-3 text-gray-400" />
                  </div>
                  <button
                    type="submit"
                    className="bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-black transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-red-500">{couponError}</p>}
                {cartStore.couponCode && (
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center justify-between">
                    <span>Code {cartStore.couponCode} applied ({cartStore.discountPercentage}% OFF)</span>
                    <button
                      type="button"
                      onClick={() => cartStore.removeCoupon()}
                      className="underline text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      Remove
                    </button>
                  </p>
                )}
              </form>

              {/* Calculation Breakdown */}
              <div className="space-y-2 text-xs border-t border-gray-100 pt-4 text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                {cartStore.getDiscountAmount() > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-{formatCurrency(cartStore.getDiscountAmount())}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-gray-900">
                    {cartStore.getShippingFee() === 0 ? "FREE" : formatCurrency(cartStore.getShippingFee())}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-gray-900 pt-3 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatCurrency(cartStore.getTotal())}</span>
                </div>
              </div>

              {/* Proceed to Checkout */}
              <Link
                href="/checkout"
                className="w-full bg-black hover:bg-gray-800 text-white text-xs font-bold py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock size={15} />
                <span>Proceed to Checkout — {formatCurrency(cartStore.getTotal())}</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
