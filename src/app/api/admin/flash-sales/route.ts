import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const flashSales = await prisma.flashSale.findMany({
      orderBy: { createdAt: "desc" },
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
    });

    return NextResponse.json(flashSales);
  } catch (error) {
    console.error("GET /api/admin/flash-sales error:", error);
    return NextResponse.json({ error: "Failed to fetch flash sales" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { title, startDate, endDate, isActive, items } = body;

    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: "Title, start date, and end date are required" }, { status: 400 });
    }

    const flashSale = await prisma.flashSale.create({
      data: {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive ?? true,
        items: items && Array.isArray(items) && items.length > 0
          ? {
              create: items.map((item: { productId: string; salePrice: number }) => ({
                productId: item.productId,
                salePrice: parseFloat(String(item.salePrice)),
              })),
            }
          : undefined,
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
    });

    // Update isFlashSale flag on added products
    if (items && Array.isArray(items)) {
      const productIds = items.map((i: { productId: string }) => i.productId);
      if (productIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isFlashSale: true },
        });
      }
    }

    return NextResponse.json(flashSale, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/flash-sales error:", error);
    return NextResponse.json({ error: "Failed to create flash sale" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, startDate, endDate, isActive, items } = body;

    if (!id) {
      return NextResponse.json({ error: "Flash sale ID required" }, { status: 400 });
    }

    // Delete existing items for this flash sale first, then recreate them
    await prisma.flashSaleItem.deleteMany({
      where: { flashSaleId: id },
    });

    const flashSale = await prisma.flashSale.update({
      where: { id },
      data: {
        title,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        items: items && Array.isArray(items)
          ? {
              create: items.map((item: { productId: string; salePrice: number }) => ({
                productId: item.productId,
                salePrice: parseFloat(String(item.salePrice)),
              })),
            }
          : undefined,
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
    });

    // Sync product isFlashSale flags
    if (items && Array.isArray(items)) {
      const productIds = items.map((i: { productId: string }) => i.productId);
      if (productIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isFlashSale: true },
        });
      }
    }

    return NextResponse.json(flashSale);
  } catch (error) {
    console.error("PUT /api/admin/flash-sales error:", error);
    return NextResponse.json({ error: "Failed to update flash sale" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Flash Sale ID required" }, { status: 400 });
    }

    await prisma.flashSale.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/flash-sales error:", error);
    return NextResponse.json({ error: "Failed to delete flash sale" }, { status: 500 });
  }
}
