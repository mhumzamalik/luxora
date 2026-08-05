"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchApi } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetchApi("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
      toastSuccess("Check your inbox", "Password reset instructions have been sent.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email";
      toastError("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-gray-100 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-serif font-extrabold text-gray-900">
              Forgot Password
            </h1>
            <p className="text-xs text-gray-500">
              Enter your email address and we&apos;ll send you instructions to reset your password.
            </p>
          </div>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-3">
              <CheckCircle2 size={40} className="text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-900">Email Sent!</h3>
              <p className="text-xs text-emerald-700">
                If an account exists for {email}, you will receive a reset link shortly.
              </p>
              <Link
                href="/auth/login"
                className="inline-block mt-2 text-xs font-bold text-black underline"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-9 outline-hidden focus:border-black transition"
                  />
                  <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? "Sending Link..." : "Send Reset Link"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          <p className="text-xs text-center text-gray-500">
            Remember your password?{" "}
            <Link href="/auth/login" className="font-bold text-black hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
