"use client";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateForCalendar } from "@/lib/utils";

type Props = {
  booking: {
    id: string;
    alumni: {
      id: string;
      fullName: string;
      profilePhotoUrl: string | null;
      universityName: string;
    };
    sessionType: { type: string };
    scheduledStartAt: Date | string;
    scheduledEndAt: Date | string;
    meetLink: string | null;
  };
};

export function ConfirmationScreen({ booking }: Props) {
  const router = useRouter();
  const startDate = new Date(booking.scheduledStartAt);
  const endDate = new Date(booking.scheduledEndAt);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Session with " + booking.alumni.fullName)}&dates=${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}&details=${encodeURIComponent("AlumNow session with " + booking.alumni.fullName)}`;

  return (
    <div className="space-y-6 text-center">
      {/* ── SVG draw-in checkmark ── */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="mx-auto w-20 h-20"
      >
        <svg viewBox="0 0 52 52" className="w-full h-full">
          <circle
            cx="26"
            cy="26"
            r="25"
            fill="none"
            stroke="rgba(34,197,94,0.25)"
            strokeWidth="1.5"
          />
          <motion.circle
            cx="26"
            cy="26"
            r="25"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ rotate: -90, transformOrigin: "center" }}
          />
          <motion.path
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 27l7 7 15-15"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.5 }}
          />
        </svg>
      </motion.div>

      {/* ── Heading ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-white">Session booked!</h2>
        <p className="mt-1 text-white/50">You&apos;re all set for your conversation.</p>
      </motion.div>

      {/* ── Detail card ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden rounded-2xl text-left"
        style={{
          background: "linear-gradient(180deg, #1d1d1d 0%, #161616 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Alumni row */}
        <div
          className="flex items-center gap-4 px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <img
            src={
              booking.alumni.profilePhotoUrl ??
              `https://picsum.photos/seed/${booking.alumni.id}/100/100`
            }
            alt={booking.alumni.fullName}
            className="h-11 w-11 rounded-full object-cover border border-white/10"
          />
          <div>
            <p className="font-semibold text-white">{booking.alumni.fullName}</p>
            <p className="text-[12px] text-white/40">{booking.alumni.universityName}</p>
          </div>
        </div>

        {/* Date / Time / Duration / Session grid */}
        <div className="grid grid-cols-2 gap-0">
          {[
            {
              label: "Date",
              value: startDate.toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            },
            {
              label: "Time",
              value: `${startDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} — ${endDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
            },
            {
              label: "Duration",
              value: `${duration} min`,
            },
            {
              label: "Session",
              value: booking.sessionType.type.replaceAll("_", " "),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="px-5 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <p className="text-[11px] text-white/25">{label}</p>
              <p className="mt-0.5 text-[13px] font-semibold text-white capitalize">{value}</p>
            </div>
          ))}
        </div>

        {/* Timezone caption */}
        <p
          className="px-5 py-2.5 text-[11px] text-white/25 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          Times shown in {tz}
        </p>

        {/* Meet link */}
        {booking.meetLink && (
          <div
            className="px-5 py-3 text-[12px] text-white/40"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            Meet link:{" "}
            <a href={booking.meetLink} className="text-[#e8573a] hover:underline">
              {booking.meetLink}
            </a>
          </div>
        )}
        {!booking.meetLink && (
          <p
            className="px-5 py-3 text-[12px] italic text-white/25"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            Meet link will appear 10 minutes before your session
          </p>
        )}
      </motion.div>

      {/* ── CTAs ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 0.4 }}
        className="flex flex-col gap-3"
      >
        <a href={calendarUrl} target="_blank" rel="noreferrer">
          <button
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-medium text-white/70 transition-all hover:text-white"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Calendar size={15} />
            Add to Google Calendar
          </button>
        </a>
        <button
          className="btn-coral w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-white"
          onClick={() => router.push("/bookings")}
        >
          View my bookings
          <ArrowRight size={15} />
        </button>
      </motion.div>
    </div>
  );
}
