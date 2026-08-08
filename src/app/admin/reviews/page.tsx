"use client";

import React from "react";
import { Star, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string | null; email: string };
  product: { name: string; slug: string };
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["admin", "reviews"],
    queryFn: () => fetchApi<{ reviews: Review[] }>("/api/admin/reviews").then((res) => res.reviews),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/api/admin/reviews?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Reviews & Moderation
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitor customer ratings, review feedback, and moderate customer testimonials.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200/70 rounded-3xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center text-purple-600 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs font-bold">Loading product reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No customer reviews submitted yet.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 uppercase text-[10px] text-gray-500 font-bold tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Review Comment</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-gray-50/60 transition">
                  <td className="p-4 font-bold text-gray-900">{rev.product?.name || "Product"}</td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{rev.user?.name || "Customer"}</div>
                    <div className="text-[11px] text-gray-400">{rev.user?.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star size={14} fill="currentColor" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 max-w-sm truncate">{rev.comment}</td>
                  <td className="p-4 text-gray-400 text-[11px]">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(rev.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Review"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
