import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200/70 rounded-2xl ${className}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-3xl border border-gray-100 space-y-4">
      <Skeleton className="w-full aspect-square rounded-2xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}
