import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^(\+91)?[0-9]{10}$/, "Phone must be 10 digits (optionally with +91 prefix)"),
  dateOfBirth: z.coerce.date().optional(),
  currentGrade: z.enum(["AS", "A2", "Other"]),
  school: z.string().min(1).default("JBCN International School Borivali"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least 1 number"),
  confirmPassword: z.string().optional(),
  tosAccepted: z.literal(true, { message: "You must accept the terms" }),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).regex(/[0-9]/, "Must contain at least 1 number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const alumniApplicationSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^(\+91)?[0-9]{10}$/, "Phone must be 10 digits (optionally with +91 prefix)"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least 1 number"),
  confirmPassword: z.string().optional(),
  universityName: z.string().min(2).max(200),
  course: z.string().min(2).max(200),
  graduationYearJbcn: z.coerce.number().int().min(2015).max(2026),
  country: z.string().min(2).max(100),
  bio: z.string().max(750).optional(),
  profilePhotoUrl: z.string().optional(),
  languages: z.string().min(2).max(100),
  currentStudyLevel: z.enum(["undergraduate", "postgraduate", "other"]),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  tosAccepted: z.boolean().refine((val) => val === true, { message: "You must accept the terms" }),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const alumniProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  universityName: z.string().min(2).max(200),
  course: z.string().min(2).max(200),
  country: z.string().min(2).max(100),
  graduationYearJbcn: z.number().int().min(1990).max(2030),
  currentStudyLevel: z.enum(["undergraduate", "postgraduate"]),
  bio: z.string().max(750).optional(),
  languages: z.array(z.string()).max(10).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
});

export const studentProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  dateOfBirth: z.string().optional(),
  currentGrade: z.enum(["AS", "A2", "Other"]),
  school: z.string().min(1).max(200),
});

export const sessionTypeSchema = z.object({
  type: z.enum(["call_30", "call_45", "call_60", "group_40"]),
  pricePaise: z.number().int().min(0).max(100000),
  maxParticipants: z.number().int().min(1).max(10).default(1),
});

export const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  specificDate: z.string().optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be HH:mm format"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be HH:mm format"),
  isRecurring: z.boolean().default(true),
});

export const bookingDraftSchema = z.object({
  alumniId: z.string().min(1),
  sessionTypeOfferingId: z.string().min(1),
  scheduledStartAt: z.string().datetime(),
  scheduledEndAt: z.string().datetime(),
});

export const paymentRefSchema = z.object({
  upiTransactionRef: z.string().regex(/^[A-Za-z0-9.-]{8,}$/, "Reference must be 8+ characters (letters, numbers, hyphens, dots)"),
});

export const signupAlumniSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^(\+91)?[0-9]{10}$/, "Phone must be 10 digits (optionally with +91 prefix)"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  universityName: z.string().min(2).max(200),
  course: z.string().min(2).max(200),
  country: z.string().min(2).max(100),
  graduationYearJbcn: z.number().int().min(1990).max(2030),
  bio: z.string().max(750).optional(),
  profilePhotoUrl: z.string().optional(),
  languages: z.string().optional(),
  sessionTypes: z.array(z.object({
    type: z.string().min(1),
    pricePaise: z.number().int().min(0),
    maxParticipants: z.number().int().min(1).default(1),
    descriptionOneLiner: z.string().optional(),
  })).min(1, "At least one session type is required"),
  availability: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be HH:mm format"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Must be HH:mm format"),
  })).optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(200, "Review must be under 200 characters").optional(),
});
