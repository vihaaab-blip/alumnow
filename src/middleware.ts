import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Paths an alumnus account may reach before their application is approved.
const ALUMNI_PENDING_ALLOWED = new Set(["/alumni/application-under-review", "/login"]);

async function getAlumniVerificationStatus(userId: string): Promise<string | null> {
  const params = new URLSearchParams({ select: "verificationStatus", userId: `eq.${userId}`, limit: "1" });
  const res = await fetch(`${supabaseUrl}/rest/v1/AlumniProfile?${params.toString()}`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as { verificationStatus: string | null }[];
  return rows[0]?.verificationStatus?.toLowerCase() ?? null;
}

export default async function handler(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const role = user?.user_metadata?.role as string | undefined;

  const protectedPaths = ["/browse", "/bookings", "/dashboard", "/profile", "/alumni", "/apply", "/account"];
  const isProtected = protectedPaths.some((p) => path.startsWith(p));
  const isAdminPath = path.startsWith("/admin");

  if (isAdminPath) {
    if (!user || role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  } else if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  } else if (isProtected && user && role === "alumnus" && !ALUMNI_PENDING_ALLOWED.has(path)) {
    // An alumnus account exists as soon as they sign up, but they should get no
    // access to the app beyond the review page until an admin approves them.
    const status = await getAlumniVerificationStatus(user.id);
    if (status !== "approved") {
      const url = request.nextUrl.clone();
      url.pathname = "/alumni/application-under-review";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images/|uploads/|auth/callback).*)"] };
