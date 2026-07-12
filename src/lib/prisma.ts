import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const databaseUrl = process.env.DATABASE_URL ?? (process.env.VERCEL ? "file:/tmp/alumnow.db" : "file:./prisma/dev.db");

function sqlitePathFromUrl(url: string) {
  if (!url.startsWith("file:")) return null;
  const filePath = url.slice("file:".length);
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

function bootstrapSqliteSchema(url: string) {
  const dbPath = sqlitePathFromUrl(url);
  if (!dbPath) return;

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  try {
    const hasUserTable = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'User'").get();
    if (hasUserTable) return;

    const migrationPath = path.join(process.cwd(), "prisma", "migrations", "0001_foundation", "migration.sql");
    const migration = fs.readFileSync(migrationPath, "utf8");
    db.exec(migration);
  } finally {
    db.close();
  }
}

function createPrismaClient() {
  bootstrapSqliteSchema(databaseUrl);
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
