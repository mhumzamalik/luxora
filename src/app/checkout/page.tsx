"use client";

import React, { useState, useEffect } from "react";
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
  Tag,
  Ticket,
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

  /* Coupon State */
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  const subtotal = cartStore.getSubtotal();
  const discount = cartStore.getDiscountAmount();
  const shipping = cartStore.getShippingFee();
  const total = cartStore.getTotal();

  // Fetch available coupons dynamically when subtotal changes
  useEffect(() => {
    if (subtotal <= 0) {
      setAvailableCoupons([]);
      return;
    }
    let isMounted = true;
    fetch(`/api/coupons/available?subtotal=${subtotal}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setAvailableCoupons(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [subtotal]);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = (codeToApply || couponInput).trim();
    if (!targetCode) return;

    setCouponError("");
    setIsValidatingCoupon(true);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: targetCode, orderAmount: subtotal }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setCouponError(data.error || "Invalid coupon code.");
        toastError("Coupon Failed", data.error || "Invalid coupon code.");
      } else {
        cartStore.applyCoupon({
          code: data.coupon.code,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
          maxDiscount: data.coupon.maxDiscount,
          minOrderAmount: data.coupon.minOrderAmount,
        });
        setCouponInput("");
        toastSuccess(
          "Coupon Applied",
          `Coupon "${data.coupon.code}" applied! Saved ${formatCurrency(data.coupon.discountAmount)}.`
        );
      }
    } catch {
      setCouponError("Failed to validate coupon code.");
      toastError("Error", "Failed to validate coupon code.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    cartStore.removeCoupon();
    setCouponInput("");
    setCouponError("");
    toastSuccess("Coupon Removed", "Discount has been removed.");
  };

  const isBankTransferMissingProof =
    selectedPaymentMethod === "BANK_TRANSFER" && !paymentProofUrl;
  const isPlaceOrderDisabled = isSubmitting || isUploading || isBankTransferMissingProof;

  const handlePaymentMethodChange = (method: PaymentMethodType) => {
    setSelectedPaymentMethod(method);
    if (method === "COD") {
      setProofError(false);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      toastSuccess("Order Placed", `Order #${order.orderNumber} placed successfully.`);
      router.push(`/order-confirmation/${order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      toastError("Order Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-black">
            Shopping Bag
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form Column */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
            {/* Step 1: Shipping Address */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <h2 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Truck size={18} className="text-purple-600" /> Shipping Address
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="font-bold text-gray-800 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Muhammad Hamza"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
                  />
                </div>

                {!session && (
                  <div className="md:col-span-2">
                    <label className="font-bold text-gray-800 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="font-bold text-gray-800 block mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="House / Building / Street address"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Lahore / Karachi / Islamabad"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1">State / Province</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Punjab"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="54000"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0300 1234567"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-bold text-gray-800 block mb-1">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Special instructions for delivery..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method Selection */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <h2 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Landmark size={18} className="text-purple-600" /> Select Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Direct Bank Transfer */}
                <div
                  onClick={() => handlePaymentMethodChange("BANK_TRANSFER")}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                    selectedPaymentMethod === "BANK_TRANSFER"
                      ? "border-purple-600 bg-purple-50/40"
                      : "border-gray-100 hover:border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                      <Landmark size={16} className="text-purple-600" /> Bank Transfer
                    </span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={selectedPaymentMethod === "BANK_TRANSFER"}
                      onChange={() => handlePaymentMethodChange("BANK_TRANSFER")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Transfer funds directly to our bank account. Requires proof upload.
                  </p>
                </div>

                {/* Option 2: Cash on Delivery (COD) */}
                <div
                  onClick={() => handlePaymentMethodChange("COD")}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                    selectedPaymentMethod === "COD"
                      ? "border-purple-600 bg-purple-50/40"
                      : "border-gray-100 hover:border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                      <Truck size={16} className="text-emerald-600" /> Cash on Delivery
                    </span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={selectedPaymentMethod === "COD"}
                      onChange={() => handlePaymentMethodChange("COD")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Pay in cash when your luxury parcel is delivered to your doorstep.
                  </p>
                </div>
              </div>

              {/* Conditional Bank Details & Proof Upload for BANK_TRANSFER */}
              {selectedPaymentMethod === "BANK_TRANSFER" && (
                <div className="pt-4 border-t border-gray-100 space-y-4 animate-in fade-in">
                  <div className="bg-purple-900 text-white p-4 rounded-2xl space-y-2 text-xs shadow-md">
                    <div className="font-bold text-purple-200 uppercase tracking-widest text-[10px]">
                      LUXORA Official Bank Account
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div>
                        <span className="text-purple-300 block text-[9px]">Bank Name</span>
                        <span className="font-bold">Meezan Bank Ltd</span>
                      </div>
                      <div>
                        <span className="text-purple-300 block text-[9px]">Account Title</span>
                        <span className="font-bold">LUXORA ENTERPRISE</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-purple-300 block text-[9px]">IBAN Number</span>
                        <span className="font-bold text-amber-300 text-xs">
                          PK36MEZN0001234567890101
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-gray-800 text-xs flex items-center justify-between">
                      <span>
                        Upload Payment Receipt / Proof <span className="text-rose-500">*</span>
                      </span>
                      {paymentProofUrl && (
                        <span className="text-emerald-600 text-[11px] font-semibold flex items-center gap-1">
                          <CheckCircle2 size={13} /> Receipt Attached
                        </span>
                      )}
                    </label>

                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleProofUpload}
                        className="hidden"
                        id="proof-upload-input"
                      />
                      <label
                        htmlFor="proof-upload-input"
                        className={`flex-1 flex items-center justify-center space-x-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition text-xs font-semibold ${
                          proofError
                            ? "border-rose-400 bg-rose-50/50 text-rose-700 animate-pulse"
                            : paymentProofUrl
                            ? "border-emerald-300 bg-emerald-50/50 text-emerald-800"
                            : "border-gray-200 hover:border-purple-300 bg-gray-50 text-gray-700"
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 size={16} className="animate-spin text-purple-600" />
                            <span>Uploading Receipt...</span>
                          </>
                        ) : paymentProofUrl ? (
                          <>
                            <CheckCircle2 size={16} className="text-emerald-600" />
                            <span>Change Attached Proof</span>
                          </>
                        ) : (
                          <>
                            <Upload size={16} className="text-purple-600" />
                            <span>Click to Choose Receipt Image or PDF</span>
                          </>
                        )}
                      </label>
                    </div>

                    {proofError && !paymentProofUrl && (
                      <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle size={13} />
                        Payment receipt upload is required for Bank Transfer orders.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Place Order Action Button */}
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

            {/* Cart Items List */}
            <div className="space-y-3 max-h-72 overflow-y-auto divide-y divide-gray-100 pr-1">
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

            {/* ── Coupon Application Section ── */}
            {cartStore.couponCode ? (
              /* Applied Coupon Box */
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <Ticket size={16} className="text-emerald-600" />
                    <span>Coupon Applied</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-mono font-extrabold text-emerald-700">
                    {cartStore.couponCode}
                    {cartStore.coupon?.discountType === "PERCENTAGE"
                      ? ` (${cartStore.coupon.discountValue}% OFF)`
                      : ` (${formatCurrency(cartStore.coupon?.discountValue || 0)} OFF)`}
                  </span>
                  <span className="font-extrabold text-emerald-700">
                    -{formatCurrency(discount)}
                  </span>
                </div>
              </div>
            ) : (
              /* Coupon Input Form */
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-800 block">Have a promo code?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    placeholder="Enter Code (e.g. SAVE10)"
                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl p-2.5 outline-hidden uppercase font-mono focus:border-purple-600"
                  />
                  <button
                    type="button"
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    onClick={() => handleApplyCoupon()}
                    className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1"
                  >
                    {isValidatingCoupon ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Tag size={13} />
                    )}
                    <span>Apply</span>
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} /> {couponError}
                  </p>
                )}
              </div>
            )}

            {/* ── Suggested / Available Coupons ── */}
            {!cartStore.couponCode && availableCoupons.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                  Available Coupons
                </span>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {availableCoupons.map((ac) => (
                    <div
                      key={ac.id}
                      className="bg-purple-50/60 border border-purple-100 rounded-xl p-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-extrabold text-purple-900 block">
                          {ac.code}
                        </span>
                        <span className="text-[10px] text-purple-700 font-medium">
                          {ac.discountType === "PERCENTAGE"
                            ? `${ac.discountValue}% OFF`
                            : `${formatCurrency(ac.discountValue)} OFF`}
                          {ac.minOrderAmount
                            ? ` (Min. ${formatCurrency(ac.minOrderAmount)})`
                            : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(ac.code)}
                        disabled={isValidatingCoupon}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals Breakdown */}
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

              <div className="flex justify-between pt-1">
                <span>Payment Method</span>
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
