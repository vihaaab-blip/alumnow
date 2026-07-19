import { describe, it, expect } from "vitest";

/* ─── Inline replicas of dashboard data functions ─── */

function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset + offset * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function generateWeeklyHours(bookings: any[]) {
  const { start } = getWeekRange(0);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, i) => {
    const dayStart = new Date(start);
    dayStart.setDate(start.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const hours = bookings
      .filter((b) => b.status === "completed" && new Date(b.scheduledStartAt) >= dayStart && new Date(b.scheduledStartAt) < dayEnd)
      .reduce((sum, b) => {
        const dur = (new Date(b.scheduledEndAt).getTime() - new Date(b.scheduledStartAt).getTime()) / 3600000;
        return sum + dur;
      }, 0);
    const sessions = bookings.filter((b) => b.status === "completed" && new Date(b.scheduledStartAt) >= dayStart && new Date(b.scheduledStartAt) < dayEnd).length;
    return { day, hours: Math.round(hours * 10) / 10, sessions };
  });
}

function generateMonthlySessions(bookings: any[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = new Date().getFullYear();
  return months.map((month) => {
    const monthIndex = months.indexOf(month);
    const count = bookings.filter((b) => {
      const d = new Date(b.scheduledStartAt);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    });
    return { month, completed: count.filter((b) => b.status === "completed").length, cancelled: count.filter((b) => b.status === "cancelled").length };
  });
}

function generateRatingDist(bookings: any[]) {
  return [5, 4, 3, 2, 1].map((r) => ({
    rating: `${r}★`,
    count: bookings.filter((b) => b.review?.rating === r).length,
    color: r === 5 ? "#16A34A" : r === 4 ? "#65A30D" : r === 3 ? "#D97706" : r === 2 ? "#DC2626" : "#EF4444",
  }));
}

function generateWeeklyStudents(bookings: any[]) {
  const { start } = getWeekRange(0);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, i) => {
    const dayStart = new Date(start);
    dayStart.setDate(start.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const students = new Set(
      bookings
        .filter((b) => new Date(b.scheduledStartAt) >= dayStart && new Date(b.scheduledStartAt) < dayEnd)
        .map((b) => b.studentId)
    );
    return { day, students: students.size };
  });
}

