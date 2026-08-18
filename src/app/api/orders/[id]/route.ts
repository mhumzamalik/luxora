import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const isAdmin =
      session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    // H-3: push ownership into the DB query so unauthorized users receive a 404
    // (no information leakage about whether an order exists at all).
    const order = await prisma.order.findFirst({
      where: {
        // Match by either internal ID or human-readable order number
        OR: [{ id }, { orderNumber: id }],
        // Admins see all orders; regular users only see their own
        ...(isAdmin
          ? {}
          : {
              OR: [
                { userId: userId ?? "__no_match__" },
                { guestEmail: userEmail ?? "__no_match__" },
              ],
            }),
      },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

