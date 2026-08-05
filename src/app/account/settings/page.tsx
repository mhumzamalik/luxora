"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/api-client";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useToast } from "@/components/ui/ToastProvider";
import { Lock, User } from "lucide-react";

export default function AccountSettingsPage() {
  const { data: session, update } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [name, setName] = useState(session?.user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetchApi("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim() ? name : undefined,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      toastSuccess("Profile Updated", "Your changes have been saved.");
      setCurrentPassword("");
      setNewPassword("");
      await update({ name });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not update account settings.";
      toastError("Update Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        <Breadcrumb items={[{ label: "Account", href: "/account" }, { label: "Settings & Security" }]} />

        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-gray-900">Account Settings</h1>
          <p className="text-xs text-gray-500">Manage your profile details and security preferences.</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-6 text-xs">
          {/* Profile Name & Readonly Email */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-base text-gray-900">Profile Details</h3>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sophia Carter"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-9 outline-hidden focus:border-black transition"
                />
                <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Email Address <span className="text-gray-400 font-normal">(Read-only)</span>
              </label>
              <input
                type="email"
                disabled
                value={session?.user?.email || ""}
                className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-xl p-3 cursor-not-allowed"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Change Password */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-base text-gray-900">Security & Password</h3>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Current Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-9 outline-hidden focus:border-black transition"
                />
                <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-9 outline-hidden focus:border-black transition"
                />
                <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
