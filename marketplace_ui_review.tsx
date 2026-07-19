// ==========================================
// FILE: src/app/browse/page.tsx
// ==========================================
"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFilterOptions, saveAlumni, unsaveAlumni } from "@/actions/alumni.actions";
import { getSavedAlumni } from "@/actions/student.actions";
import { FilterPanel } from "@/components/FilterPanel";
import { AlumniGrid } from "@/components/AlumniGrid";
import { SwipeDeck } from "@/components/SwipeDeck";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlumniDetailPanel } from "@/components/AlumniDetailPanel";
import type { AlumniCardData, AlumniFilters } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { X, LayoutGrid, Heart, Sparkles, ArrowUpDown, ChevronDown } from "lucide-react";
import { SearchOverlay, SearchTrigger } from "@/components/SearchOverlay";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const ITEMS_PER_PAGE = 18;

const categoryTabs = [
  { label: "All", filters: {} as Record<string, unknown> },
  { label: "Top QS", filters: { qsTiers: ["top10", "top20"] } as Record<string, unknown> },
  { label: "1-on-1", filters: { sessionType: "1:1" } as Record<string, unknown> },
  { label: "Group", filters: { sessionType: "group" } as Record<string, unknown> },
  { label: "This Week", filters: { availability: "this_week" } as Record<string, unknown> },
];

function activeCategoryLabel(sp: URLSearchParams): string {
  for (const tab of categoryTabs) {
    if (tab.label === "All") continue;
    const match = Object.entries(tab.filters).every(([key, val]) => {
      const paramKey = key === "qsTiers" ? "qsTier" : key;
      if (Array.isArray(val)) return val.every((v) => sp.getAll(paramKey).includes(String(v)));
      return sp.get(paramKey) === String(val);
    });
    if (match) return tab.label;
  }
  return "All";
}

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "rating", label: "Rating" },
  { value: "newest", label: "Newest" },
];

function filtersFromSearchParams(sp: URLSearchParams): AlumniFilters {
  const qsTiers = sp.getAll("qsTier");
  return {
    search: sp.get("search") ?? undefined,
    university: sp.get("university") ?? undefined,
    country: sp.get("country") ?? undefined,
    course: sp.get("course") ?? undefined,
    studyLevel: sp.get("studyLevel") ?? undefined,
    gradYearMin: sp.get("gradYearMin") ? Number(sp.get("gradYearMin")) : undefined,
    gradYearMax: sp.get("gradYearMax") ? Number(sp.get("gradYearMax")) : undefined,
    qsTiers: qsTiers.length > 0 ? qsTiers : undefined,
    priceMin: sp.get("priceMin") ? Number(sp.get("priceMin")) : undefined,
    priceMax: sp.get("priceMax") ? Number(sp.get("priceMax")) : undefined,
    languages: sp.getAll("language").length > 0 ? sp.getAll("language") : undefined,
    minRating: sp.get("minRating") ?? undefined,
    availability: (sp.get("availability") as AlumniFilters["availability"]) ?? undefined,
    sessionType: (sp.get("sessionType") as AlumniFilters["sessionType"]) ?? undefined,
    sortBy: (sp.get("sortBy") as AlumniFilters["sortBy"]) ?? undefined,
  };
}

function filtersToParams(filters: AlumniFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (key === "qsTiers" && Array.isArray(value)) value.forEach((t) => params.append("qsTier", t));
    else if (key === "languages" && Array.isArray(value)) value.forEach((t) => params.append("language", t));
    else if (typeof value !== "object") params.set(key, String(value));
  });
  return params.toString();
}

const activeFilterLabels: Record<string, (v: any) => string> = {
  search: (v) => v,
  availability: (v: string) => v === "this_week" ? "This week" : "This month",
  sessionType: (v: string) => v === "1:1" ? "1-on-1" : "Group",
  studyLevel: (v: string) => v === "undergraduate" ? "Undergrad" : "Postgrad",
  qsTiers: (v: string[]) => v.map((t) => `QS ${t}`).join(", "),
  languages: (v: string[]) => v.join(", "),
  minRating: (v: string) => `${v}+ rating`,
  priceMin: (v: number) => `From ₹${v}`,
  priceMax: (v: number) => `Up to ₹${v}`,
  sortBy: (v) => `Sort: ${v}`,
};

