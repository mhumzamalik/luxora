import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  // Automatically disabled in production environment
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const testError = new Error("Sentry integration test");

  // Capture explicitly with Sentry context
  Sentry.captureException(testError, {
    tags: {
      operation: "sentry_test_verification",
      environment: process.env.NODE_ENV || "development",
    },
    extra: {
      path: "/api/test/sentry",
      method: "GET",
      timestamp: new Date().toISOString(),
    },
  });

  // Also throw exception so Next.js error handler captures it
  throw testError;
}
