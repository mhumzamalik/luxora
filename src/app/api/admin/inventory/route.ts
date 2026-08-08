import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateStockSchema = z.object({
  variantId: z.string().min(1),
  stock: z.number().min(0),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    let whereClause = {};
    if (filter === "low") {
      whereClause = { stock: { lte: 10, gt: 0 } };
    } else if (filter === "out") {
      whereClause = { stock: 0 };
    }

    const variants = await prisma.productVariant.findMany({
      where: whereClause,
      include: {
        product: {
          select: { id: true, name: true, slug: true, category: { select: { name: true } }, images: true },
        },
      },
      orderBy: { stock: "asc" },
    });

    return NextResponse.json({ variants });
  } catch (error) {
    console.error("GET /api/admin/inventory error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateStockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { variantId, stock } = parsed.data;

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock },
    });

    return NextResponse.json({ variant: updatedVariant });
  } catch (error) {
    console.error("PUT /api/admin/inventory error:", error);
    return NextResponse.json({ error: "Failed to update inventory stock" }, { status: 500 });
  }
}