function generateEarnings(bookings: any[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = new Date().getFullYear();
  return months.map((month) => {
    const monthIndex = months.indexOf(month);
    const amount = bookings
      .filter((b) => {
        const d = new Date(b.scheduledStartAt);
        return d.getFullYear() === year && d.getMonth() === monthIndex && b.status !== "cancelled";
      })
      .reduce((sum, b) => sum + (b.payment?.amountPaise ?? b.sessionType?.pricePaise ?? 0), 0);
    return { month, amount };
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── Tests ─── */

describe("getWeekRange", () => {
  it("returns start and end dates for current week", () => {
    const { start, end } = getWeekRange(0);
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
    expect(start.getDay()).toBe(1);
    expect(end.getDay()).toBe(1);
    expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("previous week offset works", () => {
    const { start } = getWeekRange(-1);
    expect(start).toBeInstanceOf(Date);
    expect(start.getDay()).toBe(1);
  });

  it("next week offset works", () => {
    const { start } = getWeekRange(1);
    expect(start).toBeInstanceOf(Date);
    expect(start.getDay()).toBe(1);
  });
});

describe("generateWeeklyHours", () => {
  it("returns 7 days of data", () => {
    const result = generateWeeklyHours([]);
    expect(result).toHaveLength(7);
    expect(result[0]).toHaveProperty("day");
    expect(result[0]).toHaveProperty("hours");
    expect(result[0]).toHaveProperty("sessions");
  });

  it("calculates hours from completed bookings", () => {
    const now = new Date();
    const mockBooking = {
      status: "completed",
      scheduledStartAt: now.toISOString(),
      scheduledEndAt: new Date(now.getTime() + 3600000).toISOString(),
    };
    const result = generateWeeklyHours([mockBooking]);
    const totalHours = result.reduce((a, d) => a + d.hours, 0);
    expect(totalHours).toBeGreaterThan(0);
  });

  it("ignores non-completed bookings", () => {
    const result = generateWeeklyHours([{ status: "cancelled", scheduledStartAt: new Date().toISOString(), scheduledEndAt: new Date().toISOString() }]);
    const totalHours = result.reduce((a, d) => a + d.hours, 0);
    expect(totalHours).toBe(0);
  });
});

describe("generateMonthlySessions", () => {
  it("returns 12 months of data", () => {
    const result = generateMonthlySessions([]);
    expect(result).toHaveLength(12);
    expect(result[0]).toHaveProperty("month");
    expect(result[0]).toHaveProperty("completed");
    expect(result[0]).toHaveProperty("cancelled");
  });

  it("counts bookings by month", () => {
    const year = new Date().getFullYear();
    const mockBooking = {
      status: "completed",
      scheduledStartAt: new Date(year, 0, 15).toISOString(),
      scheduledEndAt: new Date(year, 0, 15, 1).toISOString(),
    };
    const result = generateMonthlySessions([mockBooking]);
    expect(result[0].completed).toBe(1);
  });

  it("separates cancelled from completed", () => {
    const year = new Date().getFullYear();
    const bookings = [
      { status: "completed", scheduledStartAt: new Date(year, 5, 1).toISOString(), scheduledEndAt: new Date(year, 5, 1, 1).toISOString() },
      { status: "cancelled", scheduledStartAt: new Date(year, 5, 2).toISOString(), scheduledEndAt: new Date(year, 5, 2, 1).toISOString() },
    ];
    const result = generateMonthlySessions(bookings);
    expect(result[5].completed).toBe(1);
    expect(result[5].cancelled).toBe(1);
  });
});

describe("generateRatingDist", () => {
  it("returns 5 rating buckets", () => {
    const result = generateRatingDist([]);
    expect(result).toHaveLength(5);
  });

  it("counts ratings correctly", () => {
    const bookings = [
      { review: { rating: 5, text: "Great" } },
      { review: { rating: 5, text: "Amazing" } },
      { review: { rating: 3, text: "Okay" } },
    ];
    const result = generateRatingDist(bookings);
    expect(result[0].count).toBe(2);
    expect(result[2].count).toBe(1);
    expect(result[4].count).toBe(0);
  });

  it("handles missing review", () => {
    const result = generateRatingDist([{}, { review: null }]);
    expect(result.every((r) => r.count === 0)).toBe(true);
  });
});

describe("generateWeeklyStudents", () => {
  it("returns 7 days with unique student counts", () => {
    const now = new Date();
    const bookings = [
      { studentId: "s1", scheduledStartAt: now.toISOString(), scheduledEndAt: new Date(now.getTime() + 1800000).toISOString() },
      { studentId: "s2", scheduledStartAt: now.toISOString(), scheduledEndAt: new Date(now.getTime() + 1800000).toISOString() },
    ];
    const result = generateWeeklyStudents(bookings);
    expect(result).toHaveLength(7);
    const todayTotal = result[now.getDay() === 0 ? 6 : now.getDay() - 1].students;
    expect(todayTotal).toBe(2);
  });

  it("deduplicates same student on same day", () => {
    const now = new Date();
    const bookings = [
      { studentId: "s1", scheduledStartAt: now.toISOString(), scheduledEndAt: new Date(now.getTime() + 1800000).toISOString() },
      { studentId: "s1", scheduledStartAt: now.toISOString(), scheduledEndAt: new Date(now.getTime() + 3600000).toISOString() },
    ];
    const result = generateWeeklyStudents(bookings);
    const todayTotal = result[now.getDay() === 0 ? 6 : now.getDay() - 1].students;
    expect(todayTotal).toBe(1);
  });
});

describe("generateEarnings", () => {
  it("returns 12 months of data", () => {
    const result = generateEarnings([]);
    expect(result).toHaveLength(12);
    expect(result[0]).toHaveProperty("month");
    expect(result[0]).toHaveProperty("amount");
  });

  it("sums payment amounts for non-cancelled bookings", () => {
    const year = new Date().getFullYear();
    const bookings = [
      { status: "completed", payment: { amountPaise: 29900 }, scheduledStartAt: new Date(year, 0, 15).toISOString() },
      { status: "confirmed", payment: { amountPaise: 49900 }, scheduledStartAt: new Date(year, 0, 20).toISOString() },
      { status: "cancelled", payment: { amountPaise: 39900 }, scheduledStartAt: new Date(year, 0, 25).toISOString() },
    ];
    const result = generateEarnings(bookings);
    expect(result[0].amount).toBe(29900 + 49900);
  });
});

describe("getGreeting", () => {
  it("returns a greeting string", () => {
    const greeting = getGreeting();
    expect(["Good morning", "Good afternoon", "Good evening"]).toContain(greeting);
  });
});
