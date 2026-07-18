import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const configuredDatabaseUrl = process.env.DATABASE_URL;
const databaseUrl = process.env.VERCEL && (!configuredDatabaseUrl || configuredDatabaseUrl.startsWith("file:"))
  ? "file:/tmp/alumnow.db"
  : configuredDatabaseUrl ?? "file:./prisma/dev.db";

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
      seedPlatformSettings(db);
      seedDemoAlumni(db);
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

function seedPlatformSettings(db: Database.Database) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO "PlatformSetting" ("key", "value", "updatedAt")
    VALUES ('upi_id', 'alumnow@upi', ?)
  `).run(now);
}

function seedDemoAlumni(db: Database.Database) {
  const alumniCount = db.prepare('SELECT COUNT(*) as count FROM "AlumniProfile"').get() as { count: number };
  if (alumniCount.count >= 100) return;

  const now = new Date().toISOString();
  const userId = "demo_alumni_aanya_user";
  const alumniId = "cmrhkuiqs00muoauf2f4v84rx";

  db.prepare(`
    INSERT OR IGNORE INTO "User" ("id", "role", "email", "createdAt", "updatedAt", "emailVerifiedAt")
    VALUES (?, 'alumnus', 'aanya.das@alumnow.com', ?, ?, ?)
  `).run(userId, now, now, now);

  db.prepare(`
    INSERT OR IGNORE INTO "AlumniProfile" (
      "id", "userId", "fullName", "profilePhotoUrl", "universityName", "course", "country",
      "graduationYearJbcn", "currentStudyLevel", "qsRankingTier", "bio", "languages",
      "verificationStatus", "avgResponseTimeHours", "isVerifiedJbcnAlumnus", "isActive",
      "ratingAvg", "ratingCount", "createdAt", "updatedAt"
    )
    VALUES (?, ?, 'Aanya Das', NULL, 'Columbia University', 'B.E. Civil Engineering', 'Sweden',
      2022, 'undergraduate', 'top50', 'JBCN alum helping students choose courses, applications, and student-life tradeoffs.',
      ?, 'approved', 2, true, true, 4.8, 18, ?, ?)
  `).run(alumniId, userId, JSON.stringify(["English", "Hindi"]), now, now);

  const insertOffering = db.prepare(`
    INSERT OR IGNORE INTO "SessionTypeOffering" ("id", "alumniId", "type", "pricePaise", "maxParticipants", "descriptionOneLiner")
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  [
    ["demo_call_30_aanya", "call_30", 25791, 1, "In-depth conversation about your future"],
    ["demo_call_45_aanya", "call_45", 43693, 1, "In-depth conversation about your future"],
    ["demo_call_60_aanya", "call_60", 62939, 1, "In-depth conversation about your future"],
    ["demo_group_40_aanya", "group_40", 111357, 6, "Deep dive - comprehensive guidance"],
  ].forEach(([id, type, pricePaise, maxParticipants, description]) => {
    insertOffering.run(id, alumniId, type, pricePaise, maxParticipants, description);
  });

  const insertAvailability = db.prepare(`
    INSERT OR IGNORE INTO "AlumniAvailability" ("id", "alumniId", "dayOfWeek", "startTime", "endTime", "isRecurring")
    VALUES (?, ?, ?, ?, ?, true)
  `);
  [
    [0, "13:00", "14:00"], [0, "14:00", "15:00"], [0, "15:00", "16:00"], [0, "16:00", "17:00"],
    [1, "08:00", "09:00"], [1, "09:00", "10:00"], [1, "10:00", "11:00"],
    [2, "13:00", "14:00"], [2, "14:00", "15:00"], [2, "15:00", "16:00"],
    [3, "08:00", "09:00"], [3, "09:00", "10:00"], [3, "10:00", "11:00"],
  ].forEach(([day, start, end], index) => {
    insertAvailability.run(`demo_aanya_availability_${index}`, alumniId, day, start, end);
  });

  const firstNames = ["Priya", "Arjun", "Ishita", "Vikram", "Ananya", "Rohit", "Sneha", "Karan", "Divya", "Ravi", "Maya", "Aditya", "Zara", "Neha", "Amit", "Sarah", "Kabir", "Tara", "Rohan", "Kavya"];
  const lastNames = ["Sharma", "Mehta", "Reddy", "Singh", "Gupta", "Joshi", "Kapoor", "Verma", "Nair", "Deshmukh", "Patel", "Khan", "Rao", "Fernandes", "Iyer", "Shah", "Bose", "Choudhary", "D'Souza", "Jain"];
  const universities = ["UC Berkeley", "Stanford University", "University of Oxford", "University of Cambridge", "NUS Singapore", "University of Toronto", "Imperial College London", "UCL London", "University of Melbourne", "NYU Stern", "Cornell University", "ETH Zurich", "University of Hong Kong", "University of Michigan", "UCLA", "Georgia Tech", "University of Edinburgh", "King's College London", "LSE", "Columbia University"];
  const courses = ["B.Sc. Computer Science", "B.A. Economics", "B.A. Psychology", "B.Tech AI", "B.B.A.", "B.Sc. Data Science", "B.A. Political Science", "B.Des. Product Design", "B.Sc. Finance", "B.E. Civil Engineering"];
  const countries = ["United States", "United Kingdom", "Singapore", "Canada", "Australia", "Germany", "Switzerland", "Hong Kong", "Netherlands", "France", "India", "Sweden"];
  const qsTiers = ["top10", "top20", "top50", "top100", "top200", "unranked"];
  const insertDemoUser = db.prepare(`
    INSERT OR IGNORE INTO "User" ("id", "role", "email", "createdAt", "updatedAt", "emailVerifiedAt")
    VALUES (?, 'alumnus', ?, ?, ?, ?)
  `);
  const insertProfile = db.prepare(`
    INSERT OR IGNORE INTO "AlumniProfile" (
      "id", "userId", "fullName", "profilePhotoUrl", "universityName", "course", "country",
      "graduationYearJbcn", "currentStudyLevel", "qsRankingTier", "bio", "languages",
      "verificationStatus", "avgResponseTimeHours", "isVerifiedJbcnAlumnus", "isActive",
      "ratingAvg", "ratingCount", "createdAt", "updatedAt"
    )
    VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, true, true, ?, ?, ?, ?)
  `);

  for (let i = 1; i < 100; i++) {
    const demoAlumniId = `demo_alumni_${String(i + 1).padStart(3, "0")}`;
    const demoUserId = `demo_alumni_user_${String(i + 1).padStart(3, "0")}`;
    const fullName = `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`;
    const university = universities[i % universities.length]!;
    const course = courses[i % courses.length]!;
    const country = countries[i % countries.length]!;
    const qsTier = qsTiers[i % qsTiers.length]!;
    const gradYear = 2015 + (i % 12);
    const rating = Number((3.7 + (i % 13) * 0.1).toFixed(1));

    insertDemoUser.run(demoUserId, `alumni${i + 1}@alumnow.com`, now, now, now);
    insertProfile.run(
      demoAlumniId,
      demoUserId,
      fullName,
      university,
      course,
      country,
      gradYear,
      i % 2 === 0 ? "undergraduate" : "postgraduate",
      qsTier,
      `JBCN alum from ${university} helping students choose courses, applications, and student-life tradeoffs.`,
      JSON.stringify(["English", "Hindi"]),
      [1, 2, 3, 4, 6, 8, 12][i % 7],
      rating,
      8 + (i % 60),
      now,
      now,
    );

    [
      ["call_30", 25000 + i * 137, 1, "In-depth conversation about your future"],
      ["call_45", 42000 + i * 173, 1, "Application strategy and profile review"],
      ["call_60", 60000 + i * 211, 1, "Deep dive on university and course choices"],
      ["group_40", 95000 + i * 397, 6, "Group guidance with JBCN peers"],
    ].forEach(([type, pricePaise, maxParticipants, description]) => {
      insertOffering.run(`demo_${type}_${i + 1}`, demoAlumniId, type, pricePaise, maxParticipants, description);
    });

    const baseDay = i % 7;
    [
      [baseDay, "08:00", "09:00"],
      [baseDay, "09:00", "10:00"],
      [(baseDay + 2) % 7, "13:00", "14:00"],
      [(baseDay + 2) % 7, "15:00", "16:00"],
    ].forEach(([day, start, end], slotIndex) => {
      insertAvailability.run(`demo_availability_${i + 1}_${slotIndex}`, demoAlumniId, day, start, end);
    });
  }
}

function createPrismaClient() {
  bootstrapSqliteSchema(databaseUrl);
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
