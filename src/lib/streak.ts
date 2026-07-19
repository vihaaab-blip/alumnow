export function computeStreak(bookings: any[]): { current: number; longest: number } {
  const completedDates = Array.from(new Set(
    bookings.filter(b => b.status === "completed")
      .map(b => new Date(b.scheduledStartAt).toDateString())
  )).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());

  let current = 0, longest = 0, streak = 0;
  for (let i = 0; i < completedDates.length; i++) {
    const prev = completedDates[i - 1];
    if (i === 0 || !prev || (completedDates[i]!.getTime() - prev.getTime()) <= 7 * 86400000) {
      streak++;
    } else {
      streak = 1;
    }
    longest = Math.max(longest, streak);
  }
  const lastDate = completedDates[completedDates.length - 1];
  const daysSinceLast = lastDate
    ? (Date.now() - lastDate.getTime()) / 86400000
    : Infinity;
  current = daysSinceLast <= 7 ? streak : 0;
  return { current, longest };
}
