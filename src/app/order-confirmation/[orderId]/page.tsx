"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle2, Landmark, Upload, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";
import { Skeleton } from "@/components/ui/Skeleton";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: { name: string };
}

interface OrderConfirmation {
  id: string;
  orderNumber: string;
  bankReference: string;
  total: number;
  paymentStatus: string;
  paymentProofUrl?: string | null;
  items: OrderItem[];
}

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { success: toastSuccess, error: toastError } = useToast();

  const [isUploading, setIsUploading] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchApi<OrderConfirmation>(`/api/orders/${orderId}`),
  });

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const uploadJson = await uploadRes.json();

      if (uploadJson.url) {
        // Update order status in admin/order
        await fetchApi(`/api/admin/orders/${order.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            paymentStatus: "PROOF_SUBMITTED",
          }),
        });

        setProofSubmitted(true);
        toastSuccess("Proof Submitted", "Admin will verify your payment receipt shortly.");
      } else {
        toastError("Upload Failed", uploadJson.error || "Could not upload file.");
      }
    } catch {
      toastError("Upload Error", "Failed to submit payment proof.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
        <Header />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-10 space-y-6">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-60 w-full rounded-3xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center space-y-4 max-w-md shadow-xs">
            <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
            <p className="text-xs text-gray-500">We couldn&apos;t retrieve order details for ID #{orderId}.</p>
            <Link href="/" className="inline-block bg-black text-white text-xs font-bold px-6 py-3 rounded-xl">
              Return Home
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-10 space-y-8">
        {/* Success Banner */}
        <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-gray-900">
            Order Confirmed!
          </h1>
          <p className="text-xs md:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            Thank you for shopping with Luxora. Your order has been registered and inventory is reserved.
          </p>

          <div className="inline-flex items-center gap-4 bg-gray-50 border border-gray-200 px-6 py-3 rounded-2xl text-xs">
            <div>
              <span className="text-gray-400 block text-[10px]">Order Number</span>
              <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <span className="text-gray-400 block text-[10px]">Bank Reference</span>
              <span className="font-mono font-extrabold text-indigo-600">{order.bankReference}</span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <span className="text-gray-400 block text-[10px]">Total Due</span>
              <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Bank Transfer Instructions */}
        <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-3xl shadow-2xs space-y-6">
          <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Landmark size={22} />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-gray-900">
                Bank Transfer Verification
              </h3>
              <p className="text-xs text-gray-500">
                Status: <strong className="uppercase text-amber-600">{order.paymentStatus}</strong>
              </p>
            </div>
          </div>

          {/* Proof Upload */}
          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-3">
            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <Upload size={15} className="text-indigo-600" /> Upload Proof of Payment (Receipt / Screenshot)
            </h4>

            {proofSubmitted || order.paymentProofUrl ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Proof of payment submitted successfully! Admin will verify your order shortly.
              </div>
            ) : (
              <label className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold px-4 py-3 rounded-xl cursor-pointer text-xs w-fit transition">
                <Upload size={16} />
                <span>{isUploading ? "Uploading..." : "Attach Payment Receipt"}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleProofUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Order Items Table */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider">Items in Order</h4>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
              {order.items?.map((item: OrderItem) => (
                <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{item.product.name}</p>
                    <p className="text-[11px] text-gray-500">Qty: {item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                  </div>
                  <span className="font-bold text-gray-900">${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-black hover:underline"
            >
              <span>Return to Storefront</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
