// Vercel provides env vars; dotenv is only for local development.
if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  try {
    require("dotenv/config");
  } catch {
    // dotenv is optional in environments where it's not installed
  }
}

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Global cache to prevent multiple pools in serverless.
 *
 * IMPORTANT: Prisma initialization is lazy so that a missing DATABASE_URL
 * doesn't crash the serverless function during cold start/module load.
 */
const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function initPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({
      connectionString,
      max: 5, // 🔑 NEVER more than 5 on Neon
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  const adapter = new PrismaPg(globalForPrisma.pool);
  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: ["error"],
  });

  return globalForPrisma.prisma;
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = initPrismaClient() as any;
    return client[prop];
  },
});

export default prisma;
export { prisma };
