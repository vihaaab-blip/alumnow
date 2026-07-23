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
- Auth: Supabase Auth (email/password), NOT NextAuth. Uses `auth.users` table managed by Supabase.
- Prisma User table uses Supabase auth UUID as `User.id` (no `@default(cuid())`)
- Session: `useSession()` from `@/hooks/useSession` returns same shape as next-auth
- Server session: `getServerSession()` from `@/lib/supabase-auth` replaces `auth()` from `@/lib/auth`
- Admin role check: `session.user.role !== "admin"`
- Client-side sign-in: `signIn("credentials", { email, password })` from `@/hooks/useSession`
- Client-side sign-out: `signOut()` from `@/hooks/useSession`
- User metadata (role, full_name) stored in `auth.users.raw_user_meta_data` during signup

## Database Schema Notes
- `AlumniProfile.verificationStatus` defaults to `"pending"` (lowercase) — always use lowercase when filtering
- `isVerifiedJbcnAlumnus` column exists in the initial migration
- All IDs in Prisma are Supabase auth UUIDs (for User) or Prisma-generated cuids (for other models)
- Database: PostgreSQL via Supabase at `db.rxravqontgymnmcmiaew.supabase.co`
- Prisma manages all tables (User, StudentProfile, AlumniProfile, Booking, etc.)

## Supabase Admin API
- `src/lib/supabase-admin.ts` — uses `SUPABASE_SERVICE_ROLE_KEY` (server-only env var) to call Auth Admin API
- `confirmUserEmail(userId)` — confirms user email via `PUT /auth/v1/admin/users/{id}` with `email_confirm: true`
- Called automatically in both `signup()` and `signupAlumni()` server actions after `supabase.auth.signUp()` succeeds
- This replaces Supabase's built-in email confirmation flow (confirmations disabled via API instead of dashboard toggle)

## Common Fixes
- White-on-white text: search for `bg-primary text-white` patterns and replace
- Case-sensitive filter: ensure filter values match DB casing (lowercase)
- Admin approve error: check `guard()` auth first, then Prisma update
- `document is not defined` during build: add `typeof document === "undefined"` guards in cookie handlers
- Session persistence: Supabase `persistSession: true` is default in `createBrowserClient` — don't disable it
