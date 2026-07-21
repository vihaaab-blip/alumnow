# Agent Instructions

## Build Commands
- `npm run build` — Build the Next.js app
- `npm run dev` — Start dev server (port 3000)
- `npm run lint` — Run Next.js lint
- `npm run typecheck` — Check TypeScript errors
- Node.js: `C:\Users\curio\AppData\Local\Temp\node22\node-v22.16.0-win-x64\node.exe`
- npm: `C:\Users\curio\AppData\Local\Temp\node22\node-v22.16.0-win-x64\npm.cmd`
- All commands must use `.cmd` extensions on this Windows system

## Important Codebase Conventions
- `primary` Tailwind color = `#FFFFFF` (white) — never use `bg-primary text-white` (invisible on dark bg); use `bg-background text-white` or `bg-accent text-white`
- SQLite database at `prisma/dev.db`
- Auth: NextAuth v5 with JWT strategy, Credentials provider only
- Admin role check: `(session.user as any).role !== "admin"`
- Demo accounts exist in `auth.ts`: `admin@alumnow.com`, `alumni1@alumnow.com`, `student1@alumnow.com` with password `password123`

## Database Schema Notes
- `AlumniProfile.verificationStatus` defaults to `"pending"` (lowercase) — always use lowercase when filtering
- `bootstrapSqliteSchema` in `prisma.ts` auto-adds `isActive` column if missing
- `isVerifiedJbcnAlumnus` column exists in the initial migration

## Common Fixes
- White-on-white text: search for `bg-primary text-white` patterns and replace
- Case-sensitive filter: ensure filter values match DB casing (lowercase)
- Admin approve error: check `guard()` auth first, then Prisma update
