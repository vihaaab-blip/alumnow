"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAlumni, getFilterOptions, saveAlumni, unsaveAlumni } from "@/actions/alumni.actions";
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

const ALUMNI_KEY = ["alumni"];
const SAVED_KEY = ["saved-alumni"];
const OPTIONS_KEY = ["filter-options"];
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
      if (Array.isArray(val)) return val.every((v) => sp.getAll(key).includes(String(v)));
      return sp.get(key) === String(val);
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
    availability: (sp.get("availability") as AlumniFilters["availability"]) ?? undefined,
    sessionType: (sp.get("sessionType") as AlumniFilters["sessionType"]) ?? undefined,
    sortBy: (sp.get("sortBy") as AlumniFilters["sortBy"]) ?? "relevance",
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
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniCardData | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const sortBy = searchParams.get("sortBy") ?? "relevance";
  const tab = searchParams.get("view") === "saved" ? "saved" : "browse";
  const swipe = searchParams.get("swipe") === "1";
  const spStr = searchParams.toString();

  const queryParams = useMemo(() => ({ ...filters, sortBy, page: tab === "browse" ? page : 1, pageSize: ITEMS_PER_PAGE }), [filters, sortBy, page, tab]);

  const { data, isFetching, error } = useQuery({
    queryKey: [...ALUMNI_KEY, queryParams],
    queryFn: () => listAlumni(queryParams),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const optionsQuery = useQuery({
    queryKey: [...OPTIONS_KEY, filters.country],
    queryFn: () => getFilterOptions(filters.country),
    staleTime: 300000,
  });

  const savedQuery = useQuery({
    queryKey: SAVED_KEY,
    queryFn: getSavedAlumni,
    staleTime: 120000,
  });

  // Reset page when search params (filters) change
  useEffect(() => { setPage(1); }, [spStr]);

  const invalidateAlumni = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ALUMNI_KEY });
    queryClient.invalidateQueries({ queryKey: SAVED_KEY });
  }, [queryClient]);

  const saveMutation = useMutation({ mutationFn: saveAlumni, onSuccess: invalidateAlumni });
  const unsaveMutation = useMutation({ mutationFn: unsaveAlumni, onSuccess: invalidateAlumni });

  const items = (data?.items ?? []) as AlumniCardData[];
  const totalPages = data?.totalPages ?? 1;
  const hasMore = page < totalPages;
  const totalItems = data?.total ?? 0;

  const savedItems: AlumniCardData[] = useMemo(
    () => (savedQuery.data ?? []).map((s) => s.alumni) as unknown as AlumniCardData[],
    [savedQuery.data]
  );

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
    <div className="min-h-screen bg-[var(--color-bg)]">

      {/* Sub-nav bar */}
      <div className="sticky top-0 z-20 bg-[#0D0D0D]/80 backdrop-blur-md border-b border-white/5 pt-16">
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
                    if (Array.isArray(v)) v.forEach((item) => p.append(k, String(item)));
                    else p.set(k, String(v));
                  });
                  const qs = p.toString();
                  router.replace(`/browse${qs ? `?${qs}` : ""}`, { scroll: false });
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  activeCat === tab.label
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-white/40 hover:text-white hover:bg-white/5"
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
          <div className="flex items-center bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => {
                const p = new URLSearchParams(filtersToParams(filters));
                p.delete("view");
                router.replace(`/browse?${p.toString()}`, { scroll: false });
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                  tab === "browse" ? "bg-[#232326] text-white shadow-sm" : "text-white/30 hover:text-white"
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
                  tab === "saved" ? "bg-[#232326] text-white shadow-sm" : "text-white/30 hover:text-white"
              }`}
            >
              <Heart size={11} />
              Saved
              {savedQuery.data?.length ? <span className="text-[10px] opacity-60">({savedQuery.data.length})</span> : null}
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
              swipe ? "bg-coral text-white" : "text-white/30 hover:text-white hover:bg-white/5"
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
            <h1 className="text-[28px] font-bold text-white">Marketplace</h1>
            <p className="text-sm text-white/50 mt-0.5">
              {totalItems > 0 ? `${totalItems} alumni available` : "Browse verified alumni mentors"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/30">
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
              <ChevronDown size={11} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" />
            </div>
          </div>
        </div>

        {/* Active filter pills */}
        <AnimatePresence>
          {activeFilters.length >= 1 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 flex flex-wrap items-center gap-2">
              <Sparkles size={12} className="text-white/30" />
              {activeFilters.map(([key, val]) => (
                <span key={key} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-medium text-white shadow-sm">
                  {activeFilterLabels[key]?.(val) ?? key}
                  <button onClick={() => removeFilter(key)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors"><X size={11} /></button>
                </span>
              ))}
              <button onClick={clearFilters} className="text-xs text-[var(--color-primary)] hover:underline font-medium ml-1 transition-colors">Clear all</button>
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
                  universities: optionsQuery.data?.universities ?? [],
                  countries: optionsQuery.data?.countries ?? [],
                  courses: optionsQuery.data?.courses ?? [],
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
                <p className="mt-2 text-sm text-red-500">Failed to load alumni. Please try again.</p>
                <Button className="mt-4" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ALUMNI_KEY })}>Retry</Button>
              </div>
            )}

            {!error && tab === "saved" && savedQuery.isLoading && (
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
                onSave={async (id) => { await saveMutation.mutateAsync(id); return { success: true }; }}
                onUndoSave={(id) => unsaveMutation.mutateAsync(id)}
              />
            ) : !error && tab === "saved" ? (
              savedItems.length === 0 && !savedQuery.isLoading ? (
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
              <AlumniGrid items={items} hasMore={hasMore} loadMore={loadMore} loading={isFetching} onSelect={handleSelect} />
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
