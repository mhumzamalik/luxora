"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Mail, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchApi } from "@/lib/api-client";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { error: toastError, success: toastSuccess } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toastError("Email Required", "Please enter your email to resend verification.");
      return;
    }

    setIsResending(true);
    setResendSuccess(false);

    try {
      const res = await fetchApi<{ message: string }>("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResendSuccess(true);
      toastSuccess("Verification Email Sent", res.message || "Please check your inbox.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend verification email";
      toastError("Error", msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-100 p-8 rounded-3xl shadow-xl space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
          <Mail size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-extrabold text-gray-900">
            Check Your Email
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            We&apos;ve sent a verification link to{" "}
            {email ? (
              <span className="font-bold text-gray-800">{email}</span>
            ) : (
              "your registered email address"
            )}
            .
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs text-gray-600 space-y-2 text-left">
          <p className="font-bold text-gray-800">Next Steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-600">
            <li>Open the verification email in your inbox.</li>
            <li>Click the <strong>&quot;Verify Email Address&quot;</strong> button.</li>
            <li>Once verified, sign in to your LUXORA account.</li>
          </ol>
        </div>

        {resendSuccess && (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold">
            <CheckCircle2 size={16} />
            A new verification link has been sent!
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || !email}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold py-3 rounded-xl text-xs transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={isResending ? "animate-spin" : ""} />
            {isResending ? "Sending New Link..." : "Resend Verification Email"}
          </button>

          <Link
            href="/auth/login"
            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <p className="text-[11px] text-gray-400">
          Didn&apos;t receive an email? Check your spam/junk folder or request a new link.
        </p>
      </div>
    </main>
  );
}

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }>
        <CheckEmailContent />
      </Suspense>
      <Footer />
    </div>
  );
}
