"use client";
import { useState } from "react";
import { Heart, Star, Loader2, GraduationCap, MapPin, Video, Zap, Clock3, ArrowRight } from "lucide-react";
import { saveAlumni, unsaveAlumni } from "@/actions/alumni.actions";
import type { AlumniCardData } from "@/types";

export function AlumniCard({ alumni, variant = "grid", onSaved, index = 0, onSelect }: {
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

  const initials = alumni.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");
  const src = alumni.profilePhotoUrl ?? `https://picsum.photos/seed/${alumni.id}/500/400`;
  const hasSessions = alumni.sessionTypes?.length > 0;
  const lowestPrice = hasSessions ? Math.min(...alumni.sessionTypes.map((s) => s.pricePaise)) : null;
  const responseTime = alumni.avgResponseTimeHours;

  if (variant === "swipe") {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-[#1A1A1A] border border-white/5">
        <div className="relative flex-shrink-0" style={{ aspectRatio: "4 / 3" }}>
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 animate-shimmer" />
          )}
          {imgError ? (
            <div className="flex h-full items-center justify-center bg-[var(--color-surface)]">
              <span className="text-4xl font-bold text-[var(--color-text-tertiary)]">{initials}</span>
            </div>
          ) : (
            <img src={src} alt={alumni.fullName} className="h-full w-full object-cover" loading="lazy" onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <h3 className="text-lg font-bold text-white">{alumni.fullName}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/50">
              <GraduationCap size={14} className="shrink-0" />
              {alumni.universityName}
            </p>
            <p className="mt-1 text-xs text-white/30">{alumni.country} · {alumni.course}</p>
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/40">{alumni.bio ?? "Ready to share practical advice."}</p>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/50">
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

  return (
    <div onClick={() => onSelect?.(alumni.id)} className="group cursor-pointer">
      <div
        className="bg-[#1A1A1A] rounded-[var(--radius-lg)] border border-white/5 overflow-hidden card-elevation"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Image zone — fixed 4:3 aspect ratio */}
        <div className="relative" style={{ aspectRatio: "4 / 3" }}>
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 animate-shimmer" />
          )}
          {imgError ? (
            <div className="flex h-full items-center justify-center bg-[var(--color-surface)]">
              <span className="text-4xl font-bold text-[var(--color-text-tertiary)]">{initials}</span>
            </div>
          ) : (
            <img
              src={src}
              alt={alumni.fullName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          )}

          {/* Dark scrim for badge legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

          {/* Heart save button — top-right */}
          <button
            aria-label={alumni.isSaved ? "Remove from saved" : "Save alumni"}
            onClick={toggle}
            disabled={saving}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#0D0D0D]/85 backdrop-blur-sm shadow-sm transition-all hover:scale-110 hover:shadow-md disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin text-[var(--color-text-secondary)]" /> : <Heart size={14} className={alumni.isSaved ? "fill-red-500 text-red-500" : "text-[var(--color-text-secondary)]"} />}
          </button>

          {/* Rating badge — top-left (4.5+) */}
          {alumni.ratingAvg != null && alumni.ratingAvg >= 4.5 && (
            <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-[#0D0D0D]/85 backdrop-blur-sm px-2 py-0.5 shadow-sm">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-white">{alumni.ratingAvg.toFixed(1)}</span>
            </div>
          )}

          {/* Verified badge — bottom-left */}
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0D0D0D]/85 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-white shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              </svg>
              Verified
            </span>
          </div>
        </div>

        {/* Content zone — consistent 20px padding */}
        <div className="p-5">
          {/* Name + rating row */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-[16px] font-semibold text-white leading-snug group-hover:text-coral transition-colors line-clamp-1">{alumni.fullName}</h3>
            {alumni.ratingAvg != null && (
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-white">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                {alumni.ratingAvg.toFixed(1)}
              </span>
            )}
          </div>

          {/* University */}
          <p className="flex items-center gap-1.5 text-[13px] text-white/50 mb-1">
            <GraduationCap size={13} className="shrink-0 text-white/25" />
            <span className="truncate">{alumni.universityName}</span>
          </p>

          {/* Location + year */}
          <p className="flex items-center gap-1 text-xs text-white/30 mb-3">
            <MapPin size={11} className="shrink-0" />
            {alumni.country} · {alumni.course} · {alumni.graduationYearJbcn}
          </p>

          {/* Response time badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50">
              <Clock3 size={11} />
              {responseTime != null
                ? `Responds within ${responseTime < 1 ? "1h" : `${Math.round(responseTime)}h`}`
                : "Response time varies"}
            </span>
            {responseTime != null && responseTime < 12 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                <Zap size={11} />Fast
              </span>
            )}
          </div>

          {/* Bio — 2 line max */}
          <p className="line-clamp-2 text-[13px] leading-5 text-white/40 mb-4">
            {alumni.bio ?? "Ready to share practical advice from their university journey."}
          </p>

          {/* Footer row */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              {hasSessions && (
                <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50">
                  <Video size={11} />
                  {alumni.sessionTypes.length} option{alumni.sessionTypes.length > 1 ? "s" : ""}
                </span>
              )}
              {lowestPrice != null && (
                <span className="text-sm font-bold text-white">
                  ₹{Math.round(lowestPrice / 100)}
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-coral transition-all group-hover:bg-coral-light">
              View Profile <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
