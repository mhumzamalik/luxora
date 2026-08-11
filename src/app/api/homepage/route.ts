import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrimaryImage } from "@/lib/images";

// ─── Lightweight per-process in-memory cache ────────────────────────────────
// Homepage data is safe to cache for a short window; Flash Sale status
// changes at most once every few minutes in practice.  We revalidate every
// 30 seconds so countdown timers and sale-state transitions stay accurate.
const CACHE_TTL_MS = 30_000; // 30 seconds

let cached: { data: HomepagePayload; expiresAt: number } | null = null;

// ─── Types returned to the client ────────────────────────────────────────────
interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
}

interface HomeProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  badge: string | null;
  rating: number;
  reviewCount: number;
  category: string;
  image: string;
  images: ProductImage[];
  stock: number;
}

interface FlashSaleProduct {
  id: string;
  name: string;
  slug: string;
  /** Sale price from FlashSaleItem.salePrice — NOT Product.price */
  price: number;
  /** Original Product.price — shown crossed-out */
  comparePrice: number;
  badge: string;
  image: string;
  images: ProductImage[];
  stock: number;
  category: string;
  rating: number;
  reviewCount: number;
}

interface FlashSaleData {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: FlashSaleProduct[];
}

interface HomepagePayload {
  bestSellers: HomeProduct[];
  flashSale: FlashSaleData | null;
  newArrivals: HomeProduct[];
  categories: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    productCount: number;
  }[];
}

// ─── Prisma select for a product with only the fields we actually render ─────
const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  comparePrice: true,
  badge: true,
  rating: true,
  reviewCount: true,
  category: { select: { name: true } },
  // Only the primary image + one fallback — avoids fetching every image row
  images: {
    select: { id: true, url: true, alt: true, isPrimary: true },
  },
  // Variants only for stock calculation
  variants: { select: { stock: true } },
} as const;

// ─── Helper ───────────────────────────────────────────────────────────────────
function shapeProduct(
  prod: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    comparePrice: number | null;
    badge: string | null;
    rating: number;
    reviewCount: number;
    category: { name: string } | null;
    images: { id: string; url: string; alt: string | null; isPrimary: boolean }[];
    variants: { stock: number }[];
  },
  badgeFallback?: string
): HomeProduct {
  const totalStock = prod.variants.reduce((sum, v) => sum + v.stock, 0);
  const primaryImg = getPrimaryImage(prod);
  return {
    id: prod.id,
    name: prod.name,
    slug: prod.slug,
    description: prod.description,
    price: Number(prod.price),
    comparePrice: prod.comparePrice != null ? Number(prod.comparePrice) : null,
    badge: prod.badge ?? badgeFallback ?? null,
    rating: prod.rating,
    reviewCount: prod.reviewCount,
    category: prod.category?.name ?? "General",
    image: primaryImg,
    images: prod.images,
    stock: totalStock,
  };
}

// ─── Core data fetcher ───────────────────────────────────────────────────────
async function fetchHomepageData(): Promise<HomepagePayload> {
  const now = new Date();

  // ── Step A: fetch the active FlashSale (with all its items & products) AND
  //            the bare list of flash-sale product IDs in a SINGLE PARALLEL
  //            batch alongside bestSellers, newArrivals, and categories.
  //
  //    We no longer make a separate "Step 0" query just for product IDs; we
  //    derive those IDs directly from the activeFlashSale result, eliminating
  //    one full round-trip to the database.
  //
  //    bestSellers/newArrivals are still filtered by the "no flash-sale" rule,
  //    but because we don't know the IDs yet we fetch them without the notIn
  //    filter first, then exclude in JS — saving a sequential dependency.
  //    (For small datasets — ≤8 products per section — this is faster overall.)

  const activeFlashSaleWhere = {
    isActive: true,
    startDate: { lte: now },
    endDate: { gte: now },
  } as const;

  // Run all four independent queries concurrently ────────────────────────────
  const [activeFlashSale, rawBestSellers, rawNewArrivals, categories] =
    await Promise.all([
      // 1. Active flash sale + its products (single deep query, replaces two old queries)
      prisma.flashSale.findFirst({
        where: activeFlashSaleWhere,
        orderBy: { endDate: "asc" },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          isActive: true,
          items: {
            select: {
              salePrice: true,
              product: { select: productSelect },
            },
          },
        },
      }),

      // 2. Best sellers (up to 10; we trim after excluding flash-sale items)
      prisma.product.findMany({
        where: { isBestSeller: true },
        take: 10,
        orderBy: { updatedAt: "desc" },
        select: productSelect,
      }),

      // 3. New arrivals (up to 10; same trim strategy)
      prisma.product.findMany({
        where: { isNewArrival: true },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: productSelect,
      }),

      // 4. Categories
      prisma.category.findMany({
        take: 12,
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          _count: { select: { products: true } },
        },
      }),
    ]);

  // ── Derive flash-sale product ID set from the single flash-sale query ──────
  const activeFlashSaleProductIds = new Set<string>(
    activeFlashSale?.items.map((i) => i.product.id) ?? []
  );

  // ── Filter bestSellers / newArrivals (O(n) JS, no extra DB round-trip) ────
  const bestSellers = rawBestSellers
    .filter((p) => !activeFlashSaleProductIds.has(p.id))
    .slice(0, 8);

  const newArrivals = rawNewArrivals
    .filter((p) => !activeFlashSaleProductIds.has(p.id))
    .slice(0, 8);

  // ── Shape Flash Sale ──────────────────────────────────────────────────────
  let flashSaleData: FlashSaleData | null = null;

  if (activeFlashSale && activeFlashSale.items.length > 0) {
    flashSaleData = {
      id: activeFlashSale.id,
      title: activeFlashSale.title,
      startDate: activeFlashSale.startDate.toISOString(),
      endDate: activeFlashSale.endDate.toISOString(),
      isActive: activeFlashSale.isActive,
      products: activeFlashSale.items.map((item) => {
        const prod = item.product;
        const salePrice = Number(item.salePrice);
        const originalPrice = Number(prod.price);
        const discountPercent =
          originalPrice > salePrice
            ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
            : 0;
        const totalStock = prod.variants.reduce((sum, v) => sum + v.stock, 0);
        const primaryImage = getPrimaryImage(prod);

        return {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          price: salePrice,
          comparePrice: originalPrice,
          badge:
            discountPercent > 0
              ? `-${discountPercent}%`
              : (prod.badge ?? "-20%"),
          image: primaryImage,
          images: prod.images,
          stock: totalStock,
          category: prod.category?.name ?? "General",
          rating: prod.rating,
          reviewCount: prod.reviewCount,
        };
      }),
    };
  }

  return {
    bestSellers: bestSellers.map((p) => shapeProduct(p, "Best Seller")),
    flashSale: flashSaleData,
    newArrivals: newArrivals.map((p) => shapeProduct(p, "New")),
    categories: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: cat.imageUrl,
      productCount: cat._count.products,
    })),
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const now = Date.now();

    // Serve from cache if still fresh
    if (cached && now < cached.expiresAt) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          "X-Cache": "HIT",
        },
      });
    }

    const data = await fetchHomepageData();

    cached = { data, expiresAt: now + CACHE_TTL_MS };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("GET /api/homepage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch homepage data" },
      { status: 500 }
    );
  }
}
