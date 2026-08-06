"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle2, AlertTriangle, Loader2, ArrowRight, Mail, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchApi } from "@/lib/api-client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") || "";
  const { error: toastError, success: toastSuccess } = useToast();

  const [status, setStatus] = useState<"loading" | "success" | "expired" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [resendEmail, setResendEmail] = useState(emailParam);
  const [isResending, setIsResending] = useState(false);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    let isMounted = true;

    async function verify() {
      if (!token || !emailParam) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage("Invalid or missing verification parameters.");
        }
        return;
      }

      try {
        await fetchApi<{ message: string }>(
          `/api/auth/verify-email?token=${token}&email=${encodeURIComponent(emailParam)}`
        );
        if (isMounted) {
          setStatus("success");
          toastSuccess("Verified!", "Email verified successfully.");
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Verification failed";
        if (msg.toLowerCase().includes("expired")) {
          setStatus("expired");
        } else {
          setStatus("error");
        }
        setErrorMessage(msg);
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, emailParam, toastSuccess]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
      toastError("Email Required", "Please enter your email address.");
      return;
    }

    setIsResending(true);
    try {
      const res = await fetchApi<{ message: string }>("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: resendEmail }),
      });
      toastSuccess("Verification Email Sent", res.message || "Please check your inbox.");
      router.push(`/auth/check-email?email=${encodeURIComponent(resendEmail)}`);
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
        {status === "loading" && (
          <div className="space-y-4 py-8">
            <div className="mx-auto w-16 h-16 bg-gray-50 text-black rounded-2xl flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-black" />
            </div>
            <h1 className="text-xl font-serif font-extrabold text-gray-900">
              Verifying Your Email Address...
            </h1>
            <p className="text-xs text-gray-500">
              Please wait while we validate your email verification token.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-extrabold text-gray-900">
                Email Verified Successfully
              </h1>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your account is now active and verified. You can log in to start exploring LUXORA.
              </p>
            </div>

            <Link
              href="/auth/login?verified=true"
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
            >
              <span>Sign In to Your Account</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {(status === "expired" || status === "error") && (
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
              <AlertTriangle size={36} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-extrabold text-gray-900">
                {status === "expired" ? "Verification Link Expired" : "Invalid Verification Link"}
              </h1>
              <p className="text-xs text-gray-500 leading-relaxed">
                {errorMessage ||
                  "Verification links expire after 24 hours and can only be used once."}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-3 text-left">
              <p className="text-xs font-bold text-gray-800">Request a New Verification Link</p>
              <form onSubmit={handleResend} className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 pl-9 text-xs outline-hidden focus:border-black transition"
                  />
                  <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
                <button
                  type="submit"
                  disabled={isResending}
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isResending ? "animate-spin" : ""} />
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </button>
              </form>
            </div>

            <p className="text-[11px] text-gray-400">
              Back to{" "}
              <Link href="/auth/login" className="font-bold text-black hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-black" />
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
      <Footer />
    </div>
  );
}
