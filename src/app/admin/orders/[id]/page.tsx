"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Landmark,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileCheck,
  Package,
  User,
  MapPin,
  Loader2,
  ImageIcon,
  ExternalLink,
  X,
  ShieldAlert,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/currency";

interface ShippingAddress {
  id?: string;
  fullName?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  paymentMethod: string;
  bankReference: string | null;
  paymentStatus: string;
  status: string;
  /** Correct field name matching the Prisma/DB response */
  paymentProofUrl: string | null;
  shippingAddress: string | ShippingAddress | null;
  user: { name: string | null; email: string };
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
    variantSku: string | null;
    product: { name: string };
    variant?: { sku: string; stock: number } | null;
  }>;
}

/* ─── Proof image helpers ─────────────────────────────── */
function isPdf(url: string) {
  return url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("application/pdf");
}

/* ─── Full-image lightbox modal ──────────────────────── */
function ProofLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-xs font-bold text-gray-700">Payment Proof — Full View</span>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-800 transition"
            >
              <ExternalLink size={13} /> Open in new tab
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        {/* Image */}
        <div className="relative w-full" style={{ minHeight: "400px" }}>
          <Image
            src={url}
            alt="Payment Proof — Full Size"
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, 760px"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Payment Proof section ──────────────────────────── */
function PaymentProofSection({ paymentProofUrl, paymentMethod }: {
  paymentProofUrl: string | null;
  paymentMethod: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isBankTransfer = paymentMethod === "BANK_TRANSFER";

  /* Only render for Bank Transfer or if a proof URL exists on any method */
  if (!isBankTransfer && !paymentProofUrl) return null;

  return (
    <>
      {lightboxOpen && paymentProofUrl && !isPdf(paymentProofUrl) && (
        <ProofLightbox url={paymentProofUrl} onClose={() => setLightboxOpen(false)} />
      )}

      <div className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 shadow-2xs">
        {/* Section header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon size={16} className="text-purple-600" />
            Payment Proof
          </h3>
          {paymentProofUrl && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              SUBMITTED
            </span>
          )}
          {!paymentProofUrl && isBankTransfer && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <ShieldAlert size={11} /> AWAITING PROOF
            </span>
          )}
        </div>

        {paymentProofUrl ? (
          <div className="space-y-3">
            {isPdf(paymentProofUrl) ? (
              /* PDF: download / view link */
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <FileCheck size={20} className="text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">Payment Proof (PDF)</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate">{paymentProofUrl}</p>
                </div>
                <a
                  href={paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition"
                >
                  <ExternalLink size={12} />
                  View / Download
                </a>
              </div>
            ) : (
              /* Image preview */
              <div className="space-y-2">
                <p className="text-[10px] text-gray-400 font-semibold">
                  Click the image or button below to view full size.
                </p>
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="relative w-full h-60 bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 cursor-zoom-in group"
                >
                  <Image
                    src={paymentProofUrl}
                    alt="Payment Proof"
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-contain p-3 group-hover:opacity-90 transition"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition bg-white/90 text-gray-900 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow">
                      <ExternalLink size={12} /> View Full Image
                    </span>
                  </div>
                </button>
                <a
                  href={paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition mt-1"
                >
                  <ExternalLink size={12} />
                  Open original in new tab
                </a>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <ImageIcon size={28} className="text-gray-300" />
            <p className="text-xs font-bold text-gray-400">No payment proof uploaded</p>
            {isBankTransfer && (
              <p className="text-[10px] text-gray-400 max-w-xs">
                Bank Transfer orders require a payment proof. The customer has not submitted one yet.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Main page ─────────────────────────────────────── */
export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const { data: order, isLoading, error } = useQuery<OrderDetail>({
    queryKey: ["admin", "order", id],
    queryFn: () => fetchApi(`/api/admin/orders/${id}`),
  });

  const verifyMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          paymentStatus: "PAID",
          status: "PROCESSING",
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order", id] });
      setVerifiedSuccess(true);
    },
  });

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center text-purple-600 gap-2">
        <Loader2 className="animate-spin" size={24} />
        <span className="text-xs font-semibold">Loading order details...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-12 text-center text-rose-600 text-xs font-bold">
        Failed to load order details. Please return to Orders menu.
      </div>
    );
  }

  const shippingAddr =
    typeof order.shippingAddress === "string"
      ? order.shippingAddress
      : order.shippingAddress
      ? `${order.shippingAddress.street || ""}, ${order.shippingAddress.city || ""}, ${order.shippingAddress.postalCode || ""}`
      : "No address provided";

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs">
        <Link
          href="/admin/orders"
          className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1.5 transition"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        <span className="text-xs text-gray-500 font-mono">
          Order Number: <strong className="text-gray-900">{order.orderNumber || order.id}</strong>
        </span>
      </div>

      {verifiedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Bank Transfer Verified &amp; Order Marked as PAID!</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Inventory stock decremented automatically. Confirmation email sent to {order.user?.email}.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Payment Status / Bank Transfer Card */}
          <div className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 shadow-2xs">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2">
                <Landmark size={20} className="text-purple-600" />
                <h3 className="text-base font-serif font-bold text-gray-900">
                  Bank Transfer Verification
                </h3>
              </div>
              {order.paymentStatus === "PAID" ? (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={14} /> VERIFIED &amp; PAID
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                  <Clock size={14} /> PENDING ADMIN VERIFICATION
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[10px]">Bank Reference Code</span>
                <span className="font-mono font-extrabold text-purple-600 text-sm">
                  {order.bankReference || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Total Amount</span>
                <span className="font-extrabold text-gray-900 text-sm">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>

            {/* Action Trigger Button */}
            {order.paymentStatus !== "PAID" && (
              <button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {verifyMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <FileCheck size={18} />}
                <span>
                  {verifyMutation.isPending
                    ? "Verifying Payment & Decrementing Inventory..."
                    : "Verify & Mark Paid (Decrement Inventory)"}
                </span>
              </button>
            )}
          </div>

          {/* ── Payment Proof Section ── */}
          <PaymentProofSection
            paymentProofUrl={order.paymentProofUrl}
            paymentMethod={order.paymentMethod}
          />

          {/* Ordered Items Table */}
          <div className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 shadow-2xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Package size={16} className="text-purple-600" /> Ordered Items
            </h3>

            <div className="space-y-3 divide-y divide-gray-100 text-xs">
              {order.items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-gray-900">{item.productName || item.product?.name}</div>
                    <div className="text-[11px] text-gray-400">SKU: {item.variantSku || item.variant?.sku || "N/A"}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 block">{formatCurrency(item.price)}</span>
                    <span className="text-gray-500 text-[11px]">Qty: {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Shipping Address */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 text-xs shadow-2xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <User size={16} className="text-purple-600" /> Customer Information
            </h3>

            <div className="space-y-2">
              <div>
                <span className="text-gray-400 block text-[10px]">Full Name</span>
                <span className="font-bold text-gray-900 text-sm">{order.user?.name || "Customer"}</span>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px]">Email Address</span>
                <span className="text-gray-700">{order.user?.email}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 text-xs shadow-2xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <MapPin size={16} className="text-purple-600" /> Shipping Address
            </h3>
            {typeof order.shippingAddress === "object" && order.shippingAddress ? (
              <div className="space-y-2 text-gray-700">
                {order.shippingAddress.fullName && (
                  <div>
                    <span className="text-gray-400 block text-[10px]">Recipient Name</span>
                    <span className="font-bold text-gray-900">{order.shippingAddress.fullName}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400 block text-[10px]">Street Address</span>
                  <span className="font-semibold text-gray-800">{order.shippingAddress.street || "N/A"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400 block text-[10px]">City / State</span>
                    <span>
                      {[order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Postal Code</span>
                    <span className="font-mono">{order.shippingAddress.postalCode || "N/A"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Country</span>
                    <span>{order.shippingAddress.country || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Phone</span>
                    <span className="font-mono">{order.shippingAddress.phone || "N/A"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed">{shippingAddr}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
