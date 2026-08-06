import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";

async function verifyEmailToken(token: string, email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const existingToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: normalizedEmail,
      token: hashedToken,
    },
  });

  if (!existingToken) {
    // Check if the user account is already verified
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { emailVerified: true },
    });

    if (user && user.emailVerified !== null) {
      return {
        success: true,
        message: "Email already verified.",
      };
    }

    return {
      success: false,
      error: "Invalid or already used verification link.",
      code: "INVALID_TOKEN",
      status: 400,
    };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    await prisma.verificationToken.delete({
      where: { token: hashedToken },
    });
    return {
      success: false,
      error: "Verification link has expired. Please request a new link.",
      code: "TOKEN_EXPIRED",
      status: 400,
    };
  }

  // Mark account as verified
  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { emailVerified: new Date() },
  });

  // Delete used token to prevent reuse
  await prisma.verificationToken.delete({
    where: { token: hashedToken },
  });

  return {
    success: true,
    message: "Email verified successfully.",
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { error: "Missing token or email parameter", code: "INVALID_PARAMS" },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "verify-ip";
    const rateCheck = checkRateLimit(`verify:${ip}`, 10, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many verification requests. Please try again later." },
        { status: 429 }
      );
    }

    const result = await verifyEmailToken(token, email);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status }
      );
    }

    return NextResponse.json({ message: result.message }, { status: 200 });
  } catch (error) {
    console.error("Verify Email Error:", error);
    return NextResponse.json(
      { error: "An error occurred while verifying email." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, email } = body;

    if (!token || !email) {
      return NextResponse.json(
        { error: "Missing token or email in request body", code: "INVALID_PARAMS" },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "verify-ip";
    const rateCheck = checkRateLimit(`verify:${ip}`, 10, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many verification requests. Please try again later." },
        { status: 429 }
      );
    }

    const result = await verifyEmailToken(token, email);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status }
      );
    }

    return NextResponse.json({ message: result.message }, { status: 200 });
  } catch (error) {
    console.error("Verify Email Error:", error);
    return NextResponse.json(
      { error: "An error occurred while verifying email." },
      { status: 500 }
    );
  }
}
