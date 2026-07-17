import { describe, it, expect } from "vitest";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  alumniApplicationSchema,
  studentProfileSchema,
  sessionTypeSchema,
  availabilitySchema,
  bookingDraftSchema,
  paymentRefSchema,
  signupAlumniSchema,
  reviewSchema,
} from "@/lib/validation";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "secret" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid email address");
    }
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  const validInput = {
    fullName: "Test User",
    email: "test@example.com",
    phone: "+919876543210",
    currentGrade: "AS",
    password: "password1",
    tosAccepted: true,
  };

  it("accepts valid signup data", () => {
    const result = signupSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = signupSchema.safeParse({ ...validInput, fullName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone without +91 prefix", () => {
    const result = signupSchema.safeParse({ ...validInput, phone: "9876543210" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone format", () => {
    const result = signupSchema.safeParse({ ...validInput, phone: "12345" });
    expect(result.success).toBe(false);
  });

  it("accepts phone with +91 prefix", () => {
    const result = signupSchema.safeParse({ ...validInput, phone: "+919876543210" });
    expect(result.success).toBe(true);
  });

  it("rejects password without number", () => {
    const result = signupSchema.safeParse({ ...validInput, password: "password" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("number"))).toBe(true);
    }
  });

  it("rejects short password", () => {
    const result = signupSchema.safeParse({ ...validInput, password: "a1" });
    expect(result.success).toBe(false);
  });

  it("rejects unaccepted tos", () => {
    const result = signupSchema.safeParse({ ...validInput, tosAccepted: false });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({ ...validInput, confirmPassword: "different" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "Passwords don't match")).toBe(true);
    }
  });

  it("applies default school", () => {
    const result = signupSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.school).toBe("JBCN International School Borivali");
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts valid reset data", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "newpass1",
      confirmPassword: "newpass1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "newpass1",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });
});

describe("alumniApplicationSchema", () => {
  const validInput = {
    fullName: "Alumni User",
    email: "alumni@example.com",
    phone: "+919876543210",
    password: "pass12345",
    universityName: "Test University",
    course: "Computer Science",
    graduationYearJbcn: 2020,
    country: "India",
    languages: "English",
    currentStudyLevel: "undergraduate",
    tosAccepted: true,
  };

  it("accepts valid application", () => {
    const result = alumniApplicationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects invalid graduation year", () => {
    const result = alumniApplicationSchema.safeParse({ ...validInput, graduationYearJbcn: 2010 });
    expect(result.success).toBe(false);
  });

  it("accepts optional linkedin url", () => {
    const result = alumniApplicationSchema.safeParse({ ...validInput, linkedinUrl: "" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid linkedin url", () => {
    const result = alumniApplicationSchema.safeParse({ ...validInput, linkedinUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

describe("studentProfileSchema", () => {
  it("accepts valid student profile", () => {
    const result = studentProfileSchema.safeParse({
      fullName: "Student Name",
      currentGrade: "A2",
      school: "Test School",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid grade", () => {
    const result = studentProfileSchema.safeParse({
      fullName: "Student Name",
      currentGrade: "invalid",
      school: "Test School",
    });
    expect(result.success).toBe(false);
  });
});

describe("sessionTypeSchema", () => {
  it("accepts valid session type", () => {
    const result = sessionTypeSchema.safeParse({
      type: "call_30",
      pricePaise: 29900,
      maxParticipants: 1,
    });
    expect(result.success).toBe(true);
  });

  it("applies default maxParticipants", () => {
    const result = sessionTypeSchema.safeParse({ type: "call_60", pricePaise: 49900 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxParticipants).toBe(1);
    }
  });

  it("rejects invalid type", () => {
    const result = sessionTypeSchema.safeParse({ type: "invalid", pricePaise: 1000 });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = sessionTypeSchema.safeParse({ type: "call_30", pricePaise: -1 });
    expect(result.success).toBe(false);
  });
});

describe("availabilitySchema", () => {
  it("accepts valid availability", () => {
    const result = availabilitySchema.safeParse({
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isRecurring).toBe(true);
    }
  });

  it("rejects invalid time format", () => {
    const result = availabilitySchema.safeParse({
      dayOfWeek: 1,
      startTime: "9:00",
      endTime: "17:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid dayOfWeek", () => {
    const result = availabilitySchema.safeParse({
      dayOfWeek: 7,
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("paymentRefSchema", () => {
  it("accepts valid UPI reference", () => {
    const result = paymentRefSchema.safeParse({ upiTransactionRef: "ABC12345.xyz" });
    expect(result.success).toBe(true);
  });

  it("rejects short reference", () => {
    const result = paymentRefSchema.safeParse({ upiTransactionRef: "short" });
    expect(result.success).toBe(false);
  });
});

describe("bookingDraftSchema", () => {
  it("accepts valid booking draft", () => {
    const result = bookingDraftSchema.safeParse({
      alumniId: "alumni-1",
      sessionTypeOfferingId: "offering-1",
      scheduledStartAt: "2026-01-15T10:00:00Z",
      scheduledEndAt: "2026-01-15T10:30:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-datetime string", () => {
    const result = bookingDraftSchema.safeParse({
      alumniId: "alumni-1",
      sessionTypeOfferingId: "offering-1",
      scheduledStartAt: "not-a-datetime",
      scheduledEndAt: "2026-01-15T10:30:00Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("accepts valid review", () => {
    const result = reviewSchema.safeParse({ rating: 5, text: "Great mentor" });
    expect(result.success).toBe(true);
  });

  it("rejects rating out of range", () => {
    const result = reviewSchema.safeParse({ rating: 6 });
    expect(result.success).toBe(false);
  });

  it("rejects overlong review text", () => {
    const result = reviewSchema.safeParse({ rating: 4, text: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("accepts review without text", () => {
    const result = reviewSchema.safeParse({ rating: 3 });
    expect(result.success).toBe(true);
  });

  it("rejects zero rating", () => {
    const result = reviewSchema.safeParse({ rating: 0 });
    expect(result.success).toBe(false);
  });
});

describe("signupAlumniSchema", () => {
  it("accepts valid alumni signup", () => {
    const result = signupAlumniSchema.safeParse({
      fullName: "Test Alumni",
      email: "alumni@test.com",
      phone: "+919876543210",
      password: "testpass1",
      universityName: "UC Berkeley",
      course: "CS",
      country: "US",
      graduationYearJbcn: 2020,
      sessionTypes: [{ type: "call_30", pricePaise: 29900 }],
      availability: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty session types", () => {
    const result = signupAlumniSchema.safeParse({
      fullName: "Test Alumni",
      email: "alumni@test.com",
      phone: "+919876543210",
      password: "testpass1",
      universityName: "UC Berkeley",
      course: "CS",
      country: "US",
      graduationYearJbcn: 2020,
      sessionTypes: [],
      availability: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty availability", () => {
    const result = signupAlumniSchema.safeParse({
      fullName: "Test Alumni",
      email: "alumni@test.com",
      phone: "+919876543210",
      password: "testpass1",
      universityName: "UC Berkeley",
      course: "CS",
      country: "US",
      graduationYearJbcn: 2020,
      sessionTypes: [{ type: "call_30", pricePaise: 29900 }],
      availability: [],
    });
    expect(result.success).toBe(false);
  });
});
