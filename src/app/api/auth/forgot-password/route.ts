import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/resend";
import { checkRateLimit } from "@/lib/rate-limit";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "forgot-ip";
    const rateCheck = checkRateLimit(`forgot:${ip}`, 3, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many reset requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return success even if user not found to prevent user enumeration
      return NextResponse.json({
        message: "If an account exists, password reset instructions have been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

    await prisma.verificationToken.upsert({
      where: { identifier_token: { identifier: email, token: resetToken } },
      update: { expires },
      create: {
        identifier: email,
        token: resetToken,
        expires,
      },
    });

    const emailResult = await sendPasswordResetEmail({
      to: email,
      token: resetToken,
    });

    if (!emailResult.success) {
      const errorDetail =
        emailResult.error?.message ||
        (typeof emailResult.error === "string" ? emailResult.error : "Email delivery failed");
      return NextResponse.json(
        { error: `Failed to send password reset email: ${errorDetail}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "If an account exists, password reset instructions have been sent.",
      debugToken: process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
