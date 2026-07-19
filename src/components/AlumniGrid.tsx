"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlumniCard } from "./AlumniCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { AlumniCardData } from "@/types";

function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden alumni-card">
      <div className="aspect-[4/3] animate-shimmer" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3.5 w-1/2 rounded-md" />
        <Skeleton className="h-3 w-2/3 rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />
        <div className="pt-2 border-t border-white/5 flex justify-between items-center">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function AlumniGrid({
  items,
  hasMore,
  loadMore,
  loading,
  onSelect,
  activeFilters,
  onRemoveFilter,
}: {
  items: AlumniCardData[];
  hasMore: boolean;
  loadMore: () => void;
  loading: boolean;
  onSelect?: (id: string) => void;
  activeFilters?: Record<string, unknown>;
  onRemoveFilter?: (key: string) => void;
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

  // Build list of active filter keys for smart suggestions
  const activeFilterKeys = activeFilters
    ? Object.entries(activeFilters)
        .filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0))
        .map(([k]) => k)
    : [];

  const FILTER_LABELS: Record<string, string> = {
    search: "Search",
    university: "University",
    country: "Country",
    course: "Course",
    studyLevel: "Study level",
    qsTiers: "QS Tier",
    languages: "Languages",
    minRating: "Rating",
    priceMin: "Min price",
    priceMax: "Max price",
    availability: "Availability",
    sessionType: "Session type",
  };

  return (
    <>
      {/* ── Initial skeleton (12 cards) ── */}
      <AnimatePresence mode="wait">
        {loading && items.length === 0 && (
          <motion.div
            key="skeleton-grid"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={`sk-${i}`} />
            ))}
          </motion.div>
        )}

        {/* ── Content grid ── */}
        {items.length > 0 && (
          <motion.div
            key="content-grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {items.map((item, idx) => (
              <AlumniCard key={item.id} alumni={item} index={idx} onSelect={onSelect} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Load-more skeleton (3 cards) ── */}
      {loading && items.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 mt-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={`lm-sk-${i}`} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-10" aria-hidden="true" />

      {!hasMore && items.length > 0 && (
        <p className="py-8 text-center text-sm text-white/25" aria-live="polite">
          You&apos;ve seen all {items.length} alumni
        </p>
      )}

      {!loading && hasMore && (
        <div className="flex justify-center py-6">
          <Button variant="outline" onClick={loadMore}>Load more</Button>
        </div>
      )}

      {/* ── Smart empty state ── */}
      {!loading && items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl px-6 py-20 text-center"
          style={{
            border: "1px dashed rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(232,87,58,0.08)", border: "1px solid rgba(232,87,58,0.15)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(232,87,58,0.7)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <h2 className="text-[17px] font-semibold text-white">No alumni match your filters</h2>
          <p className="mt-2 text-[13px] text-white/35 max-w-xs mx-auto">
            Try removing one of the active filters to see more results.
          </p>

          {/* Clickable filter suggestion chips */}
          {activeFilterKeys.length > 0 && onRemoveFilter && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[12px] text-white/30">Remove:</span>
              {activeFilterKeys.slice(0, 4).map((key) => (
                <button
                  key={key}
                  onClick={() => onRemoveFilter(key)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all hover:scale-105"
                  style={{
                    background: "rgba(232,87,58,0.1)",
                    border: "1px solid rgba(232,87,58,0.2)",
                    color: "#f0744e",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                  {FILTER_LABELS[key] ?? key}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}
