"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
