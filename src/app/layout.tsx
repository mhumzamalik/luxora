import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { AIShoppingAssistantWidget } from "@/components/ai/AIShoppingAssistantWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LUXORA — Luxury E-Commerce & Fine Fashion",
    template: "%s | LUXORA",
  },
  description:
    "Discover curated luxury apparel, designer accessories, timepieces, and fragrances at LUXORA.",
  keywords: ["Luxury fashion", "Designer bags", "Watches", "High fashion", "E-commerce"],
  openGraph: {
    title: "LUXORA — Luxury E-Commerce",
    description: "Curated luxury apparel, accessories, and fine fragrances.",
    url: process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000",
    siteName: "LUXORA",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LUXORA — Luxury E-Commerce",
    description: "Curated luxury apparel, accessories, and fine fragrances.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAFA] text-gray-900 font-sans">
        <AuthProvider>
          <QueryProvider>
            <ToastProvider>
              {children}
              <AIShoppingAssistantWidget />
            </ToastProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
