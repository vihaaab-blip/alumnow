# Marketplace UI Upgrade — AlumNow

## Implementation Checklist

### Sprint 1 — Visual Polish (from marketplace_ui_upgrade.md)

| # | Item | File(s) | Status |
|---|------|---------|--------|
| P0.1 | Running checkout summary card (sticky sidebar, alumni info, itemised pricing, timezone) | `CheckoutSummaryCard.tsx` [NEW] | ✅ Done |
| P0.2 | Timezone caption everywhere | `ConfirmationScreen.tsx`, `BookingSummaryCard.tsx`, `CheckoutSummaryCard.tsx` | ✅ Done |
| P0.3 | Itemised pricing (session fee + 10% platform fee + total line) | `PaymentModal.tsx`, `BookingSummaryCard.tsx`, `CheckoutSummaryCard.tsx` | ✅ Done |
| P0.4 | Smart empty search states (icon + clickable remove-filter chips) | `AlumniGrid.tsx` | ✅ Done |
| P0.5 | SVG checkmark draw-in animation (circle path + check path, staggered) | `ConfirmationScreen.tsx` | ✅ Done |
| P1.1 | Recently viewed rail (localStorage, max 5, horizontal scroll, persists) | `browse/page.tsx` | ✅ Done |
| P1.2 | AvailabilityCalendar 3-step wizard (session → calendar → confirm), unavailable-day fade, grouped slots, sticky rail, rounded prices | `book/new/page.tsx` | ✅ Done |
| P1.3 | Trust signals on cards (session count, response rate) | `AlumniCard.tsx`, `AlumniDetailPanel.tsx` | ✅ Done |
| P2.1 | HTML email template + Resend/SendGrid wiring | `src/lib/email.ts` | ⏳ Pending |
| P2.2 | Skeleton → content crossfade (AnimatePresence, scale 0.98→1) | `AlumniGrid.tsx` | ✅ Done |
| P2.3 | "Continue where you left off" banner for pending bookings | `browse/page.tsx` | ✅ Done |

### Sprint 2 — Trust Engineering (from Airbnb/Fiverr/Upwork analysis)

| # | Item | File(s) | Status |
|---|------|---------|--------|
| T1 | Two-sided review reveal — `ReviewCard` display component | `reviews/ReviewCard.tsx` [NEW] | ✅ Done |
| T1 | Two-sided review reveal — `ReviewPrompt` double-blind submission | `reviews/ReviewPrompt.tsx` [NEW] | ✅ Done |
| T1 | Reviews tab in detail panel with blind-reveal notice + placeholder cards | `AlumniDetailPanel.tsx` | ✅ Done |
| T2 | 4th stat tile: Sessions Completed (Upwork JSS pattern) | `AlumniDetailPanel.tsx` | ✅ Done |
| T2 | Trust fields added to type system (`sessionsCompleted`, `responseRate`, `completionRate`, `tier`) | `types/index.ts` | ✅ Done |
| T3 | Tiered "Top Mentor" gradient badge (replaces flat Verified chip on cards) | `AlumniCard.tsx` | ✅ Done |
| T3 | Top Mentor badge in detail panel hero | `AlumniDetailPanel.tsx` | ✅ Done |
| T3 | Top Mentor filter in sidebar (highest-intent filter, Superhost pattern) | `FilterPanel.tsx` | ✅ Done |
| T4 | Cancellation/refund trust strip below Book button | `AlumniDetailPanel.tsx` | ✅ Done |
| T5 | "Fastest response" sort option added | `browse/page.tsx`, `types/index.ts` | ✅ Done |
| T6 | Session safety/monitoring line (parent-visible for teen-facing product) | `AlumniDetailPanel.tsx` | ✅ Done |


---

> Analysis of the current browse + booking flow and a prioritised roadmap to premium feel.

---


## Current State Summary

**Browse page** (`/browse`): Full-featured — category tabs, sort, filters, grid/swipe views, slide-in detail panel, search overlay with debounce + recent searches. Skeleton loading. Empty and error states exist.

**Booking flow** (`/book/new` → `/book/[draftId]`):
- Step 1: Session type → Calendar picker (custom) → Time slots (Morning/Afternoon/Evening) → Create draft
- Step 2 (Review): BookingSummaryCard + agree-to-attend CTA
- Step 3 (Payment): UPI QR code + manual reference entry → simulated verification (timeout animations only)
- Step 4 (Confirmation): Checkmark animation + Google Calendar link + auto-redirect

**What's good**: Skeleton loading everywhere, dark theme consistent, framer-motion spring animations, Radix primitives, custom calendar, UPI QR generation, Google Calendar link in confirmation, TanStack Query for data.

**What feels "demo"**:
1. **Payment is fully simulated** — `submitPaymentRef` immediately auto-verifies with no actual reconciliation
2. **Emails are `console.log` only** — `sendEmail` prints to console + saves NotificationLog, never actually sends
3. **No running summary card during checkout** — user loses context of what they're paying for
4. **No timezone display** — slots show without timezone caption, creates uncertainty
5. **No scarcity/social proof** — no "X people looked at this" or "Only Y slots left"
6. **No itemised pricing** — lump sum, no platform fee breakdown
7. **No recently viewed** — localStorage-based trail on browse
8. **No smart empty states** — shows "no results" instead of nearest alternatives
9. **No booking confirmation email design** — template exists but is plain text, never delivered

