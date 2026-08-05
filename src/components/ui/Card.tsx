import React from "react";

export function Card({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-3xl p-6 shadow-xs transition ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
