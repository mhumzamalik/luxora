import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveProductPricing } from "@/lib/pricing";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const now = new Date();

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: true,
        variants: true,
        flashSaleItems: {
          include: {
            flashSale: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch related products in the same category
    const rawRelatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: 4,
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

    const resolvedProduct = resolveProductPricing(product, now);
    const relatedProducts = rawRelatedProducts.map((p) => resolveProductPricing(p, now));

    return NextResponse.json({ product: resolvedProduct, relatedProducts });
  } catch (error) {
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product details" },
      { status: 500 }
    );
  }
}
