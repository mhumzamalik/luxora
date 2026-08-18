import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { resolveProductPricing } from "@/lib/pricing";

// ─── Cache Layer (30s TTL per query URL) ─────────────────────────────────────
const CACHE_TTL_MS = 30_000;
const cacheMap = new Map<string, { data: unknown; expiresAt: number }>();
const inFlightMap = new Map<string, Promise<unknown>>();

function invalidateProductsCache() {
  cacheMap.clear();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const cacheKey = url.search || "default";
    const nowTs = Date.now();

    // 1. Serve from cache if fresh
    const cached = cacheMap.get(cacheKey);
    if (cached && nowTs < cached.expiresAt) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          "X-Cache": "HIT",
        },
      });
    }

    // 2. In-flight deduplication
    if (!inFlightMap.has(cacheKey)) {
      const fetchPromise = (async () => {
        const search = url.searchParams.get("search") || "";
        const category = url.searchParams.get("category") || "";
        const minPrice = parseFloat(url.searchParams.get("minPrice") || "0");
        const maxPrice = parseFloat(url.searchParams.get("maxPrice") || "100000");
        const isFlashSale = url.searchParams.get("isFlashSale") === "true";
        const isBestSeller = url.searchParams.get("isBestSeller") === "true";
        const isNewArrival = url.searchParams.get("isNewArrival") === "true";
        const sortBy = url.searchParams.get("sortBy") || "featured";
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "12", 10)));

        const where: Prisma.ProductWhereInput = {};

        if (search) {
          where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ];
        }

        if (category && category !== "all") {
          where.category = {
            slug: category,
          };
        }

        where.price = {
          gte: minPrice,
          lte: maxPrice,
        };

        if (isFlashSale) where.isFlashSale = true;
        if (isBestSeller) where.isBestSeller = true;
        if (isNewArrival) where.isNewArrival = true;

        let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

        if (sortBy === "low-to-high") {
          orderBy = { price: "asc" };
        } else if (sortBy === "high-to-low") {
          orderBy = { price: "desc" };
        } else if (sortBy === "rating") {
          orderBy = { rating: "desc" };
        } else if (sortBy === "featured") {
          orderBy = { reviewCount: "desc" };
        }

        const now = new Date();

        // Run count and products fetch in parallel
        const [total, rawProducts] = await Promise.all([
          prisma.product.count({ where }),
          prisma.product.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
              category: { select: { id: true, name: true, slug: true } },
              images: { select: { id: true, url: true, alt: true, isPrimary: true } },
              variants: { select: { id: true, size: true, color: true, stock: true, price: true, sku: true } },
              flashSaleItems: {
                where: {
                  flashSale: {
                    isActive: true,
                    startDate: { lte: now },
                    endDate: { gte: now },
                  },
                },
                include: {
                  flashSale: { select: { id: true, title: true, startDate: true, endDate: true, isActive: true } },
                },
              },
            },
          }),
        ]);

        const products = rawProducts.map((p) => resolveProductPricing(p, now));

        const result = {
          products,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };

        cacheMap.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
        return result;
      })().finally(() => {
        inFlightMap.delete(cacheKey);
      });

      inFlightMap.set(cacheKey, fetchPromise);
    }

    const data = await inFlightMap.get(cacheKey);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, description, price, comparePrice, categoryId, badge, images, variants } = body;

    if (!name || !slug || !description || !price || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        badge,
        categoryId,
        images: {
          create: images?.map((img: { url: string; alt?: string; isPrimary?: boolean }) => ({
            url: img.url,
            alt: img.alt || name,
            isPrimary: img.isPrimary || false,
          })) || [],
        },
        variants: {
          create: variants?.map((v: { sku: string; size?: string; color?: string; stock?: number; price?: number }) => ({
            sku: v.sku || `${slug}-${Date.now()}`,
            size: v.size,
            color: v.color,
            stock: v.stock || 10,
            price: v.price ? parseFloat(v.price as unknown as string) : null,
          })) || [{ sku: `${slug}-default`, stock: 50 }],
        },
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    invalidateProductsCache();

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
