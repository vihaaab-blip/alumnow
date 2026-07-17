"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Video, XCircle } from "lucide-react";
import { getMyBookings, cancelBooking } from "@/actions/booking.actions";
import { BookingSummaryCard } from "@/components/BookingSummaryCard";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ReviewForm } from "@/components/ReviewForm";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

type Tab = "upcoming" | "past" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const filtered = bookings.filter((b) => {
    const isPast = new Date(b.scheduledStartAt).getTime() < now;
    switch (tab) {
      case "upcoming": return !isPast && b.status !== "cancelled";
      case "past": return (isPast || b.status === "no_show") && b.status !== "cancelled";
      case "cancelled": return b.status === "cancelled";
    }
  });

  const handleCancel = async (id: string) => {
    await cancelBooking(id);
    setBookings((old) =>
      old.map((item) =>
        item.id === id ? { ...item, status: "cancelled" } : item,
      ),
    );
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-4xl px-6 py-12"
    >
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#E8573A" }}>
            Your AlumNow
          </p>
          <h1 className="mt-2 text-3xl font-bold text-primary">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your sessions with alumni</p>
        </div>
        <Link href="/browse">
          <Button variant="accent" className="gap-2">
            Browse alumni <ArrowRight size={15} />
          </Button>
        </Link>
      </div>

      <div className="mt-8 flex gap-1.5 rounded-lg bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-[#1A1A1A] text-primary shadow-sm"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            {t.label}
            {loading ? null : (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({bookings.filter((b) => {
                  const isPast = new Date(b.scheduledStartAt).getTime() < now;
                  switch (t.key) {
                    case "upcoming": return !isPast && b.status !== "cancelled";
                    case "past": return (isPast || b.status === "no_show") && b.status !== "cancelled";
                    case "cancelled": return b.status === "cancelled";
                  }
                }).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-5">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : !filtered.length ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-center"
        >
          <p className="text-muted-foreground">
            {tab === "upcoming" && "No upcoming sessions yet."}
            {tab === "past" && "No past sessions yet."}
            {tab === "cancelled" && "No cancelled sessions."}
          </p>
          {tab !== "cancelled" && (
            <Link href="/browse">
              <Button variant="accent" className="mt-4">
                Browse alumni
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="mt-6 space-y-5">
          <AnimatePresence>
            {filtered.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className="space-y-3"
              >
                <BookingSummaryCard booking={booking} />
                {(tab === "upcoming" || tab === "past") && (
                  <>
                    {tab === "upcoming" && (
                      <div className="flex items-center justify-between rounded-xl border border-border/80 bg-[#1A1A1A] p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock size={15} />
                          <span>
                            Starts in <CountdownTimer target={booking.scheduledStartAt} />
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {booking.meetLink && (
                            <a href={booking.meetLink} target="_blank" rel="noreferrer">
                              <Button variant="accent" size="sm" className="gap-1.5">
                                <Video size={14} /> Join
                              </Button>
                            </a>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-red-600 border-red-900 hover:bg-red-950"
                            onClick={() => handleCancel(booking.id)}
                          >
                            <XCircle size={14} /> Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    {tab === "past" && !booking.review && booking.status === "completed" && (
                      <ReviewForm
                        bookingId={booking.id}
                        onSubmitted={() =>
                          setBookings((old) =>
                            old.map((item) =>
                              item.id === booking.id
                                ? { ...item, review: { id: "pending", rating: 0, text: null } }
                                : item,
                            ),
                          )
                        }
                      />
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.main>
  );
}
