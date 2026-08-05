"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchApi } from "@/lib/api-client";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      await fetchApi("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      toastSuccess("Account Created!", "Signing you in automatically...");

      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (res?.error) {
        router.push("/auth/login");
      } else {
        router.push("/account");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account";
      toastError("Registration Failed", msg);
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
              Create an Account
            </h1>
            <p className="text-xs text-gray-500">
              Join LUXORA for exclusive access, orders tracking, and luxury perks.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  {...register("name")}
                  placeholder="Sophia Carter"
                  className={`w-full bg-gray-50 border ${
                    errors.name ? "border-red-500" : "border-gray-200"
                  } rounded-xl p-3 pl-9 outline-hidden focus:border-black transition`}
                />
                <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              {errors.name && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.name.message}</p>
              )}
            </div>

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
              <label className="font-bold text-gray-700 block mb-1">Password</label>
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

            <div>
              <label className="font-bold text-gray-700 block mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="••••••••"
                  className={`w-full bg-gray-50 border ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-200"
                  } rounded-xl p-3 pl-9 outline-hidden focus:border-black transition`}
                />
                <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-xs text-center text-gray-500">
            Already have an account?{" "}
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
