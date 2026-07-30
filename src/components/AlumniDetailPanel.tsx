"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Star, Clock3, GraduationCap, ChevronDown, Video, Users, MapPin, Award, ShieldCheck } from "lucide-react";
import { AlumniPhoto } from "@/components/ui/AlumniPhoto";
import type { AlumniCardData } from "@/types";

interface DetailPanelProps {
  alumni: AlumniCardData | null;
  onClose: () => void;
}

export function AlumniDetailPanel({ alumni, onClose }: DetailPanelProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [tab, setTab] = useState<"overview" | "reviews">("overview");
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
  const responseTime = alumni.avgResponseTimeHours;

  const sessionTypeLabel = (type: string) => {
    const match = type.match(/^(call|group)_(\d+)$/);
    if (!match) return type.replace(/_/g, " ");
    const [, kind, minutes] = match;
    return `${minutes}-min ${kind === "group" ? "group session" : "call"}`;
  };
  const bioLong = (alumni.bio?.length ?? 0) > 150;
  const initials = alumni.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          visible
            ? "bg-black/50 backdrop-blur-sm opacity-100"
            : "bg-black/0 opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[440px] flex flex-col
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
        style={{
          background: "linear-gradient(180deg, #181818 0%, #111111 100%)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "-24px 0 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full
            bg-white/5 border border-white/8 backdrop-blur-sm hover:bg-white/10 transition-all"
        >
          <X size={15} className="text-white/70" />
        </button>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Hero image */}
          <div className="relative img-duotone" style={{ aspectRatio: "16 / 10" }}>
            {imgError ? (
              <div className="flex h-full items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1d1d1d, #151515)" }}>
                <span className="text-5xl font-bold text-white/15">{initials}</span>
              </div>
            ) : (
              <AlumniPhoto
                src={src}
                alt={alumni.fullName}
                sizes="440px"
                className="object-cover object-top"
                onError={() => setImgError(true)}
              />
            )}
            {/* Heavy bottom scrim for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-5 right-12">
              <h2 className="text-[22px] font-semibold text-white tracking-tight leading-snug">
                {alumni.fullName}
              </h2>
              <p className="text-[13px] text-white/55 mt-0.5 flex items-center gap-1.5">
                <GraduationCap size={13} className="shrink-0 text-white/30" />
                {alumni.universityName}
              </p>
              <p className="text-[11px] text-white/30 mt-0.5 flex items-center gap-1">
                <MapPin size={11} className="shrink-0" />
                {alumni.country}
              </p>
              {/* Tier badge */}
              {alumni.tier === "top_mentor" && (
                <span
                  className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                  style={{
                    background: "linear-gradient(90deg, #FF7A57 0%, #E8573A 100%)",
                    boxShadow: "0 0 10px rgba(232,87,58,0.4)",
                  }}
                >
                  <Award size={9} /> Top Mentor
                </span>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-white/5 px-5">
            {(["overview", "reviews"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative px-4 py-3 text-[13px] font-medium capitalize transition-colors ${
                  tab === key ? "text-white" : "text-white/30 hover:text-white/55"
                }`}
              >
                {key}
                {tab === key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#e8573a] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-5 py-5 space-y-5">
            {tab === "overview" && (
              <>
                {/* Stats row — 4 tiles */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="stat-chip">
                    <Clock3 size={14} className="mx-auto text-white/25 mb-1.5" />
                    <p className="text-[15px] font-bold text-white tabular-nums">
                      {responseTime != null ? `${Math.round(responseTime)}h` : "—"}
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5">Response</p>
                  </div>
                  <div className="stat-chip">
                    <GraduationCap size={14} className="mx-auto text-white/25 mb-1.5" />
                    <p className="text-[15px] font-bold text-white tabular-nums">
                      {alumni.graduationYearJbcn ?? "—"}
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5">Graduated</p>
                  </div>
                  <div className="stat-chip">
                    <Star size={14} className="mx-auto text-coral mb-1.5" />
                    <p className="text-[15px] font-bold text-white tabular-nums">
                      {alumni.ratingAvg != null ? alumni.ratingAvg.toFixed(1) : "—"}
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5">
                      {alumni.ratingCount ? `${alumni.ratingCount} reviews` : "Rating"}
                    </p>
                  </div>
                  <div className="stat-chip">
                    <Award size={14} className="mx-auto text-emerald-400 mb-1.5" />
                    <p className="text-[15px] font-bold text-white tabular-nums">
                      {alumni.sessionsCompleted ?? "—"}
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5">Sessions</p>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-2">
                    About
                  </h3>
                  <p
                    className={`text-[13px] leading-[22px] text-white/50 ${
                      !showFullBio && bioLong ? "line-clamp-3" : ""
                    }`}
                  >
                    {alumni.bio ?? "No bio provided yet."}
                  </p>
                  {bioLong && (
                    <button
                      onClick={() => setShowFullBio(!showFullBio)}
                      className="mt-2 text-[12px] font-medium text-[#e8573a] hover:text-[#f0744e] inline-flex items-center gap-0.5 transition-colors"
                    >
                      {showFullBio ? "Show less" : "Read more"}
                      <ChevronDown
                        size={12}
                        className={`transition-transform ${showFullBio ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>

                {/* Key details */}
                <div className="space-y-0.5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-2">
                    Details
                  </h3>
                  {[
                    { label: "Country", value: alumni.country },
                    { label: "Course", value: alumni.course },
                    { label: "QS Ranking", value: alumni.qsRankingTier },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-2.5 border-b border-white/[0.04]"
                    >
                      <span className="text-[12px] text-white/25">{label}</span>
                      <span className="text-[13px] font-medium text-white/75 capitalize">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Sessions */}
                {hasSessions && (
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-3">
                      Select a Session
                    </h3>
                    <div className="space-y-2">
                      {alumni.sessionTypes.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-xl p-3"
                          style={{
                            background: "rgba(255,255,255,0.035)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                              {s.type === "group_40" ? (
                                <Users size={14} className="text-white/35" />
                              ) : (
                                <Video size={14} className="text-white/35" />
                              )}
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-white/80">
                                {sessionTypeLabel(s.type)}
                              </p>
                              {s.descriptionOneLiner && (
                                <p className="text-[11px] text-white/25">{s.descriptionOneLiner}</p>
                              )}
                            </div>
                          </div>
                          <span className="price-badge">₹{Math.round(s.pricePaise / 100)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Reviews tab */}
            {tab === "reviews" && (() => {
              return (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/25">
                    {alumni.ratingCount} review{alumni.ratingCount !== 1 ? "s" : ""}
                    {alumni.ratingAvg != null && (
                      <span className="ml-2 text-coral">{alumni.ratingAvg.toFixed(1)} ★</span>
                    )}
                  </p>

                  {/* Double-blind notice */}
                  <div
                    className="flex items-start gap-2 rounded-xl p-3 text-[11px] text-white/35"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-white/20">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Reviews are revealed simultaneously once both parties submit or 72 hours pass — preventing bias.
                  </div>

                  <div className="py-8 text-center">
                    <p className="text-[13px] text-white/25 mb-4">
                      No reviews yet — be the first to book a session.
                    </p>
                    <button
                      onClick={() => router.push(`/book/new?alumniId=${alumni.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #f06040, #e8573a, #d14a2e)" }}
                    >
                      Be the first to book a session →
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Sticky CTA */}
        <div
          className="shrink-0 px-5 py-4"
          style={{
            background: "linear-gradient(180deg, rgba(24,24,24,0) 0%, #111111 30%)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {alumni.ratingAvg != null && (
            <div className="flex items-center justify-end gap-1 mb-3 text-[12px] text-white/45">
              <Star size={11} className="fill-coral text-coral" />
              {alumni.ratingAvg.toFixed(1)}
              {alumni.ratingCount ? (
                <span className="text-white/25">({alumni.ratingCount})</span>
              ) : null}
            </div>
          )}
          <button
            className="btn-coral w-full rounded-xl py-3 text-[14px] font-semibold text-white"
            onClick={() => router.push(`/book/new?alumniId=${alumni.id}`)}
          >
            Book a session
          </button>
          {/* Safety framing */}
          <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[11px] text-white/25">
            <ShieldCheck size={12} className="text-emerald-400/60" />
            Full refund if {alumni.fullName.split(" ")[0]} doesn&apos;t join · All sessions monitored
          </div>
        </div>
      </div>
    </>
  );
}
