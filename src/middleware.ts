import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const { auth: middleware } = NextAuth(authConfig);

export default async function handler(
  request: NextRequest,
  event: { params: Promise<Record<string, string>> }
) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });
    await supabase.auth.getUser();
  }

  return (middleware as any)(request, event);
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images/|uploads/).*)"] };
