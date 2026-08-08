"use client";

import React, { useState } from "react";
import { Plus, FolderTree, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count: { products: number };
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["admin", "categories"],
    queryFn: () => fetchApi<{ categories: Category[] }>("/api/admin/categories").then((res) => res.categories),
  });

  const createMutation = useMutation({
    mutationFn: (newCategory: { name: string; slug: string; description?: string }) =>
      fetchApi("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(newCategory),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setShowModal(false);
      setName("");
      setSlug("");
      setDescription("");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name, slug, description });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Categories Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Organize products into store categories and manage navigation taxonomy.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {showModal && (
        <form onSubmit={handleCreate} className="bg-white border border-purple-200 p-6 rounded-3xl space-y-4 max-w-md shadow-lg animate-in fade-in">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FolderTree size={18} className="text-purple-600" /> New Product Category
          </h3>
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Category Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
              }}
              placeholder="e.g. Fine Jewelry"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 text-xs outline-hidden focus:border-purple-600"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">URL Slug</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="fine-jewelry"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 text-xs outline-hidden font-mono focus:border-purple-600"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Category overview..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2.5 text-xs outline-hidden focus:border-purple-600"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs cursor-pointer"
            >
              {createMutation.isPending ? "Saving..." : "Save Category"}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200/70 rounded-3xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center text-purple-600 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs font-bold">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No categories created yet. Click &quot;Add Category&quot; above.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 uppercase text-[10px] text-gray-500 font-bold tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4">Category Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Products Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/60 transition">
                  <td className="p-4 font-bold text-gray-900">{cat.name}</td>
                  <td className="p-4 font-mono text-purple-600">{cat.slug}</td>
                  <td className="p-4 text-gray-500 truncate max-w-xs">{cat.description || "N/A"}</td>
                  <td className="p-4 text-center font-extrabold text-gray-900">{cat._count?.products || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
