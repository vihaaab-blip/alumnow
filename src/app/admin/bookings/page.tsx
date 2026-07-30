"use client";
import { useEffect, useState, useCallback } from "react";
import { getAllBookings, updateBookingStatus } from "@/actions/admin.actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdminCsvExportButton } from "@/components/AdminCsvExportButton";
import { toast } from "@/components/ui/Toaster";
import type { AdminBookingItem, PaginatedResult } from "@/types";

const STATUS_OPTIONS = ["pending_payment", "payment_submitted", "confirmed", "completed", "cancelled", "no_show"];

export default function AdminBookingsPage() {
  const [data, setData] = useState<PaginatedResult<AdminBookingItem> | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const isStale = (booking: AdminBookingItem) =>
    booking.status === "payment_submitted" &&
    Date.now() - new Date((booking as any).updatedAt ?? booking.scheduledStartAt).getTime() > 24 * 60 * 60 * 1000;

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
      setData(result);
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Sessions</p>
          <h1 className="mt-2 text-[32px] font-bold tracking-tight text-white">Bookings</h1>
          <p className="mt-2 text-sm text-white/40">Payments, attendance, and session status in one view.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-[10px] border border-white/10 bg-white/[0.02] px-3.5 text-sm text-white outline-none focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
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

      <p className="mt-2 text-xs text-white/30">Rows highlighted in amber have pending payment confirmation older than 24 hours.</p>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider text-white/35">
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
              <tr key={booking.id} className={`border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.02] ${isStale(booking) ? "bg-amber-500/[0.04]" : ""}`}>
                <td className="p-4 font-semibold text-white">
                  {booking.alumni.fullName}
                  <p className="text-xs font-normal text-white/40">{booking.sessionType.type}</p>
                </td>
                <td className="text-white/50">{booking.student.email}</td>
                <td className="text-white/50">{new Date(booking.scheduledStartAt).toLocaleString()}</td>
                <td className="font-mono text-white/70">₹{((booking.payment?.amountPaise ?? 0) / 100).toLocaleString("en-IN")}</td>
                <td>
                  <select
                    value={booking.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        await updateBookingStatus(booking.id, newStatus);
                        setData((prev) => prev ? { ...prev, items: prev.items.map((b) => b.id === booking.id ? { ...b, status: newStatus } as any : b) } : prev);
                        toast({ title: "Booking status updated", variant: "success" });
                      } catch {
                        toast({ title: "Failed to update booking", variant: "error" });
                      }
                    }}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-coral/40"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.06]">
                  <td className="p-4"><div className="h-4 w-32 rounded-[6px] bg-white/10 animate-pulse" /></td>
                  <td><div className="h-4 w-40 rounded-[6px] bg-white/10 animate-pulse" /></td>
                  <td><div className="h-4 w-28 rounded-[6px] bg-white/10 animate-pulse" /></td>
                  <td><div className="h-4 w-16 rounded-[6px] bg-white/10 animate-pulse" /></td>
                  <td><div className="h-5 w-20 rounded-full bg-white/10 animate-pulse" /></td>
                </tr>
              ))
            ) : (!data || data.items.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-white/40">No bookings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-white/40">
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
