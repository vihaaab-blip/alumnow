"use client";
import { useEffect, useState, useCallback } from "react";
import { getAllBookings } from "@/actions/admin.actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdminCsvExportButton } from "@/components/AdminCsvExportButton";
import { toast } from "@/components/ui/Toaster";
import type { AdminBookingItem, PaginatedResult } from "@/types";

const STATUS_BADGE: Record<string, "neutral" | "accent" | "success" | "danger"> = {
  pending_payment: "neutral",
  payment_submitted: "accent",
  confirmed: "success",
  completed: "success",
  cancelled: "danger",
  no_show: "danger",
};

export default function AdminBookingsPage() {
  const [data, setData] = useState<PaginatedResult<AdminBookingItem> | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = await getAllBookings({
        page: p,
        pageSize: 20,
        status: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(result as any);
    } catch {
      toast({ title: "Failed to load bookings", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, startDate, endDate]);

  useEffect(() => {
    load(page);
  }, [page, load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, startDate, endDate]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Bookings" }]} />
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Bookings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Payments, attendance, and session status in one view.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-[10px] border border-border bg-[#1A1A1A] px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          <option value="ALL">All statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="payment_submitted">Payment Submitted</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
        <div className="ml-auto">
          <AdminCsvExportButton />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-[#1A1A1A]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Session</th>
              <th>Student</th>
              <th>When</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((booking) => (
              <tr key={booking.id} className="border-b border-border last:border-0">
                <td className="p-4 font-semibold text-primary">
                  {booking.alumni.fullName}
                  <p className="text-xs font-normal text-muted-foreground">{booking.sessionType.type}</p>
                </td>
                <td>{booking.student.email}</td>
                <td>{new Date(booking.scheduledStartAt).toLocaleString()}</td>
                <td>₹{((booking.payment?.amountPaise ?? 0) / 100).toLocaleString("en-IN")}</td>
                <td>
                  <Badge tone={STATUS_BADGE[booking.status] ?? "neutral"}>
                    {booking.status.replaceAll("_", " ")}
                  </Badge>
                </td>
              </tr>
            ))}
            {(!data || data.items.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                  {loading ? "Loading..." : "No bookings found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.page} of {data.totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
