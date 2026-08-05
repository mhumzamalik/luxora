import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, description, price, categorySlug, stock, imageUrl } = body;

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

    const product = await prisma.product.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: description || name,
        price: parseFloat(price),
        categoryId: category.id,
        images: imageUrl
          ? {
              create: [{ url: imageUrl, isPrimary: true }],
            }
          : undefined,
        variants: {
          create: [
            {
              sku: `${slug || "item"}-${Date.now()}`,
              stock: parseInt(stock || "50", 10),
              price: parseFloat(price),
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

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
