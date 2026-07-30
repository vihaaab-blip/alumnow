"use client";
import { getUserActivitySummary } from "@/actions/admin.actions";
import { useEffect, useState } from "react";

export function UserActivitySummary({ userId }: { userId: string }) {
  const [summary, setSummary] = useState<{ bookingCount: number; reviewCount: number; totalSpentPaise: number } | null>(null);
  useEffect(() => { getUserActivitySummary(userId).then(setSummary); }, [userId]);
  if (!summary) return <p className="text-xs text-white/30">Loading activity...</p>;
  return (
    <div className="flex gap-6 text-xs text-white/50">
      <span>{summary.bookingCount} bookings</span>
      <span>{summary.reviewCount} reviews</span>
      <span>₹{(summary.totalSpentPaise / 100).toLocaleString("en-IN")} spent</span>
    </div>
  );
}
