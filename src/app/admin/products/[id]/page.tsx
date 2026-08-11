"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
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
import { isValidImageUrl } from "@/lib/images";

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
      {img.isPrimary && (
        <span className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow z-10">
          <Star size={9} className="fill-white" /> Primary
        </span>
      )}

      <div className="relative w-full h-full flex items-center justify-center p-2">
        {loadError ? (
          <div className="flex flex-col items-center justify-center text-center p-2 text-rose-600 space-y-1">
            <AlertTriangle size={20} />
            <span className="text-[9px] font-bold leading-tight">
              Unable to load image
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [category, setCategory] = useState("accessories");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("50");

  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isFlashSale, setIsFlashSale] = useState(false);

  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"device" | "url">("device");
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        const prod: any = await fetchApi(`/api/admin/products/${productId}`);
        setName(prod.name || "");
        setSlug(prod.slug || "");
        setPrice(prod.price ? String(prod.price) : "");
        setComparePrice(prod.comparePrice ? String(prod.comparePrice) : "");
        setDescription(prod.description || "");
        setCategory(prod.category?.slug || "accessories");
        setIsBestSeller(Boolean(prod.isBestSeller));
        setIsNewArrival(Boolean(prod.isNewArrival));
        setIsFlashSale(Boolean(prod.isFlashSale));

        const primaryVariant = prod.variants?.[0];
        if (primaryVariant && primaryVariant.stock !== undefined) {
          setStock(String(primaryVariant.stock));
        }

        if (Array.isArray(prod.images) && prod.images.length > 0) {
          const loadedImgs: ProductImageItem[] = prod.images.map((img: any, idx: number) => ({
            key: img.id || `${Date.now()}-${idx}`,
            url: img.url,
            isPrimary: Boolean(img.isPrimary),
            name: `Product Image ${idx + 1}`,
            source: img.url.includes("unsplash.com") ? "url" : "upload",
          }));
          setImages(loadedImgs);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load product");
      } finally {
        setIsLoading(false);
      }
    }
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    setUploadError("");

    const toUpload: File[] = [];
    for (const file of fileArr) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setUploadError(`"${file.name}" is not supported. Use JPG, PNG, or WEBP.`);
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
    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        newImages.push({
          key: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2)}`,
          url: result.value,
          name: toUpload[idx].name,
          isPrimary: false,
          source: "upload",
        });
      }
    });

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

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError("");
    if (!urlInput.trim() || !isValidImageUrl(urlInput.trim())) {
      setUrlError("Please enter a valid image URL.");
      return;
    }

    const trimmedUrl = urlInput.trim();
    const newImg: ProductImageItem = {
      key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: trimmedUrl,
      name: "External Image",
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

  const handleSetPrimary = (key: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.key === key }))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingCount > 0) {
      setErrorMsg("Please wait for all uploads to complete.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      await fetchApi(`/api/admin/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          slug,
          price,
          comparePrice: comparePrice || null,
          categorySlug: category,
          description,
          stock,
          isBestSeller: Boolean(isBestSeller),
          isNewArrival: Boolean(isNewArrival),
          isFlashSale: Boolean(isFlashSale),
          images: images.map((img) => ({ url: img.url, isPrimary: img.isPrimary })),
        }),
      });
      router.push("/admin/products");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center text-purple-600 gap-2">
        <Loader2 className="animate-spin" size={24} />
        <span className="text-xs font-bold">Loading product details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200/70 shadow-2xs">
        <Link
          href="/admin/products"
          className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1.5 transition"
        >
          <ArrowLeft size={16} /> Back to Products
        </Link>
        <h1 className="text-xl font-serif font-extrabold text-gray-900">Edit Product</h1>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Product Details Card */}
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
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                }}
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
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">Compare Price (Optional)</label>
              <input
                type="number"
                step="1"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
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
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-hidden focus:border-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Homepage Section Visibility Card */}
        <div className="bg-white border border-gray-200/70 p-6 md:p-8 rounded-3xl space-y-4 text-xs shadow-2xs">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Homepage Section Visibility
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
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
                  <p className="text-[10px] text-gray-500">Feature in Best Sellers</p>
                </div>
              </div>
            </label>

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
                  <p className="text-[10px] text-gray-500">Feature in New Arrivals</p>
                </div>
              </div>
            </label>

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
                  <p className="text-[10px] text-gray-500">Mark for Flash Sale</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Product Images Card */}
        <div className="bg-white border border-gray-200/70 p-6 md:p-8 rounded-3xl space-y-6 text-xs shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon size={16} className="text-purple-600" />
              Product Images
            </h2>
          </div>

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
              <UploadCloud size={15} /> Upload from device
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
              <Link2 size={15} /> Use image URL
            </button>
          </div>

          {activeTab === "device" && (
            <div className="space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-semibold flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  {uploadError}
                </div>
              )}
              <div
                onClick={() => !uploadingCount && fileInputRef.current?.click()}
                className="relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 bg-gray-50/60 rounded-2xl p-8 cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition select-none"
              >
                {uploadingCount > 0 ? (
                  <>
                    <Loader2 size={28} className="animate-spin text-purple-500" />
                    <p className="text-[11px] font-semibold text-gray-500">Uploading...</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                      <UploadCloud size={22} className="text-purple-500" />
                    </div>
                    <p className="text-xs font-bold text-gray-700">Click to upload new images</p>
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

          {activeTab === "url" && (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setUrlError(""); }}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 font-mono text-xs outline-hidden focus:border-purple-600"
              />
              <button
                type="button"
                onClick={handleAddUrl}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-3 rounded-xl transition shrink-0 cursor-pointer text-xs"
              >
                Add URL
              </button>
            </div>
          )}

          {images.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
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
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving || uploadingCount > 0}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Update Product</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
