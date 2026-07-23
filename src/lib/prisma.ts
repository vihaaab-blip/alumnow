import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const url = process.env.DATABASE_URL || "postgresql://localhost:5432/postgres";
const poolConfig = { connectionString: url, ssl: { rejectUnauthorized: false } };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg(poolConfig) });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
