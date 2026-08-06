import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { resend } from "@/lib/resend";
import { formatCurrency } from "@/lib/currency";

const orderItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

const addressSchema = z.object({
  fullName: z.string().min(2),
  street: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(2),
  country: z.string().min(2),
  phone: z.string().min(5),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Cart cannot be empty"),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["BANK_TRANSFER", "CREDIT_CARD", "PAYPAL"]),
  paymentProofUrl: z.string().optional(),
  couponCode: z.string().optional(),
  guestEmail: z.string().email().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();

    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      items,
      shippingAddress,
      paymentMethod,
      paymentProofUrl,
      couponCode,
      guestEmail,
      notes,
    } = parsed.data;

    const userId = session?.user?.id || null;
    const email = session?.user?.email || guestEmail;

    if (!userId && !guestEmail) {
      return NextResponse.json(
        { error: "Guest email is required for unauthenticated checkout" },
        { status: 400 }
      );
    }

    // Execute order creation transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Calculate pricing and verify stock
      let subtotal = 0;
      const verifiedItems: {
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product ID ${item.productId} not found`);
        }

        let variantStock = 999;
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          if (!variant) throw new Error(`Product variant not found`);
          variantStock = variant.stock;
          if (variantStock < item.quantity) {
            throw new Error(`Insufficient stock for product ${product.name}`);
          }
          // Decrement stock
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        const lineTotal = product.price * item.quantity;
        subtotal += lineTotal;

        verifiedItems.push({
          productId: product.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: lineTotal,
        });
      }

      // 2. Validate & Calculate Coupon Discount
      let discountAmount = 0;
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode.toUpperCase().trim() },
        });

        if (
          coupon &&
          coupon.isActive &&
          (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
          (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount)
        ) {
          if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = Math.min(subtotal, coupon.discountValue);
          }

          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      // 3. Shipping fee calculation (Free over $150)
      const shippingFee = subtotal >= 150 ? 0 : 15;
      const total = Math.max(0, subtotal - discountAmount + shippingFee);

      const addressData: Prisma.AddressUncheckedCreateInput = {
        fullName: shippingAddress.fullName,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone || "",
        userId: userId || "",
      };

      const address = await tx.address.create({
        data: addressData,
      });

      // 5. Generate Order Number & Bank Reference
      const timestamp = Date.now().toString().slice(-6);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `LX-${new Date().getFullYear()}-${timestamp}`;
      const bankReference = `REF-${timestamp}${randomSuffix}`;

      const paymentStatus = paymentProofUrl ? "PROOF_SUBMITTED" : "PENDING";

      // 6. Create Order record
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          guestEmail,
          shippingAddressId: address.id,
          paymentMethod,
          paymentStatus,
          paymentProofUrl,
          subtotal,
          discountAmount,
          shippingFee,
          total,
          couponCode,
          bankReference,
          notes,
          items: {
            create: verifiedItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
        },
      });

      return createdOrder;
    });

    // Send confirmation email asynchronously via Resend
    if (email && process.env.RESEND_API_KEY) {
      try {
        await resend?.emails.send({
          from: process.env.EMAIL_FROM || "LUXORA <orders@luxora.com>",
          to: email,
          subject: `Order Confirmation #${order.orderNumber} - LUXORA`,
          html: `
            <div style="font-family: serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 16px;">
              <h1 style="color: #111; text-align: center;">LUXORA</h1>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <h2 style="color: #222;">Thank you for your order!</h2>
              <p>Order Number: <strong>${order.orderNumber}</strong></p>
              <p>Bank Reference: <strong>${order.bankReference}</strong></p>
              <p>Total Amount: <strong>${formatCurrency(order.total)}</strong></p>
              <h3 style="margin-top: 24px;">Items Ordered:</h3>
              <ul>
                ${order.items
                  .map(
                    (i) => `<li>${i.product.name} x ${i.quantity} - ${formatCurrency(i.totalPrice)}</li>`
                  )
                  .join("")}
              </ul>
              <p style="margin-top: 24px; color: #666; font-size: 13px;">If you paid via Direct Bank Transfer, please retain reference <strong>${order.bankReference}</strong> for verification.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Failed to send order email:", emailErr);
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/orders error:", error);
    const message = error instanceof Error ? error.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
