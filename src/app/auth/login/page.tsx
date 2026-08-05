"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/ToastProvider";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { error: toastError, success: toastSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      });

      if (res?.error) {
        toastError("Authentication Failed", "Invalid email or password");
      } else {
        toastSuccess("Welcome Back!", "Successfully signed in.");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toastError("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      toastError("Google Sign-In Error", "Could not sign in with Google.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-gray-100 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-serif font-extrabold text-gray-900">
              Welcome Back
            </h1>
            <p className="text-xs text-gray-500">
              Sign in to manage your orders, wishlist, and profile.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold py-3 rounded-xl text-xs transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {isGoogleLoading ? "Connecting..." : "Continue with Google"}
          </button>

          <div className="relative flex items-center justify-center">
            <hr className="w-full border-gray-200" />
            <span className="absolute bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Or with email
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  {...register("email")}
                  placeholder="name@example.com"
                  className={`w-full bg-gray-50 border ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  } rounded-xl p-3 pl-9 outline-hidden focus:border-black transition`}
                />
                <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-gray-700">Password</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  className={`w-full bg-gray-50 border ${
                    errors.password ? "border-red-500" : "border-gray-200"
                  } rounded-xl p-3 pl-9 outline-hidden focus:border-black transition`}
                />
                <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-xs text-center text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-bold text-black hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
