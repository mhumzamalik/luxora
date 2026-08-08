"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Truck, Tag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/currency";

export function CartDrawer() {
  const cartStore = useCartStore();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  if (!cartStore.isOpen) return null;

  const subtotal = cartStore.getSubtotal();
  const freeShippingThreshold = 5000;
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => cartStore.closeCart()}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag size={20} className="text-black" />
              <h3 className="text-lg font-serif font-bold text-gray-900">
                Your Bag ({cartStore.getItemCount()})
              </h3>
            </div>
            <button
              onClick={() => cartStore.closeCart()}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition"
              aria-label="Close Cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="bg-indigo-50/60 p-4 border-b border-indigo-100/50 text-xs">
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

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-gray-100">
            {cartStore.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                  <ShoppingBag size={32} />
                </div>
                <h4 className="text-base font-bold text-gray-900">Your bag is empty</h4>
                <p className="text-xs text-gray-500 max-w-xs">
                  Discover our latest luxury collection and add timeless pieces to your bag.
                </p>
                <button
                  onClick={() => cartStore.closeCart()}
                  className="bg-black text-white text-xs font-semibold px-6 py-3 rounded-full hover:bg-gray-800 transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cartStore.items.map((item, idx) => (
                <div key={idx} className="pt-4 first:pt-0 flex space-x-4">
                  <div className="relative w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        {item.product.selectedColor && (
                          <span className="text-[11px] text-gray-400 block">
                            Color: {item.product.selectedColor}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          cartStore.removeItem(item.product.id, item.product.variantId)
                        }
                        className="text-gray-400 hover:text-red-500 transition"
                        aria-label="Remove Item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                        <button
                          onClick={() =>
                            cartStore.updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.product.variantId
                            )
                          }
                          className="p-1 hover:bg-gray-200 text-gray-600 rounded-l-lg transition"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-xs font-semibold text-gray-900">
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
                          className="p-1 hover:bg-gray-200 text-gray-600 rounded-r-lg transition"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span className="text-sm font-extrabold text-gray-900">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Checkout */}
          {cartStore.items.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-white space-y-4">
              {/* Promo Code Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Promo Code (e.g. LUXORA20)"
                      className="w-full bg-gray-50 text-xs border border-gray-200 rounded-xl py-2 pl-8 pr-3 uppercase"
                    />
                    <Tag size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
                  </div>
                  <button
                    type="submit"
                    className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-black transition"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-red-500">{couponError}</p>}
                {cartStore.couponCode && (
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center justify-between">
                    <span>Code {cartStore.couponCode} applied ({cartStore.discountPercentage}% OFF)</span>
                    <button
                      type="button"
                      onClick={() => cartStore.removeCoupon()}
                      className="underline text-gray-400 hover:text-gray-600"
                    >
                      Remove
                    </button>
                  </p>
                )}
              </form>

              {/* Subtotal Calculations */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                {cartStore.getDiscountAmount() > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-{formatCurrency(cartStore.getDiscountAmount())}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-gray-900">
                    {cartStore.getShippingFee() === 0 ? "FREE" : formatCurrency(cartStore.getShippingFee())}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatCurrency(cartStore.getTotal())}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={() => cartStore.closeCart()}
                  className="w-full bg-black hover:bg-gray-800 text-white text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/cart"
                  onClick={() => cartStore.closeCart()}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold py-2.5 rounded-xl block text-center transition"
                >
                  View Full Shopping Bag
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
