"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

export default function AddProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("accessories");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("50");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
          imageUrl: imageUrl || undefined,
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <Link
          href="/admin/products"
          className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft size={16} /> Back to Products
        </Link>
        <h1 className="text-xl font-serif font-extrabold text-white">Add New Product</h1>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[#161722] border border-white/10 p-6 md:p-8 rounded-3xl space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="font-bold text-gray-300 block mb-1">Product Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
              }}
              placeholder="e.g. Italian Leather Duffel Bag"
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-gray-300 block mb-1">URL Slug</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-gray-300 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 outline-hidden"
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
            <label className="font-bold text-gray-300 block mb-1">Price ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="299.00"
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-gray-300 block mb-1">Stock Quantity</label>
            <input
              type="number"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 outline-hidden"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-gray-300 block mb-1">Description</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe craftsmanship, specifications..."
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 outline-hidden"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="font-bold text-gray-300 block">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 outline-hidden font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          <span>{isSaving ? "Saving Product..." : "Save Product to Catalog"}</span>
        </button>
      </form>
    </div>
  );
}
