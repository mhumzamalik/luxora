import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [
      totalRevenueResult,
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      lowStockVariants,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "PAID" },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: true } },
        },
      }),
      prisma.productVariant.findMany({
        where: { stock: { lte: 5 } },
        include: { product: true },
        take: 10,
      }),
    ]);

    const totalRevenue = totalRevenueResult._sum.total || 0;

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      lowStockVariants,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
