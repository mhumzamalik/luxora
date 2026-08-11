import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { resolveProductPricing } from "@/lib/pricing";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "100000");
    const isFlashSale = searchParams.get("isFlashSale") === "true";
    const isBestSeller = searchParams.get("isBestSeller") === "true";
    const isNewArrival = searchParams.get("isNewArrival") === "true";
    const sortBy = searchParams.get("sortBy") || "featured";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "12", 10)));

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

    const total = await prisma.product.count({ where });
    const rawProducts = await prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: true,
        images: true,
        variants: true,
        flashSaleItems: {
          include: {
            flashSale: true,
          },
        },
      },
    });

    const products = rawProducts.map((p) => resolveProductPricing(p, now));

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
