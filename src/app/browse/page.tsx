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
import { X, LayoutGrid, Heart, Sparkles, ArrowUpDown, ChevronDown, Clock } from "lucide-react";
import { SearchOverlay, SearchTrigger } from "@/components/SearchOverlay";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const ITEMS_PER_PAGE = 18;

const categoryTabs = [
  { label: "All", filters: {} as Record<string, unknown> },
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
  { value: "fastest_response", label: "Fastest response" },
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
    minRating: sp.get("minRating") ?? undefined,
    availability: (sp.get("availability") as AlumniFilters["availability"]) ?? undefined,
    sessionType: (sp.get("sessionType") as AlumniFilters["sessionType"]) ?? undefined,
    sortBy: (sp.get("sortBy") as AlumniFilters["sortBy"]) ?? undefined,
    topMentorOnly: sp.get("topMentorOnly") === "true" ? true : undefined,
  };
}

function filtersToParams(filters: AlumniFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (key === "qsTiers" && Array.isArray(value)) value.forEach((t) => params.append("qsTier", t));
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
  minRating: (v: string) => `${v}+ stars`,
  sortBy: (v) => `Sort: ${v}`,
  country: (v: string) => v,
  university: (v: string) => v,
  course: (v: string) => v,
  gradYearMin: (v: number) => `From ${v}`,
  gradYearMax: (v: number) => `To ${v}`,
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
  const [recentlyViewed, setRecentlyViewed] = useState<AlumniCardData[]>([]);
  const [pendingBooking, setPendingBooking] = useState<{ id: string; alumniName: string } | null>(null);

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
    if (alum) {
      setSelectedAlumni(alum);
      // Persist to recently-viewed
      setRecentlyViewed((prev) => {
        const next = [alum, ...prev.filter((a) => a.id !== alum.id)].slice(0, 5);
        try { localStorage.setItem("alumnow-recently-viewed", JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    }
  }, [items, savedItems]);

  useEffect(() => {
    const saved = sessionStorage.getItem("browse-scroll-y");
    if (saved) { requestAnimationFrame(() => window.scrollTo(0, Number(saved))); sessionStorage.removeItem("browse-scroll-y"); }
    return () => { sessionStorage.setItem("browse-scroll-y", String(window.scrollY)); };
  }, []);

  // Load recently viewed from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("alumnow-recently-viewed");
      if (raw) setRecentlyViewed(JSON.parse(raw) as AlumniCardData[]);
    } catch { /* ignore */ }
  }, []);

  // Check for pending/incomplete booking (P2.3)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("alumnow-pending-booking");
      if (raw) setPendingBooking(JSON.parse(raw) as { id: string; alumniName: string });
    } catch { /* ignore */ }
  }, []);

  const activeFilters = Object.entries(filters).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0));

  const activeCat = activeCategoryLabel(searchParams);

  return (
    <div className="min-h-screen text-white">

      {/* Sub-nav bar */}
      <div className="sticky top-0 z-20 border-b border-white/[0.05] bg-[#0d0d0d]/90 pt-16 shadow-[0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 h-12 flex items-center gap-4">
          {/* Category pills */}
          <div className="hidden md:flex items-center gap-1">
            {categoryTabs.map((cat) => {
              const active = activeCat === cat.label;
              return (
                <button
                  key={cat.label}
                  onClick={() => {
                    const p = new URLSearchParams();
                    const s = searchParams.get("search");
                    if (s) p.set("search", s);
                    Object.entries(cat.filters).forEach(([k, v]) => {
                      if (k === "qsTiers" && Array.isArray(v)) v.forEach((item) => p.append("qsTier", String(item)));
                      else if (Array.isArray(v)) v.forEach((item) => p.append(k, String(item)));
                      else p.set(k, String(v));
                    });
                    const qs = p.toString();
                    router.replace(`/browse${qs ? `?${qs}` : ""}`, { scroll: false });
                  }}
                  className={`category-pill ${active ? "active" : ""}`}
                  style={active ? {
                    background: "linear-gradient(135deg, #f06040, #e8573a)",
                    boxShadow: "0 0 0 1px rgba(232,87,58,0.3), 0 4px 16px rgba(232,87,58,0.2)",
                    color: "#fff",
                    borderRadius: "9999px",
                  } : undefined}
                >
                  {!active && <span className="category-pill-bg" aria-hidden />}
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <SearchTrigger onClick={() => setSearchOpen(true)} />

          {/* Browse / Saved toggle */}
          <div className="flex items-center rounded-full p-0.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <button
              onClick={() => {
                const p = new URLSearchParams(filtersToParams(filters));
                p.delete("view");
                router.replace(`/browse?${p.toString()}`, { scroll: false });
              }}
              className={`px-3 py-1 text-[12px] font-medium rounded-full transition-all ${
                  tab === "browse"
                    ? "bg-white/10 text-white border border-white/12 shadow-sm"
                    : "text-white/35 hover:text-white/65"
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
              className={`px-3 py-1 text-[12px] font-medium rounded-full transition-all inline-flex items-center gap-1.5 ${
                  tab === "saved"
                    ? "bg-white/10 text-white border border-white/12 shadow-sm"
                    : "text-white/35 hover:text-white/65"
              }`}
            >
              <Heart size={11} />
              Saved
              {savedItems.length > 0 && (
                <span className="text-[10px] tabular-nums" style={{ color: "rgba(232,87,58,0.8)" }}>{savedItems.length}</span>
              )}
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
            <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white leading-none">Marketplace</h1>
            <p className="text-[13px] text-white/35 mt-1">
              {totalItems > 0 ? (
                <><span className="text-white/65 font-medium tabular-nums">{totalItems}</span> verified alumni</>)
                : "Browse verified alumni mentors"}
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
            <div className="w-[240px] shrink-0 filter-sidebar rounded-xl overflow-hidden self-start sticky top-[100px]">
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
            {/* Continue where you left off banner */}
            {pendingBooking && tab === "browse" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                style={{
                  background: "linear-gradient(90deg, rgba(232,87,58,0.08) 0%, rgba(232,87,58,0.03) 100%)",
                  border: "1px solid rgba(232,87,58,0.2)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Clock size={14} className="text-[#e8573a] shrink-0" />
                  <p className="text-[13px] text-white/65">
                    You have an incomplete booking with{" "}
                    <span className="font-semibold text-white">{pendingBooking.alumniName}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/book/${pendingBooking.id}`)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #f06040, #e8573a, #d14a2e)" }}
                  >
                    Continue →
                  </button>
                  <button
                    onClick={() => {
                      setPendingBooking(null);
                      try { localStorage.removeItem("alumnow-pending-booking"); } catch { /* ignore */ }
                    }}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                  >
                    <X size={13} />
                  </button>
                </div>
              </motion.div>
            )}

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
              <>
                {/* Recently viewed rail */}
                {recentlyViewed.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-3">
                      Recently viewed
                    </p>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                      {recentlyViewed.map((alum) => (
                        <button
                          key={alum.id}
                          onClick={() => handleSelect(alum.id)}
                          className="flex-shrink-0 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:scale-[1.02]"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            minWidth: "180px",
                          }}
                        >
                          <img
                            src={alum.profilePhotoUrl ?? `https://picsum.photos/seed/${alum.id}/80/80`}
                            alt={alum.fullName}
                            className="h-8 w-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-white/80 truncate">{alum.fullName}</p>
                            <p className="text-[11px] text-white/30 truncate">{alum.universityName}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <AlumniGrid
                  items={items}
                  hasMore={hasMore}
                  loadMore={loadMore}
                  loading={loading}
                  onSelect={handleSelect}
                  activeFilters={filters as unknown as Record<string, unknown>}
                  onRemoveFilter={removeFilter}
                />
              </>
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
