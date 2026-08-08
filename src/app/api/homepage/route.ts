import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // 1. Fetch Best Sellers
    let bestSellers = await prisma.product.findMany({
      where: { isBestSeller: true },
      take: 8,
      include: {
        category: true,
        images: true,
        variants: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (bestSellers.length === 0) {
      bestSellers = await prisma.product.findMany({
        take: 8,
        include: {
          category: true,
          images: true,
          variants: true,
        },
        orderBy: { reviewCount: "desc" },
      });
    }

    // 2. Fetch Active Flash Sale
    // Find active flash sale currently within time window, or fallback to latest active sale
    let activeFlashSale = await prisma.flashSale.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
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
      orderBy: { endDate: "asc" },
    });

    // Fallback: If no current active flash sale in window, find latest active flash sale
    if (!activeFlashSale) {
      activeFlashSale = await prisma.flashSale.findFirst({
        where: { isActive: true },
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
        orderBy: { createdAt: "desc" },
      });
    }

    // Fallback if no FlashSale record exists yet: find products marked isFlashSale: true
    let flashSaleData = null;
    if (activeFlashSale) {
      flashSaleData = {
        id: activeFlashSale.id,
        title: activeFlashSale.title,
        startDate: activeFlashSale.startDate.toISOString(),
        endDate: activeFlashSale.endDate.toISOString(),
        isActive: activeFlashSale.isActive,
        products: activeFlashSale.items.map((item) => {
          const prod = item.product;
          const originalPrice = prod.price;
          const salePrice = item.salePrice;
          const discountPercent = originalPrice > salePrice
            ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
            : 0;

          const totalStock = prod.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
          const primaryImage = prod.images?.find((img) => img.isPrimary)?.url || prod.images?.[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80";

          return {
            id: prod.id,
            name: prod.name,
            slug: prod.slug,
            price: salePrice,
            comparePrice: originalPrice,
            badge: discountPercent > 0 ? `-${discountPercent}%` : prod.badge || "-20%",
            image: primaryImage,
            stock: totalStock,
            category: prod.category?.name || "General",
            rating: prod.rating,
            reviewCount: prod.reviewCount,
          };
        }),
      };
    } else {
      // Fallback to legacy isFlashSale products if no campaign was created yet
      const fallbackProducts = await prisma.product.findMany({
        where: { isFlashSale: true },
        take: 4,
        include: {
          category: true,
          images: true,
          variants: true,
        },
      });

      // 2 hours from now default
      const defaultEndDate = new Date(Date.now() + 2 * 60 * 60 * 1000 + 18 * 60 * 1000 + 34 * 1000);

      flashSaleData = {
        id: "default-flash-sale",
        title: "Flash Sale",
        startDate: new Date().toISOString(),
        endDate: defaultEndDate.toISOString(),
        isActive: true,
        products: fallbackProducts.map((prod) => {
          const originalPrice = prod.comparePrice || prod.price * 1.25;
          const salePrice = prod.price;
          const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
          const totalStock = prod.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
          const primaryImage = prod.images?.find((img) => img.isPrimary)?.url || prod.images?.[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80";

          return {
            id: prod.id,
            name: prod.name,
            slug: prod.slug,
            price: salePrice,
            comparePrice: originalPrice,
            badge: prod.badge || `-${discountPercent}%`,
            image: primaryImage,
            stock: totalStock,
            category: prod.category?.name || "General",
            rating: prod.rating,
            reviewCount: prod.reviewCount,
          };
        }),
      };
    }

    // 3. Fetch New Arrivals
    let newArrivals = await prisma.product.findMany({
      where: { isNewArrival: true },
      take: 8,
      include: {
        category: true,
        images: true,
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (newArrivals.length === 0) {
      newArrivals = await prisma.product.findMany({
        take: 8,
        include: {
          category: true,
          images: true,
          variants: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // 4. Fetch Categories
    const categories = await prisma.category.findMany({
      take: 12,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({
      bestSellers: bestSellers.map((prod) => {
        const totalStock = prod.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
        const primaryImg = prod.images?.find((i) => i.isPrimary)?.url || prod.images?.[0]?.url || "";
        return {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          price: prod.price,
          comparePrice: prod.comparePrice,
          badge: prod.badge,
          rating: prod.rating,
          reviewCount: prod.reviewCount,
          category: prod.category?.name || "General",
          image: primaryImg,
          stock: totalStock,
        };
      }),
      flashSale: flashSaleData,
      newArrivals: newArrivals.map((prod) => {
        const totalStock = prod.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
        const primaryImg = prod.images?.find((i) => i.isPrimary)?.url || prod.images?.[0]?.url || "";
        return {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          price: prod.price,
          comparePrice: prod.comparePrice,
          badge: prod.badge || "New",
          rating: prod.rating,
          reviewCount: prod.reviewCount,
          category: prod.category?.name || "General",
          image: primaryImg,
          stock: totalStock,
        };
      }),
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.imageUrl,
        productCount: cat._count.products,
      })),
    });
  } catch (error) {
    console.error("GET /api/homepage error:", error);
    return NextResponse.json({ error: "Failed to fetch homepage data" }, { status: 500 });
  }
}
