"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Skeleton } from "@/components/ui/Skeleton";
import { MapPin, Plus, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface AddressItem {
  id: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string | null;
  isDefault: boolean;
}

export default function AccountAddressesPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
    phone: "",
    isDefault: false,
  });

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["userAddresses"],
    queryFn: () => fetchApi<AddressItem[]>("/api/users/me/addresses"),
  });

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi("/api/users/me/addresses", {
        method: "POST",
        body: JSON.stringify(newAddr),
      });

      toastSuccess("Address Added", "New shipping address saved successfully.");
      setShowAddForm(false);
      setNewAddr({
        fullName: "",
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "United States",
        phone: "",
        isDefault: false,
      });
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add address";
      toastError("Error", msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        <Breadcrumb items={[{ label: "Account", href: "/account" }, { label: "Address Book" }]} />

        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold text-gray-900">Address Book</h1>
            <p className="text-xs text-gray-500">Manage your shipping and billing locations.</p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-black hover:bg-gray-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition cursor-pointer"
          >
            <Plus size={16} /> Add Address
          </button>
        </div>

        {/* Add Address Form Modal / Drawer */}
        {showAddForm && (
          <form onSubmit={handleAddAddress} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl space-y-4 text-xs">
            <h3 className="font-serif font-bold text-base text-gray-900">Add New Address</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newAddr.fullName}
                  onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-gray-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={newAddr.street}
                  onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">State / Province</label>
                <input
                  type="text"
                  required
                  value={newAddr.state}
                  onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Postal Code</label>
                <input
                  type="text"
                  required
                  value={newAddr.postalCode}
                  onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={newAddr.country}
                  onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-100 text-gray-800 font-bold px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-black text-white font-bold px-6 py-2 rounded-xl"
              >
                Save Address
              </button>
            </div>
          </form>
        )}

        {/* Address Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        ) : !addresses || addresses.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-4 shadow-2xs">
            <MapPin size={48} className="text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">No Saved Addresses</h3>
            <p className="text-xs text-gray-500">Click &quot;Add Address&quot; above to save your first shipping location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr: AddressItem) => (
              <div
                key={addr.id}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-2 relative"
              >
                {addr.isDefault && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Default Address
                  </span>
                )}
                <h4 className="font-bold text-sm text-gray-900">{addr.fullName}</h4>
                <p className="text-xs text-gray-600">{addr.street}</p>
                <p className="text-xs text-gray-600">
                  {addr.city}, {addr.state} {addr.postalCode}
                </p>
                <p className="text-xs text-gray-600">{addr.country}</p>
                <p className="text-xs text-gray-500 pt-1">Phone: {addr.phone}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
