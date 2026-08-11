import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, PaymentMethod } from "@prisma/client";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { sendOrderConfirmationEmail } from "@/lib/resend";
import { formatCurrency } from "@/lib/currency";
import { resolveProductPricing } from "@/lib/pricing";

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

const createOrderSchema = z
  .object({
    items: z.array(orderItemSchema).min(1, "Cart cannot be empty"),
    shippingAddress: addressSchema,
    paymentMethod: z.enum(["BANK_TRANSFER", "CREDIT_CARD", "PAYPAL", "COD"]),
    // Storage path returned by /api/upload (e.g. "userId/filename.jpg").
    // Not validated as a URL because the private bucket path is not a public URL.
    paymentProofUrl: z.string().min(1).optional(),
    couponCode: z.string().optional(),
    guestEmail: z.string().email().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Server-side guard: BANK_TRANSFER MUST have a payment proof URL
      if (data.paymentMethod === "BANK_TRANSFER" && !data.paymentProofUrl) {
        return false;
      }
      return true;
    },
    {
      message: "Payment proof is required for bank transfer orders.",
      path: ["paymentProofUrl"],
    }
  );

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

    const userId = session?.user?.id || undefined;
    const email = session?.user?.email || guestEmail;

    if (!userId && !guestEmail) {
      return NextResponse.json(
        { error: "Guest email is required for unauthenticated checkout" },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // STAGE 1: PRE-TRANSACTION (READ & VALIDATE OUTSIDE TRANSACTION)
    // -------------------------------------------------------------
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const explicitVariantIds = Array.from(
      new Set(items.map((i) => i.variantId).filter((v): v is string => Boolean(v)))
    );

    const now = new Date();

    // Batch read products and variants in parallel outside the transaction
    const [fetchedProducts, fetchedExplicitVariants, defaultVariants] =
      await Promise.all([
        prisma.product.findMany({
          where: { id: { in: productIds } },
          include: {
            flashSaleItems: {
              include: {
                flashSale: true,
              },
            },
          },
        }),
        explicitVariantIds.length > 0
          ? prisma.productVariant.findMany({
            where: { id: { in: explicitVariantIds } },
          })
          : Promise.resolve([]),
        prisma.productVariant.findMany({
          where: { productId: { in: productIds } },
        }),
      ]);

    const productMap = new Map(fetchedProducts.map((p) => [p.id, resolveProductPricing(p, now)]));
    const variantMap = new Map(fetchedExplicitVariants.map((v) => [v.id, v]));

    let subtotal = 0;
    const verifiedItems: {
      productId: string;
      variantId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found (ID: ${item.productId})` },
          { status: 400 }
        );
      }

      let variant = item.variantId ? variantMap.get(item.variantId) : undefined;
      if (variant && variant.productId !== item.productId) {
        return NextResponse.json(
          { error: `Variant ID ${item.variantId} does not belong to product "${product.name}"` },
          { status: 400 }
        );
      }

      if (!variant) {
        variant = defaultVariants.find((v) => v.productId === item.productId);
      }

      if (!variant) {
        return NextResponse.json(
          { error: `No available inventory record for product "${product.name}"` },
          { status: 400 }
        );
      }

      const availableStock = Math.max(0, variant.stock - (variant.reserved || 0));
      if (availableStock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Only ${availableStock} item(s) available, but ${item.quantity} requested.`,
          },
          { status: 400 }
        );
      }

      const effectiveUnitPrice = product.price;
      const lineTotal = effectiveUnitPrice * item.quantity;
      subtotal += lineTotal;

      verifiedItems.push({
        productId: product.id,
        variantId: variant.id,
        quantity: item.quantity,
        unitPrice: effectiveUnitPrice,
        totalPrice: lineTotal,
      });
    }

    // Validate Coupon Discount (outside transaction)
    let discountAmount = 0;
    let validCouponId: string | null = null;
    let validCouponCode: string | null = null;

    if (couponCode) {
      const normalizedCode = couponCode.toUpperCase().trim();
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
      });

      if (!coupon) {
        return NextResponse.json({ error: "Coupon not found." }, { status: 400 });
      }

      if (!coupon.isActive) {
        return NextResponse.json({ error: "This coupon is currently inactive." }, { status: 400 });
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json({ error: "This coupon code has expired." }, { status: 400 });
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 400 });
      }

      if (coupon.minOrderAmount !== null && subtotal < coupon.minOrderAmount) {
        return NextResponse.json(
          { error: `Minimum order amount of Rs. ${coupon.minOrderAmount} required for this coupon.` },
          { status: 400 }
        );
      }

      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount !== null && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = Math.min(subtotal, coupon.discountValue);
      }

      discountAmount = Math.max(0, discountAmount);
      validCouponId = coupon.id;
      validCouponCode = coupon.code;
    }

    const shippingFee = subtotal >= 150 ? 0 : 15;
    const total = Math.max(0, subtotal - discountAmount + shippingFee);

    // -------------------------------------------------------------
    // STAGE 2: FAST TRANSACTION (ATOMIC DECREMENTS & RECORD CREATION)
    // -------------------------------------------------------------
    const order = await prisma.$transaction(
      async (tx) => {
        // 1. Atomic Stock Decrement with stock >= quantity guard
        for (const item of verifiedItems) {
          const updatedCount = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          if (updatedCount.count === 0) {
            throw new Error(
              `Stock changed during checkout for product. Please try placing your order again.`
            );
          }
        }

        // 2. Increment coupon used count if valid
        if (validCouponId) {
          await tx.coupon.update({
            where: { id: validCouponId },
            data: { usedCount: { increment: 1 } },
          });
        }

        // 3. Create Shipping Address
        const address = await tx.address.create({
          data: {
            fullName: shippingAddress.fullName,
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone || "",
            userId: userId || undefined,
          },
        });

        // 4. Generate Order Number & Bank Reference
        const timestamp = Date.now().toString().slice(-6);
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `LX-${new Date().getFullYear()}-${timestamp}`;
        const bankReference = `REF-${timestamp}${randomSuffix}`;

        let paymentStatus: "PENDING" | "PROOF_SUBMITTED" | "PAID" | "FAILED" | "REFUNDED";
        if (paymentMethod === "COD") {
          paymentStatus = "PENDING";
        } else if (paymentMethod === "BANK_TRANSFER" && paymentProofUrl) {
          paymentStatus = "PROOF_SUBMITTED";
        } else {
          paymentStatus = "PENDING";
        }

        // 5. Create Order record with OrderItems
        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            userId,
            guestEmail: userId ? undefined : guestEmail,
            shippingAddressId: address.id,
            paymentMethod: paymentMethod as PaymentMethod,
            paymentStatus,
            paymentProofUrl,
            subtotal,
            discountAmount,
            shippingFee,
            total,
            couponCode: validCouponCode || undefined,
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
      },
      {
        timeout: 15000, // 15 seconds production safety timeout
        maxWait: 5000,
      }
    );

    // -------------------------------------------------------------
    // STAGE 3: ASYNCHRONOUS POST-PROCESSING (EMAIL CONFIRMATION)
    // -------------------------------------------------------------
    if (email) {
      sendOrderConfirmationEmail({
        to: email,
        orderNumber: order.orderNumber,
        bankReference: order.bankReference,
        totalAmount: order.total,
        items: order.items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.totalPrice,
        })),
      }).catch((emailErr) => {
        console.error("Failed to send order email:", emailErr);
      });
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
