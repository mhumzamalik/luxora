import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isValidImageUrl } from "@/lib/images";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("GET /api/admin/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch product details" }, { status: 500 });
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      images,
      isBestSeller,
      isNewArrival,
      isFlashSale,
      variants,
    } = body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Category resolution
    let categoryId = existingProduct.categoryId;
    if (categorySlug) {
      let category = await prisma.category.findFirst({
        where: { slug: categorySlug },
      });
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categorySlug.toUpperCase(),
            slug: categorySlug,
          },
        });
      }
      categoryId = category.id;
    }

    // Process image updates if provided
    type ImageInput = { url: string; isPrimary?: boolean; alt?: string };
    let imageUpdatePayload: ImageInput[] | undefined;

    if (Array.isArray(images)) {
      const valid = (images as ImageInput[]).filter(
        (img) => img && img.url && isValidImageUrl(img.url)
      );
      const hasPrimary = valid.some((img) => img.isPrimary);
      imageUpdatePayload = valid.map((img, idx) => ({
        url: img.url.trim(),
        isPrimary: hasPrimary ? Boolean(img.isPrimary) : idx === 0,
        alt: img.alt || name || existingProduct.name,
      }));
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      // If images provided, replace existing images for this product
      if (imageUpdatePayload !== undefined) {
        await tx.productImage.deleteMany({
          where: { productId: id },
        });

        if (imageUpdatePayload.length > 0) {
          await tx.productImage.createMany({
            data: imageUpdatePayload.map((img) => ({
              productId: id,
              url: img.url,
              alt: img.alt || null,
              isPrimary: img.isPrimary || false,
            })),
          });
        }
      }

      // Update variants if provided
      if (Array.isArray(variants)) {
        const existingVariants = await tx.productVariant.findMany({
          where: { productId: id },
        });
        const existingIds = new Set(existingVariants.map((v) => v.id));
        const incomingIds = new Set(variants.filter((v: any) => v.id).map((v: any) => v.id));

        // Delete variants removed by admin
        const toDelete = existingVariants.filter((v) => !incomingIds.has(v.id));
        for (const delVar of toDelete) {
          try {
            await tx.productVariant.delete({ where: { id: delVar.id } });
          } catch {
            // If referenced by orders, fallback to stock: 0
            await tx.productVariant.update({
              where: { id: delVar.id },
              data: { stock: 0 },
            });
          }
        }

        // Upsert / Update variants
        for (let idx = 0; idx < variants.length; idx++) {
          const v = variants[idx];
          const variantData = {
            size: v.size ? String(v.size).trim() : null,
            color: v.color ? String(v.color).trim() : null,
            colorHex: v.colorHex ? String(v.colorHex).trim() : null,
            sku: v.sku ? String(v.sku).trim() : `${slug || existingProduct.slug}-${idx + 1}-${Date.now()}`,
            stock: v.stock !== undefined && v.stock !== null ? Math.max(0, parseInt(String(v.stock), 10) || 0) : 0,
            price: v.price ? parseFloat(String(v.price)) : null,
          };

          if (v.id && existingIds.has(v.id)) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: variantData,
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                ...variantData,
              },
            });
          }
        }
      } else if (stock !== undefined && stock !== null) {
        const primaryVariant = await tx.productVariant.findFirst({
          where: { productId: id },
        });
        if (primaryVariant) {
          await tx.productVariant.update({
            where: { id: primaryVariant.id },
            data: {
              stock: parseInt(String(stock), 10),
              price: price ? parseFloat(String(price)) : primaryVariant.price,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: id,
              sku: `${slug || existingProduct.slug}-${Date.now()}`,
              stock: parseInt(String(stock), 10),
              price: price ? parseFloat(String(price)) : existingProduct.price,
            },
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: {
          name: name !== undefined ? name.trim() : undefined,
          slug: slug !== undefined ? slug.trim() : undefined,
          description: description !== undefined ? description.trim() : undefined,
          price: price !== undefined ? parseFloat(String(price)) : undefined,
          comparePrice: comparePrice !== undefined ? (comparePrice ? parseFloat(String(comparePrice)) : null) : undefined,
          badge: badge !== undefined ? (badge ? badge.trim() : null) : undefined,
          categoryId,
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
    });

    revalidatePath("/", "layout");
    revalidatePath("/products");

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("PUT /api/admin/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.product.delete({ where: { id } });

    revalidatePath("/", "layout");
    revalidatePath("/products");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
