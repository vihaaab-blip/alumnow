import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Creates a Supabase client for browser-side use.
 * Must be called from a useEffect or event handler, not at module level.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(key: string) {
        if (typeof document === "undefined") return undefined;
        const match = document.cookie.split("; ").find((c) => c.startsWith(`${key}=`));
        return match ? decodeURIComponent(match.split("=")[1]!) : undefined;
      },
      set(key: string, value: string, options: Record<string, unknown>) {
        if (typeof document === "undefined") return;
        let cookie = `${key}=${encodeURIComponent(value)}`;
        if (options?.path) cookie += `; Path=${options.path}`;
        if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;
        if (options?.secure) cookie += "; Secure";
        if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;
        document.cookie = cookie;
      },
      remove(key: string) {
        if (typeof document === "undefined") return;
        document.cookie = `${key}=; Path=/; Max-Age=0`;
      },
    },
  });
}
