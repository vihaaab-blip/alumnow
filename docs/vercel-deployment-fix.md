# Vercel Deployment Fix Guide

## Root Cause

The 3 deployments failed because **environment variables were missing on Vercel**.

Your friend added `@prisma/adapter-pg` and `@supabase/ssr` packages to `package.json` and rewrote auth to use Supabase — but the required env vars were only set in his local `.env` file, never on Vercel.

## Required Environment Variables

Add these to **Vercel → alumnow → Settings → Environment Variables** (set to Production):

| Variable | Value | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@REF.supabase.co:5432/postgres` | Prisma PostgreSQL connection |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://REF.supabase.co` | Supabase project URL (from Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOi...` (anon key) | Supabase anonymous public key (not service_role key) |

## How to Add

1. Go to https://vercel.com/aditya-balajis-projects/alumnow
2. Click **Settings** → **Environment Variables**
3. Add each variable (scope: **Production**)
4. Click **Save**
5. Go to **Deployments** → click **Redeploy** on the latest failed deployment

## If Build Still Fails

Check Vercel build logs:
1. Go to **Deployments** → click the failed deployment
2. Click **View Function Logs** or scroll to the build output section
3. Share the error with your dev partner

## Files Changed in This Migration

- `prisma/schema.prisma` — SQLite → PostgreSQL
- `src/lib/prisma.ts` — replaced SQLite bootstrapping with `@prisma/adapter-pg`
- `src/lib/supabase-auth.ts` — new server session handler
- `src/hooks/useSession.ts` — new client auth (replaces next-auth/react)
- `src/components/SupabaseProvider.tsx` — new auth provider context
- Various actions/pages — imports updated from next-auth to Supabase
- `package.json` — added `@prisma/adapter-pg`, `@supabase/ssr`
