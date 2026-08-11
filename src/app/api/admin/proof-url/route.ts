/**
 * GET /api/admin/proof-url?path=<storagePath>
 *
 * Admin-only endpoint. Generates a short-lived signed URL for a file stored
 * in the private Supabase Storage `payment-proofs` bucket.
 *
 * Requires an authenticated admin session.
 * Never exposes the service-role key to the client.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

const SIGNED_URL_EXPIRES_IN = 60 * 60; // 1 hour in seconds

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins may generate signed URLs for private payment proofs
    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get("path");

    if (!storagePath || storagePath.trim() === "") {
      return NextResponse.json(
        { error: "Missing required query parameter: path" },
        { status: 400 }
      );
    }

    const adminClient = getAdminSupabaseClient();

    const { data, error } = await adminClient.storage
      .from("payment-proofs")
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_IN);

    if (error || !data?.signedUrl) {
      console.error("Failed to create signed URL:", error);
      return NextResponse.json(
        { error: "Could not generate proof URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error) {
    console.error("GET /api/admin/proof-url error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
