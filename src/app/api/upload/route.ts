import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

// H-4: only these buckets may be written to via this endpoint
const ALLOWED_BUCKETS = new Set(["products", "payment-proofs"]);

// M-4: map validated MIME type to a safe extension (never trust the filename)
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    // H-4: validate bucket against allowlist — do NOT trust user-supplied value blindly
    const rawBucket = formData.get("bucket") as string | null;
    if (!rawBucket || !ALLOWED_BUCKETS.has(rawBucket)) {
      return NextResponse.json(
        { error: "Invalid or missing bucket. Allowed: products, payment-proofs." },
        { status: 400 }
      );
    }
    const bucket = rawBucket;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF." },
        { status: 400 }
      );
    }

    // Validate file size (10 MB max)
    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // M-4: derive extension from the validated MIME type, never from the user-supplied filename
    const fileExt = MIME_TO_EXT[file.type] ?? "bin";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    // Store under the authenticated user's folder so paths are scoped
    const storagePath = `${session.user.id}/${fileName}`;

    // Use the service-role client — bypasses Storage RLS on the private bucket
    const adminClient = getAdminSupabaseClient();

    const { data, error } = await adminClient.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return NextResponse.json(
        { error: `Storage upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Return the storage path (not a public URL — the bucket is private).
    // Signed URLs for display are generated server-side on demand via /api/admin/proof-url.
    return NextResponse.json({ path: data.path });
  } catch (error) {
    console.error("Upload handler error:", error);
    const message =
      error instanceof Error ? error.message : "File upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
