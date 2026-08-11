import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const banners = await prisma.banner.findMany({
      orderBy: [
        { position: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error("GET /api/admin/banners error:", error);
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      subtitle,
      description,
      imageUrl,
      mobileImageUrl,
      linkUrl,
      ctaText,
      position,
      type,
      isActive,
      startDate,
      endDate,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Banner title is required" }, { status: 400 });
    }

    if (!imageUrl || !imageUrl.trim()) {
      return NextResponse.json({ error: "Banner image is required" }, { status: 400 });
    }

    const banner = await prisma.banner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : null,
        description: description ? description.trim() : null,
        imageUrl: imageUrl.trim(),
        mobileImageUrl: mobileImageUrl ? mobileImageUrl.trim() : null,
        linkUrl: linkUrl ? linkUrl.trim() : null,
        ctaText: ctaText ? ctaText.trim() : null,
        position: position !== undefined && position !== null ? parseInt(position, 10) : 0,
        type: type || "HERO",
        isActive: typeof isActive === "boolean" ? isActive : true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/banners error:", error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}
