"use client";
import { Fragment } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, GitCompareArrows, Star, GraduationCap, MapPin } from "lucide-react";
import type { AlumniCardData } from "@/types";

export const MAX_COMPARE = 3;

export function CompareTray({
  alumni,
  onRemove,
  onCompare,
  onClear,
}: {
  alumni: AlumniCardData[];
  onRemove: (id: string) => void;
  onCompare: () => void;
  onClear: () => void;
}) {
  const canCompare = alumni.length >= 2;

  return (
    <AnimatePresence>
      {alumni.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2"
        >
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl"
            style={{
              background: "linear-gradient(180deg, #1c1c1c 0%, #141414 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
          >
            <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-wider text-white/30">
              Compare
            </span>

            <div className="flex items-center gap-2">
              {alumni.map((a) => {
                const initials = a.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");
                return (
                  <div key={a.id} className="relative shrink-0" title={a.fullName}>
                    {a.profilePhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- small chip avatar, not worth next/image overhead
                      <img
                        src={a.profilePhotoUrl}
                        alt={a.fullName}
                        className="h-10 w-10 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[11px] font-bold text-white/60">
                        {initials}
                      </div>
                    )}
                    <button
                      aria-label={`Remove ${a.fullName} from compare`}
                      onClick={() => onRemove(a.id)}
                      className="absolute -top-1.5 -right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-black/80 border border-white/20 text-white/70 hover:text-white hover:bg-black transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, MAX_COMPARE - alumni.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/10 text-[10px] text-white/20"
                >
                  +
                </div>
              ))}
            </div>

            <button
              onClick={onCompare}
              disabled={!canCompare}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={
                canCompare
                  ? { background: "linear-gradient(135deg, #f06040, #e8573a, #d14a2e)", boxShadow: "0 0 16px rgba(232,87,58,0.35)" }
                  : { background: "rgba(255,255,255,0.06)" }
              }
            >
              <GitCompareArrows size={13} />
              Compare ({alumni.length})
            </button>

            <button
              onClick={onClear}
              className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
              aria-label="Clear comparison"
              title="Clear comparison"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Comparison modal ─────────────────────────────────────── */
function fmtPrice(paise?: number | null) {
  if (paise == null) return "—";
  return `₹${Math.round(paise / 100)}`;
}

export function CompareModal({
  alumni,
  onClose,
}: {
  alumni: AlumniCardData[];
  onClose: () => void;
}) {
  const rows: { label: string; render: (a: AlumniCardData) => React.ReactNode }[] = [
    { label: "University", render: (a) => a.universityName },
    { label: "Course", render: (a) => a.course },
    { label: "Country", render: (a) => a.country },
    {
      label: "Rating",
      render: (a) =>
        a.ratingAvg != null ? (
          <span className="inline-flex items-center gap-1">
            <Star size={12} className="fill-coral text-coral" />
            {a.ratingAvg.toFixed(1)} {a.ratingCount ? `(${a.ratingCount})` : ""}
          </span>
        ) : "—",
    },
    {
      label: "Starting price",
      render: (a) => {
        const hasSessions = a.sessionTypes?.length > 0;
        const lowest = hasSessions ? Math.min(...a.sessionTypes.map((s) => s.pricePaise)) : null;
        return `${fmtPrice(lowest)}${lowest != null ? " / session" : ""}`;
      },
    },
    { label: "Bio", render: (a) => <span className="line-clamp-4 text-white/50">{a.bio ?? "No bio provided yet."}</span> },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(180deg, #181818 0%, #111111 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-[16px] font-semibold text-white">Compare alumni</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <div className="overflow-auto max-h-[calc(85vh-64px)]">
            <div
              className="grid gap-px bg-white/5"
              style={{ gridTemplateColumns: `160px repeat(${alumni.length}, minmax(180px, 1fr))` }}
            >
              {/* Header row: avatar + name */}
              <div className="bg-[#141414] p-3" />
              {alumni.map((a) => {
                const initials = a.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");
                return (
                  <div key={a.id} className="bg-[#141414] p-4 text-center">
                    {a.profilePhotoUrl ? (
                      <img
                        src={a.profilePhotoUrl}
                        alt={a.fullName}
                        className="mx-auto h-14 w-14 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[13px] font-bold text-white/60">
                        {initials}
                      </div>
                    )}
                    <p className="mt-2 text-[13px] font-semibold text-white flex items-center justify-center gap-1">
                      <GraduationCap size={11} className="text-white/20" />
                      {a.fullName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/30 flex items-center justify-center gap-1">
                      <MapPin size={10} />
                      {a.country}
                    </p>
                  </div>
                );
              })}

              {/* Data rows */}
              {rows.map((row) => (
                <Fragment key={row.label}>
                  <div className="bg-[#141414] p-3 text-[12px] font-medium text-white/35">
                    {row.label}
                  </div>
                  {alumni.map((a) => (
                    <div key={`${row.label}-${a.id}`} className="bg-[#141414] p-3 text-[12px] text-white/70">
                      {row.render(a)}
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
