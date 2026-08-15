import { NextResponse } from "next/server";
import { getBankSettings } from "@/lib/bank-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getBankSettings();
    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("GET /api/bank-details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank transfer settings" },
      { status: 500 }
    );
  }
}