export default function BrowsePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-[var(--color-bg)] pt-[88px] flex items-center justify-center">
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
      }>
        <BrowsePageContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function BrowsePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniCardData | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [data, setData] = useState<{ items: AlumniCardData[]; total: number; totalPages: number } | null>(null);
  const [savedItems, setSavedItems] = useState<AlumniCardData[]>([]);
  const [options, setOptions] = useState<{ universities: string[]; countries: string[]; courses: string[] }>({ universities: [], countries: [], courses: [] });
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);
  const [error, setError] = useState("");

  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const sortBy = (searchParams.get("sortBy") as AlumniFilters["sortBy"]) ?? "relevance";
  const tab = searchParams.get("view") === "saved" ? "saved" : "browse";
  const swipe = searchParams.get("swipe") === "1";
  const spStr = searchParams.toString();

  const queryParams = useMemo(() => ({ ...filters, sortBy, page: tab === "browse" ? page : 1, pageSize: ITEMS_PER_PAGE }), [filters, sortBy, page, tab]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const params = new URLSearchParams(filtersToParams(queryParams));
    params.set("page", String(queryParams.page ?? 1));
    params.set("pageSize", String(queryParams.pageSize ?? ITEMS_PER_PAGE));
    fetch(`/api/alumni?${params.toString()}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load alumni");
        return response.json();
      })
      .then((result) => { if (!cancelled) setData(result as any); })
      .catch(() => { if (!cancelled) { setError("Failed to load alumni."); setData({ items: [], total: 0, totalPages: 1 }); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [queryParams]);

  useEffect(() => {
    let cancelled = false;
    getFilterOptions(filters.country)
      .then((result) => { if (!cancelled) setOptions(result); })
      .catch(() => { if (!cancelled) setOptions({ universities: [], countries: [], courses: [] }); });
    return () => { cancelled = true; };
  }, [filters.country]);

  useEffect(() => {
    let cancelled = false;
    setSavedLoading(true);
    getSavedAlumni()
      .then((result) => { if (!cancelled) setSavedItems(result.map((s) => s.alumni) as unknown as AlumniCardData[]); })
      .catch(() => { if (!cancelled) setSavedItems([]); })
      .finally(() => { if (!cancelled) setSavedLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Reset page when search params (filters) change
  useEffect(() => { setPage(1); }, [spStr]);

  const items = (data?.items ?? []) as AlumniCardData[];
  const totalPages = data?.totalPages ?? 1;
  const hasMore = page < totalPages;
  const totalItems = data?.total ?? 0;

  const updateFilters = useCallback((next: Partial<AlumniFilters>) => {
    const merged = { ...filters, ...next };
    const qs = filtersToParams(merged);
    router.replace(`/browse${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [filters, router]);

  const clearFilters = useCallback(() => {
    router.replace("/browse", { scroll: false });
  }, [router]);

  const removeFilter = useCallback((key: string) => {
    const merged = { ...filters, [key]: undefined };
    const qs = filtersToParams(merged);
    router.replace(`/browse${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [filters, router]);

  const loadMore = useCallback(() => setPage((p) => Math.min(p + 1, totalPages)), [totalPages]);

  const handleSelect = useCallback((id: string) => {
    const alum = items.find((a) => a.id === id) ?? savedItems.find((a) => a.id === id);
    if (alum) setSelectedAlumni(alum);
  }, [items, savedItems]);

  useEffect(() => {
    const saved = sessionStorage.getItem("browse-scroll-y");
    if (saved) { requestAnimationFrame(() => window.scrollTo(0, Number(saved))); sessionStorage.removeItem("browse-scroll-y"); }
    return () => { sessionStorage.setItem("browse-scroll-y", String(window.scrollY)); };
  }, []);

  const activeFilters = Object.entries(filters).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0));

  const activeCat = activeCategoryLabel(searchParams);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">

      {/* Sub-nav bar */}
      <div className="sticky top-0 z-20 border-b border-white/6 bg-[#0D0D0D]/88 pt-16 shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 h-12 flex items-center gap-4">
          {/* Category pills */}
          <div className="hidden md:flex items-center gap-0.5">
            {categoryTabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => {
                  const p = new URLSearchParams();
                  const s = searchParams.get("search");
                  if (s) p.set("search", s);
                  Object.entries(tab.filters).forEach(([k, v]) => {
                    if (k === "qsTiers" && Array.isArray(v)) v.forEach((item) => p.append("qsTier", String(item)));
                    else if (Array.isArray(v)) v.forEach((item) => p.append(k, String(item)));
                    else p.set(k, String(v));
                  });
                  const qs = p.toString();
                  router.replace(`/browse${qs ? `?${qs}` : ""}`, { scroll: false });
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  activeCat === tab.label
                    ? "bg-[#E8573A] text-white shadow-[0_8px_24px_rgba(232,87,58,0.24)]"
                    : "text-white/42 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <SearchTrigger onClick={() => setSearchOpen(true)} />

          {/* Browse / Saved toggle */}
          <div className="flex items-center rounded-xl bg-white/[0.06] p-0.5">
            <button
              onClick={() => {
                const p = new URLSearchParams(filtersToParams(filters));
                p.delete("view");
                router.replace(`/browse?${p.toString()}`, { scroll: false });
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                  tab === "browse" ? "bg-[#232326] text-white shadow-sm" : "text-white/35 hover:text-white"
              }`}
            >
              Browse
            </button>
            <button
              onClick={() => {
                const p = new URLSearchParams(filtersToParams(filters));
                p.set("view", "saved");
                router.replace(`/browse?${p.toString()}`, { scroll: false });
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all inline-flex items-center gap-1 ${
                  tab === "saved" ? "bg-[#232326] text-white shadow-sm" : "text-white/35 hover:text-white"
              }`}
            >
              <Heart size={11} />
              Saved
              {savedItems.length ? <span className="text-[10px] opacity-60">({savedItems.length})</span> : null}
            </button>
          </div>

          {/* Swipe toggle */}
          <button
            onClick={() => {
              const p = new URLSearchParams(filtersToParams(filters));
              if (swipe) p.delete("swipe");
              else p.set("swipe", "1");
              router.replace(`/browse?${p.toString()}`, { scroll: false });
            }}
            className={`p-2 rounded-lg transition-all ${
              swipe ? "bg-[#E8573A] text-white" : "text-white/35 hover:text-white hover:bg-white/[0.06]"
            }`}
            title={swipe ? "Grid view" : "Swipe view"}
          >
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-white">Marketplace</h1>
            <p className="text-sm text-white/45 mt-0.5">
              {totalItems > 0 ? `${totalItems} alumni available` : "Browse verified alumni mentors"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/35">
            <ArrowUpDown size={13} />
            <span>Sort:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  const p = new URLSearchParams(searchParams.toString());
                  if (e.target.value === "relevance") p.delete("sortBy");
                  else p.set("sortBy", e.target.value);
                  router.replace(`/browse${p.toString() ? `?${p.toString()}` : ""}`, { scroll: false });
                }}
                className="appearance-none bg-transparent text-xs font-semibold text-white outline-none cursor-pointer pr-4"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-white/35" />
            </div>
          </div>
        </div>

        {/* Active filter pills */}
        <AnimatePresence>
          {activeFilters.length >= 1 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 flex flex-wrap items-center gap-2">
              <Sparkles size={12} className="text-[#E8573A]" />
              {activeFilters.map(([key, val]) => (
                <span key={key} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-white shadow-sm">
                  {activeFilterLabels[key]?.(val) ?? key}
                  <button onClick={() => removeFilter(key)} className="text-white/35 hover:text-white transition-colors"><X size={11} /></button>
                </span>
              ))}
              <button onClick={clearFilters} className="text-xs text-[#E8573A] hover:underline font-medium ml-1 transition-colors">Clear all</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main grid: sidebar + content */}
        <div className="flex gap-6">
          {/* Filter sidebar */}
          {tab === "browse" && (
            <div className="w-[240px] shrink-0">
              <FilterPanel
                filters={filters}
                options={{
                  universities: options.universities,
                  countries: options.countries,
                  courses: options.courses,
                }}
                onChange={updateFilters}
                onClear={clearFilters}
                resultCount={data ? totalItems : undefined}
              />
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 min-w-0">
            {error && (
              <div className="rounded-2xl border border-dashed border-red-300 bg-red-50 px-6 py-12 text-center" role="alert">
                <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
                <p className="mt-2 text-sm text-red-500">{error}</p>
                <Button className="mt-4" variant="outline" onClick={() => setPage((p) => p)}>Retry</Button>
              </div>
            )}

            {!error && tab === "saved" && savedLoading && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={`sv-sk-${i}`} className="rounded-lg border border-white/5 bg-[#1A1A1A] overflow-hidden">
                    <div className="aspect-[4/3] bg-[var(--color-surface)]" />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-5 w-3/4 rounded-md" />
                      <Skeleton className="h-4 w-1/2 rounded-md" />
                      <Skeleton className="h-4 w-2/3 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!error && swipe && tab === "browse" ? (
              <SwipeDeck
                items={items}
                onSave={async (id) => { await saveAlumni(id); return { success: true }; }}
                onUndoSave={(id) => unsaveAlumni(id)}
              />
            ) : !error && tab === "saved" ? (
              savedItems.length === 0 && !savedLoading ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-20 text-center">
                  <Heart size={36} className="mx-auto text-[var(--color-text-tertiary)]" />
                  <h2 className="mt-4 text-lg font-semibold text-white">No saved alumni yet</h2>
                  <p className="mt-2 text-sm text-white/30">Click the heart icon to save alumni you&apos;re interested in.</p>
                  <Button className="mt-5" variant="outline" onClick={() => router.push("/browse")}>Browse marketplace</Button>
                </div>
              ) : (
                <AlumniGrid items={savedItems} hasMore={false} loadMore={() => {}} loading={false} onSelect={handleSelect} />
              )
            ) : !error && tab === "browse" ? (
              <AlumniGrid items={items} hasMore={hasMore} loadMore={loadMore} loading={loading} onSelect={handleSelect} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Slide-in detail panel */}
      <AlumniDetailPanel alumni={selectedAlumni} onClose={() => setSelectedAlumni(null)} />

      {/* Search overlay */}
      <SearchOverlay
        open={searchOpen}
        onOpenChange={setSearchOpen}
        value={filters.search ?? ""}
        onChange={(v) => {
          const merged = { ...filters, search: v || undefined };
          const qs = filtersToParams(merged);
          router.replace(`/browse${qs ? `?${qs}` : ""}`, { scroll: false });
        }}
      />
    </div>
  );
}

// ==========================================
// FILE: src/components/AlumniGrid.tsx
// ==========================================
"use client";
import { useEffect, useRef } from "react";
import { AlumniCard } from "./AlumniCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { AlumniCardData } from "@/types";

export function AlumniGrid({ items, hasMore, loadMore, loading, onSelect }: {
  items: AlumniCardData[];
  hasMore: boolean;
  loadMore: () => void;
  loading: boolean;
  onSelect?: (id: string) => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting && hasMore && !loading) loadMore(); },
      { rootMargin: "600px" }
    );
    observerRef.current.observe(node);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadMore, loading]);

  return (
    <>
      {items.length > 0 && (
        <div
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          key={items.map((i) => i.id).join(",")}
        >
          {items.map((item, idx) => (
            <div key={item.id}>
              <AlumniCard alumni={item} index={idx} onSelect={onSelect} />
            </div>
          ))}
        </div>
      )}

      {/* Initial loading skeleton (12 cards) */}
      {loading && items.length === 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`sk-${i}`} className="rounded-lg border border-white/5 bg-[#1A1A1A] overflow-hidden">
              <div className="aspect-[4/3] bg-[var(--color-surface)]" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load-more skeleton (3 cards) */}
      {loading && items.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 mt-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`lm-sk-${i}`} className="rounded-lg border border-white/5 bg-[#1A1A1A] overflow-hidden">
              <div className="aspect-[4/3] bg-[var(--color-surface)]" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-10" aria-hidden="true" />

      {!hasMore && items.length > 0 && (
        <p className="py-8 text-center text-sm text-white/30" aria-live="polite">
          You&apos;ve seen all {items.length} alumni
        </p>
      )}

      {!loading && hasMore && (
        <div className="flex justify-center py-6">
          <Button variant="outline" onClick={loadMore}>Load more</Button>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-20 text-center">
          <h2 className="text-lg font-semibold text-white">No alumni match your filters</h2>
          <p className="mt-2 text-sm text-white/30">Try widening your search or clearing the filters.</p>
        </div>
      )}
    </>
  );
}

// ==========================================
// FILE: src/components/SwipeDeck.tsx
// ==========================================
"use client";
import { useCallback, useEffect, useRef, useState, useMemo, memo } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { RotateCcw, Heart, X as XIcon, Loader2, Sparkles } from "lucide-react";
import { AlumniCard } from "./AlumniCard";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useImagePreloader } from "@/lib/hooks/useImagePreloader";
import type { AlumniCardData } from "@/types";

interface SwipeCardInnerProps {
  alumni: AlumniCardData;
  onSave: () => void;
  onSkip: () => void;
}

const SwipeCardInner = memo(function SwipeCardInner({ alumni, onSave, onSkip }: SwipeCardInnerProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-20, 0, 20]);
  const likeOpacity = useTransform(x, [0, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 100;
    const velocityThreshold = 400;
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      onSave();
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      onSkip();
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, willChange: "transform" }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.8, right: 0.8 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: x.get() > 0 ? 600 : -600, opacity: 0, rotate: x.get() > 0 ? 15 : -15 }}
      transition={{ duration: 0.3, ease: [0.18, 0.89, 0.32, 1.28] }}
    >
      <motion.div
        className="pointer-events-none absolute left-5 top-5 z-10 rounded-xl border-4 border-green-500 bg-white px-4 py-2 shadow-lg"
        style={{ opacity: likeOpacity, rotate: -12 }}
      >
        <Heart size={32} className="fill-green-500 text-green-500" />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-5 top-5 z-10 rounded-xl border-4 border-red-500 bg-white px-4 py-2 shadow-lg"
        style={{ opacity: nopeOpacity, rotate: 12 }}
      >
        <XIcon size={32} className="text-red-500" />
      </motion.div>
      <div className="absolute inset-0 rounded-xl border border-border shadow-sm">
        <AlumniCard alumni={alumni} variant="swipe" />
      </div>
    </motion.div>
  );
});

export function SwipeDeck({
  items,
  onSave,
  onUndoSave,
}: {
  items: AlumniCardData[];
  onSave: (id: string) => Promise<{ success: boolean }>;
  onUndoSave: (id: string) => Promise<{ success: boolean }>;
}) {
  const [index, setIndex] = useState(0);
  const [lastAction, setLastAction] = useState<{ index: number; direction: "left" | "right" } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showEmptyUndo, setShowEmptyUndo] = useState(false);
  const [swipeReady, setSwipeReady] = useState(true);
  const lastActionTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const emptyUndoTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const announcerRef = useRef<HTMLDivElement>(null);
  const prevItemsLengthRef = useRef(items.length);

  const images = useMemo(
    () => items.map((item) => item.profilePhotoUrl ?? `https://picsum.photos/seed/${item.id}/500/400`),
    [items]
  );
  useImagePreloader(images, index);

  const current = items[index];
  const hasItems = items.length > 0;
  const nextCards = hasItems ? items.slice(index + 1, index + 3) : [];

  useEffect(() => {
    if (items.length > 0 && prevItemsLengthRef.current === 0) {
      setIndex(0);
      setLastAction(null);
    }
    prevItemsLengthRef.current = items.length;
  }, [items.length]);

  useEffect(() => {
    if (lastAction) {
      clearTimeout(lastActionTimeoutRef.current);
      lastActionTimeoutRef.current = setTimeout(() => setLastAction(null), 3000);
    }
    return () => clearTimeout(lastActionTimeoutRef.current);
  }, [lastAction]);

  useEffect(() => {
    if (!current && items.length > 0) {
      setShowEmptyUndo(true);
      clearTimeout(emptyUndoTimeoutRef.current);
      emptyUndoTimeoutRef.current = setTimeout(() => setShowEmptyUndo(false), 5000);
    }
    return () => clearTimeout(emptyUndoTimeoutRef.current);
  }, [current, items.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat || !current) return;
      if (e.key === "ArrowRight") handleSwipe("right");
      if (e.key === "ArrowLeft") handleSwipe("left");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, swipeReady]);

  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = message;
    }
  }, []);

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (!current || !swipeReady) return;

      setSwipeReady(false);

      if (direction === "right") {
        setSavingId(current.id);
        const result = await onSave(current.id);
        setSavingId(null);
        if (!result.success) {
          setSwipeReady(true);
          announce("Failed to save. Please try again.");
          return;
        }
        announce(`Saved ${current.fullName}`);
      } else {
        announce(`Skipped ${current.fullName}`);
      }

      setLastAction({ index, direction });
      setIndex((i) => i + 1);
      setTimeout(() => setSwipeReady(true), 350);
    },
    [index, current, onSave, announce, swipeReady]
  );

  const handleUndo = useCallback(async () => {
    if (!lastAction) return;

    clearTimeout(lastActionTimeoutRef.current);

    if (lastAction.direction === "right") {
      const cardId = items[lastAction.index]?.id;
      if (cardId) {
        await onUndoSave(cardId);
      }
    }

    setIndex(lastAction.index);
    setLastAction(null);
    announce("Last action undone");
  }, [lastAction, items, onUndoSave, announce]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md">
        <div className="relative flex min-h-[560px] items-center justify-center">
          <div className="text-center">
            <Skeleton className="mx-auto mb-4 h-80 w-full rounded-xl" />
            <Skeleton className="mx-auto h-6 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <motion.div
        className="mx-auto max-w-md"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative flex min-h-[560px] items-center justify-center">
          <div className="text-center">
            <Sparkles className="mx-auto mb-4 text-accent" size={40} />
            <p className="text-lg font-semibold text-primary">You&apos;ve seen everyone!</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back later for new alumni.</p>
          </div>
        </div>
        {showEmptyUndo && lastAction && (
          <div className="mt-5 flex justify-center">
            <Button variant="outline" onClick={handleUndo}>
              <RotateCcw size={18} /> Undo Last
            </Button>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div ref={announcerRef} className="sr-only" role="status" aria-live="polite" />

      <div className="relative min-h-[560px]" style={{ perspective: "1000px" }}>
        {nextCards.map((card, i) => {
          const zIndex = (nextCards.length - i) * 2;
          return (
            <div
              key={card.id}
              className="absolute inset-0 overflow-hidden rounded-xl border border-border shadow-sm"
              style={{
                zIndex,
                transform: `scale(${1 - (i + 1) * 0.03}) translateY(${(i + 1) * 8}px)`,
                opacity: 1 - (i + 1) * 0.15,
              }}
            >
              <AlumniCard alumni={card} variant="swipe" />
            </div>
          );
        })}

        <AnimatePresence mode="popLayout">
          <SwipeCardInner
            key={current.id + (lastAction?.index ?? 0)}
            alumni={current}
            onSave={() => handleSwipe("right")}
            onSkip={() => handleSwipe("left")}
          />
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          className="h-14 w-14 rounded-full border-2 p-0 hover:border-red-400 hover:bg-red-50 hover:text-red-500"
          aria-label="Skip"
          onClick={() => handleSwipe("left")}
          disabled={!swipeReady}
        >
          <XIcon size={22} />
        </Button>
        <Button
          variant="accent"
          className="h-16 w-16 rounded-full p-0 shadow-lg shadow-accent/25"
          aria-label="Save"
          onClick={() => handleSwipe("right")}
          disabled={!swipeReady || savingId === current.id}
        >
          {savingId === current.id ? <Loader2 size={22} className="animate-spin" /> : <Heart size={22} />}
        </Button>
        {lastAction && (
          <motion.div initial={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
            <Button variant="ghost" className="h-14 w-14 rounded-full" aria-label="Undo last action" onClick={handleUndo}>
              <RotateCcw size={20} />
            </Button>
          </motion.div>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Swipe right to save &middot; left to skip &middot; or use arrow keys
      </p>
    </div>
  );
}

// ==========================================
// FILE: src/components/FilterPanel.tsx
// ==========================================
"use client";
import { useState, useEffect, useRef } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Book, Globe, Languages, Star, BookOpen, Award, DollarSign, Calendar, GraduationCap, Video, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AlumniFilters } from "@/types";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

type Options = { universities: string[]; countries: string[]; courses: string[] };

const qsTierOptions = [
  { value: "top10", label: "Top 10" },
  { value: "top20", label: "Top 20" },
  { value: "top50", label: "Top 50" },
  { value: "top100", label: "Top 100" },
  { value: "top200", label: "Top 200" },
  { value: "unranked", label: "Unranked" },
];

const languageOptions = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Mandarin", label: "Mandarin" },
];

const ratingOptions = [
  { value: "4", label: "4+ \u2605" },
  { value: "3", label: "3+ \u2605" },
  { value: "2", label: "2+ \u2605" },
];

const GRAD_YEAR_MIN = 2015;
const GRAD_YEAR_MAX = new Date().getFullYear();

function FilterSection({ title, count, defaultOpen = true, icon, children }: { title: string; count?: number; defaultOpen?: boolean; icon?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <span className="flex items-center gap-1.5">
          {count != null && count > 0 && (
            <span className="text-[10px] font-bold text-coral bg-coral/10 px-1.5 py-0.5 rounded-full">{count}</span>
          )}
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pb-3">{children}</div>
      </div>
    </div>
  );
}

function ChipGroup({ options, selected, onChange }: { options: { value: string; label: string }[]; selected?: string[]; onChange: (vals: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected?.includes(opt.value) ?? false;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(active ? selected!.filter((v) => v !== opt.value) : [...(selected ?? []), opt.value])}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105 ${active ? "chip-active" : "chip-inactive"}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function PillGroup<T extends string>({ options, selected, onChange }: { options: { value: T; label: string }[]; selected: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt, index) => (
        <button
          key={`${opt.value}-${index}`}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105 ${selected === opt.value ? "chip-active" : "chip-inactive"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function DualRangeSlider({ min, max, value, onChange }: { min: number; max: number; value: [number, number] | undefined; onChange: (v: [number, number] | undefined) => void }) {
  const [local, setLocal] = useState<[number, number]>(value ?? [min, max]);
  const [minVal, maxVal] = local;
  const active = value != null;

  const updateMin = (v: number) => {
    const next: [number, number] = [Math.min(v, maxVal - 1), maxVal];
    setLocal(next);
    if (next[0] !== min || next[1] !== max) onChange(next);
    else onChange(undefined);
  };
  const updateMax = (v: number) => {
    const next: [number, number] = [minVal, Math.max(v, minVal + 1)];
    setLocal(next);
    if (next[0] !== min || next[1] !== max) onChange(next);
    else onChange(undefined);
  };
  const range = max - min;
  const leftPct = ((minVal - min) / range) * 100;
  const rightPct = ((max - maxVal) / range) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-white/50">
          {minVal} – {maxVal}
        </span>
        {active && (
          <button
            onClick={() => { setLocal([min, max]); onChange(undefined); }}
            className="text-[11px] text-coral hover:underline font-medium"
          >
            Reset
          </button>
        )}
      </div>
      <div className="dual-slider">
        <div className="track" style={{ left: `${leftPct}%`, right: `${rightPct}%` }} />
        <input type="range" min={min} max={max} value={minVal} onChange={(e) => updateMin(Number(e.target.value))} />
        <input type="range" min={min} max={max} value={maxVal} onChange={(e) => updateMax(Number(e.target.value))} />
      </div>
    </div>
  );
}

export function FilterPanel({
  filters,
  options,
  onChange,
  onClear,
  resultCount,
}: {
  filters: AlumniFilters;
  options: Options;
  onChange: (next: Partial<AlumniFilters>) => void;
  onClear: () => void;
  resultCount?: number;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [uniInput, setUniInput] = useState(filters.university ?? "");
  const [courseInput, setCourseInput] = useState(filters.course ?? "");
  const [countryInput, setCountryInput] = useState("");

  const debouncedUni = useDebounce(uniInput, 300);
  const debouncedCourse = useDebounce(courseInput, 300);
  const debouncedCountryInput = useDebounce(countryInput, 300);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current({ university: debouncedUni || undefined });
  }, [debouncedUni]);

  useEffect(() => {
    onChangeRef.current({ course: debouncedCourse || undefined });
  }, [debouncedCourse]);

  useEffect(() => {
    setUniInput(filters.university ?? "");
  }, [filters.university]);

  useEffect(() => {
    setCourseInput(filters.course ?? "");
  }, [filters.course]);

  const countryList = options.countries.map((c) => ({ value: c, label: c }));
  const filteredCountries = debouncedCountryInput.trim()
    ? countryList.filter((c) => c.label.toLowerCase().includes(debouncedCountryInput.toLowerCase()))
    : countryList;

  const activeCount = [
    filters.university,
    filters.country,
    filters.course,
    filters.studyLevel && filters.studyLevel !== "both" ? filters.studyLevel : null,
    (filters.sessionType && filters.sessionType !== "both") ? filters.sessionType : null,
    filters.gradYearMin || filters.gradYearMax ? "grad" : null,
    filters.qsTiers?.length ? `qs-${filters.qsTiers.length}` : null,
    (filters.availability && filters.availability !== "any") ? filters.availability : null,
    filters.priceMin || filters.priceMax ? "price" : null,
    filters.languages?.length ? `lang-${filters.languages.length}` : null,
    filters.minRating ? "rating" : null,
  ].filter(Boolean).length;

  const content = (
    <div className="rounded-2xl border border-white/5 bg-[#1A1A1A] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Filters</h2>
            {resultCount != null && (
              <p className="text-xs text-white/50 mt-0.5">{resultCount} result{resultCount !== 1 ? "s" : ""}</p>
            )}
          </div>
          {activeCount > 0 && (
            <button onClick={onClear} className="text-xs font-semibold text-coral hover:underline transition-all">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter sections */}
      <div className="px-5">
        {/* University */}
        <FilterSection title="University" count={filters.university ? 1 : 0} icon={<Book size={14} />}>
          <input
            type="text"
            placeholder="Search universities..."
            className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/15 transition-all placeholder:text-white/25"
            value={uniInput}
            onChange={(e) => setUniInput(e.target.value)}
          />
        </FilterSection>

        {/* Country */}
        <FilterSection title="Country" count={filters.country ? 1 : 0} icon={<Globe size={14} />}>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search countries..."
              className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/15 transition-all placeholder:text-white/25"
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value)}
            />
            {filteredCountries.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {filteredCountries.map((c) => {
                  const active = filters.country === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => onChange({ country: active ? undefined : c.value })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105 ${active ? "chip-active" : "chip-inactive"}`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-white/25">No countries match</p>
            )}
          </div>
        </FilterSection>

        {/* Language */}
        <FilterSection title="Language" count={filters.languages?.length} icon={<Languages size={14} />}>
          <ChipGroup options={languageOptions} selected={filters.languages} onChange={(vals) => onChange({ languages: vals.length > 0 ? vals : undefined })} />
        </FilterSection>

        {/* Minimum Rating */}
        <FilterSection title="Minimum Rating" count={filters.minRating ? 1 : 0} icon={<Star size={14} />}>
          <PillGroup options={ratingOptions} selected={filters.minRating ?? ""} onChange={(v) => onChange({ minRating: v || undefined })} />
        </FilterSection>

        {/* Course */}
        <FilterSection title="Course" count={filters.course ? 1 : 0} icon={<BookOpen size={14} />}>
          <input
            type="text"
            placeholder="Search courses..."
            className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/15 transition-all placeholder:text-white/25"
            value={courseInput}
            onChange={(e) => setCourseInput(e.target.value)}
          />
        </FilterSection>

        {/* QS Ranking */}
        <FilterSection title="QS Ranking" count={filters.qsTiers?.length} icon={<Award size={14} />}>
          <ChipGroup options={qsTierOptions} selected={filters.qsTiers} onChange={(vals) => onChange({ qsTiers: vals.length > 0 ? vals : undefined })} />
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range" count={filters.priceMin || filters.priceMax ? 1 : 0} icon={<DollarSign size={14} />}>
          <DualRangeSlider
            min={0}
            max={10000}
            value={filters.priceMin != null || filters.priceMax != null ? [filters.priceMin ?? 0, filters.priceMax ?? 10000] : undefined}
            onChange={(val) => onChange({ priceMin: val?.[0], priceMax: val?.[1] })}
          />
        </FilterSection>

        {/* Graduation Year */}
        <FilterSection title="Graduation Year" count={filters.gradYearMin || filters.gradYearMax ? 1 : 0} icon={<Calendar size={14} />}>
          <DualRangeSlider
            min={GRAD_YEAR_MIN}
            max={GRAD_YEAR_MAX}
            value={filters.gradYearMin || filters.gradYearMax ? [filters.gradYearMin ?? GRAD_YEAR_MIN, filters.gradYearMax ?? GRAD_YEAR_MAX] : undefined}
            onChange={(val) => onChange({ gradYearMin: val?.[0], gradYearMax: val?.[1] })}
          />
        </FilterSection>

        {/* Study Level */}
        <FilterSection title="Study Level" icon={<GraduationCap size={14} />}>
          <PillGroup
            options={[
              { value: "both" as const, label: "All" },
              { value: "undergraduate" as const, label: "Undergrad" },
              { value: "postgraduate" as const, label: "Postgrad" },
            ]}
            selected={filters.studyLevel ?? "both"}
            onChange={(v) => onChange({ studyLevel: v === "both" ? undefined : v })}
          />
        </FilterSection>

        {/* Session Type */}
        <FilterSection title="Session Type" icon={<Video size={14} />}>
          <PillGroup
            options={[
              { value: "both" as const, label: "All" },
              { value: "1:1" as const, label: "1-on-1" },
              { value: "group" as const, label: "Group" },
            ]}
            selected={filters.sessionType ?? "both"}
            onChange={(v) => onChange({ sessionType: v === "both" ? undefined : v })}
          />
        </FilterSection>

        {/* Availability */}
        <FilterSection title="Availability" icon={<Clock size={14} />}>
          <PillGroup
            options={[
              { value: "any" as const, label: "Any" },
              { value: "this_week" as const, label: "This week" },
              { value: "this_month" as const, label: "This month" },
            ]}
            selected={filters.availability ?? "any"}
            onChange={(v) => onChange({ availability: v === "any" ? undefined : v })}
          />
        </FilterSection>
      </div>

      {/* Apply button */}
      <div className="px-5 py-4">
        <Button
          className="w-full rounded-lg"
          onClick={() => { if (drawerOpen) setDrawerOpen(false); }}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-[#1A1A1A] text-sm font-medium text-white hover:bg-white/5 transition-all"
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">{activeCount}</span>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0D0D0D] p-4 shadow-2xl animate-slide-up">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="font-semibold text-white">Filters</h2>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">{content}</div>
    </>
  );
}

// ==========================================
// FILE: src/components/AlumniDetailPanel.tsx
// ==========================================
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Star, Clock3, GraduationCap, ChevronDown, Video, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AlumniCardData } from "@/types";

interface DetailPanelProps {
  alumni: AlumniCardData | null;
  onClose: () => void;
}

export function AlumniDetailPanel({ alumni, onClose }: DetailPanelProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [tab, setTab] = useState<"overview" | "details">("overview");
  const [showFullBio, setShowFullBio] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alumni) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [alumni]);

  if (!alumni) return null;

  const src = alumni.profilePhotoUrl ?? `https://picsum.photos/seed/${alumni.id}/800/600`;
  const hasSessions = alumni.sessionTypes?.length > 0;
  const lowestPrice = hasSessions ? Math.min(...alumni.sessionTypes.map((s) => s.pricePaise)) : null;
  const responseTime = alumni.avgResponseTimeHours;
  const bioLong = (alumni.bio?.length ?? 0) > 150;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-[#0D0D0D] shadow-2xl flex flex-col slide-panel ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#0D0D0D]/90 backdrop-blur-sm shadow-md hover:bg-[#1A1A1A] transition-all"
        >
          <X size={16} className="text-white" />
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero image */}
          <div className="relative" style={{ aspectRatio: "16 / 10" }}>
            {imgError ? (
              <div className="flex h-full items-center justify-center bg-[#1A1A1A]">
                <span className="text-5xl font-bold text-white/20">
                  {alumni.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
              </div>
            ) : (
              <img
                src={src}
                alt={alumni.fullName}
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
              <h2 className="text-2xl font-bold text-white drop-shadow-sm">{alumni.fullName}</h2>
              <p className="text-sm text-white/80 mt-0.5">{alumni.universityName}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5 px-5">
            {[
              { key: "overview" as const, label: "Overview" },
              { key: "details" as const, label: "Details" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  tab === t.key
                    ? "text-coral border-coral"
                    : "text-white/25 border-transparent hover:text-white/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-5 py-5 space-y-5">
            {tab === "overview" && (
              <>
                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white/5 p-4 text-center">
                    <Clock3 size={16} className="mx-auto text-white/25 mb-1" />
                    <p className="text-lg font-bold text-white">{responseTime != null ? `${Math.round(responseTime)}h` : "—"}</p>
                    <p className="text-[11px] text-white/25">Response time</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4 text-center">
                    <GraduationCap size={16} className="mx-auto text-white/25 mb-1" />
                    <p className="text-lg font-bold text-white">{alumni.graduationYearJbcn}</p>
                    <p className="text-[11px] text-white/25">Graduated</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4 text-center">
                    <Star size={16} className="mx-auto text-amber-400 mb-1" />
                    <p className="text-lg font-bold text-white">{alumni.ratingAvg != null ? alumni.ratingAvg.toFixed(1) : "—"}</p>
                    <p className="text-[11px] text-white/25">Rating</p>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">About</h3>
                  <p className={`text-[13px] leading-6 text-white/50 ${!showFullBio && bioLong ? "line-clamp-3" : ""}`}>
                    {alumni.bio ?? "No bio provided yet."}
                  </p>
                  {bioLong && (
                    <button
                      onClick={() => setShowFullBio(!showFullBio)}
                      className="mt-1 text-xs font-medium text-coral hover:underline inline-flex items-center gap-0.5"
                    >
                      {showFullBio ? "Show less" : "More details"} <ChevronDown size={12} className={showFullBio ? "rotate-180" : ""} />
                    </button>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-xs text-white/25">Country</span>
                    <span className="text-sm font-medium text-white">{alumni.country}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-xs text-white/25">Course</span>
                    <span className="text-sm font-medium text-white">{alumni.course}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-xs text-white/25">QS Tier</span>
                    <span className="text-sm font-medium text-white capitalize">{alumni.qsRankingTier}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-xs text-white/25">Languages</span>
                    <span className="text-sm font-medium text-white">{alumni.languages?.join(", ") || "—"}</span>
                  </div>
                </div>

                {/* Session types */}
                {hasSessions && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Available sessions</h3>
                    <div className="space-y-2">
                      {alumni.sessionTypes.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                          <div className="flex items-center gap-2">
                            {s.type === "group_40" ? <Users size={14} className="text-white/25" /> : <Video size={14} className="text-white/25" />}
                            <div>
                              <p className="text-sm font-medium text-white capitalize">{s.type.replace("_", " ")}</p>
                              {s.descriptionOneLiner && (
                                <p className="text-[11px] text-white/25">{s.descriptionOneLiner}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-white">₹{Math.round(s.pricePaise / 100)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "details" && (
              <div className="space-y-4">
                <p className="text-sm text-white/50">
                  {alumni.bio ?? "No additional details available."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {alumni.languages?.map((lang) => (
                    <span key={lang} className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/50">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="shrink-0 border-t border-white/5 bg-[#0D0D0D] px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              {lowestPrice != null && (
                <p className="text-xl font-bold text-white">₹{Math.round(lowestPrice / 100)}</p>
              )}
              <p className="text-xs text-white/25">Starting price</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-white/50">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {alumni.ratingAvg != null ? `${alumni.ratingAvg.toFixed(1)} (${alumni.ratingCount})` : "No ratings"}
            </div>
          </div>
          <Button className="w-full rounded-lg" onClick={() => router.push(`/book/new?alumniId=${alumni.id}`)}>Book a session</Button>
        </div>
      </div>
    </>
  );
}

// ==========================================
// FILE: src/components/SearchOverlay.tsx
// ==========================================
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { Keyboard } from "@/components/ui/keyboard";

const KEY_CHAR: Record<string, string> = {
  KeyA: "a", KeyB: "b", KeyC: "c", KeyD: "d", KeyE: "e", KeyF: "f",
  KeyG: "g", KeyH: "h", KeyI: "i", KeyJ: "j", KeyK: "k", KeyL: "l",
  KeyM: "m", KeyN: "n", KeyO: "o", KeyP: "p", KeyQ: "q", KeyR: "r",
  KeyS: "s", KeyT: "t", KeyU: "u", KeyV: "v", KeyW: "w", KeyX: "x",
  KeyY: "y", KeyZ: "z",
  Digit0: "0", Digit1: "1", Digit2: "2", Digit3: "3", Digit4: "4",
  Digit5: "5", Digit6: "6", Digit7: "7", Digit8: "8", Digit9: "9",
  Space: " ", Minus: "-", Equal: "=",
  BracketLeft: "[", BracketRight: "]", Backslash: "\\",
  Semicolon: ";", Quote: "'",
  Comma: ",", Period: ".", Slash: "/",
  Backquote: "`",
};

const SHIFTED: Record<string, string> = {
  ...Object.fromEntries([...Array(26)].map((_, i) => [String.fromCharCode(65 + i), String.fromCharCode(65 + i)])),
  Digit1: "!", Digit2: "@", Digit3: "#", Digit4: "$", Digit5: "%",
  Digit6: "^", Digit7: "&", Digit8: "*", Digit9: "(", Digit0: ")",
  Minus: "_", Equal: "+",
  BracketLeft: "{", BracketRight: "}", Backslash: "|",
  Semicolon: ":", Quote: "\"",
  Comma: "<", Period: ">", Slash: "?",
  Backquote: "~",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
}

export function SearchOverlay({ open, onOpenChange, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value);
  const shiftRef = useRef(false);
  const skipDebounce = useRef(true);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setInputValue(value);
      skipDebounce.current = true;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, value]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (skipDebounce.current) {
      skipDebounce.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onChangeRef.current(inputValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftRef.current = e.type === "keydown";
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handler);
    return () => { window.removeEventListener("keydown", handler); window.removeEventListener("keyup", handler); };
  }, [open, onOpenChange]);

  const saveRecent = useCallback((v: string) => {
    if (!v.trim()) return;
    setRecentSearches((prev) => {
      const next = [v, ...prev.filter((s) => s !== v)].slice(0, 5);
      try { localStorage.setItem("recent-searches", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const commit = useCallback((v: string) => {
    saveRecent(v);
    onChange(v);
    onOpenChange(false);
  }, [onChange, onOpenChange, saveRecent]);

  const handleKeyClick = useCallback((keyCode: string) => {
    const input = inputRef.current;
    if (!input) return;

    if (keyCode === "Backspace") {
      const start = input.selectionStart ?? inputValue.length;
      const end = input.selectionEnd ?? start;
      if (start > 0 || end < inputValue.length) {
        const newVal = inputValue.slice(0, Math.max(0, start - (start === end ? 1 : 0))) + inputValue.slice(end);
        setInputValue(newVal);
        requestAnimationFrame(() => {
          input.focus();
          input.setSelectionRange(Math.max(0, start - (start === end ? 1 : 0)), Math.max(0, start - (start === end ? 1 : 0)));
        });
      }
      return;
    }

    if (keyCode === "Enter") {
      commit(inputValue);
      return;
    }

    let char: string | undefined;
    if (shiftRef.current) char = SHIFTED[keyCode];
    if (!char) char = KEY_CHAR[keyCode];
    if (!char) return;

    const start = input.selectionStart ?? inputValue.length;
    const end = input.selectionEnd ?? start;
    const newVal = inputValue.slice(0, start) + char + inputValue.slice(end);
    setInputValue(newVal);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + char.length, start + char.length);
    });
  }, [inputValue, commit]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[15vh]"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-[#1A1A1A] shadow-2xl ring-1 ring-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-4 h-14 border-b border-white/5">
                <Search size={16} className="text-white/25 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit(inputValue);
                  }}
                  placeholder="Search alumni by name, university, course..."
                  className="flex-1 text-sm text-white placeholder:text-white/25 bg-transparent outline-none"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/25 bg-white/5 px-1.5 py-0.5 rounded font-mono shrink-0">⏎</span>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="p-1 rounded-md hover:bg-white/5 text-white/25 hover:text-white/50 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="px-6 py-5 bg-gradient-to-b from-white/[0.03] to-transparent" onMouseDown={(e) => e.preventDefault()}>
                <div className="shadow-lg rounded-xl">
                  <Keyboard onKeyClick={handleKeyClick} />
                </div>
                {recentSearches.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Recent searches</p>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((s, i) => (
                        <button key={i}
                          onClick={() => { setInputValue(s); commit(s); }}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white/5 hover:bg-white/10 text-white/50 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-center text-xs text-white/60 mt-3">
              Click keys on the keyboard · Type on your keyboard · Enter to search · Esc to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Search alumni by name, university, or course"
      className="relative w-56 group cursor-pointer"
    >
      <div className="flex items-center gap-2 w-full pl-8 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg transition-all duration-200 text-white/25 group-hover:border-white/20 group-hover:shadow-[0_0_16px_rgba(232,87,58,0.1)]">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
        <span className="flex-1 text-left">Search alumni...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-white/25 bg-white/5 px-1.5 py-0.5 rounded font-mono">
          <span>⌘</span>K
        </kbd>
      </div>
    </button>
  );
}
