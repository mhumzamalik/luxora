"use client";

import React, { useState, useEffect, use } from "react";
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
  XCircle,
  AlertTriangle,
  ShoppingBag,
  Tag,
  Truck,
  Receipt,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/currency";

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
}

interface OrderItem {
  id: string;
  quantity: number;
  /** Historical unit price stored at the time the order was placed */
  unitPrice: number;
  /** Historical line-total stored at the time the order was placed */
  totalPrice: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: ProductImage[];
  };
  variant: {
    id: string;
    sku: string;
    size?: string | null;
    color?: string | null;
    colorHex?: string | null;
    stock: number;
  } | null;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  /** Order-level totals – all numeric, populated by the API */
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  couponCode?: string | null;
  paymentMethod: string;
  bankReference: string | null;
  paymentStatus: string;
  status: string;
  paymentProofUrl: string | null;
  notes?: string | null;
  shippingAddress: ShippingAddress | null;
  user: { name: string | null; email: string } | null;
  guestEmail?: string | null;
  items: OrderItem[];
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPdf(url: string) {
  return (
    url.toLowerCase().includes(".pdf") ||
    url.toLowerCase().includes("application/pdf")
  );
}

function isStoragePath(value: string) {
  return !value.startsWith("http");
}

/** Orders that can still be legitimately declined/cancelled */
const DECLINABLE_STATUSES = new Set(["PENDING", "PROCESSING"]);

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING:    { label: "PENDING",    className: "bg-amber-50 text-amber-700 border-amber-200" },
  PROCESSING: { label: "PROCESSING", className: "bg-blue-50 text-blue-700 border-blue-200" },
  SHIPPED:    { label: "SHIPPED",    className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  DELIVERED:  { label: "DELIVERED",  className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED:  { label: "CANCELLED",  className: "bg-rose-50 text-rose-700 border-rose-200" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-xs font-bold text-gray-700">
            Payment Proof — Full View
          </span>
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

function PaymentProofSection({
  paymentProofUrl,
  paymentMethod,
}: {
  paymentProofUrl: string | null;
  paymentMethod: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);

  const isBankTransfer = paymentMethod === "BANK_TRANSFER";

  useEffect(() => {
    if (!paymentProofUrl) return;

    if (!isStoragePath(paymentProofUrl)) {
      setResolvedUrl(paymentProofUrl);
      return;
    }

    setUrlLoading(true);
    fetch(`/api/admin/proof-url?path=${encodeURIComponent(paymentProofUrl)}`)
      .then((res) => res.json())
      .then((data: { signedUrl?: string; error?: string }) => {
        if (data.signedUrl) {
          setResolvedUrl(data.signedUrl);
        } else {
          console.error("proof-url API error:", data.error);
          setResolvedUrl("error");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch signed proof URL:", err);
        setResolvedUrl("error");
      })
      .finally(() => setUrlLoading(false));
  }, [paymentProofUrl]);

  if (!isBankTransfer && !paymentProofUrl) return null;

  const displayUrl =
    resolvedUrl && resolvedUrl !== "error" ? resolvedUrl : null;

  return (
    <>
      {lightboxOpen && displayUrl && !isPdf(displayUrl) && (
        <ProofLightbox url={displayUrl} onClose={() => setLightboxOpen(false)} />
      )}

      <div className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 shadow-2xs">
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
          urlLoading ? (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ) : resolvedUrl === "error" ? (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-700 font-semibold">
              <ShieldAlert size={16} className="shrink-0" />
              Could not load payment proof. The signed URL may have expired —
              try refreshing the page.
            </div>
          ) : displayUrl ? (
            <div className="space-y-3">
              {isPdf(displayUrl) ? (
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                    <FileCheck size={20} className="text-rose-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      Payment Proof (PDF)
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                      {paymentProofUrl}
                    </p>
                  </div>
                  <a
                    href={displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition"
                  >
                    <ExternalLink size={12} /> View / Download
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-400 font-semibold">
                    Click the image or button below to view full size.
                  </p>
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="relative w-full h-60 bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 cursor-zoom-in group"
                  >
                    <Image
                      src={displayUrl}
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
                    href={displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition mt-1"
                  >
                    <ExternalLink size={12} /> Open original in new tab
                  </a>
                </div>
              )}
            </div>
          ) : null
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <ImageIcon size={28} className="text-gray-300" />
            <p className="text-xs font-bold text-gray-400">
              No payment proof uploaded
            </p>
            {isBankTransfer && (
              <p className="text-[10px] text-gray-400 max-w-xs">
                Bank Transfer orders require a payment proof. The customer has
                not submitted one yet.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Ordered Items section ───────────────────────────────────────────────────

function OrderedItemsSection({ items }: { items: OrderItem[] }) {
  return (
    <div className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 shadow-2xs">
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
        <ShoppingBag size={16} className="text-purple-600" />
        Ordered Items
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </h3>

      <div className="space-y-4">
        {items.map((item) => {
          const image = item.product.images[0];
          const unitPrice  = Number(item.unitPrice);
          const totalPrice = Number(item.totalPrice);

          return (
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-2xl bg-gray-50/70 border border-gray-100 hover:border-purple-200/60 transition"
            >
              {/* Product thumbnail */}
              <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                {image?.url ? (
                  <Image
                    src={image.url}
                    alt={image.alt ?? item.product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={22} className="text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs font-bold text-gray-900 leading-tight truncate">
                  {item.product.name}
                </p>

                {/* Variant details */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                  {item.variant?.sku && (
                    <span className="font-mono">
                      SKU: {item.variant.sku}
                    </span>
                  )}
                  {item.variant?.size && (
                    <span>
                      Size:{" "}
                      <span className="font-semibold text-gray-700">
                        {item.variant.size}
                      </span>
                    </span>
                  )}
                  {item.variant?.color && (
                    <span className="flex items-center gap-1">
                      Color:{" "}
                      <span className="font-semibold text-gray-700">
                        {item.variant.color}
                      </span>
                      {item.variant.colorHex && (
                        <span
                          className="inline-block w-3 h-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: item.variant.colorHex }}
                        />
                      )}
                    </span>
                  )}
                </div>

                {/* Qty & pricing */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] text-gray-500">
                    Qty:{" "}
                    <span className="font-bold text-gray-800">
                      {item.quantity}
                    </span>
                  </span>
                  <span className="text-[11px] text-gray-400">×</span>
                  <span className="text-[11px] text-gray-500">
                    {formatCurrency(unitPrice)}
                  </span>
                </div>
              </div>

              {/* Line total */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-extrabold text-gray-900">
                  {formatCurrency(totalPrice)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  line total
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Order Totals summary ────────────────────────────────────────────────────

function OrderTotals({
  subtotal,
  discountAmount,
  shippingFee,
  total,
  couponCode,
}: {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  couponCode?: string | null;
}) {
  return (
    <div className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-3 shadow-2xs">
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
        <Receipt size={16} className="text-purple-600" />
        Order Summary
      </h3>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(Number(subtotal))}
          </span>
        </div>

        {Number(discountAmount) > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span className="flex items-center gap-1">
              <Tag size={11} />
              Discount
              {couponCode && (
                <span className="font-mono text-[10px] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                  {couponCode}
                </span>
              )}
            </span>
            <span className="font-semibold">
              −{formatCurrency(Number(discountAmount))}
            </span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span className="flex items-center gap-1">
            <Truck size={11} />
            Shipping
          </span>
          <span className="font-semibold text-gray-900">
            {Number(shippingFee) === 0
              ? "Free"
              : formatCurrency(Number(shippingFee))}
          </span>
        </div>

        <div className="flex justify-between text-gray-900 font-extrabold text-sm border-t border-gray-100 pt-3 mt-2">
          <span>Total</span>
          <span className="text-purple-700">{formatCurrency(Number(total))}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Decline confirmation modal ──────────────────────────────────────────────

function DeclineModal({
  onConfirm,
  onCancel,
  isPending,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Decline this order?</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              The order status will be set to <strong>CANCELLED</strong>. This
              action cannot be undone and the customer will no longer be able to
              proceed with this order.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <XCircle size={14} />
            )}
            {isPending ? "Declining…" : "Yes, Decline Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [declineSuccess, setDeclineSuccess] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery<OrderDetail>({
    queryKey: ["admin", "order", id],
    queryFn: () => fetchApi<OrderDetail>(`/api/admin/orders/${id}`),
  });

  // Verify / Mark Paid mutation
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
      setActionError(null);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to verify payment. Please try again.";
      setActionError(msg);
    },
  });

  // Decline / Cancel mutation
  const declineMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order", id] });
      setShowDeclineModal(false);
      setDeclineSuccess(true);
      setActionError(null);
    },
    onError: (err: unknown) => {
      setShowDeclineModal(false);
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to decline order. Please try again.";
      setActionError(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center text-purple-600 gap-2">
        <Loader2 className="animate-spin" size={24} />
        <span className="text-xs font-semibold">Loading order details…</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-12 text-center text-rose-600 text-xs font-bold">
        Failed to load order details. Please return to the Orders menu.
      </div>
    );
  }

  const customerEmail =
    order.user?.email ?? order.guestEmail ?? "N/A";
  const customerName = order.user?.name ?? "Guest";

  const orderStatusBadge =
    STATUS_BADGE[order.status] ?? {
      label: order.status,
      className: "bg-gray-50 text-gray-700 border-gray-200",
    };

  const canBeDeclined = DECLINABLE_STATUSES.has(order.status);

  return (
    <>
      {/* Decline confirmation modal */}
      {showDeclineModal && (
        <DeclineModal
          onConfirm={() => declineMutation.mutate()}
          onCancel={() => setShowDeclineModal(false)}
          isPending={declineMutation.isPending}
        />
      )}

      <div className="space-y-6">
        {/* ── Top header bar ── */}
        <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs">
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1.5 transition"
          >
            <ArrowLeft size={16} /> Back to Orders
          </Link>

          <div className="flex items-center gap-3">
            {/* Order status pill */}
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${orderStatusBadge.className}`}
            >
              {orderStatusBadge.label}
            </span>

            <span className="text-xs text-gray-500 font-mono">
              Order:{" "}
              <strong className="text-gray-900">
                {order.orderNumber || order.id}
              </strong>
            </span>
          </div>
        </div>

        {/* ── Toast banners ── */}
        {verifiedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in">
            <CheckCircle2
              size={20}
              className="text-emerald-600 flex-shrink-0"
            />
            <div>
              <p className="font-bold">
                Bank Transfer Verified &amp; Order Marked as PAID!
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Inventory stock decremented automatically. Confirmation email
                sent to {customerEmail}.
              </p>
            </div>
          </div>
        )}

        {declineSuccess && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in">
            <XCircle size={20} className="text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Order Declined</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                This order has been marked as CANCELLED.
              </p>
            </div>
          </div>
        )}

        {actionError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in">
            <AlertTriangle size={20} className="text-rose-600 flex-shrink-0" />
            <p>{actionError}</p>
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Bank Transfer / Verify card */}
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
                  <span className="text-gray-400 block text-[10px]">
                    Bank Reference Code
                  </span>
                  <span className="font-mono font-extrabold text-purple-600 text-sm">
                    {order.bankReference || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">
                    Total Amount
                  </span>
                  <span className="font-extrabold text-gray-900 text-sm">
                    {formatCurrency(Number(order.total))}
                  </span>
                </div>
              </div>

              {/* Verify button — only when not yet paid */}
              {order.paymentStatus !== "PAID" && order.status !== "CANCELLED" && (
                <button
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <FileCheck size={18} />
                  )}
                  <span>
                    {verifyMutation.isPending
                      ? "Verifying Payment & Decrementing Inventory…"
                      : "Verify & Mark Paid (Decrement Inventory)"}
                  </span>
                </button>
              )}

              {/* ── Decline Order button ── */}
              {canBeDeclined && (
                <button
                  onClick={() => setShowDeclineModal(true)}
                  disabled={declineMutation.isPending}
                  className="w-full bg-white hover:bg-rose-50 border border-rose-300 hover:border-rose-400 text-rose-600 hover:text-rose-700 font-bold text-xs py-3 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  <XCircle size={16} />
                  Decline Order
                </button>
              )}
            </div>

            {/* Payment Proof */}
            <PaymentProofSection
              paymentProofUrl={order.paymentProofUrl}
              paymentMethod={order.paymentMethod}
            />

            {/* ── Ordered Items (main fix: uses unitPrice / totalPrice) ── */}
            <OrderedItemsSection items={order.items} />
          </div>

          {/* Right column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Customer */}
            <div className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 text-xs shadow-2xs">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <User size={16} className="text-purple-600" /> Customer
                Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 block text-[10px]">
                    Full Name
                  </span>
                  <span className="font-bold text-gray-900 text-sm">
                    {customerName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">
                    Email Address
                  </span>
                  <span className="text-gray-700">{customerEmail}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white border border-gray-200/70 p-6 rounded-3xl space-y-4 text-xs shadow-2xs">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <MapPin size={16} className="text-purple-600" /> Shipping
                Address
              </h3>
              {order.shippingAddress ? (
                <div className="space-y-2 text-gray-700">
                  {order.shippingAddress.fullName && (
                    <div>
                      <span className="text-gray-400 block text-[10px]">
                        Recipient Name
                      </span>
                      <span className="font-bold text-gray-900">
                        {order.shippingAddress.fullName}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400 block text-[10px]">
                      Street Address
                    </span>
                    <span className="font-semibold text-gray-800">
                      {order.shippingAddress.street || "N/A"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400 block text-[10px]">
                        City / State
                      </span>
                      <span>
                        {[
                          order.shippingAddress.city,
                          order.shippingAddress.state,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">
                        Postal Code
                      </span>
                      <span className="font-mono">
                        {order.shippingAddress.postalCode || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400 block text-[10px]">
                        Country
                      </span>
                      <span>{order.shippingAddress.country || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">
                        Phone
                      </span>
                      <span className="font-mono">
                        {order.shippingAddress.phone || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-xs">No address provided</p>
              )}
            </div>

            {/* Order Totals */}
            <OrderTotals
              subtotal={order.subtotal}
              discountAmount={order.discountAmount}
              shippingFee={order.shippingFee}
              total={order.total}
              couponCode={order.couponCode}
            />

            {/* Notes */}
            {order.notes && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs space-y-1">
                <span className="text-amber-700 font-bold block">
                  Customer Notes
                </span>
                <p className="text-amber-800 leading-relaxed">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
