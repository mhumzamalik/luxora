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
  Link2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sparkles,
  Zap,
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface ProductImageItem {
  key: string;
  url: string;
  isPrimary: boolean;
  name: string;
  source: "upload" | "url";
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
  fd.append("bucket", "uploads");

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
   URL Validator helper
───────────────────────────────────────────── */
function validateImageUrl(
  urlStr: string,
  existingUrls: string[]
): { valid: boolean; error?: string } {
  if (!urlStr || !urlStr.trim()) {
    return { valid: false, error: "Please enter an image URL." };
  }
  const trimmed = urlStr.trim();
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("file:")
  ) {
    return {
      valid: false,
      error: "Invalid URL protocol. Only HTTP and HTTPS URLs are allowed.",
    };
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Malformed URL. Please enter a valid URL." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTP and HTTPS URLs are allowed." };
  }
  if (existingUrls.includes(trimmed)) {
    return { valid: false, error: "This image URL has already been added." };
  }
  return { valid: true };
}

/* ─────────────────────────────────────────────
   Image thumbnail card component
───────────────────────────────────────────── */
function ImageThumb({
  img,
  onRemove,
  onSetPrimary,
}: {
  img: ProductImageItem;
  onRemove: (key: string) => void;
  onSetPrimary: (key: string) => void;
}) {
  const [loadError, setLoadError] = useState(false);

  return (
    <div
      className={`relative group rounded-2xl overflow-hidden border-2 transition-all duration-200 aspect-square bg-gray-50 flex flex-col justify-between ${
        img.isPrimary
          ? "border-purple-600 shadow-md shadow-purple-100"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Primary Badge */}
      {img.isPrimary && (
        <span className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow z-10">
          <Star size={9} className="fill-white" /> Primary
        </span>
      )}

      {/* Source Tag Badge */}
      <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md z-10">
        {img.source === "upload" ? "Uploaded" : "Unsplash"}
      </span>

      {/* Image Preview / Error Fallback */}
      <div className="relative w-full h-full flex items-center justify-center p-2">
        {loadError ? (
          <div className="flex flex-col items-center justify-center text-center p-2 text-rose-600 space-y-1">
            <AlertTriangle size={20} />
            <span className="text-[9px] font-bold leading-tight">
              Unable to load this image. Please check the URL.
            </span>
          </div>
        ) : (
          <Image
            src={img.url}
            alt={img.name}
            fill
            sizes="180px"
            className="object-contain p-2"
            onError={() => setLoadError(true)}
          />
        )}
      </div>

      {/* Hover Controls Overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20 p-2">
        {!img.isPrimary && (
          <button
            type="button"
            onClick={() => onSetPrimary(img.key)}
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-full transition shadow cursor-pointer w-full justify-center"
          >
            <StarOff size={11} /> Set Primary
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(img.key)}
          className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-full transition shadow cursor-pointer w-full justify-center"
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

  /* — Form Fields — */
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("accessories");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("50");

  /* — Homepage Section Visibility Flags — */
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isFlashSale, setIsFlashSale] = useState(false);

  /* — Image State — */
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"device" | "url">("device");

  /* — Variants State — */
  const [variants, setVariants] = useState<
    { id?: string; size: string; color: string; colorHex: string; sku: string; stock: string; price: string }[]
  >([
    { size: "S", color: "", colorHex: "#000000", sku: "", stock: "10", price: "" },
    { size: "M", color: "", colorHex: "#000000", sku: "", stock: "10", price: "" },
    { size: "L", color: "", colorHex: "#000000", sku: "", stock: "0", price: "" },
    { size: "XL", color: "", colorHex: "#000000", sku: "", stock: "5", price: "" },
  ]);

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        size: "",
        color: "",
        colorHex: "#000000",
        sku: slug ? `${slug}-${prev.length + 1}` : "",
        stock: "10",
        price: "",
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (
    index: number,
    field: "size" | "color" | "colorHex" | "sku" | "stock" | "price",
    value: string
  ) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  /* — URL Input State — */
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");

  /* — Save State — */
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Process uploaded files ── */
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

    const newImages: ProductImageItem[] = [];
    const errors: string[] = [];

    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        newImages.push({
          key: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2)}`,
          url: result.value,
          name: toUpload[idx].name,
          isPrimary: false,
          source: "upload",
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
        const hasPrimary = combined.some((img) => img.isPrimary);
        if (!hasPrimary && combined.length > 0) {
          combined[0] = { ...combined[0], isPrimary: true };
        }
        return combined;
      });
    }
  }, []);

  /* ── Drag & Drop ── */
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  /* ── Add Image URL ── */
  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError("");

    const existingUrls = images.map((img) => img.url);
    const { valid, error } = validateImageUrl(urlInput, existingUrls);

    if (!valid && error) {
      setUrlError(error);
      return;
    }

    const trimmedUrl = urlInput.trim();
    const isUnsplash = trimmedUrl.includes("unsplash.com");

    const newImg: ProductImageItem = {
      key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: trimmedUrl,
      name: isUnsplash ? "Unsplash Image" : "External Image",
      isPrimary: false,
      source: "url",
    };

    setImages((prev) => {
      const combined = [...prev, newImg];
      const hasPrimary = combined.some((img) => img.isPrimary);
      if (!hasPrimary && combined.length > 0) {
        combined[0] = { ...combined[0], isPrimary: true };
      }
      return combined;
    });

    setUrlInput("");
  };

  /* ── Remove Image ── */
  const handleRemove = (key: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.key !== key);
      const stillHasPrimary = filtered.some((img) => img.isPrimary);
      if (!stillHasPrimary && filtered.length > 0) {
        filtered[0] = { ...filtered[0], isPrimary: true };
      }
      return filtered;
    });
  };

  /* ── Set Primary ── */
  const handleSetPrimary = (key: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.key === key }))
    );
  };

  /* ── Submit Form ── */
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
          isBestSeller: Boolean(isBestSeller),
          isNewArrival: Boolean(isNewArrival),
          isFlashSale: Boolean(isFlashSale),
          images: images.map((img) => ({ url: img.url, isPrimary: img.isPrimary })),
          variants: variants.map((v) => ({
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            sku: v.sku,
            stock: v.stock,
            price: v.price || null,
          })),
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
                <option value="kids">Kids</option>
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

        {/* ── Product Variants & Inventory Card ── */}
        <div className="bg-white border border-gray-200/70 p-6 md:p-8 rounded-3xl space-y-6 text-xs shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Product Variants &amp; Inventory</h2>
              <p className="text-[11px] text-gray-500">
                Define available sizes, colors, SKUs, and stock levels for this product.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddVariant}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Add Variant
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              No variants defined. Click &quot;+ Add Variant&quot; to add sizes, colors, and stock.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2">Size</th>
                    <th className="py-2 px-2">Color Name</th>
                    <th className="py-2 px-2">Color Hex</th>
                    <th className="py-2 px-2">SKU</th>
                    <th className="py-2 px-2">Stock</th>
                    <th className="py-2 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {variants.map((v, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => handleUpdateVariant(idx, "size", e.target.value)}
                          placeholder="e.g. S, M, L"
                          className="w-20 bg-gray-50 border border-gray-200 rounded-lg p-2 font-semibold text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => handleUpdateVariant(idx, "color", e.target.value)}
                          placeholder="e.g. Coral"
                          className="w-28 bg-gray-50 border border-gray-200 rounded-lg p-2 font-semibold text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={v.colorHex || "#000000"}
                            onChange={(e) => handleUpdateVariant(idx, "colorHex", e.target.value)}
                            className="w-7 h-7 rounded-md border border-gray-200 cursor-pointer p-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={v.colorHex}
                            onChange={(e) => handleUpdateVariant(idx, "colorHex", e.target.value)}
                            placeholder="#FF7F50"
                            className="w-20 bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono text-[11px]"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => handleUpdateVariant(idx, "sku", e.target.value)}
                          placeholder="SKU-001"
                          className="w-32 bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono text-[11px]"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => handleUpdateVariant(idx, "stock", e.target.value)}
                          placeholder="10"
                          className="w-20 bg-gray-50 border border-gray-200 rounded-lg p-2 font-bold text-center text-xs"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remove variant"
                        >
                          <X size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Homepage Section Visibility Card ── */}
        <div className="bg-white border border-gray-200/70 p-6 md:p-8 rounded-3xl space-y-4 text-xs shadow-2xs">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Homepage Section Visibility
          </h2>
          <p className="text-[11px] text-gray-500">
            Control which customer homepage sections display this product upon saving.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Best Seller */}
            <label
              className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition select-none ${
                isBestSeller
                  ? "bg-amber-50/70 border-amber-300 text-amber-900"
                  : "bg-gray-50/60 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded"
              />
              <div className="flex items-center gap-2">
                <Flame size={16} className={isBestSeller ? "text-amber-500 fill-amber-500" : "text-gray-400"} />
                <div>
                  <p className="font-bold">Best Seller</p>
                  <p className="text-[10px] text-gray-500">Feature in Best Sellers strip</p>
                </div>
              </div>
            </label>

            {/* New Arrival */}
            <label
              className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition select-none ${
                isNewArrival
                  ? "bg-blue-50/70 border-blue-300 text-blue-900"
                  : "bg-gray-50/60 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
              <div className="flex items-center gap-2">
                <Sparkles size={16} className={isNewArrival ? "text-blue-500 fill-blue-500" : "text-gray-400"} />
                <div>
                  <p className="font-bold">New Arrival</p>
                  <p className="text-[10px] text-gray-500">Feature in New Arrivals list</p>
                </div>
              </div>
            </label>

            {/* Flash Sale */}
            <label
              className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition select-none ${
                isFlashSale
                  ? "bg-purple-50/70 border-purple-300 text-purple-900"
                  : "bg-gray-50/60 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <input
                type="checkbox"
                checked={isFlashSale}
                onChange={(e) => setIsFlashSale(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded"
              />
              <div className="flex items-center gap-2">
                <Zap size={16} className={isFlashSale ? "text-purple-500 fill-purple-500" : "text-gray-400"} />
                <div>
                  <p className="font-bold">Flash Sale</p>
                  <p className="text-[10px] text-gray-500">Mark product for Flash Sale</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* ── Product Images Card (Dual Source: Upload & Unsplash URL) ── */}
        <div className="bg-white border border-gray-200/70 p-6 md:p-8 rounded-3xl space-y-6 text-xs shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon size={16} className="text-purple-600" />
              Product Images
            </h2>
            <span className="text-[10px] text-gray-400 font-semibold">
              Support Device Uploads &amp; Unsplash URLs
            </span>
          </div>

          {/* Source Tabs Header */}
          <div className="flex border-b border-gray-200 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("device")}
              className={`pb-2.5 font-bold transition flex items-center gap-2 cursor-pointer border-b-2 -mb-px text-xs ${
                activeTab === "device"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <UploadCloud size={15} />
              Upload from device
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`pb-2.5 font-bold transition flex items-center gap-2 cursor-pointer border-b-2 -mb-px text-xs ${
                activeTab === "url"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Link2 size={15} />
              Use image URL (Unsplash)
            </button>
          </div>

          {/* Source 1: Upload from device */}
          {activeTab === "device" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-semibold flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  {uploadError}
                </div>
              )}

              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`
                  relative flex flex-col items-center justify-center gap-3
                  border-2 border-dashed rounded-2xl p-8 cursor-pointer
                  transition-all duration-200 select-none
                  ${
                    isDragging
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
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-4 py-2 rounded-full transition shadow cursor-pointer"
                    >
                      <UploadCloud size={13} /> Upload Images
                    </button>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      processFiles(e.target.files);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Source 2: Use image URL */}
          {activeTab === "url" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-2">
                <label className="font-bold text-gray-800 block">
                  Image URL (Unsplash or direct image link)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setUrlError("");
                      }}
                      placeholder="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 font-mono outline-hidden focus:border-purple-600 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-3 rounded-xl transition shadow flex items-center gap-1.5 shrink-0 cursor-pointer text-xs"
                  >
                    <Plus size={15} /> Add Image URL
                  </button>
                </div>
                {urlError && (
                  <p className="text-rose-600 text-[11px] font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle size={13} /> {urlError}
                  </p>
                )}
                <p className="text-[10px] text-gray-400">
                  Example: https://images.unsplash.com/photo-1505740420928-5e560c06d30e
                </p>
              </div>
            </div>
          )}

          {/* ── Unified Image Gallery (Mixed Uploads & Unsplash URLs) ── */}
          {images.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <p className="text-[11px] text-gray-700 font-bold uppercase tracking-wider">
                  Image Gallery ({images.length})
                </p>
                <span className="text-[10px] text-gray-400 font-semibold">
                  Hover image to set primary or remove
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {images.map((img) => (
                  <ImageThumb
                    key={img.key}
                    img={img}
                    onRemove={handleRemove}
                    onSetPrimary={handleSetPrimary}
                  />
                ))}
              </div>

              {/* Primary Image Notice */}
              <div className="flex items-center gap-2 text-[10px] text-gray-600 bg-purple-50 border border-purple-100 rounded-xl p-3">
                <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                <span>
                  Primary image is set to:{" "}
                  <strong className="text-purple-700 font-bold">
                    {images.find((img) => img.isPrimary)?.name || "First item"}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {images.length === 0 && !isUploading && (
            <p className="text-[10px] text-gray-400 text-center py-2">
              No images added yet. Add images by uploading from device or pasting an Unsplash URL above.
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
