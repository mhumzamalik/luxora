import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveProductPricing } from "@/lib/pricing";

// ─── Cache Layer (30s TTL per product slug) ───────────────────────────────────
const CACHE_TTL_MS = 30_000;
const slugCacheMap = new Map<string, { data: unknown; expiresAt: number }>();
const slugInFlightMap = new Map<string, Promise<unknown>>();

/**
 * Fetches all product detail data using fully-parallel Prisma queries.
 *
 * Strategy:
 *   1. Fetch the product scalars + slug lookup (single DB call, fast PK+unique index)
 *   2. Once we have productId, fire ALL relation queries in a single Promise.all:
 *      images, variants, reviews, flashSaleItems, relatedProducts
 *   This reduces sequential round-trips from 5-6 down to 2 total.
 */
async function fetchProductDetail(slug: string) {
  const now = new Date();

  // ── Phase 1: minimal product lookup (1 round-trip) ───────────────────────
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      comparePrice: true,
      badge: true,
      rating: true,
      reviewCount: true,
      isFlashSale: true,
      isBestSeller: true,
      isNewArrival: true,
      categoryId: true,
    },
  });
  if (!product) return null;

  // ── Phase 2: all relations in parallel (1 round-trip each, all concurrent) ──
  const [category, images, variants, reviews, flashSaleItems, relatedRaw] = await Promise.all([
    // Category (PK lookup — very fast)
    prisma.category.findUnique({
      where: { id: product.categoryId },
      select: { id: true, name: true, slug: true },
    }),

    // Images (index: productId, isPrimary)
    prisma.productImage.findMany({
      where: { productId: product.id },
      select: { id: true, url: true, alt: true, isPrimary: true },
      orderBy: { isPrimary: "desc" },
    }),

    // Variants (index: productId)
    prisma.productVariant.findMany({
      where: { productId: product.id },
      select: {
        id: true,
        size: true,
        color: true,
        colorHex: true,
        sku: true,
        stock: true,
        reserved: true,
        price: true,
      },
    }),

    // Reviews (NEW index: productId, createdAt DESC)
    prisma.review.findMany({
      where: { productId: product.id },
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Flash sale items (NEW index: productId) — only active sales
    prisma.flashSaleItem.findMany({
      where: {
        productId: product.id,
        flashSale: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      },
      select: {
        salePrice: true,
        flashSale: {
          select: { id: true, title: true, startDate: true, endDate: true, isActive: true },
        },
      },
    }),

    // Related products — scalars only (index: categoryId) — NO nested relations
    // Images are batch-fetched below and joined in memory to avoid N+1
    prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: 4,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        comparePrice: true,
        badge: true,
        rating: true,
        reviewCount: true,
        categoryId: true,
        isFlashSale: true,
        // category inline is a cheap JOIN on PK, Prisma handles it without N+1
        category: { select: { id: true, name: true, slug: true } },
        // No images/flashSaleItems here — fetched in batch below
      },
    }),
  ]);

  // Phase 3: batch-fetch images for all related products in ONE query (no N+1)
  const relatedIds = relatedRaw.map((p) => p.id);
  const relatedImages = relatedIds.length > 0
    ? await prisma.productImage.findMany({
      where: { productId: { in: relatedIds } },
      select: { id: true, url: true, alt: true, isPrimary: true, productId: true },
      orderBy: { isPrimary: "desc" },
    })
    : [];

  // Group images by productId
  const imagesByProductId = relatedImages.reduce<Record<string, typeof relatedImages>>((acc, img) => {
    if (!acc[img.productId]) acc[img.productId] = [];
    acc[img.productId].push(img);
    return acc;
  }, {});

  // Attach images to each related product; include empty flashSaleItems for resolveProductPricing compat
  const relatedWithImages = relatedRaw.map((p) => ({
    ...p,
    images: (imagesByProductId[p.id] ?? []).slice(0, 3),
    flashSaleItems: [] as Array<{ salePrice: number; flashSale: { id: string; title: string; startDate: Date; endDate: Date; isActive: boolean } }>,
  }));

  // Reconstruct the full product object matching the existing API contract
  const fullProduct = {
    ...product,
    category: category ?? null,
    images,
    variants,
    reviews,
    flashSaleItems,
  };

  return { product: fullProduct, relatedProducts: relatedWithImages };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const nowTs = Date.now();

    // 1. Serve from cache if fresh
    const cached = slugCacheMap.get(slug);
    if (cached && nowTs < cached.expiresAt) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          "X-Cache": "HIT",
        },
      });
    }

    // 2. In-flight deduplication — prevents thundering herd on cache miss
    if (!slugInFlightMap.has(slug)) {
      const fetchPromise = (async () => {
        const now = new Date();
        const raw = await fetchProductDetail(slug);

        if (!raw) return null;

        const { product: rawProduct, relatedProducts: rawRelated } = raw;

        // resolveProductPricing computes flash-sale prices, discount badges, etc.
        const resolvedProduct = resolveProductPricing(rawProduct, now);
        const relatedProducts = rawRelated.map((p) => resolveProductPricing(p, now));

        const result = { product: resolvedProduct, relatedProducts };
        slugCacheMap.set(slug, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
        return result;
      })().finally(() => {
        slugInFlightMap.delete(slug);
      });


      slugInFlightMap.set(slug, fetchPromise);
    }

    const data = await slugInFlightMap.get(slug);

    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product details" },
      { status: 500 }
    );
  }
}
