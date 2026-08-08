import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        shippingAddress: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET /api/admin/orders/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

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
    const { status, paymentStatus } = body;

    const updateData: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      paidAt?: Date;
      shippedAt?: Date;
    } = {};

    if (status) {
      updateData.status = status as OrderStatus;
      if (status === "SHIPPED") updateData.shippedAt = new Date();
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus as PaymentStatus;
      if (paymentStatus === "PAID") updateData.paidAt = new Date();
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
      details: updateData,
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id] error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
