import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subtotalParam = searchParams.get("subtotal");
    const subtotal = subtotalParam ? parseFloat(subtotalParam) : 0;

    const now = new Date();

    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter coupons matching usage limits and minimum order amount
    const availableCoupons = coupons.filter((c) => {
      if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return false;
      if (c.minOrderAmount !== null && subtotal > 0 && subtotal < c.minOrderAmount) return false;
      return true;
    });

    return NextResponse.json(
      availableCoupons.map((c) => ({
        id: c.id,
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount,
        maxDiscount: c.maxDiscount,
        expiresAt: c.expiresAt,
      }))
    );
  } catch (error) {
    console.error("GET /api/coupons/available error:", error);
    return NextResponse.json({ error: "Failed to fetch available coupons" }, { status: 500 });
  }
}
