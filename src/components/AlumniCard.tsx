"use client";
import { useState } from "react";
import { Heart, Star, Loader2, GraduationCap, MapPin, Video, Zap, Clock3, ArrowRight, Award } from "lucide-react";
import { motion } from "framer-motion";
import { saveAlumni, unsaveAlumni } from "@/actions/alumni.actions";
import type { AlumniCardData } from "@/types";

export function AlumniCard({
  alumni,
  variant = "grid",
  onSaved,
  index = 0,
  onSelect,
}: {
  alumni: AlumniCardData;
  variant?: "grid" | "swipe";
  onSaved?: (saved: boolean) => void;
  index?: number;
  onSelect?: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    const next = !alumni.isSaved;
    const result = next ? await saveAlumni(alumni.id) : await unsaveAlumni(alumni.id);
    if (result.success) onSaved?.(next);
    setSaving(false);
  };

  const initials = alumni.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  const src = alumni.profilePhotoUrl ?? `https://picsum.photos/seed/${alumni.id}/500/400`;
  const hasSessions = alumni.sessionTypes?.length > 0;
  const lowestPrice = hasSessions
    ? Math.min(...alumni.sessionTypes.map((s) => s.pricePaise))
    : null;
  const responseTime = alumni.avgResponseTimeHours;

  /* ─── Swipe variant ──────────────────────────────────────── */
  if (variant === "swipe") {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl alumni-card">
        <div className="relative flex-shrink-0 img-duotone" style={{ aspectRatio: "4 / 3" }}>
          {!imgLoaded && !imgError && <div className="absolute inset-0 animate-shimmer" />}
          {imgError ? (
            <div className="flex h-full items-center justify-center bg-[#1a1a1a]">
              <span className="text-4xl font-bold text-white/20">{initials}</span>
            </div>
          ) : (
            <img
              src={src}
              alt={alumni.fullName}
              className="h-full w-full object-cover"
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight leading-snug">
              {alumni.fullName}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-white/45">
              <GraduationCap size={13} className="shrink-0" />
              {alumni.universityName}
            </p>
            <p className="mt-0.5 text-xs text-white/25">
              {alumni.country} · {alumni.course}
            </p>
            <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-white/35">
              {alumni.bio ?? "Ready to share practical advice."}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/6 px-2 py-0.5 text-[11px] font-medium text-white/40">
              <Clock3 size={11} />
              {responseTime != null ? `${Math.round(responseTime)}h` : "—"}
            </span>
            {alumni.ratingAvg != null && (
              <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-white">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                {alumni.ratingAvg.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Grid variant ───────────────────────────────────────── */
  return (
    <motion.div
      onClick={() => onSelect?.(alumni.id)}
      className="group cursor-pointer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.045,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="alumni-card rounded-[var(--radius-lg)] overflow-hidden">
        {/* ── Image zone ── */}
        <div className="relative img-duotone" style={{ aspectRatio: "4 / 3" }}>
          {!imgLoaded && !imgError && <div className="absolute inset-0 animate-shimmer" />}
          {imgError ? (
            <div className="flex h-full items-center justify-center bg-[#1a1a1a]">
              <span className="text-4xl font-bold text-white/20">{initials}</span>
            </div>
          ) : (
            <img
              src={src}
              alt={alumni.fullName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          )}

          {/* Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

          {/* Heart button */}
          <button
            aria-label={alumni.isSaved ? "Remove from saved" : "Save alumni"}
            onClick={toggle}
            disabled={saving}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-sm transition-all hover:scale-110 hover:bg-black/75 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin text-white/50" />
            ) : (
              <Heart
                size={13}
                className={
                  alumni.isSaved ? "fill-red-500 text-red-500" : "text-white/60"
                }
              />
            )}
          </button>

          {/* Rating badge */}
          {alumni.ratingAvg != null && alumni.ratingAvg >= 4.5 && (
            <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 shadow-sm">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-white">
                {alumni.ratingAvg.toFixed(1)}
              </span>
            </div>
          )}

          {/* Tier / Verified badge (bottom-left overlay) */}
          <div className="absolute bottom-3 left-3">
            {alumni.tier === "top_mentor" ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                style={{
                  background: "linear-gradient(90deg, #FF7A57 0%, #E8573A 100%)",
                  boxShadow: "0 0 10px rgba(232,87,58,0.5)",
                }}
              >
                <Award size={9} /> Top Mentor
              </span>
            ) : alumni.isVerifiedJbcnAlumnus ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 text-[11px] font-medium text-white/90 shadow-sm">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="shrink-0 text-emerald-400">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Verified
              </span>
            ) : null}
          </div>
        </div>

        {/* ── Content zone ── */}
        <div className="p-4">
          {/* Name + rating */}
          <div className="flex items-start justify-between gap-3 mb-0.5">
            <h3 className="text-[15px] font-semibold text-white leading-snug tracking-tight group-hover:text-[#f0744e] transition-colors line-clamp-1">
              {alumni.fullName}
            </h3>
            {alumni.ratingAvg != null && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white/80">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                {alumni.ratingAvg.toFixed(1)}
              </span>
            )}
          </div>

          {/* University */}
          <p className="flex items-center gap-1.5 text-[12px] text-white/40 mb-0.5">
            <GraduationCap size={12} className="shrink-0 text-white/20" />
            <span className="truncate">{alumni.universityName}</span>
          </p>

          {/* Location */}
          <p className="flex items-center gap-1 text-[11px] text-white/25 mb-3">
            <MapPin size={11} className="shrink-0" />
            {alumni.country} · {alumni.course}
            {alumni.graduationYearJbcn ? ` · ${alumni.graduationYearJbcn}` : ""}
          </p>

          {/* Bio */}
          <p className="line-clamp-2 text-[12px] leading-[18px] text-white/35 mb-4">
            {alumni.bio ?? "Ready to share practical advice from their university journey."}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sessions completed */}
              {alumni.sessionsCompleted != null && alumni.sessionsCompleted > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/4 border border-white/6 px-2 py-0.5 text-[10px] font-medium text-white/35">
                  <Video size={10} />
                  {alumni.sessionsCompleted} sessions
                </span>
              )}
              {/* Response time */}
              {alumni.sessionsCompleted == null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/4 border border-white/6 px-2 py-0.5 text-[10px] font-medium text-white/35">
                  <Clock3 size={10} />
                  {responseTime != null
                    ? responseTime < 1
                      ? "< 1h"
                      : `${Math.round(responseTime)}h`
                    : "—"}
                </span>
              )}
              {responseTime != null && responseTime < 12 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <Zap size={10} />
                  Fast
                </span>
              )}
              {/* Response rate */}
              {alumni.responseRate != null && alumni.responseRate >= 80 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-white/4 border border-white/6 px-2 py-0.5 text-[10px] font-medium text-white/35">
                  {alumni.responseRate}% replies
                </span>
              )}
              {lowestPrice != null && (
                <span className="price-badge">₹{Math.round(lowestPrice / 100)}</span>
              )}
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white btn-coral transition-all">
              View <ArrowRight size={11} />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
