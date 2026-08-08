import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { formatCurrency } from "@/lib/currency";

const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  orderAmount: z.number().min(0, "Order amount must be positive"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = validateCouponSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { code, orderAmount } = parsed.data;
    const normalizedCode = code.toUpperCase().trim();

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found." },
        { status: 404 }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "This coupon is currently inactive." },
        { status: 400 }
      );
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This coupon code has expired." },
        { status: 400 }
      );
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit." },
        { status: 400 }
      );
    }

    if (coupon.minOrderAmount !== null && orderAmount < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Minimum order amount of ${formatCurrency(coupon.minOrderAmount)} required for this coupon.`,
        },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount !== null && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(orderAmount, coupon.discountValue);
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        minOrderAmount: coupon.minOrderAmount,
        discountAmount: Math.max(0, discountAmount),
      },
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
