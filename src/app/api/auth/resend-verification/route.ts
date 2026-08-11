import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/resend";

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "resend-verify-ip";
    const body = await req.json().catch(() => ({}));
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate-limit resend verification email requests (3 attempts per 15 minutes)
    const rateCheck = checkRateLimit(
      `resend-verify:${ip}:${normalizedEmail}`,
      3,
      15 * 60 * 1000
    );

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many resend attempts. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Only send email if user exists and is not yet verified
    if (user && !user.emailVerified) {
      const { rawToken } = await generateVerificationToken(normalizedEmail);
      const emailResult = await sendVerificationEmail({
        to: normalizedEmail,
        token: rawToken,
      });

      if (!emailResult.success) {
        const errorDetail =
          emailResult.error?.message ||
          (typeof emailResult.error === "string" ? emailResult.error : "Email delivery failed");
        return NextResponse.json(
          { error: `Failed to send verification email: ${errorDetail}` },
          { status: 500 }
        );
      }
    }

    // Always return a generic success message to prevent email enumeration
    return NextResponse.json(
      {
        message:
          "If an unverified account exists for this email, a verification link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend Verification Error:", error);
    return NextResponse.json(
      { error: "An error occurred while resending verification email." },
      { status: 500 }
    );
  }
}
