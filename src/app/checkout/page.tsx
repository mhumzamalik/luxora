"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCartStore } from "@/store/cart-store";
import {
  Landmark,
  Lock,
  Upload,
  CheckCircle2,
  Truck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";
import { formatCurrency } from "@/lib/currency";

type PaymentMethodType = "BANK_TRANSFER" | "COD";

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
    country: "Pakistan",
    phone: "",
    notes: "",
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethodType>("BANK_TRANSFER");
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofError, setProofError] = useState(false);

  const subtotal = cartStore.getSubtotal();
  const discount = cartStore.getDiscountAmount();
  const shipping = cartStore.getShippingFee();
  const total = cartStore.getTotal();

  // The Place Order button should be disabled when:
  // - Submitting is in progress
  // - Proof is still uploading
  // - Bank Transfer is selected but no proof has been uploaded yet
  const isBankTransferMissingProof =
    selectedPaymentMethod === "BANK_TRANSFER" && !paymentProofUrl;
  const isPlaceOrderDisabled = isSubmitting || isUploading || isBankTransferMissingProof;

  const handlePaymentMethodChange = (method: PaymentMethodType) => {
    setSelectedPaymentMethod(method);
    // Clear proof error when switching away from BANK_TRANSFER
    if (method === "COD") {
      setProofError(false);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset proof error on new upload attempt
    setProofError(false);
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
        setPaymentProofUrl(null);
      }
    } catch {
      toastError("Upload Error", "Failed to upload payment proof. Please try again.");
      setPaymentProofUrl(null);
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

    // Frontend guard: Block BANK_TRANSFER without proof
    if (selectedPaymentMethod === "BANK_TRANSFER" && !paymentProofUrl) {
      setProofError(true);
      toastError(
        "Payment Proof Required",
        "Please upload your payment receipt before placing the order."
      );
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
        paymentMethod: selectedPaymentMethod,
        // Only include proof URL for BANK_TRANSFER
        paymentProofUrl:
          selectedPaymentMethod === "BANK_TRANSFER" && paymentProofUrl
            ? paymentProofUrl
            : undefined,
        couponCode: cartStore.couponCode || undefined,
        guestEmail: session?.user ? undefined : formData.email,
        notes: formData.notes || undefined,
      };

      const order = await fetchApi<{
        id: string;
        orderNumber: string;
        bankReference: string;
      }>("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

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
            <p className="text-xs text-gray-500">
              Add items to your shopping bag before proceeding to checkout.
            </p>
            <Link
              href="/products"
              className="inline-block bg-black text-white text-xs font-bold px-6 py-3 rounded-xl"
            >
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
          <Link href="/cart">Bag</Link> /{" "}
          <span className="text-gray-800 font-semibold">Checkout</span>
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
                    placeholder="+92 300 123456"
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
                    placeholder="Enter Address"
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
                    placeholder="Enter City"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden focus:border-black transition"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Province</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Enter Province"
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

            {/* Step 2: Payment Method */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <h2 className="text-lg font-serif font-bold text-gray-900">
                2. Payment Method
              </h2>

              {/* Payment Method Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A: Bank Transfer */}
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange("BANK_TRANSFER")}
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                    selectedPaymentMethod === "BANK_TRANSFER"
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      selectedPaymentMethod === "BANK_TRANSFER"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Landmark size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Direct Bank Transfer</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      Transfer to our bank account and upload payment proof.
                    </p>
                  </div>
                  {selectedPaymentMethod === "BANK_TRANSFER" && (
                    <CheckCircle2
                      size={16}
                      className="ml-auto text-indigo-600 shrink-0 mt-0.5"
                    />
                  )}
                </button>

                {/* Option B: Cash on Delivery */}
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange("COD")}
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                    selectedPaymentMethod === "COD"
                      ? "border-emerald-600 bg-emerald-50/50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      selectedPaymentMethod === "COD"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Cash on Delivery</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      Pay in cash when your order arrives at your door.
                    </p>
                  </div>
                  {selectedPaymentMethod === "COD" && (
                    <CheckCircle2
                      size={16}
                      className="ml-auto text-emerald-600 shrink-0 mt-0.5"
                    />
                  )}
                </button>
              </div>

              {/* Bank Transfer Details — only shown for BANK_TRANSFER */}
              {selectedPaymentMethod === "BANK_TRANSFER" && (
                <>
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

                  {/* Payment Proof Upload — REQUIRED for BANK_TRANSFER */}
                  <div className="pt-1 space-y-2 text-xs">
                    <label className="font-bold text-gray-700 flex items-center gap-1.5">
                      Upload Payment Receipt / Proof
                      <span className="text-rose-600 font-extrabold">*</span>
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
                        Required
                      </span>
                    </label>

                    <div className="flex items-center gap-3 flex-wrap">
                      <label
                        className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl cursor-pointer transition text-xs ${
                          isUploading
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                        }`}
                      >
                        {isUploading ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Upload size={15} />
                        )}
                        <span>{isUploading ? "Uploading..." : "Choose File"}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleProofUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>

                      {paymentProofUrl && !isUploading && (
                        <span className="text-emerald-600 font-bold flex items-center gap-1 text-xs">
                          <CheckCircle2 size={15} />
                          Receipt Attached
                        </span>
                      )}
                    </div>

                    {/* Validation error message */}
                    {proofError && !paymentProofUrl && (
                      <p className="flex items-center gap-1.5 text-rose-600 font-semibold text-[11px] mt-1">
                        <AlertCircle size={13} />
                        Payment proof is required for bank transfer.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* COD confirmation note */}
              {selectedPaymentMethod === "COD" && (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800">
                  <Truck size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                  <p>
                    <span className="font-bold">Cash on Delivery selected.</span> No payment is
                    required now. Our delivery agent will collect payment when your order
                    arrives. No upload needed.
                  </p>
                </div>
              )}
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={isPlaceOrderDisabled}
              title={
                isBankTransferMissingProof
                  ? "Upload payment proof to place order"
                  : undefined
              }
              className="w-full bg-black hover:bg-gray-800 text-white text-sm font-bold py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : isBankTransferMissingProof ? (
                <>
                  <Upload size={16} />
                  <span>Upload Payment Proof to Continue</span>
                </>
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
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-contain p-1"
                    />
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
                <span className="font-semibold text-gray-900">
                  {shipping === 0 ? "FREE" : formatCurrency(shipping)}
                </span>
              </div>

              {/* Payment method indicator in summary */}
              <div className="flex justify-between pt-1">
                <span>Payment</span>
                <span
                  className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                    selectedPaymentMethod === "COD"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {selectedPaymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer"}
                </span>
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
