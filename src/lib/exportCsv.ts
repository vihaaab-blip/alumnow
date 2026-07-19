export function exportBookingsCsv(bookings: any[], filename = "sessions.csv") {
  const headers = ["Date", "Time", "Person", "Status"];
  const rows = bookings.map((b: any) => [
    new Date(b.scheduledStartAt).toLocaleDateString(),
    new Date(b.scheduledStartAt).toLocaleTimeString(),
    b.alumni?.fullName || b.student?.name || "\u2014",
    b.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
