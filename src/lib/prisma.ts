import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const url = process.env.DATABASE_URL;
const poolConfig = url
  ? { connectionString: url, ssl: { rejectUnauthorized: false } }
  : undefined;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: poolConfig ? new PrismaPg(poolConfig) : undefined });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
