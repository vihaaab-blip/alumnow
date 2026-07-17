"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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

  useEffect(() => {
    const timer = setTimeout(() => router.push("/bookings"), 4000);
    return () => clearTimeout(timer);
  }, [router]);

  const startDate = new Date(booking.scheduledStartAt);
  const endDate = new Date(booking.scheduledEndAt);
  const duration = Math.round(
    (endDate.getTime() - startDate.getTime()) / 60000,
  );
  const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Session with " + booking.alumni.fullName)}&dates=${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}&details=${encodeURIComponent("AlumNow session with " + booking.alumni.fullName)}`;

  return (
    <div className="space-y-6 text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-900/30"
      >
        <CheckCircle size={48} className="text-green-400" />
      </motion.div>
      <div>
        <h2 className="text-2xl font-bold text-primary">Session booked!</h2>
        <p className="mt-1 text-muted-foreground">You&apos;re all set for your conversation.</p>
      </div>

      <Card className="overflow-hidden border border-border/80 p-0 text-left">
        <div className="flex items-center gap-4 bg-gradient-to-r from-accent/5 to-transparent p-5">
          <img
            src={
              booking.alumni.profilePhotoUrl ??
              `https://picsum.photos/seed/${booking.alumni.id}/100/100`
            }
            alt={booking.alumni.fullName}
            className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm"
          />
          <div>
            <p className="font-semibold text-primary">{booking.alumni.fullName}</p>
            <p className="text-sm text-muted-foreground">{booking.alumni.universityName}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-border/60 px-5 py-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="mt-0.5 font-semibold text-primary">
              {startDate.toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="mt-0.5 font-semibold text-primary">
              {startDate.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" — "}
              {endDate.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="mt-0.5 font-semibold text-primary">{duration} min</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Session</p>
            <p className="mt-0.5 font-semibold text-primary capitalize">
              {booking.sessionType.type.replaceAll("_", " ")}
            </p>
          </div>
        </div>
        <div className="border-t border-border/60 px-5 py-3 text-sm text-muted-foreground">
          Meet link:{" "}
          {booking.meetLink ?? (
            <span className="italic">Link will appear 10 minutes before session</span>
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <a href={calendarUrl} target="_blank" rel="noreferrer">
          <Button variant="outline" className="w-full gap-2">
            <Calendar size={16} />
            Add to Google Calendar
          </Button>
        </a>
        <Button
          variant="accent"
          className="w-full gap-2"
          onClick={() => router.push("/bookings")}
        >
          View my bookings
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
