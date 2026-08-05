import { prisma } from "@/lib/prisma";

export async function logAdminAction({
  userId,
  action,
  entity,
  entityId,
  details,
}: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown> | string;
}) {
  try {
    const detailsStr =
      typeof details === "object" ? JSON.stringify(details) : details;

    await prisma.adminAuditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: detailsStr,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
