import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const configuredDatabaseUrl = process.env.DATABASE_URL;

function isTursoUrl(url: string): boolean {
  return url.startsWith("libsql://");
}

function createPrismaClient() {
  const rawUrl = configuredDatabaseUrl ?? (process.env.VERCEL ? "file:/tmp/alumnow.db" : "file:./prisma/dev.db");

  if (isTursoUrl(rawUrl)) {
    const adapter = new PrismaLibSql({ url: rawUrl });
    return new PrismaClient({ adapter });
  }

  return createLocalSqliteClient(rawUrl);
}

function createLocalSqliteClient(url: string) {
  bootstrapSqliteSchema(url);
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

function sqlitePathFromUrl(url: string) {
  if (!url.startsWith("file:")) return null;
  const filePath = url.slice("file:".length);
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

function bootstrapSqliteSchema(url: string) {
  const dbPath = sqlitePathFromUrl(url);
  if (!dbPath) return;

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    try {
      const hasUserTable = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'User'").get();
      if (!hasUserTable) {
        const migrationPath = path.join(process.cwd(), "prisma", "migrations", "0001_foundation", "migration.sql");
        const migration = fs.readFileSync(migrationPath, "utf8");
        try {
          db.exec(migration);
        } catch (e) {
          if (!(e instanceof Error && e.message.includes("already exists"))) throw e;
        }
      }
      ensureSqliteSchemaCompatibility(db);
      return;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("SQLITE_BUSY") || msg.includes("locked")) {
        db.close();
        const delay = 50 * Math.pow(2, attempt);
        const start = Date.now();
        while (Date.now() - start < delay) {}
        continue;
      }
      throw e;
    } finally {
      try { db.close(); } catch {}
    }
  }
}

function ensureSqliteSchemaCompatibility(db: Database.Database) {
  const alumniColumns = db.prepare("PRAGMA table_info('AlumniProfile')").all() as { name: string }[];
  if (!alumniColumns.some((column) => column.name === "isActive")) {
    try {
      db.exec('ALTER TABLE "AlumniProfile" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true');
    } catch (e) {
      if (!(e instanceof Error && e.message.includes("duplicate column name"))) throw e;
    }
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;