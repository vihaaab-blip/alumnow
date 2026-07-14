# Auth Flow — Full reference

How accounts are created, how login works, how sessions are managed, and how every piece of data is tied to the right user.

---

## Table of contents

1. [Prisma schema — The `User` model](#1-prisma-schema--the-user-model)
2. [Sign-up flow (student)](#2-sign-up-flow-student)
3. [Sign-up flow (alumni)](#3-sign-up-flow-alumni)
4. [Login flow](#4-login-flow)
5. [JWT — What's in the token](#5-jwt--whats-in-the-token)
6. [Session — How the client knows who you are](#6-session--how-the-client-knows-who-you-are)
7. [Middleware — Protected vs public routes](#7-middleware--protected-vs-public-routes)
8. [Redirect after auth — Why full reload](#8-redirect-after-auth--why-full-reload)
9. [Role-based redirect — Who goes where](#9-role-based-redirect--who-goes-where)
10. [Dashboard — Data scoped to user](#10-dashboard--data-scoped-to-user)
11. [Alumni dashboard — Separate page, same pattern](#11-alumni-dashboard--separate-page-same-pattern)
12. [Sidebar — Nav items by role](#12-sidebar--nav-items-by-role)
13. [Google OAuth flow](#13-google-oauth-flow)
14. [Login page — Quick access buttons](#14-login-page--quick-access-buttons)
15. [Error handling](#15-error-handling)
16. [Rate limiting & security](#16-rate-limiting--security)
17. [Key files reference](#17-key-files-reference)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-14 | **Role-based redirect**: `login()` now queries user role and redirects students → `/dashboard`, alumni → `/alumni/dashboard`, admin → `/admin` |
| 2026-07-14 | **Student signup redirect**: Changed from `/browse` to `/dashboard` |
| 2026-07-14 | **Full page reload**: Changed all post-auth redirects from `router.push` to `window.location.href` — fixes session not being picked up by `SessionProvider` |
| 2026-07-14 | **Quick access buttons**: "Continue as Student/Alumni/Admin" buttons now directly call `login()` + redirect (one click, no form filling) |
| 2026-07-14 | **Login autocomplete**: Typing email shows dropdown with matching demo accounts that auto-fill email + password |
| 2026-07-14 | **Register role selector**: Added Student/Alumni tabs; student has simplified form, alumni has 4-step wizard (Account → Profile → Pricing → Availability) |
| 2026-07-14 | **Alumni dashboard redesign**: Full rewrite as client component with stat cards, sparklines, trend pills, sessions chart, rating donut, earnings chart, quick actions sidebar, upcoming bookings with countdown timers |
| 2026-07-14 | **Audit fix**: Added missing routes (`/browse`, `/alumni`, `/apply`) to middleware protected paths |
| 2026-07-14 | **Audit fix**: Added Zod validation (`signupAlumniSchema`) to `signupAlumni()` server action |
| 2026-07-14 | **Audit fix**: Fixed `getMyBookings()` to include `alumni → user` relation for image/name display |
| 2026-07-14 | **Doc update**: Fixed inaccuracies in authorize callback, middleware paths, and `getAlumniBookings` query |
| 2026-07-14 | **Doc update**: Added auth flow health checklist |

---

## 1. Prisma schema — The `User` model

Every account is a single row in the `User` table.

```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  passwordHash    String?
  phone           String?
  name            String?
  image           String?
  role            String   @default("student")    // "student" | "alumnus" | "admin"
  emailVerifiedAt DateTime?

  studentProfile StudentProfile?    // null if role = "alumnus"
  alumniProfile  AlumniProfile?     // null if role = "student"

  bookingsAsStudent    Booking[] @relation("StudentBooking")
  bookingsAsAlumni     Booking[] @relation("AlumniBooking")
  reviews              Review[]
  accounts             Account[]
  sessions             Session[]
  passwordResetTokens  PasswordResetToken[]
}
```

The `id` is a **cuid** (e.g. `cm8jvxn3p0000vs9w5b3x7k2a`). It is the foreign key used by **every related table**.

### Role determines what profile data is linked

```
role: "student"  →  User ──1:1──> StudentProfile { fullName, dateOfBirth, currentGrade, school }
role: "alumnus"  →  User ──1:1──> AlumniProfile { fullName, universityName, course, bio, ... }
                                       │
                                       ├──1:N──> SessionTypeOffering { type, pricePaise, ... }
                                       └──1:N──> AlumniAvailability { dayOfWeek, startTime, endTime }
```

### Bookings tie two users together

```prisma
model Booking {
  id                String
  studentId         String    // FK → User.id  (the student who booked)
  alumniId          String    // FK → User.id  (the alumni being booked)
  scheduledStartAt  DateTime
  status            String    // "pending_payment" | "confirmed" | "completed" | "cancelled" | ...
  student           User   @relation("StudentBooking", fields: [studentId], references: [id])
  alumni            User   @relation("AlumniBooking",  fields: [alumniId],  references: [id])
  review            Review?
}
```

So a **single booking row** links one student user + one alumni user.

---

## 2. Sign-up flow (student)

The student sign-up form lives in `src/app/register/page.tsx` → `StudentForm` component.

### What the user sees

4 fields: Full name, Email, Phone, Password + Confirm password + TOS checkbox.  
"Auto-fill demo student data" button fills everything instantly.

### What happens on submit

```ts
const submit = async (e: React.FormEvent) => {
  // 1. Validate passwords match
  // 2. Validate TOS accepted
  setStatus("creating");

  // 3. Call server action
  const r = await signup({
    fullName, email, phone, password,
    dateOfBirth: null,
    currentGrade: "AS",
    school: "Demo School",
  });

  // 4. If error, show it
  if (r.error) { setError(r.error); return; }

  // 5. Simulate verification animation
  setStatus("verifying");
  await sleep(800);
  setStatus("verified");
  await sleep(700);

  // 6. Full page redirect
  window.location.href = "/dashboard";
};
```

### The `signup()` server action (`auth.actions.ts`)

```ts
export async function signup(input) {
  // 1. Parse & validate via Zod
  const parsed = signupSchema.parse(input);

  // 2. Rate limit check (3 attempts per 15 min per IP)
  if (!rateLimit(`signup:${ip}`, { max: 3, windowMs: 900000 }))
    return { error: "Too many signup attempts." };

  // 3. Check duplicate email
  if (await prisma.user.findUnique({ where: { email: parsed.email } }))
    return { error: "An account with this email already exists." };

  // 4. Hash password (12 rounds of bcrypt)
  const passwordHash = await hash(parsed.password, 12);

  // 5. Create User + StudentProfile in one transaction
  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      passwordHash,
      phone: parsed.phone,
      role: "student",
      emailVerifiedAt: new Date(),
      studentProfile: {
        create: {
          fullName: parsed.fullName,
          dateOfBirth: parsed.dateOfBirth instanceof Date ? parsed.dateOfBirth : null,
          currentGrade: parsed.currentGrade,
          school: parsed.school,
        },
      },
    },
  });

  // 6. Send verification email
  await sendEmail(/* ... */, user.id);

  // 7. Auto-login — creates session cookie
  await signIn("credentials", {
    email: parsed.email,
    password: parsed.password,
    redirect: false,
  });

  // 8. Return redirect path
  return { success: true, data: { redirectTo: "/dashboard" } };
}
```

### Database after sign-up

```
users table
┌────────────────────────────────┬──────────┬──────────────────┐
│ id                             │ email    │ role             │
├────────────────────────────────┼──────────┼──────────────────┤
│ cm8jvxn3p0000vs9w5b3x7k2a     │ foo@...  │ "student"        │
└────────────────────────────────┴──────────┴──────────────────┘

student_profiles table
┌──────────┬───────────┬──────────────────────────────┐
│ user_id  │ full_name │ school                       │
├──────────┼───────────┼──────────────────────────────┤
│ cm8jv... │ "Aarav"   │ "Demo School"                │
└──────────┴───────────┴──────────────────────────────┘
```

---

## 3. Sign-up flow (alumni)

The alumni sign-up is a **multi-step wizard** (4 steps) inside `AlumniWizard` component.

### Step 1 — Account
Fields: Full name, Email, Phone, Password, Confirm password.  
"Auto-fill demo alumni data" fills everything.

### Step 2 — Profile
Fields: Photo upload, University, Course, Country (dropdown), Graduation year, Bio.  
"Auto-fill demo profile data" fills everything.

### Step 3 — Session types & pricing
Dynamic list of session offerings. Each has:
- Type dropdown (1:1 Video Call / Group Session)
- Price (in paise, e.g. `99900` = ₹999)
- Max participants (default 1)
- Description (one-liner)

"Add another session type" appends a new card. Each card has a delete button.  
"Auto-fill demo session types" adds sample data.

### Step 4 — Availability
Dynamic list of time slots. Each has:
- Day of week dropdown (Sun–Sat)
- Start time (time picker)
- End time (time picker)

"Add time slot" appends a new row. Each has a delete button.  
"Auto-fill demo availability" adds sample data.

### What happens on final submit

```ts
const handleSubmit = async () => {
  setStatus("creating");
  const r = await signupAlumni({
    ...acc,                        // step 1: name, email, phone, password
    ...profile,                    // step 2: university, course, country, bio, etc.
    sessionTypes: sessions,        // step 3: array of { type, pricePaise, ... }
    availability: avail,           // step 4: array of { dayOfWeek, startTime, endTime }
  });
  if (r.error) { setError(r.error); return; }
  setStatus("verifying"); await sleep(800);
  setStatus("verified"); await sleep(700);
  window.location.href = "/alumni/dashboard";
};
```

### The `signupAlumni()` server action

```ts
export async function signupAlumni(input) {
  // Zod validation (via signupAlumniSchema)
  const parsed = signupAlumniSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please check your details." };

  // Rate limit, duplicate check, hash password (same as student flow)

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      phone: parsed.data.phone,
      role: "alumnus",
      emailVerifiedAt: new Date(),
      alumniProfile: {
        create: {
          fullName: parsed.data.fullName,
          profilePhotoUrl: parsed.data.profilePhotoUrl,
          universityName: parsed.data.universityName,
          course: parsed.data.course,
          country: parsed.data.country,
          graduationYearJbcn: parsed.data.graduationYearJbcn,
          bio: parsed.data.bio,
          languages: parsed.data.languages
            ? JSON.stringify(parsed.data.languages.split(",").map((l) => l.trim()).filter(Boolean))
            : "[]",
          // Creates ALL session types in one nested create
          sessionTypes: {
            create: parsed.data.sessionTypes.map((st) => ({
              type: st.type,
              pricePaise: st.pricePaise,
              maxParticipants: st.maxParticipants ?? 1,
              descriptionOneLiner: st.descriptionOneLiner,
            })),
          },
          // Creates ALL availability slots in one nested create
          availability: {
            create: parsed.data.availability.map((a) => ({
              dayOfWeek: a.dayOfWeek,
              startTime: a.startTime,
              endTime: a.endTime,
            })),
          },
        },
      },
    },
  });

  await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirect: false });
  return { success: true, data: { redirectTo: "/alumni/dashboard" } };
}
```

### Database after alumni sign-up

```
users
┌────────────────────────────────┬──────────────────┬────────────┐
│ id                             │ email            │ role       │
├────────────────────────────────┼──────────────────┼────────────┤
│ cm8k1abc...                    │ alumni@bar.com   │ "alumnus"  │
└────────────────────────────────┴──────────────────┴────────────┘

alumni_profiles
┌──────────┬───────────┬────────────────────────────────┐
│ user_id  │ full_name │ university_name                │
├──────────┼───────────┼────────────────────────────────┤
│ cm8k1... │ "Ananya"  │ "University of California..."   │
└──────────┴───────────┴────────────────────────────────┘

session_type_offerings
┌──────────┬──────────────────┬──────────────┐
│ alumni_id│ type             │ price_paise  │
├──────────┼──────────────────┼──────────────┤
│ cm8k1... │ "one_on_one_vi…" │ 99900        │
│ cm8k1... │ "group_session"  │ 49900        │
└──────────┴──────────────────┴──────────────┘

alumni_availability
┌──────────┬───────────┬───────────┬─────────┐
│ alumni_id│ day_of_week│ start_time│ end_time│
├──────────┼───────────┼───────────┼─────────┤
│ cm8k1... │ 0 (Sun)   │ 13:00     │ 14:00   │
│ cm8k1... │ 2 (Tue)   │ 10:00     │ 11:00   │
│ cm8k1... │ 4 (Thu)   │ 15:00     │ 16:00   │
└──────────┴───────────┴───────────┴─────────┘
```

---

## 4. Login flow

The login form is in `src/app/login/page.tsx`.

### Form submit

```ts
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setSubmitting(true);
  const result = await login({ email, password });
  if (result.error) { setError(result.error); return; }
  window.location.href = result.data.redirectTo;
}
```

### The `login()` server action

```ts
export async function login(input) {
  try {
    const parsed = loginSchema.parse(input);

    // Auto-ensure demo accounts exist (so they always work)
    await ensureDemoAccount(parsed.email, parsed.password);

    // Validate credentials via NextAuth
    await signIn("credentials", { ...parsed, redirect: false });

    // Look up the user's role to determine where to redirect
    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
      select: { role: true },
    });

    const redirectTo =
      user?.role === "alumnus"  ? "/alumni/dashboard"
      : user?.role === "admin"  ? "/admin"
      : "/dashboard";

    return { success: true, data: { redirectTo } };
  } catch (error) {
    if (error instanceof AuthError)
      return { success: false, error: "Invalid email or password." };
    return { success: false, error: "Unable to sign in." };
  }
}
```

### The `authorize` callback (inside NextAuth `auth.ts`)

This is what validates the credentials on every `signIn("credentials")` call:

```ts
authorize: async (credentials) => {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) throw new Error("Invalid email or password.");

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { studentProfile: true, alumniProfile: true },
  });
  if (!user?.passwordHash) throw new Error("Invalid email or password.");

  const valid = await compare(parsed.data.password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password.");

  // This object is passed to the jwt callback
  return {
    id: user.id,
    email: user.email,
    name: user.studentProfile?.fullName ?? user.alumniProfile?.fullName ?? user.email,
    role: user.role,
  };
},
```

---

## 5. JWT — What's in the token

When NextAuth creates a session, it generates a JWT (JSON Web Token). The token is stored in an **HTTP-only, secure, same-site cookie**.

The JWT is created/signed by the `jwt` callback:

```ts
jwt({ token, user }) {
  if (user) {
    token.id = user.id;          // e.g. "cm8jvxn3p0000vs9w5b3x7k2a"
    token.role = user.role;      // e.g. "student"
  }
  return token;
},
```

### Decoded JWT contents

```json
{
  "name": "Aarav Sharma",
  "email": "student1@alumnow.com",
  "sub": "cm8jvxn3p0000vs9w5b3x7k2a",
  "id": "cm8jvxn3p0000vs9w5b3x7k2a",
  "role": "student",
  "iat": 1712345678,
  "exp": 1712432078,
  "jti": "abc-def-ghi"
}
```

The cookie name depends on the session strategy:
- **JWT strategy** (this project): `next-auth.session-token`
- The cookie is `HttpOnly`, `Secure` (in production), `SameSite=Lax`

---

## 6. Session — How the client knows who you are

The `useSession()` hook from `next-auth/react` fetches the session from `/api/auth/session` on every page load.

### How the role gets to the client

The `session` callback in `auth.ts` copies the JWT claims onto the session object:

```ts
session({ session, token }) {
  if (session.user) {
    (session.user as any).id = token.id;      // token.id was set by jwt callback
    (session.user as any).role = token.role;  // token.role was set by jwt callback
  }
  return session;
},
```

### What `useSession()` returns

```ts
const { data: session, status } = useSession();
// status: "loading" | "authenticated" | "unauthenticated"
//
// session.user:
//   name: "Aarav Sharma"
//   email: "student1@alumnow.com"
//   image: null
//   id: "cm8jvxn3p0000vs9w5b3x7k2a"
//   role: "student"
```

Components access role like this:

```ts
const role = (session.user as any).role;
```

The cast is necessary because NextAuth's types don't include custom fields like `id` and `role`.

---

## 7. Middleware — Protected vs public routes

The middleware in `src/lib/auth.config.ts` checks the session on every request:

```ts
export const authConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = Boolean(auth?.user);
      const protectedPath = [
        "/browse", "/bookings", "/dashboard",
        "/profile", "/alumni", "/apply",
      ].some((p) => nextUrl.pathname.startsWith(p));

      // Admin routes: only admin role allowed
      if (nextUrl.pathname.startsWith("/admin"))
        return auth?.user?.role === "admin";

      // Protected route but not logged in → redirect to login
      return !protectedPath || loggedIn;
    },
  },
  providers: [],
};
```

The middleware file (`src/middleware.ts`) just re-exports this:

```ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
export default NextAuth(authConfig).auth;
```

### How protected routes behave

| Route | Logged in? | Result |
|-------|-----------|--------|
| `/browse` | Yes | ✅ OK |
| `/browse` | No | ❌ Redirect to `/login` |
| `/dashboard` | Yes | ✅ OK |
| `/dashboard` | No | ❌ Redirect to `/login` |
| `/admin` | Yes + role=admin | ✅ OK |
| `/admin` | Yes + role=student | ❌ 403 / redirect |
| `/admin` | No | ❌ Redirect to `/login` |
| `/login` | Any | ✅ Always public |
| `/register` | Any | ✅ Always public |

---

## 8. Redirect after auth — Why full reload

After a server action calls `signIn()` and creates the session cookie, the client must do:

```ts
window.location.href = redirectTo;
```

NOT:

```ts
router.push(redirectTo);  // ❌ Does NOT work reliably
```

### Why `router.push` doesn't work

1. `signIn("credentials")` runs inside a **server action**. It sets the session cookie on the server response.
2. `router.push()` does a **client-side navigation** — it swaps React components without a full page load.
3. The `SessionProvider` (which wraps the app) has already initialized with `status: "unauthenticated"`. It does NOT automatically refetch the session on client-side nav.
4. So the destination page calls `useSession()` → gets `status: "unauthenticated"` → redirects back to `/login`.

### Why `window.location.href` works

1. It triggers a **full browser page reload**.
2. The browser sends **all cookies** in the request headers, including the new `next-auth.session-token`.
3. The server reads the cookie, decodes the JWT, and returns the session in the HTML.
4. The `SessionProvider` bootstraps from the server-rendered session — it's immediately `"authenticated"`.

---

## 9. Role-based redirect — Who goes where

The `login()` server action determines the redirect based on the user's role:

```
User role    →    Redirect to
────────────────────────────────
"student"    →    /dashboard
"alumnus"    →    /alumni/dashboard
"admin"      →    /admin
```

The sign-up actions also redirect correctly:
- `signup()` (student) → `/dashboard`
- `signupAlumni()` → `/alumni/dashboard`

### The main dashboard already handles alumni too

Inside `src/app/dashboard/page.tsx`, there's a role check:

```ts
useEffect(() => {
  if (session?.user && (session.user as any).role === "alumnus")
    setDashboardMode("alumnus");   // enables toggle
}, [session]);
```

If an alumni user lands on `/dashboard` (e.g., by typing the URL), they see a toggle in the hero banner:

```
[Alumni view] [Student view]
```

This lets alumni see both their mentor analytics AND their student perspective.

---

## 10. Dashboard — Data scoped to user

The dashboard page (`src/app/dashboard/page.tsx`) fetches data after confirming the user is authenticated.

### Loading / auth guard

```tsx
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;

    getMyBookings().then(setBookings);
    getAlumniBookings().then(setAlumniBookings).finally(() => setLoading(false));
  }, [status, router]);
```

### How `getMyBookings()` scopes to the user

```ts
// booking.actions.ts
export async function getMyBookings() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "student")
    throw new Error("Please sign in as a student.");

  return prisma.booking.findMany({
    where: { studentId: session.user.id },   // ← ONLY this user's bookings
    include: {
      alumni: {
        include: { user: true },             // needed for alumni.user.image
      },
      sessionType: true,
      payment: true,
      review: true,
    },
    orderBy: { scheduledStartAt: "asc" },
  });
}
```

### How `getAlumniBookings()` scopes to the user

```ts
export async function getAlumniBookings() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "alumnus")
    return [];

  const profile = await prisma.alumniProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return [];

  // Note: `alumniId` is the AlumniProfile.id, NOT User.id
  return prisma.booking.findMany({
    where: { alumniId: profile.id },
    include: {
      student: {
        include: { studentProfile: true },
      },
      sessionType: true,
      payment: true,
      review: true,
    },
    orderBy: { scheduledStartAt: "asc" },
  });
}
```

### Stat cards use derived data

The dashboard uses `useMemo` to derive stats from the bookings array:

```ts
const totalCompleted = monthlyData.reduce((a, d) => a + d.completed, 0);
const totalHours = weeklyData.reduce((a, d) => a + d.hours, 0);
const avgRating = ratingData.reduce(...) / ratingData.reduce(...);
```

The "real" data (from actual bookings) is shown in the session list:

```ts
const upcomingCount = activeBookings.filter(
  (b) => new Date(b.scheduledStartAt).getTime() >= now && b.status !== "cancelled"
).length;
```

The charts use **seeded random data** (e.g. `seededRandom(42)`) to display realistic-looking analytics even when no real bookings exist yet.

---

## 11. Alumni dashboard — Separate page, same pattern

`src/app/alumni/dashboard/page.tsx` is a **client component** (uses `"use client"` + `useSession`).

### Data fetching

```tsx
const { data: session, status } = useSession();

useEffect(() => {
  if (status === "unauthenticated") { router.push("/login"); return; }
  if (status !== "authenticated") return;
  getAlumniBookings()
    .then(setBookings)
    .finally(() => setLoading(false));
}, [status, router]);
```

### Stats are derived from seeded data + real bookings

```ts
const totalSessions = sessionsData.reduce((a, d) => a + d.sessions, 0);
const totalStudents = studentsData.reduce((a, d) => a + d.students, 0);
const totalEarnings = earningsData.reduce((a, d) => a + d.amount, 0);
const avgRating = ratingData.reduce((s, r) => s + parseInt(r.rating) * r.count, 0) / totalRatings;
```

The upcoming bookings section shows real data:

```tsx
{bookings.filter((b) =>
  new Date(b.scheduledStartAt).getTime() >= now && b.status !== "cancelled"
).slice(0, 4).map((b) => (
  // Render booking card with student avatar, name, date, time, status badge
))}
```

### Quick actions sidebar

The alumni dashboard also shows navigation to profile management pages:

```
Edit profile        → /alumni/profile/edit
Manage availability → /alumni/profile/availability
Pricing & types     → /alumni/profile/pricing
View marketplace    → /browse
```

---

## 12. Sidebar — Nav items by role

The `Sidebar` component (`src/components/Sidebar.tsx`) shows different items depending on the user role.

```tsx
const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Marketplace", href: "/browse", icon: Search },
  { label: "Bookings", href: "/bookings", icon: CalendarDays },
  { label: "Saved", href: "/browse?view=saved", icon: Star },
  { label: "Profile", href: "/alumni/profile", icon: Users },
];
```

The sidebar is rendered inside the dashboard layout. When the user is on `/alumni/dashboard`, the same sidebar is shown — the active state highlights the "Dashboard" link.

---

## 13. Google OAuth flow

### How to get credentials

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a project (or select an existing one)
3. Click **+ Create Credentials** → **OAuth Client ID**
4. Set **Application type** → **Web application**
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback/google` (local dev)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy the **Client ID** and **Client Secret**

Set them in `.env`:

```
AUTH_GOOGLE_ID=your-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-client-secret
```

### How it works in code

Google sign-in on the login page:

```tsx
async function handleGoogleSignIn() {
  try {
    await signIn("google", { redirectTo: "/dashboard" });
  } catch {
    setError("Google Sign-In is not configured.");
  }
}
```

This calls the NextAuth Google provider, which redirects the user to Google's consent page, then back to the callback URL. On success, NextAuth creates a session (same JWT/cookie mechanism) and redirects to `/dashboard`.

The Google provider is conditionally included in `auth.ts`:

```ts
providers: [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })]
    : []),
  Credentials({ ... }),
],
```

If the env vars aren't set, the Google provider is omitted entirely and the app uses credentials-only login. The login page catches the error and shows a message.

---

## 14. Login page — Quick access buttons

The login page has three levels of convenience:

### Level 1 — Autocomplete dropdown

As the user types their email, a dropdown shows matching demo accounts. Clicking one fills the email and password fields (but does NOT submit the form). The user still clicks "Sign in" to proceed.

### Level 2 — "Continue as Student → Dashboard"

This button directly calls `signInWithRedirect(DEMO_ACCOUNTS[0]!.email, DEMO_ACCOUNTS[0]!.password)` — it logs in AND redirects in one click, without filling any form fields.

### Level 3 — Other demo accounts

"Continue as Alumni" and "Continue as Admin" buttons also call `signInWithRedirect()` directly with the appropriate credentials.

The `signInWithRedirect` function:

```ts
const signInWithRedirect = async (email: string, password: string) => {
  setSubmitting(true);
  setError("");
  const result = await login({ email, password });
  if (result.error) { setError(result.error); setSubmitting(false); return; }
  window.location.href = result.data?.redirectTo ?? "/dashboard";
};
```

---

## 15. Error handling

### Server action errors

Both `signup()` and `login()` return `ApiResponse<{ redirectTo: string }>`:

```ts
type ApiResponse<T> = {
  success: boolean;
  data?: T;        // present when success = true
  error?: string;  // present when success = false
};
```

### Common errors and messages

| Scenario | Error message | Where |
|----------|--------------|-------|
| Duplicate email | "An account with this email already exists." | `signup()` / `signupAlumni()` |
| Wrong password | "Invalid email or password." | `login()` |
| Rate limited (signup) | "Too many signup attempts. Try again in 15 minutes." | `signup()` / `signupAlumni()` |
| Rate limited (forgot) | "Too many requests. Try again later." | `forgotPassword()` |
| Validation failed | "Please check your details." | `signup()` / `signupAlumni()` |
| Google not configured | "Google Sign-In is not configured..." | Login page |

### Unauthenticated access

If a user tries to access a protected page without being logged in:
1. **Middleware** intercepts the request → redirects to `/login`
2. **Client-side** `useSession` + `useEffect` also redirects (redundant safety net)

### What happens if you refresh while auth is loading

The dashboard shows a skeleton loading state:

```tsx
if (status === "loading" || !session) {
  return (
    <div>
      <Sidebar />
      <Skeleton className="h-[130px]" />
      <Skeleton className="h-[120px]" />
      {/* ... */}
    </div>
  );
}
```

---

## 16. Rate limiting & security

### Rate limiting (`src/lib/rate-limit.ts`)

A simple in-memory rate limiter is applied to signup and forgot-password endpoints:

| Action | Limit | Window |
|--------|-------|--------|
| `signup` | 3 attempts | 15 minutes |
| `signupAlumni` | 3 attempts | 15 minutes |
| `forgotPassword` | 2 attempts | 15 minutes |

```ts
if (!rateLimit(`signup:${ip}`, { max: 3, windowMs: 900000 }))
  return { error: "Too many signup attempts. Try again in 15 minutes." };
```

### Password hashing

Passwords are hashed with **bcrypt, 12 salt rounds**:

```ts
const passwordHash = await hash(parsed.password, 12);
```

### JWT signing

The JWT is signed using NextAuth's default (HS256 with a random secret from `AUTH_SECRET`). In production, this should be a strong, persistent secret stored in environment variables.

### Email verification

During signup, the `emailVerifiedAt` field is set to `new Date()`. In a production app, this would be set only after the user clicks a verification link in an email (not done automatically).

---

## 17. Key files reference

| File | Purpose | Key exports |
|------|---------|-------------|
| `prisma/schema.prisma` | Database schema | User, StudentProfile, AlumniProfile, Booking, etc. |
| `src/lib/auth.ts` | NextAuth config | auth(), signIn(), signOut() |
| `src/lib/auth.config.ts` | Auth middleware config | authConfig (routes, callbacks) |
| `src/middleware.ts` | Route protection middleware | NextAuth auth handler |
| `src/actions/auth.actions.ts` | Auth server actions | signup(), signupAlumni(), login(), logout() |
| `src/app/login/page.tsx` | Login page UI | LoginPage component |
| `src/app/register/page.tsx` | Sign-up page UI | StudentForm, AlumniWizard components |
| `src/app/dashboard/page.tsx` | Student dashboard | DashboardPage component |
| `src/app/alumni/dashboard/page.tsx` | Alumni dashboard | AlumniDashboardPage component |
| `src/components/Sidebar.tsx` | Navigation sidebar | Sidebar component |
| `src/lib/validation.ts` | Zod schemas | loginSchema, signupSchema, etc. |
| `src/lib/rate-limit.ts` | Rate limiter | rateLimit() |
| `src/lib/email.ts` | Email service | sendEmail(), emailTemplates |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API route | GET, POST handlers |

---

## Summary — The complete data flow

```
                          REGISTER                              LOGIN
                             │                                   │
                             ▼                                   ▼
                    ┌─────────────────┐                 ┌─────────────────┐
                    │  Server action   │                 │  Server action   │
                    │  signup()        │                 │  login()         │
                    │                  │                 │                  │
                    │ 1. Hash password │                 │ 1. signIn()      │
                    │ 2. Create User   │                 │    (validate)    │
                    │    in DB         │                 │ 2. Query role    │
                    │ 3. Create linked │                 │ 3. Return        │
                    │    profile       │                 │    redirectTo    │
                    │ 4. signIn() →    │                 │                  │
                    │    set cookie    │                 │                  │
                    └────────┬────────┘                 └────────┬─────────┘
                             │                                   │
                             │ Return { redirectTo }             │ Return { redirectTo }
                             ▼                                   ▼
                    ┌───────────────────────────────────────────────┐
                    │          CLIENT-SIDE REDIRECT                 │
                    │    window.location.href = redirectTo          │
                    │                                              │
                    │  ⚠ NOT router.push() — must be full reload   │
                    │  so the new session cookie is sent            │
                    └─────────────────────┬─────────────────────────┘
                                          │
                                          ▼
                              ┌─────────────────────┐
                              │   FULL PAGE RELOAD  │
                              │                     │
                              │ Cookie → Server     │
                              │ Server → JWT decode │
                              │ SessionProvider     │
                              │ reads session       │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │   DASHBOARD PAGE    │
                              │                     │
                              │ useSession() →      │
                              │   user.id, user.role│
                              │                     │
                              │ getMyBookings() →   │
                              │   WHERE studentId   │
                              │   = user.id         │
                              │                     │
                               │ getAlumniBookings()→│
                               │   WHERE alumniId    │
                               │   = profile.id     │
                               │   (AlumniProfile.id)│
                              │                     │
                              │ Render: charts,     │
                              │ stats, session list │
                              └─────────────────────┘
```

**Every piece of data in the app is tied to `User.id` via Prisma foreign keys. No user can ever see another user's data because every database query filters by the authenticated user's ID from the session JWT.**

---

## Checklist — Auth flow health check

### Registration flows

- [ ] Signup creates `User` + `StudentProfile` in one transaction
- [ ] `signupAlumni` creates `User` + `AlumniProfile` + `SessionTypeOffering` + `AlumniAvailability`
- [ ] `signupAlumni` validates input via Zod `signupAlumniSchema` before any DB operation
- [ ] Rate limiting on signup (3 per 15 min per IP)
- [ ] Password hashed with bcrypt (12 rounds)
- [ ] Duplicate email returns "An account with this email already exists."
- [ ] Verification email logged via `sendEmail()` + `NotificationLog`

### Login flow

- [ ] Login validates credentials via NextAuth credentials provider
- [ ] `authorize` callback uses `safeParse` + `throw new Error` pattern
- [ ] `ensureDemoAccount` auto-creates demo accounts if missing
- [ ] Login queries role and returns correct `redirectTo`
- [ ] `AuthError` caught and returns "Invalid email or password."
- [ ] Student redirects to `/dashboard`
- [ ] Alumni redirects to `/alumni/dashboard`
- [ ] Admin redirects to `/admin`

### JWT & Session

- [ ] JWT callback stores `id` and `role` in token when `user` is present
- [ ] Session callback copies `id` and `role` from token to `session.user`
- [ ] Cast `(session.user as any)` used because NextAuth types don't include custom fields
- [ ] Session strategy is `"jwt"` (no database sessions)

### Middleware

- [ ] All private routes protected: `/browse`, `/bookings`, `/dashboard`, `/profile`, `/alumni`, `/apply`
- [ ] Middleware restricts `/admin` to users with `role === "admin"`
- [ ] Unauthenticated access to protected routes redirects to `/login`
- [ ] `/login` and `/register` are always public

### Redirects

- [ ] Full page reload (`window.location.href`) used after auth, not `router.push`
- [ ] `signup()` returns `redirectTo: "/dashboard"`
- [ ] `signupAlumni()` returns `redirectTo: "/alumni/dashboard"`
- [ ] `login()` determines redirect based on `role` column

### Dashboard scoping

- [ ] `getMyBookings()` queries `studentId: session.user.id` (User.id)
- [ ] `getAlumniBookings()` queries `alumniId: profile.id` (AlumniProfile.id, not User.id)
- [ ] `getAlumniBookings()` checks `role === "alumnus"` before querying
- [ ] Student dashboard shows loading skeleton while `status === "loading"`
- [ ] Alumni dashboard shows loading skeleton while `status === "loading"`
- [ ] Both dashboards guard against `status === "unauthenticated"` with `router.push("/login")`

### Alumni wizard

- [ ] Step 1 creates account data (name, email, phone, password)
- [ ] Step 2 creates profile data (university, course, country, grad year, bio)
- [ ] Step 3 creates session type offerings (type, pricePaise, maxParticipants)
- [ ] Step 4 creates availability slots (dayOfWeek, startTime, endTime)
- [ ] All 4 steps submitted atomically in one `prisma.user.create` transaction
- [ ] `sessionTypes` and `availability` are created via nested `create`

### Error handling

- [ ] Server actions return `ApiResponse<{ redirectTo: string }>` with `success` / `error`
- [ ] Catch blocks handle `AuthError` for login
- [ ] Catch blocks handle Zod errors for signup
- [ ] Forms show inline error messages
- [ ] Submission button disabled while submitting
- [ ] Google sign-in catch block shows "Google Sign-In is not configured."

### Google OAuth

- [ ] Google provider conditionally included based on `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- [ ] Fallback env var names: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- [ ] Without Google env vars, credentials-only login still works

### Rate limiting & security

- [ ] `signup` — 3 attempts per 15 min per IP
- [ ] `signupAlumni` — 3 attempts per 15 min per IP
- [ ] `forgotPassword` — 2 attempts per 15 min per IP
- [ ] In-memory rate limiter with auto-cleanup every 60s
- [ ] Password hashing: bcrypt with 12 salt rounds

### Demo accounts

- [ ] `ensureDemoAccount` creates student1@alumnow.com with StudentProfile
- [ ] `ensureDemoAccount` creates alumni1@alumnow.com with AlumniProfile
- [ ] `ensureDemoAccount` creates admin@alumnow.com with AdminUser
- [ ] Demo accounts only re-created if passwordHash is missing (upsert pattern)
- [ ] Login page quick-access buttons auto-fill and submit in one click
