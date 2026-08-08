import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
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
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      expiresAt,
      isActive,
    } = body;

    const existingCoupon = await prisma.coupon.findUnique({ where: { id } });
    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (code && code.trim()) {
      const normalizedCode = code.toUpperCase().trim();
      if (normalizedCode !== existingCoupon.code) {
        const codeConflict = await prisma.coupon.findUnique({ where: { code: normalizedCode } });
        if (codeConflict) {
          return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
        }
        updateData.code = normalizedCode;
      }
    }

    if (discountType) {
      updateData.discountType = discountType === "FIXED" ? "FIXED" : "PERCENTAGE";
    }

    if (discountValue !== undefined && discountValue !== null) {
      updateData.discountValue = parseFloat(discountValue);
    }

    if (minOrderAmount !== undefined) {
      updateData.minOrderAmount = minOrderAmount ? parseFloat(minOrderAmount) : null;
    }

    if (maxDiscount !== undefined) {
      updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    }

    if (usageLimit !== undefined) {
      updateData.usageLimit = usageLimit ? parseInt(usageLimit, 10) : null;
    }

    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    console.error("PATCH /api/admin/coupons/[id] error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/coupons/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
