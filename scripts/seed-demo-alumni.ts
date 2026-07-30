// One-off seed script for a demo alumni account with a properly-framed
// profile photo, so the network has a known-good reference for verifying
// the photo-crop fix (src/lib/image.ts + AlumniCard/AlumniDetailPanel).
//
// Mirrors the existing admin "Create Alumni" flow in
// src/actions/admin.actions.ts (Supabase Auth signUp + Prisma create) —
// no new infra, no Prisma seed runner added. Run with:
//   npx tsx scripts/seed-demo-alumni.ts
// Requires the same env vars the app already uses in production
// (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL).
// Not run against production from this sandbox — no live DB credentials
// were available here (.env.local points at a placeholder Supabase project).

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../generated/prisma";

const DEMO_EMAIL = "demo.alumna@alumnow.app";
const DEMO_NAME = "Ananya Rao";
// A square, well-centered headshot (face framed centrally, not cut off at
// top) from picsum.photos — the same free image service already used
// elsewhere in this codebase (see dashboard/browse pages) as placeholder
// alumni photos, so no new dependency is introduced.
const DEMO_PHOTO_URL = "https://picsum.photos/id/1027/512/512";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const prisma = new PrismaClient();

  const tempPassword = randomBytes(16).toString("hex");
  const { data: authData, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: "alumnus", full_name: DEMO_NAME },
  });
  if (error || !authData.user) {
    throw new Error(`Failed to create demo auth user: ${error?.message}`);
  }

  await prisma.user.create({
    data: {
      id: authData.user.id,
      email: DEMO_EMAIL,
      role: "alumnus",
      alumniProfile: {
        create: {
          fullName: DEMO_NAME,
          profilePhotoUrl: DEMO_PHOTO_URL,
          bio: "Demo profile added to verify the profile-photo crop fix — face should stay fully in frame on the network card and detail view.",
          universityName: "University College London",
          course: "Economics",
          country: "United Kingdom",
          graduationYearJbcn: 2021,
          verificationStatus: "approved",
          isVerifiedJbcnAlumnus: true,
          isActive: true,
        },
      },
    },
  });

  console.log(`Seeded demo alumni: ${DEMO_EMAIL}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
