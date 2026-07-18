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