---

## Priority Roadmap

### P0 — Essential for "This feels real"

These are the moments where a demo either sells the illusion or breaks it.

#### 1. Running Checkout Summary Card

**Files to create/modify:**
- `src/components/CheckoutSummaryCard.tsx` (new)
- `src/app/book/[draftId]/page.tsx` (integrate)

**What to build:**
A sticky sidebar/collapsible drawer (mobile) showing:
- Alumni photo + name + university
- Session type + duration
- Date + time (with timezone caption)
- Itemised pricing: `Session fee ₹X` + `Platform fee ₹Y` + `Total ₹Z`
- Alumni rating + session count (trust signal)

Desktop: sticky sidebar alongside the 3-step flow.
Mobile: collapsible drawer at top, or fixed bottom bar.

**Why:** The single biggest trust driver in checkout is the user never losing context of what they're paying for. Currently, the user sees the booking summary only in Step 1 (Review), then it disappears during payment.

#### 2. Timezone Caption Everywhere

**Files to modify:**
- `src/app/book/new/page.tsx` — next to time slots
- `src/app/book/[draftId]/page.tsx` — next to date/time in BookingSummaryCard
- `src/components/ConfirmationScreen.tsx` — in the detail card
- `src/components/BookingSummaryCard.tsx`
- `src/app/bookings/page.tsx` — in booking list items

**What to do:**
```tsx
<p className="text-xs text-muted-foreground">
  Times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}
</p>
```

**Why:** Nothing destroys trust faster than booking a call and being unsure what timezone you selected. This is a 5-minute change that disproportionately signals polish.

#### 3. Itemised Pricing Display

**What to change:**
Display payment amount as itemised lines rather than a single number:

```
Session fee (45 min call)          ₹399.00
Platform fee                       ₹39.90
                                   ───────
Total                              ₹438.90
```

Even if platform fee is 0 or hardcoded, showing the breakdown signals honesty. Hide fees until last step = untrustworthy. Show them upfront = premium.

**Files:**
- `src/components/PaymentModal.tsx` — in the amount display
- `src/components/CheckoutSummaryCard.tsx` (new)
- `src/components/BookingSummaryCard.tsx`

#### 4. Smart Empty Search States

**File:** `src/app/browse/page.tsx` (empty state section, ~line 350-370)

**Current:** "No alumni match your filters. Try widening your search."

**Upgrade:**
Suggest the nearest thing that does match:
- "No Cambridge alumni in Physics. Here are 3 in related fields: [results]"
- Drop the most restrictive filter and re-query with suggestions
- Show "Try removing [filter X] or [filter Y]" as clickable chips

**Why:** Amazon-tier search isn't about the query — it's about what happens when the query returns nothing. This single feature separates basic filters from premium discovery.

---

### P1 — High Perceived Value

#### 5. Recently Viewed Rail

**File:** `src/app/browse/page.tsx`

**What to build:**
A horizontal scrolling strip at the top of the browse page (below category tabs) showing the last 5 viewed alumni profiles. Only shows when there are items.

```
Recently viewed → [Card] [Card] [Card] ...
```

**Implementation:**
- Store `{ id, name, photo, university }[]` in `localStorage` under `alumnow-recently-viewed`
- Max 5 items, push to front on view, deduplicate
- Read on mount, render as mini AlumniCards (compact variant)
- Click opens the detail panel

**Files:**
- `src/app/browse/page.tsx` — add rail above results
- `src/components/AlumniCard.tsx` — add compact variant if needed

#### 6. Calendar → Booking Flow — AvailabilityPicker Polish

**File:** `src/app/book/new/page.tsx` (custom CalendarPicker + time slots)

**Current:** Inline month calendar → time slots grouped by Morning/Afternoon/Evening.

**Upgrade:**
- Two-pane layout: calendar left, time slots right (desktop)
- Only real available days are interactive (greyed out = no hover state at all)
- Timezone caption: "Times shown in Asia/Kolkata (IST)"
- Scrolling pill list for time slots, not grouped sections
- Selected slot uses active coral gradient
- Optional scarcity: "3 people looked at this slot today"

#### 7. Order Confirmation — SVG Checkmark Animation

**File:** `src/components/ConfirmationScreen.tsx`

**Current:** CheckCircle icon with spring scale animation from framer-motion.

**Upgrade:**
Replace with SVG path draw-in animation (~400ms):
```tsx
<svg viewBox="0 0 52 52">
  <circle cx="26" cy="26" r="25" fill="none" stroke="#22c55e" strokeWidth="2" />
  <motion.path
    fill="none" stroke="#22c55e" strokeWidth="3"
    d="M14 27l7 7 16-16"
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  />
</svg>
```
Followed by a scale-in of the detail card (staggered, 100ms after checkmark completes).

