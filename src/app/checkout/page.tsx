"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCartStore } from "@/store/cart-store";
import { Landmark, Lock, Upload, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";
import { formatCurrency } from "@/lib/currency";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const cartStore = useCartStore();
  const { error: toastError, success: toastSuccess } = useToast();

  const [formData, setFormData] = useState({
    fullName: session?.user?.name || "",
    email: session?.user?.email || "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
    phone: "",
    notes: "",
  });

  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cartStore.getSubtotal();
  const discount = cartStore.getDiscountAmount();
  const shipping = cartStore.getShippingFee();
  const total = cartStore.getTotal();

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("bucket", "payment-proofs");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();

      if (json.url) {
        setPaymentProofUrl(json.url);
        toastSuccess("File Uploaded", "Payment proof uploaded successfully.");
      } else {
        toastError("Upload Failed", json.error || "Could not upload file.");
      }
    } catch {
      toastError("Upload Error", "Failed to upload payment proof.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartStore.items.length === 0) {
      toastError("Empty Bag", "Your shopping bag is empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        items: cartStore.items.map((item) => ({
          productId: item.product.id,
          variantId: item.product.variantId,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
        shippingAddress: {
          fullName: formData.fullName,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          phone: formData.phone,
        },
        paymentMethod: "BANK_TRANSFER",
        paymentProofUrl: paymentProofUrl || undefined,
        couponCode: cartStore.couponCode || undefined,
        guestEmail: session?.user ? undefined : formData.email,
        notes: formData.notes || undefined,
      };

      const order = await fetchApi<{ id: string; orderNumber: string; bankReference: string }>(
        "/api/orders",
        {
          method: "POST",
          body: JSON.stringify(orderPayload),
        }
      );

      cartStore.clearCart();
      toastSuccess("Order Placed!", `Order #${order.orderNumber} confirmed.`);
      router.push(`/order-confirmation/${order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not process order.";
      toastError("Order Creation Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartStore.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center space-y-4 max-w-md shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Your Shopping Bag is Empty</h2>
            <p className="text-xs text-gray-500">Add items to your shopping bag before proceeding to checkout.</p>
            <Link href="/products" className="inline-block bg-black text-white text-xs font-bold px-6 py-3 rounded-xl">
              Explore Products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
        <div className="text-xs text-gray-400 mb-6">
          <Link href="/cart">Bag</Link> / <span className="text-gray-800 font-semibold">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form & Payment Column */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
            {/* Step 1: Shipping Address */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <h2 className="text-lg font-serif font-bold text-gray-900">
                1. Shipping Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Sophia Carter"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black transition"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sophia@example.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black transition"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-700 block mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="742 Evergreen Terrace"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black transition"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black transition"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">State / Province</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="NY"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black transition"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="10001"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black transition"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black transition"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method (Bank Transfer) */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <h2 className="text-lg font-serif font-bold text-gray-900">
                2. Payment Method
              </h2>

              <div className="p-4 rounded-2xl border-2 border-indigo-600 bg-indigo-50/50 flex items-start space-x-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <Landmark size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-900">Direct Bank Transfer</h4>
                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Transfer payment directly to our store bank account. Inventory is reserved while payment verification takes place.
                  </p>
                </div>
              </div>

              {/* Bank Instructions Card */}
              <div className="bg-gray-900 text-white p-5 rounded-2xl space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-gray-300">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Bank Name</span>
                    <span className="font-semibold">Luxora National Bank</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Account Name</span>
                    <span className="font-semibold">LUXORA RETAIL GROUP INC</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Account Number</span>
                    <span className="font-mono font-semibold">1092-8837-4412-9901</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">SWIFT / BIC</span>
                    <span className="font-mono font-semibold">LUXUS33XXX</span>
                  </div>
                </div>
              </div>

              {/* Optional Payment Proof Uploader */}
              <div className="pt-2 space-y-2 text-xs">
                <label className="font-bold text-gray-700 block">
                  Upload Payment Receipt / Proof (Optional)
                </label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2.5 rounded-xl cursor-pointer transition">
                    <Upload size={16} />
                    <span>{isUploading ? "Uploading..." : "Choose File"}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleProofUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  {paymentProofUrl && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 size={16} /> Receipt Attached
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black hover:bg-gray-800 text-white text-sm font-bold py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Placing Order...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Complete Purchase — {formatCurrency(total)}</span>
                </>
              )}
            </button>
          </form>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-2xs h-fit space-y-6">
            <h3 className="text-base font-serif font-bold text-gray-900 border-b border-gray-100 pb-3">
              Order Summary ({cartStore.getItemCount()} items)
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto divide-y divide-gray-100 pr-1">
              {cartStore.items.map((item, idx) => (
                <div key={idx} className="pt-3 first:pt-0 flex items-center space-x-3">
                  <div className="relative w-14 h-14 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    <Image src={item.product.image} alt={item.product.name} fill className="object-contain p-1" />
                  </div>
                  <div className="flex-1 text-xs">
                    <h4 className="font-bold text-gray-900 truncate">{item.product.name}</h4>
                    <span className="text-gray-500">Qty: {item.quantity}</span>
                  </div>
                  <span className="text-xs font-extrabold text-gray-900">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs border-t border-gray-100 pt-4 text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({cartStore.couponCode})</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-gray-900">{shipping === 0 ? "FREE" : formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-gray-900 border-t border-gray-100 pt-3">
                <span>Total Due</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
