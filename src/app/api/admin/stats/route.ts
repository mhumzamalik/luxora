import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPrimaryImage } from "@/lib/images";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    const now = new Date();
    let periodDays = 30;
    if (period === "7d") periodDays = 7;
    else if (period === "90d") periodDays = 90;
    else if (period === "all") periodDays = 3650; // ~10 years

    const currentPeriodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000);

    // Parallel DB Aggregations
    const [
      currentRevenueAgg,
      previousRevenueAgg,
      currentOrdersCount,
      previousOrdersCount,
      pendingOrdersCount,
      currentCustomersCount,
      previousCustomersCount,
      currentProductsCount,
      previousProductsCount,
      recentOrders,
      lowStockVariants,
      orderItemsAgg,
    ] = await Promise.all([
      // Revenue current period
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          paymentStatus: "PAID",
          ...(period !== "all" ? { createdAt: { gte: currentPeriodStart } } : {}),
        },
      }),
      // Revenue previous period
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          paymentStatus: "PAID",
          ...(period !== "all"
            ? { createdAt: { gte: previousPeriodStart, lt: currentPeriodStart } }
            : {}),
        },
      }),
      // Orders current period
      prisma.order.count({
        where: period !== "all" ? { createdAt: { gte: currentPeriodStart } } : {},
      }),
      // Orders previous period
      prisma.order.count({
        where:
          period !== "all"
            ? { createdAt: { gte: previousPeriodStart, lt: currentPeriodStart } }
            : {},
      }),
      // Pending verification orders
      prisma.order.count({ where: { status: "PENDING" } }),
      // Customers current period
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          ...(period !== "all" ? { createdAt: { gte: currentPeriodStart } } : {}),
        },
      }),
      // Customers previous period
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          ...(period !== "all"
            ? { createdAt: { gte: previousPeriodStart, lt: currentPeriodStart } }
            : {}),
        },
      }),
      // Products total count
      prisma.product.count(),
      // Products count before current period
      prisma.product.count({
        where: period !== "all" ? { createdAt: { lt: currentPeriodStart } } : {},
      }),
      // Recent orders queue
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: {
            take: 1,
            include: { product: { include: { images: true } } },
          },
        },
      }),
      // Low stock variant alerts
      prisma.productVariant.findMany({
        where: { stock: { lte: 10 } },
        include: {
          product: {
            include: { images: true },
          },
        },
        orderBy: { stock: "asc" },
        take: 6,
      }),
      // Order items aggregated for best sellers
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 6,
      }),
    ]);

    // Format KPI Values & Changes
    const totalRevenue = currentRevenueAgg._sum.total || 0;
    const prevRevenue = previousRevenueAgg._sum.total || 0;
    const revenueChange =
      prevRevenue > 0
        ? parseFloat((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
        : totalRevenue > 0
        ? 100
        : 0;

    const ordersChange =
      previousOrdersCount > 0
        ? parseFloat((((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100).toFixed(1))
        : currentOrdersCount > 0
        ? 100
        : 0;

    const customersChange =
      previousCustomersCount > 0
        ? parseFloat((((currentCustomersCount - previousCustomersCount) / previousCustomersCount) * 100).toFixed(1))
        : currentCustomersCount > 0
        ? 100
        : 0;

    const productsChange =
      previousProductsCount > 0
        ? parseFloat((((currentProductsCount - previousProductsCount) / previousProductsCount) * 100).toFixed(1))
        : 0;

    // Fetch Best Sellers Product details
    const bestSellerIds = orderItemsAgg.map((item) => item.productId);
    const bestSellerProducts = await prisma.product.findMany({
      where: { id: { in: bestSellerIds } },
      include: { images: true },
    });

    const bestSellers = orderItemsAgg.map((item) => {
      const prod = bestSellerProducts.find((p) => p.id === item.productId);
      const primaryImage = getPrimaryImage(prod);

      return {
        id: item.productId,
        name: prod?.name || "Product Item",
        image: primaryImage,
        unitsSold: item._sum.quantity || 0,
        revenue: item._sum.totalPrice || 0,
      };
    });

    // Format Low Stock Products
    const formattedLowStock = lowStockVariants.map((variant) => {
      const primaryImage = getPrimaryImage(variant.product);

      return {
        id: variant.id,
        productId: variant.productId,
        name: `${variant.product.name}${variant.color || variant.size ? ` (${[variant.color, variant.size].filter(Boolean).join(" / ")})` : ""}`,
        sku: variant.sku,
        image: primaryImage,
        stock: variant.stock,
        status: variant.stock === 0 ? "Out of Stock" : variant.stock <= 5 ? "Critical Stock" : "Low Stock",
      };
    });

    return NextResponse.json({
      period,
      periodLabel: period === "7d" ? "last 7 days" : period === "90d" ? "last 90 days" : period === "all" ? "all time" : "last 30 days",
      kpis: {
        revenue: {
          value: totalRevenue,
          change: revenueChange,
        },
        orders: {
          value: currentOrdersCount,
          pending: pendingOrdersCount,
          change: ordersChange,
        },
        customers: {
          value: currentCustomersCount,
          change: customersChange,
        },
        products: {
          value: currentProductsCount,
          change: productsChange,
        },
      },
      recentOrders,
      bestSellers,
      lowStockProducts: formattedLowStock,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
