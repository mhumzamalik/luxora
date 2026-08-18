import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Returns the optimal connection string for Prisma runtime.
 * Prefers DIRECT_URL (port 5432 session pooler / direct connection) when available
 * with explicit client-side pool limits to eliminate transaction-mode PgBouncer
 * DEALLOCATE ALL overhead and enable persistent connection reuse.
 * Falls back safely to DATABASE_URL if DIRECT_URL is not set.
 */
function getOptimalDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  // When connecting via port 5432, tune connection pool parameters if not already present
  if (rawUrl.includes(":5432") && !rawUrl.includes("connection_limit=")) {
    const separator = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${separator}connection_limit=10&pool_timeout=20&connect_timeout=15`;
  }

  return rawUrl;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getOptimalDatabaseUrl(),
    log: process.env.DEBUG_PRISMA === "true" ? ["query", "error", "warn"] : ["error", "warn"],
  });

globalForPrisma.prisma = prisma;

