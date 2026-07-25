"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export type ServerSession = {
  user: {
    id: string;
    email: string;
    role: string;
    name: string | null;
  };
} | null;

export async function getServerSession(): Promise<ServerSession> {
  // The middleware already verifies the Supabase session once per request and
  // forwards the result via trusted headers (stripped from any incoming
  // request first, so a client can never spoof them) - reading those avoids
  // a second network round trip to Supabase Auth on every server
  // action/route handler, which used to stack up badly since a single page
  // view fires several of these in parallel.
  const hdrs = await headers();
  const uid = hdrs.get("x-user-id");
  if (uid) {
    const rawName = hdrs.get("x-user-name");
    return {
      user: {
        id: uid,
        email: hdrs.get("x-user-email") ?? "",
        role: hdrs.get("x-user-role") ?? "student",
        name: rawName ? decodeURIComponent(rawName) || null : null,
      },
    };
  }

  // Fallback for anything that reaches this without going through
  // middleware (e.g. local scripts) - verifies against Supabase directly.
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {}
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      role: (user.user_metadata?.role as string) ?? "student",
      name: (user.user_metadata?.full_name as string) ?? user.email ?? null,
    },
  };
}
