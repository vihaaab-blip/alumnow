"use client";
import { Star, GraduationCap, Clock, CalendarDays } from "lucide-react";

const PLATFORM_FEE_RATE = 0.10;

type CheckoutSummaryProps = {
  alumni: {
    id: string;
    fullName: string;
    profilePhotoUrl: string | null;
    universityName: string;
    ratingAvg?: number | null;
    ratingCount?: number | null;
  };
  sessionType: string;
  durationMin: number;
  scheduledDate?: Date | null;
  scheduledTime?: string;
  amountPaise: number;
};

export function CheckoutSummaryCard({
  alumni,
  sessionType,
  durationMin,
  scheduledDate,
  scheduledTime,
  amountPaise,
}: CheckoutSummaryProps) {
  const platformFee = Math.round(amountPaise * PLATFORM_FEE_RATE);
  const total = amountPaise + platformFee;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #1d1d1d 0%, #161616 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Alumni hero */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <img
          src={alumni.profilePhotoUrl ?? `https://picsum.photos/seed/${alumni.id}/120/120`}
          alt={alumni.fullName}
          className="h-12 w-12 rounded-full object-cover border border-white/10 flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="font-semibold text-[14px] text-white truncate">{alumni.fullName}</p>
          <p className="text-[12px] text-white/40 flex items-center gap-1 mt-0.5">
            <GraduationCap size={11} className="shrink-0 text-white/25" />
            <span className="truncate">{alumni.universityName}</span>
          </p>
          {alumni.ratingAvg != null && (
            <p className="text-[11px] text-white/30 flex items-center gap-1 mt-0.5">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              {alumni.ratingAvg.toFixed(1)}
              {alumni.ratingCount ? <span>({alumni.ratingCount} reviews)</span> : null}
            </p>
          )}
        </div>
      </div>

      {/* Session details */}
      <div
        className="px-5 py-4 space-y-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex justify-between items-center text-[13px]">
          <span className="text-white/40 flex items-center gap-1.5">
            <Clock size={12} className="text-white/25" />
            Session
          </span>
          <span className="font-medium text-white/80 capitalize">{sessionType.replaceAll("_", " ")}</span>
        </div>
        <div className="flex justify-between items-center text-[13px]">
          <span className="text-white/40">Duration</span>
          <span className="font-medium text-white/80">{durationMin} min</span>
        </div>
        {scheduledDate && (
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-white/40 flex items-center gap-1.5">
              <CalendarDays size={12} className="text-white/25" />
              Date
            </span>
            <span className="font-medium text-white/80">
              {scheduledDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        )}
        {scheduledTime && (
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-white/40">Time</span>
            <span className="font-medium text-white/80">{scheduledTime}</span>
          </div>
        )}
        {(scheduledDate || scheduledTime) && (
          <p className="text-[11px] text-white/20 mt-1">Times shown in {tz}</p>
        )}
      </div>

      {/* Itemised pricing */}
      <div className="px-5 py-4 space-y-2">
        <div className="flex justify-between text-[13px]">
          <span className="text-white/40">Session fee</span>
          <span className="font-medium text-white/70">₹{(amountPaise / 100).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-white/40">Platform fee (10%)</span>
          <span className="font-medium text-white/70">₹{(platformFee / 100).toLocaleString("en-IN")}</span>
        </div>
        <div
          className="flex justify-between text-[14px] pt-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="font-semibold text-white">Total</span>
          <span
            className="font-mono font-bold"
            style={{ color: "#f0744e" }}
          >
            ₹{(total / 100).toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}
