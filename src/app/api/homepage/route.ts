import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrimaryImage } from "@/lib/images";

export async function GET() {
  try {
    const now = new Date();

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 0: Determine which product IDs are in an ACTIVE Flash Sale.
    //
    // "Active" means the FlashSale row satisfies ALL of:
    //   isActive = true
    //   startDate <= now
    //   endDate   >= now
    //
    // These IDs are used to EXCLUDE products from Best Sellers and New Arrivals
    // so the same product never appears in more than one homepage section.
    // ─────────────────────────────────────────────────────────────────────────
    const activeFlashSaleItems = await prisma.flashSaleItem.findMany({
      where: {
        flashSale: {
          isActive: true,
          startDate: { lte: now },
          endDate:   { gte: now },
        },
      },
      select: { productId: true },
    });

    // Set of product IDs that belong to an active Flash Sale (O(1) lookup)
    const activeFlashSaleProductIds = new Set(
      activeFlashSaleItems.map((item) => item.productId)
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Best Sellers
    //    Strictly filter by isBestSeller = true.
    //    Exclude any product that is currently in an active Flash Sale.
    // ─────────────────────────────────────────────────────────────────────────
    const bestSellers = await prisma.product.findMany({
      where: {
        isBestSeller: true,
        ...(activeFlashSaleProductIds.size > 0 && {
          id: { notIn: [...activeFlashSaleProductIds] },
        }),
      },
      take: 8,
      include: {
        category: true,
        images: true,
        variants: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Active Flash Sale
    //    Source of truth: FlashSaleItem.salePrice (never Product.price).
    //    "Active" = isActive AND startDate <= now AND endDate >= now.
    //    No fallback to isFlashSale flag — if no real campaign exists,
    //    the Flash Sale section simply does not render.
    // ─────────────────────────────────────────────────────────────────────────
    const activeFlashSale = await prisma.flashSale.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate:   { gte: now },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                images: true,
                variants: true,
              },
            },
          },
        },
      },
      orderBy: { endDate: "asc" }, // soonest-ending first
    });

    let flashSaleData: {
      id: string;
      title: string;
      startDate: string;
      endDate: string;
      isActive: boolean;
      products: {
        id: string;
        name: string;
        slug: string;
        /** Sale price from FlashSaleItem.salePrice — NOT Product.price */
        price: number;
        /** Original price from Product.price, shown crossed-out */
        comparePrice: number;
        badge: string;
        image: string;
        images: { id: string; url: string; alt?: string | null; isPrimary: boolean }[];
        stock: number;
        category: string;
        rating: number;
        reviewCount: number;
      }[];
    } | null = null;

    if (activeFlashSale) {
      flashSaleData = {
        id:        activeFlashSale.id,
        title:     activeFlashSale.title,
        startDate: activeFlashSale.startDate.toISOString(),
        endDate:   activeFlashSale.endDate.toISOString(),
        isActive:  activeFlashSale.isActive,
        products: activeFlashSale.items.map((item) => {
          const prod = item.product;
          // salePrice  → the price the customer pays during the Flash Sale
          // originalPrice → the regular Product.price, shown crossed-out
          const salePrice      = Number(item.salePrice);
          const originalPrice  = Number(prod.price);
          const discountPercent =
            originalPrice > salePrice
              ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
              : 0;

          const totalStock = prod.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
          const primaryImage = getPrimaryImage(prod);

          return {
            id:           prod.id,
            name:         prod.name,
            slug:         prod.slug,
            price:        salePrice,        // sale price — what the customer sees
            comparePrice: originalPrice,    // original price — crossed-out
            badge:        discountPercent > 0 ? `-${discountPercent}%` : (prod.badge ?? "-20%"),
            image:        primaryImage,
            images:       prod.images,
            stock:        totalStock,
            category:     prod.category?.name ?? "General",
            rating:       prod.rating,
            reviewCount:  prod.reviewCount,
          };
        }),
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. New Arrivals
    //    Strictly filter by isNewArrival = true.
    //    Exclude any product that is currently in an active Flash Sale.
    // ─────────────────────────────────────────────────────────────────────────
    const newArrivals = await prisma.product.findMany({
      where: {
        isNewArrival: true,
        ...(activeFlashSaleProductIds.size > 0 && {
          id: { notIn: [...activeFlashSaleProductIds] },
        }),
      },
      take: 8,
      include: {
        category: true,
        images: true,
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Categories
    // ─────────────────────────────────────────────────────────────────────────
    const categories = await prisma.category.findMany({
      take: 12,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Shape and return the response
    // ─────────────────────────────────────────────────────────────────────────
    return NextResponse.json({
      bestSellers: bestSellers.map((prod) => {
        const totalStock = prod.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
        const primaryImg = getPrimaryImage(prod);
        return {
          id:           prod.id,
          name:         prod.name,
          slug:         prod.slug,
          description:  prod.description,
          price:        Number(prod.price),
          comparePrice: prod.comparePrice != null ? Number(prod.comparePrice) : null,
          badge:        prod.badge,
          rating:       prod.rating,
          reviewCount:  prod.reviewCount,
          category:     prod.category?.name ?? "General",
          image:        primaryImg,
          images:       prod.images,
          stock:        totalStock,
        };
      }),

      flashSale: flashSaleData,

      newArrivals: newArrivals.map((prod) => {
        const totalStock = prod.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
        const primaryImg = getPrimaryImage(prod);
        return {
          id:           prod.id,
          name:         prod.name,
          slug:         prod.slug,
          description:  prod.description,
          price:        Number(prod.price),
          comparePrice: prod.comparePrice != null ? Number(prod.comparePrice) : null,
          badge:        prod.badge ?? "New",
          rating:       prod.rating,
          reviewCount:  prod.reviewCount,
          category:     prod.category?.name ?? "General",
          image:        primaryImg,
          images:       prod.images,
          stock:        totalStock,
        };
      }),

      categories: categories.map((cat) => ({
        id:           cat.id,
        name:         cat.name,
        slug:         cat.slug,
        image:        cat.imageUrl,
        productCount: cat._count.products,
      })),
    });
  } catch (error) {
    console.error("GET /api/homepage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch homepage data" },
      { status: 500 }
    );
  }
}
