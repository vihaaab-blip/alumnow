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
        className="pointer-events-none absolute left-5 top-5 z-10 flex items-center gap-2 rounded-xl border-2 border-coral bg-[#151517]/95 px-4 py-2 shadow-[0_8px_24px_rgba(232,87,58,0.35)]"
        style={{ opacity: likeOpacity, rotate: -12 }}
      >
        <Heart size={22} className="fill-coral text-coral" />
        <span className="text-sm font-bold uppercase tracking-wider text-coral">Save</span>
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-5 top-5 z-10 flex items-center gap-2 rounded-xl border-2 border-white/30 bg-[#151517]/95 px-4 py-2 shadow-lg"
        style={{ opacity: nopeOpacity, rotate: 12 }}
      >
        <span className="text-sm font-bold uppercase tracking-wider text-white/60">Skip</span>
        <XIcon size={22} className="text-white/60" />
      </motion.div>
      <div className="absolute inset-0 rounded-[16px] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
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
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-coral/10">
              <Sparkles className="text-coral" size={26} />
            </span>
            <p className="text-lg font-semibold text-white">You&apos;ve seen everyone!</p>
            <p className="mt-1 text-sm text-white/40">Check back later for new alumni.</p>
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
              className="absolute inset-0 overflow-hidden rounded-[16px] border border-white/[0.06] shadow-sm"
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
          className="h-14 w-14 rounded-full border-2 border-white/10 bg-white/[0.03] p-0 text-white/50 hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
          aria-label="Skip"
          onClick={() => handleSwipe("left")}
          disabled={!swipeReady}
        >
          <XIcon size={22} />
        </Button>
        <Button
          variant="accent"
          className="h-16 w-16 rounded-full p-0"
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
      <p className="mt-3 text-center text-xs text-white/35">
        Swipe right to save &middot; left to skip &middot; or use arrow keys
      </p>
    </div>
  );
}
