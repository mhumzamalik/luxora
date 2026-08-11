import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isValidImageUrl } from "@/lib/images";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    await prisma.product.delete({ where: { id } });

    revalidatePath("/", "layout");
    revalidatePath("/products");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

function parseBoolean(val: unknown, fallback = false): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    if (val.toLowerCase() === "true") return true;
    if (val.toLowerCase() === "false") return false;
  }
  return fallback;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      description,
      price,
      comparePrice,
      badge,
      categorySlug,
      stock,
      imageUrl,
      images,
      isBestSeller,
      isNewArrival,
      isFlashSale,
      variants,
    } = body;

    if (!name || !price) {
      return NextResponse.json({ error: "Product name and price are required" }, { status: 400 });
    }

    // Find category or default
    let category = await prisma.category.findFirst({
      where: categorySlug ? { slug: categorySlug } : {},
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categorySlug ? categorySlug.toUpperCase() : "General",
          slug: categorySlug || "general",
        },
      });
    }

    type ImageInput = { url: string; isPrimary?: boolean; alt?: string };
    let imageCreatePayload: ImageInput[] | undefined;

    if (Array.isArray(images) && images.length > 0) {
      const valid = (images as ImageInput[]).filter(
        (img) => img && img.url && isValidImageUrl(img.url)
      );
      if (valid.length > 0) {
        const hasPrimary = valid.some((img) => img.isPrimary);
        imageCreatePayload = valid.map((img, idx) => ({
          url: img.url.trim(),
          isPrimary: hasPrimary ? Boolean(img.isPrimary) : idx === 0,
          alt: img.alt || name,
        }));
      }
    } else if (imageUrl && isValidImageUrl(imageUrl)) {
      imageCreatePayload = [{ url: imageUrl.trim(), isPrimary: true, alt: name }];
    }

    const generatedSlug = slug ? slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        description: description ? description.trim() : name.trim(),
        price: parseFloat(String(price)),
        comparePrice: comparePrice ? parseFloat(String(comparePrice)) : null,
        badge: badge ? badge.trim() : null,
        isBestSeller: parseBoolean(isBestSeller, false),
        isNewArrival: parseBoolean(isNewArrival, false),
        isFlashSale:  parseBoolean(isFlashSale, false),
        categoryId: category.id,
        images: imageCreatePayload
          ? { create: imageCreatePayload }
          : undefined,
        variants: {
          create:
            Array.isArray(variants) && variants.length > 0
              ? variants.map((v: any, idx: number) => ({
                  size: v.size ? String(v.size).trim() : null,
                  color: v.color ? String(v.color).trim() : null,
                  colorHex: v.colorHex ? String(v.colorHex).trim() : null,
                  sku: v.sku ? String(v.sku).trim() : `${generatedSlug}-${idx + 1}-${Date.now()}`,
                  stock: v.stock !== undefined && v.stock !== null ? Math.max(0, parseInt(String(v.stock), 10) || 0) : 10,
                  price: v.price ? parseFloat(String(v.price)) : null,
                }))
              : [
                  {
                    sku: `${generatedSlug}-${Date.now()}`,
                    stock: stock !== undefined ? parseInt(String(stock), 10) : 50,
                    price: parseFloat(String(price)),
                  },
                ],
        },
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/products");

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, isBestSeller, isNewArrival, isFlashSale } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        isBestSeller: isBestSeller !== undefined ? parseBoolean(isBestSeller, false) : undefined,
        isNewArrival: isNewArrival !== undefined ? parseBoolean(isNewArrival, false) : undefined,
        isFlashSale:  isFlashSale !== undefined ? parseBoolean(isFlashSale, false) : undefined,
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/products");

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("PATCH /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to update product visibility" }, { status: 500 });
  }
}
