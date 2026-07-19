import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CalendarDays, Clock, Video, MapPin } from "lucide-react";

type BookingData = {
  status?: string;
  meetLink?: string | null;
  alumni: {
    id: string;
    fullName: string;
    profilePhotoUrl: string | null;
    universityName: string;
  };
  sessionType: {
    type: string;
  };
  scheduledStartAt: string;
  payment: {
    amountPaise: number;
  } | null;
};

const statusConfig: Record<string, { label: string; tone: "accent" | "success" | "danger" | "neutral" }> = {
  pending_payment: { label: "Pending payment", tone: "accent" },
  payment_submitted: { label: "Payment submitted", tone: "accent" },
  confirmed: { label: "Confirmed", tone: "accent" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  no_show: { label: "No show", tone: "neutral" },
};

const PLATFORM_FEE_RATE = 0.10; // 10%

export function BookingSummaryCard({ booking }: { booking: BookingData }) {
  const amount = booking.payment?.amountPaise;
  const sessionFee = amount ?? null;
  const platformFee = sessionFee != null ? Math.round(sessionFee * PLATFORM_FEE_RATE) : null;
  const total = sessionFee != null && platformFee != null ? sessionFee + platformFee : null;

  const statusInfo =
    statusConfig[booking.status ?? ""] ?? { label: booking.status ?? "", tone: "neutral" as const };
  const startDate = new Date(booking.scheduledStartAt);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Card className="overflow-hidden border border-border/80 p-0">
      {/* ── Alumni header ── */}
      <div className="flex items-start gap-4 bg-gradient-to-r from-primary/5 to-transparent p-5 pb-4">
        <img
          src={
            booking.alumni.profilePhotoUrl ??
            `https://picsum.photos/seed/${booking.alumni.id}/100/100`
          }
          alt={booking.alumni.fullName}
          className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold text-primary">{booking.alumni.fullName}</h2>
              <p className="text-sm text-muted-foreground">{booking.alumni.universityName}</p>
            </div>
            {booking.status && (
              <Badge tone={statusInfo.tone} className="shrink-0">{statusInfo.label}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Date / time / session ── */}
      <div className="grid grid-cols-2 gap-4 border-t border-border/60 px-5 py-4 text-sm">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-muted-foreground shrink-0" />
          <span className="text-primary font-medium">
            {startDate.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-muted-foreground shrink-0" />
          <span className="text-primary font-medium">
            {startDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-muted-foreground shrink-0" />
          <span className="text-primary font-medium capitalize">
            {booking.sessionType.type.replaceAll("_", " ")}
          </span>
        </div>
      </div>

      {/* ── Timezone caption ── */}
      <p className="px-5 pb-3 text-xs text-muted-foreground">
        Times shown in {tz}
      </p>

      {/* ── Itemised pricing ── */}
      {sessionFee != null && (
        <div className="border-t border-border/60 px-5 py-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Session fee</span>
            <span className="font-medium text-primary">
              ₹{(sessionFee / 100).toLocaleString("en-IN")}
            </span>
          </div>
          {platformFee != null && platformFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Platform fee (10%)</span>
              <span className="font-medium text-primary">
                ₹{(platformFee / 100).toLocaleString("en-IN")}
              </span>
            </div>
          )}
          <div
            className="flex items-center justify-between pt-2 text-sm"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="font-semibold text-primary">Total</span>
            <span className="font-mono font-bold text-primary">
              ₹{((total ?? sessionFee) / 100).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}

      {/* ── Meet link ── */}
      {booking.meetLink && (
        <div className="border-t border-border/60 px-5 py-3">
          <a
            href={booking.meetLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <Video size={15} />
            {booking.meetLink}
          </a>
        </div>
      )}
    </Card>
  );
}
