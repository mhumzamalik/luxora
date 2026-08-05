import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { resend } from "@/lib/resend";
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

    const resetLink = `${process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    if (process.env.RESEND_API_KEY) {
      await resend?.emails.send({
        from: process.env.EMAIL_FROM || "LUXORA <noreply@luxora.com>",
        to: email,
        subject: "Reset your LUXORA Password",
        html: `
          <div style="font-family: serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #111;">LUXORA Password Reset</h2>
            <p>You requested a password reset for your account.</p>
            <p><a href="${resetLink}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a></p>
            <p style="color: #666; font-size: 12px;">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
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
