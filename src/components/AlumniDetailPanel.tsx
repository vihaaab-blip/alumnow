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
