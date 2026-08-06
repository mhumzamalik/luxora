import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function generateVerificationToken(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Delete existing verification tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedEmail },
  });

  // Create new verification token record
  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token: hashedToken,
      expires,
    },
  });

  return {
    rawToken,
    hashedToken,
    expires,
  };
}
