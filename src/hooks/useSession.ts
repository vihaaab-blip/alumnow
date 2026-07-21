"use client";

import { useSupabase } from "@/components/SupabaseProvider";

/**
 * Drop-in replacement for `useSession()` from next-auth/react.
 * Returns the same shape: { data: SessionData | null, status: 'loading' | 'authenticated' | 'unauthenticated', update: () => {} }
 */
export function useSession() {
  const { session, status } = useSupabase();

  return {
    data: session,
    status,
    update: async () => {},
  } as const;
}

/**
 * Sign in with email/password using Supabase Auth.
 * Drop-in replacement for `signIn("credentials", ...)` from next-auth/react.
 */
export async function signIn(
  _provider: string,
  options: { email: string; password: string; redirect?: boolean; [key: string]: unknown },
) {
  const { createBrowserClient } = await import("@supabase/ssr");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createBrowserClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: options.email,
    password: options.password,
  });

  if (error || !data.session) {
    return { error: error?.message ?? "Invalid email or password." };
  }

  return { ok: true, data: { user: data.user } };
}

/**
 * Sign out using Supabase Auth.
 * Drop-in replacement for `signOut()` from next-auth/react.
 */
export async function signOut(options?: { redirectTo?: string }) {
  const { createBrowserClient } = await import("@supabase/ssr");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createBrowserClient(supabaseUrl, supabaseKey);

  await supabase.auth.signOut();

  if (options?.redirectTo) {
    window.location.href = options.redirectTo;
  } else {
    window.location.href = "/";
  }
}
