import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existingBanner = await (prisma as any).banner.findUnique({ where: { id } });
    if (!existingBanner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (subtitle !== undefined) updateData.subtitle = subtitle ? subtitle.trim() : null;
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl.trim();
    if (mobileImageUrl !== undefined) updateData.mobileImageUrl = mobileImageUrl ? mobileImageUrl.trim() : null;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl ? linkUrl.trim() : null;
    if (ctaText !== undefined) updateData.ctaText = ctaText ? ctaText.trim() : null;
    if (position !== undefined) updateData.position = parseInt(position, 10);
    if (type !== undefined) updateData.type = type;
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    const updatedBanner = await (prisma as any).banner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedBanner);
  } catch (error) {
    console.error("PATCH /api/admin/banners/[id] error:", error);
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await (prisma as any).banner.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/banners/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}
