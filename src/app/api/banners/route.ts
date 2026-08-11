import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // optional "HERO" or "PROMO" filter

    const now = new Date();

    const whereClause: any = {
      isActive: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    };

    if (type) {
      whereClause.type = type;
    }

    const banners = await prisma.banner.findMany({
      where: whereClause,
      orderBy: [
        { position: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error("GET /api/banners error:", error);
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}
