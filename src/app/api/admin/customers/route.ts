import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: {
          select: { orders: true, reviews: true },
        },
        orders: {
          select: { total: true },
        },
      },
    });

    const formatted = customers.map((c) => ({
      ...c,
      totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
