import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Paths an alumnus account may reach before their application is approved.
const ALUMNI_PENDING_ALLOWED = new Set(["/alumni/application-under-review", "/login"]);

// Trusted-identity headers this middleware sets after verifying the Supabase
// session once. getServerSession() reads these instead of re-verifying the
// session against Supabase Auth on every server action/route handler call -
// that redundant re-verification (one full network round trip per call) was
// the single biggest contributor to marketplace load latency, since a single
// page view fires several server actions in parallel, each previously paying
// its own auth round trip. Any of these headers arriving on the incoming
// request are stripped first so a client can never spoof them.
const AUTH_HEADER_NAMES = ["x-user-id", "x-user-email", "x-user-role", "x-user-name"];

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
  const requestHeaders = new Headers(request.headers);
  AUTH_HEADER_NAMES.forEach((name) => requestHeaders.delete(name));

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const role = user?.user_metadata?.role as string | undefined;

  if (user) {
    requestHeaders.set("x-user-id", user.id);
    requestHeaders.set("x-user-email", user.email ?? "");
    requestHeaders.set("x-user-role", role ?? "student");
    requestHeaders.set("x-user-name", encodeURIComponent((user.user_metadata?.full_name as string) ?? user.email ?? ""));
    // Rebuild the passthrough response now that the trusted headers are set,
    // preserving any auth cookies already staged onto supabaseResponse above.
    const refreshed = NextResponse.next({ request: { headers: requestHeaders } });
    supabaseResponse.cookies.getAll().forEach((c) => refreshed.cookies.set(c));
    supabaseResponse = refreshed;
  }

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
