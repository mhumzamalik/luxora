import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

// ---------------------------------------------------------------------------
// Status-transition rules – prevents illegal moves such as DELIVERED→CANCELLED
// ---------------------------------------------------------------------------
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:    ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED",    "CANCELLED"],
  SHIPPED:    ["DELIVERED"],
  DELIVERED:  [],   // terminal
  CANCELLED:  [],   // terminal
};

// ---------------------------------------------------------------------------
// GET  /api/admin/orders/[id]
// Returns order with full product images + variant data for the detail view.
// All numeric (Float) fields are explicitly cast to Number to prevent NaN.
// ---------------------------------------------------------------------------
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        shippingAddress: true,
        items: {
          include: {
            product: {
              include: {
                // Fetch at most the primary image to avoid over-fetching.
                images: {
                  orderBy: [{ isPrimary: "desc" }, { id: "asc" }],
                  take: 1,
                },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Explicit Number() cast: Prisma maps PostgreSQL NUMERIC/FLOAT8 to JS
    // number, but edge cases (Decimal adapter, BigInt coercion) can produce
    // strings that formatCurrency() then renders as NaN.
    const safeOrder = {
      ...order,
      subtotal:       Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingFee:    Number(order.shippingFee),
      total:          Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        unitPrice:  Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        quantity:   Number(item.quantity),
      })),
    };

    return NextResponse.json(safeOrder);
  } catch (error) {
    console.error("GET /api/admin/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH  /api/admin/orders/[id]
// Body: { status?: OrderStatus, paymentStatus?: PaymentStatus }
// Validates transitions; blocks unauthorised callers.
// ---------------------------------------------------------------------------
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json() as { status?: string; paymentStatus?: string };
    const { status, paymentStatus } = body;

    // Load current order to validate the requested transition.
    const current = await prisma.order.findUnique({
      where: { id },
      select: { status: true, paymentStatus: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      paidAt?: Date;
      shippedAt?: Date;
    } = {};

    if (status) {
      const targetStatus = status as OrderStatus;
      const allowed = ALLOWED_TRANSITIONS[current.status] ?? [];

      if (!allowed.includes(targetStatus)) {
        return NextResponse.json(
          {
            error: `Cannot move order from ${current.status} → ${targetStatus}. Allowed: [${allowed.join(", ") || "none"}].`,
          },
          { status: 422 }
        );
      }

      updateData.status = targetStatus;
      if (targetStatus === "SHIPPED") updateData.shippedAt = new Date();
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus as PaymentStatus;
      if (paymentStatus === "PAID") updateData.paidAt = new Date();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    await logAdminAction({
      userId: session.user.id,
      action: "UPDATE_ORDER",
      entity: "Order",
      entityId: id,
      details: updateData as Record<string, unknown>,
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
