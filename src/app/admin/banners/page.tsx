"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  Plus,
  Loader2,
  Edit3,
  Trash2,
  Power,
  UploadCloud,
  Link2,
  X,
  ExternalLink,
  Calendar,
  Layers,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  ctaText: string | null;
  position: number;
  type: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  /* Form State */
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("/products");
  const [ctaText, setCtaText] = useState("Shop Now");
  const [position, setPosition] = useState("0");
  const [type, setType] = useState("HERO");
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ["admin", "banners"],
    queryFn: () => fetchApi("/api/admin/banners"),
  });

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setDescription("");
    setImageUrl("");
    setMobileImageUrl("");
    setLinkUrl("/products");
    setCtaText("Shop Now");
    setPosition("0");
    setType("HERO");
    setIsActive(true);
    setStartDate("");
    setEndDate("");
    setShowModal(false);
    setEditingBanner(null);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || "");
    setDescription(banner.description || "");
    setImageUrl(banner.imageUrl);
    setMobileImageUrl(banner.mobileImageUrl || "");
    setLinkUrl(banner.linkUrl || "/products");
    setCtaText(banner.ctaText || "Shop Now");
    setPosition(banner.position.toString());
    setType(banner.type || "HERO");
    setIsActive(banner.isActive);
    setStartDate(banner.startDate ? new Date(banner.startDate).toISOString().split("T")[0] : "");
    setEndDate(banner.endDate ? new Date(banner.endDate).toISOString().split("T")[0] : "");
    setShowModal(true);
  };

  /* File Upload Handler */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "uploads");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.url) {
        setImageUrl(data.url);
        toastSuccess("Image Uploaded", "Banner image uploaded successfully.");
      } else {
        toastError("Upload Failed", data.error || "Failed to upload image.");
      }
    } catch {
      toastError("Upload Error", "Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  /* Mutations */
  const createMutation = useMutation({
    mutationFn: (newBanner: any) =>
      fetchApi("/api/admin/banners", {
        method: "POST",
        body: JSON.stringify(newBanner),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
      toastSuccess("Banner Created", "New marketing banner created successfully.");
      resetForm();
    },
    onError: (err: any) => {
      toastError("Failed to Create", err?.message || "Could not create banner");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetchApi(`/api/admin/banners/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
      toastSuccess("Banner Updated", "Banner details saved successfully.");
      resetForm();
    },
    onError: (err: any) => {
      toastError("Failed to Update", err?.message || "Could not update banner");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetchApi(`/api/admin/banners/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
      toastSuccess("Status Updated", "Banner active status changed.");
    },
    onError: (err: any) => {
      toastError("Error", err?.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/admin/banners/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
      toastSuccess("Deleted", "Banner deleted successfully.");
    },
    onError: (err: any) => {
      toastError("Error", err?.message || "Failed to delete banner");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      toastError("Validation Error", "Please upload or provide a banner image URL.");
      return;
    }

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      imageUrl: imageUrl.trim(),
      mobileImageUrl: mobileImageUrl.trim() || null,
      linkUrl: linkUrl.trim() || null,
      ctaText: ctaText.trim() || null,
      position: position ? parseInt(position, 10) : 0,
      type,
      isActive,
      startDate: startDate || null,
      endDate: endDate || null,
    };

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="text-purple-600" size={24} /> Banners &amp; Marketing Assets
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure homepage hero slides, promotional assets, ordering, and campaign schedules.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer shrink-0"
        >
          <Plus size={16} /> + Add Banner
        </button>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-purple-200 p-6 md:p-8 rounded-3xl space-y-5 max-w-2xl shadow-xl animate-in fade-in"
        >
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon size={18} className="text-purple-600" />
              {editingBanner ? `Edit Banner (${editingBanner.title})` : "Create New Banner"}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-bold text-gray-800 block mb-1">Banner Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Elevate Your Everyday"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">Tagline / Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. NEW COLLECTION"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">Banner Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              >
                <option value="HERO">Hero Carousel Slide</option>
                <option value="PROMO">Promo Banner Grid</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-gray-800 block mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief promotional description..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              />
            </div>

            {/* Image Selection Section */}
            <div className="sm:col-span-2 space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-800 text-xs">Banner Image *</label>
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setImageTab("upload")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      imageTab === "upload"
                        ? "bg-purple-600 text-white"
                        : "bg-white border text-gray-600"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab("url")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      imageTab === "url"
                        ? "bg-purple-600 text-white"
                        : "bg-white border text-gray-600"
                    }`}
                  >
                    Paste URL
                  </button>
                </div>
              </div>

              {imageTab === "upload" ? (
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-white border border-gray-300 hover:border-purple-600 text-gray-800 font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    {isUploading ? <Loader2 size={16} className="animate-spin text-purple-600" /> : <UploadCloud size={16} />}
                    <span>{isUploading ? "Uploading..." : "Upload Image File"}</span>
                  </button>
                </div>
              ) : (
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-2.5 outline-hidden font-mono focus:border-purple-600"
                />
              )}

              {/* Preview */}
              {imageUrl && (
                <div className="relative w-full h-36 bg-gray-200 rounded-xl overflow-hidden border border-gray-300">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">Target Link URL</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/products?category=bags"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden font-mono focus:border-purple-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">CTA Button Text</label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Shop Now"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">Display Order (Position)</label>
              <input
                type="number"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden font-mono focus:border-purple-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">Start Date (Optional)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <label className="font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                Active Banner (Visible on Homepage)
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{isSaving ? "Saving Banner..." : editingBanner ? "Update Banner" : "Save Banner"}</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-3.5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Banners List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200/70 shadow-2xs flex justify-center items-center text-purple-600 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs font-bold">Loading marketing banners...</span>
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200/70 shadow-2xs text-center text-gray-400 text-xs font-bold">
            No banners created yet. Click &quot;+ Add Banner&quot; above to create one.
          </div>
        ) : (
          banners.map((b) => (
            <div
              key={b.id}
              className="bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs space-y-4 transition hover:border-gray-300"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                      #{b.position}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">{b.title}</h3>
                  </div>
                  {b.subtitle && (
                    <p className="text-xs text-gray-500 font-medium">{b.subtitle}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                      b.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {b.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                    {b.type}
                  </span>
                </div>
              </div>

              {/* Banner Image Preview */}
              <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 group">
                <Image src={b.imageUrl} alt={b.title} fill className="object-cover" />
                {b.linkUrl && (
                  <a
                    href={b.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1.5 transition z-10"
                  >
                    <ExternalLink size={12} />
                    <span>{b.ctaText || "View Link"}</span>
                  </a>
                )}
              </div>

              {/* Footer Meta & Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1 border-t border-gray-100 text-xs">
                <div className="text-gray-400 text-[11px] flex items-center gap-3 flex-wrap">
                  <span>Link: <code className="text-gray-700 font-mono">{b.linkUrl || "None"}</code></span>
                  {b.startDate && <span>Starts: {new Date(b.startDate).toLocaleDateString()}</span>}
                  {b.endDate && <span>Ends: {new Date(b.endDate).toLocaleDateString()}</span>}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() =>
                      toggleStatusMutation.mutate({ id: b.id, isActive: !b.isActive })
                    }
                    title={b.isActive ? "Deactivate Banner" : "Activate Banner"}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      b.isActive
                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    <Power size={14} />
                  </button>
                  <button
                    onClick={() => openEditModal(b)}
                    title="Edit Banner"
                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this banner?")) {
                        deleteMutation.mutate(b.id);
                      }
                    }}
                    title="Delete Banner"
                    className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
