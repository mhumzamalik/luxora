import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center text-xs text-gray-400 space-x-1.5 py-2">
      <Link href="/" className="hover:text-black transition">
        Home
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight size={12} className="text-gray-300" />
          {item.href ? (
            <Link href={item.href} className="hover:text-black transition capitalize">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-gray-800 capitalize truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
