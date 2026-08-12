import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/swagger/openapi";

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
