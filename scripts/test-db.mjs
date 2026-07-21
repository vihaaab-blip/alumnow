import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

try {
  await prisma.$connect();
  console.log("Connected successfully");
  const count = await prisma.user.count();
  console.log("User count:", count);
  await prisma.$disconnect();
} catch (e) {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
}