#### 8. Trust Signals on Cards and Profile

**Files:**
- `src/components/AlumniCard.tsx` — add response rate + session count
- `src/components/AlumniDetailPanel.tsx` — same
- `src/app/alumni/[id]/page.tsx` — in ProfileHeader or BioSection

**Add to card:**
- "Responds to 95% of messages" (real data or derived from response time)
- "X sessions completed" (count from booking data)
- Rating badge only if 4.0+

**Add to profile:**
- "X students booked this mentor" in the hero stats
- "Usually responds within Xh" with confidence

---

### P2 — Premium Differentiation

#### 9. Booking Confirmation Email HTML Template

**File:** `src/lib/email.ts`

**Current:** Plain text template, never actually sent (console.log only).

**Upgrade path (in order):**
1. **Design the HTML template** — responsive email with:
   - AlumNow logo + coral brand
   - "Your session is confirmed!" hero
   - Booking detail card (photo, name, date, time, duration)
   - Itemised pricing row
   - "Add to Calendar" button (Google + .ics download)
   - Meet link CTA button
   - Small "Need to reschedule?" link at bottom
2. **Wire to real email sending** — Resend / SendGrid / Postmark integration
   - Smallest lift to go from "demo" to "real": add `@react-email/components`, build a proper template

#### 10. Skeleton → Content Crossfade

**File:** `src/components/AlumniGrid.tsx`

**Current:** Skeletons appear → data loads → instant swap (likely pops).

**Upgrade:**
- Wrap content in `<AnimatePresence>` with `mode="wait"`
- Cross-fade + slight scale-in (0.97 → 1) on content reveal
- Skeletons fade out instead of disappearing instantly

#### 11. Recently Viewed → Persist Across Sessions

**File:** `src/app/browse/page.tsx`

Already mentioned in P1, but ensure it persists in localStorage with the full `AlumniCardData` subset so the rail renders instantly (no fetch needed for the mini cards).

#### 12. "Continue where you left off" CTA

**File:** `src/app/browse/page.tsx`

If the user has a booking in `pending_payment` status, show a banner at the top:
```
⏳ You have an incomplete booking with [Name]. Continue →
```
Links to `/book/[draftId]`. Check via a lightweight server action on mount.

---

## File Change Map

| File | Change |
|------|--------|
| `src/app/browse/page.tsx` | Recently viewed rail, smart empty states, continue-booking banner |
| `src/app/book/new/page.tsx` | Two-pane layout, timezone caption, scarcity microcopy, slot pill list |
| `src/app/book/[draftId]/page.tsx` | Integrate CheckoutSummaryCard, timezone on date/time |
| `src/components/CheckoutSummaryCard.tsx` | **[NEW]** Sticky sidebar with alumni info + itemised pricing |
| `src/components/PaymentModal.tsx` | Itemised pricing display, timezone context |
| `src/components/BookingSummaryCard.tsx` | Timezone caption, itemised pricing, trust signals |
| `src/components/ConfirmationScreen.tsx` | SVG checkmark draw-in animation |
| `src/components/AlumniCard.tsx` | Response rate, session count, compact variant for recently-viewed |
| `src/components/AlumniGrid.tsx` | Crossfade skeleton→content transition |
| `src/components/AlumniDetailPanel.tsx` | Trust signals (session count, response rate) |
| `src/app/alumni/[id]/page.tsx` | Session count in hero stats |
| `src/lib/email.ts` | HTML email template for booking confirmation |
| `src/types/index.ts` | Possibly add `responseRate` to `AlumniCardData` |

---

## Implementation Order

### Sprint 1 (P0 — 2-3 days)
1. Timezone caption everywhere (~30 min)
2. CheckoutSummaryCard + sticky sidebar (~3h)
3. Itemised pricing in PaymentModal (~1h)
4. Smart empty search states (~2h)
5. SVG checkmark animation in ConfirmationScreen (~30 min)

### Sprint 2 (P1 — 2-3 days)
6. Recently viewed rail on browse (~2h)
7. AvailabilityPicker polish (two-pane, slot pills, scarcity) (~4h)
8. Trust signals on cards + profile (~2h)

### Sprint 3 (P2 — 1-2 days)
9. HTML email template + wire to Resend/SendGrid (~3h)
10. Skeleton→content crossfade (~30 min)
11. "Continue where you left off" banner (~1h)

---

## Quick Wins (Do in 1 Hour)

1. **Timezone caption** — `<p>Times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>`
2. **Platform fee line** — hardcode 10% shown separately
3. **SVG checkmark** — replace `CheckCircle` icon with path draw-in
4. **Empty state suggestions** — clickable chips to remove restrictive filters
5. **"X sessions completed"** on ProfileHeader — count from real booking data

---

## Reference: Current Booking Types

From `prisma/schema.prisma` — prices in paise:
- `call_30` — 30 min, ₹299
- `call_45` — 45 min, ₹399
- `call_60` — 60 min, ₹499
- `group_40` — 40 min, ₹999 (max 6 participants)

Platform fee (proposed): 10% of session fee, displayed itemised.
