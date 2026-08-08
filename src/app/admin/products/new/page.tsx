"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  UploadCloud,
  X,
  Star,
  StarOff,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface UploadedImage {
  /** Unique local key — not sent to server */
  key: string;
  url: string;
  isPrimary: boolean;
  /** Display name from the original file */
  name: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/* ─────────────────────────────────────────────
   Upload helper — uses existing /api/upload
───────────────────────────────────────────── */
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("bucket", "uploads"); // existing Supabase bucket

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Upload failed");
  }
  const json = await res.json();
  if (!json.url) throw new Error("Upload response missing URL");
  return json.url;
}

/* ─────────────────────────────────────────────
   Image thumbnail card
───────────────────────────────────────────── */
function ImageThumb({
  img,
  onRemove,
  onSetPrimary,
}: {
  img: UploadedImage;
  onRemove: (key: string) => void;
  onSetPrimary: (key: string) => void;
}) {
  return (
    <div
      className={`relative group rounded-2xl overflow-hidden border-2 transition-all duration-200 aspect-square bg-gray-50 ${
        img.isPrimary
          ? "border-purple-500 shadow-md shadow-purple-100"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <Image
        src={img.url}
        alt={img.name}
        fill
        sizes="160px"
        className="object-contain p-2"
      />

      {/* Primary badge */}
      {img.isPrimary && (
        <span className="absolute top-1.5 left-1.5 bg-purple-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow z-10">
          <Star size={9} className="fill-white" /> Primary
        </span>
      )}

      {/* Hover controls */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
        {!img.isPrimary && (
          <button
            type="button"
            onClick={() => onSetPrimary(img.key)}
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-full transition shadow cursor-pointer"
          >
            <StarOff size={11} /> Set Primary
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(img.key)}
          className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-full transition shadow cursor-pointer"
        >
          <X size={11} /> Remove
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function AddProductPage() {
  const router = useRouter();

  /* — form fields — */
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("accessories");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("50");

  /* — image state — */
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  /* — save state — */
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Process selected files ── */
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    setUploadError("");

    const toUpload: File[] = [];
    for (const file of fileArr) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setUploadError(`"${file.name}" is not a supported format. Use JPG, PNG, or WEBP.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setUploadError(`"${file.name}" exceeds ${MAX_SIZE_MB} MB limit.`);
        continue;
      }
      toUpload.push(file);
    }

    if (toUpload.length === 0) return;

    setUploadingCount((c) => c + toUpload.length);

    const results = await Promise.allSettled(toUpload.map(uploadFile));

    setUploadingCount((c) => c - toUpload.length);

    const newImages: UploadedImage[] = [];
    const errors: string[] = [];

    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        newImages.push({
          key: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2)}`,
          url: result.value,
          name: toUpload[idx].name,
          isPrimary: false,
        });
      } else {
        errors.push(`"${toUpload[idx].name}": ${result.reason?.message || "Upload failed"}`);
      }
    });

    if (errors.length > 0) {
      setUploadError(errors.join(" | "));
    }

    if (newImages.length > 0) {
      setImages((prev) => {
        const combined = [...prev, ...newImages];
        // Auto-set first image as primary if none is set
        const hasPrimary = combined.some((img) => img.isPrimary);
        if (!hasPrimary && combined.length > 0) {
          combined[0] = { ...combined[0], isPrimary: true };
        }
        return combined;
      });
    }
  }, []);

  /* ── Drag/drop handlers ── */
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  /* ── Control handlers ── */
  const handleRemove = (key: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.key !== key);
      // If we removed the primary, promote the first remaining
      const stillHasPrimary = filtered.some((img) => img.isPrimary);
      if (!stillHasPrimary && filtered.length > 0) {
        filtered[0] = { ...filtered[0], isPrimary: true };
      }
      return filtered;
    });
  };

  const handleSetPrimary = (key: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.key === key }))
    );
  };

  /* ── Submit ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingCount > 0) {
      setErrorMsg("Please wait for all images to finish uploading.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      await fetchApi("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          price,
          categorySlug: category,
          description,
          stock,
          // Send the images array; fallback handled server-side
          images: images.map((img) => ({ url: img.url, isPrimary: img.isPrimary })),
        }),
      });
      router.push("/admin/products");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create product";
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const isUploading = uploadingCount > 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs">
        <Link
          href="/admin/products"
          className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1.5 transition"
        >
          <ArrowLeft size={16} /> Back to Products
        </Link>
        <h1 className="text-xl font-serif font-extrabold text-gray-900">Add New Product</h1>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Product Details Card ── */}
        <div className="bg-white border border-gray-200/70 p-6 md:p-8 rounded-3xl space-y-6 text-xs shadow-2xs">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Product Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="font-bold text-gray-800 block mb-1">Product Title</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                }}
                placeholder="e.g. Italian Leather Duffel Bag"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">URL Slug</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden font-mono focus:border-purple-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              >
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="shoes">Shoes</option>
                <option value="bags">Bags</option>
                <option value="accessories">Accessories</option>
                <option value="beauty">Beauty</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">Price (PKR)</label>
              <input
                type="number"
                step="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="12999"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">Stock Quantity</label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-gray-800 block mb-1">Description</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe craftsmanship, specifications..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              />
            </div>
          </div>
        </div>

        {/* ── Product Images Card ── */}
        <div className="bg-white border border-gray-200/70 p-6 md:p-8 rounded-3xl space-y-5 text-xs shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon size={16} className="text-purple-600" />
              Product Images
            </h2>
            <span className="text-[10px] text-gray-400 font-semibold">
              JPG · PNG · WEBP · max {MAX_SIZE_MB} MB each
            </span>
          </div>

          {/* Upload error */}
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-semibold flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              {uploadError}
            </div>
          )}

          {/* Drag-and-drop zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-3
              border-2 border-dashed rounded-2xl p-8 cursor-pointer
              transition-all duration-200 select-none
              ${isDragging
                ? "border-purple-400 bg-purple-50"
                : "border-gray-200 bg-gray-50/60 hover:border-purple-300 hover:bg-purple-50/30"
              }
              ${isUploading ? "pointer-events-none opacity-70" : ""}
            `}
          >
            {isUploading ? (
              <>
                <Loader2 size={28} className="animate-spin text-purple-500" />
                <p className="text-[11px] font-semibold text-gray-500">
                  Uploading {uploadingCount} image{uploadingCount > 1 ? "s" : ""}…
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                  <UploadCloud size={22} className="text-purple-500" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-700">
                    Drag &amp; drop images here, or{" "}
                    <span className="text-purple-600 underline underline-offset-2 cursor-pointer">
                      browse
                    </span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Supports JPG, PNG, WEBP · Up to {MAX_SIZE_MB} MB per image
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-4 py-2 rounded-full transition shadow cursor-pointer"
                >
                  <UploadCloud size={13} /> Upload Images
                </button>
              </>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  processFiles(e.target.files);
                  e.target.value = ""; // reset so same file can be re-selected
                }
              }}
            />
          </div>

          {/* Image thumbnails grid */}
          {images.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                {images.length} image{images.length !== 1 ? "s" : ""} · Hover to set primary or remove
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {images.map((img) => (
                  <ImageThumb
                    key={img.key}
                    img={img}
                    onRemove={handleRemove}
                    onSetPrimary={handleSetPrimary}
                  />
                ))}
              </div>

              {/* Primary image indicator */}
              <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-purple-50 border border-purple-100 rounded-xl p-3">
                <Star size={12} className="fill-purple-500 text-purple-500 shrink-0" />
                <span>
                  <strong className="text-purple-700">
                    {images.find((img) => img.isPrimary)?.name || "First image"}
                  </strong>{" "}
                  is set as the primary image and will be shown on product cards and listings.
                </span>
              </div>
            </div>
          )}

          {images.length === 0 && !isUploading && (
            <p className="text-[10px] text-gray-400 text-center">
              No images uploaded yet. Products without images will use a fallback placeholder.
            </p>
          )}
        </div>

        {/* ── Save Button ── */}
        <button
          type="submit"
          disabled={isSaving || isUploading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Saving Product...</span>
            </>
          ) : isUploading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Waiting for uploads to finish...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Save Product</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
