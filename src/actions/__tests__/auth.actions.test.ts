import { describe, it, expect, vi } from "vitest";
import { forgotPasswordSchema, resetPasswordSchema, loginSchema, signupSchema } from "@/lib/validation";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
  emailTemplates: {
    signupVerification: vi.fn().mockReturnValue({ to: "", subject: "", body: "", eventType: "signup_verification" }),
  },
}));

describe("validation schemas used by auth actions", () => {
  describe("loginSchema", () => {
    it("parses valid credentials", () => {
      const result = loginSchema.safeParse({ email: "test@example.com", password: "secret" });
      expect(result.success).toBe(true);
    });

    it("rejects missing email", () => {
      const result = loginSchema.safeParse({ password: "secret" });
      expect(result.success).toBe(false);
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({ email: "test@example.com", password: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("signupSchema", () => {
    it("parses valid signup", () => {
      const result = signupSchema.safeParse({
        fullName: "Test User",
        email: "test@example.com",
        phone: "+919876543210",
        currentGrade: "A2",
        password: "pass1234",
        tosAccepted: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid grade", () => {
      const result = signupSchema.safeParse({
        fullName: "Test User",
        email: "test@example.com",
        phone: "+919876543210",
        currentGrade: "invalid",
        password: "pass1234",
        tosAccepted: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("parses valid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "user@example.com" });
      expect(result.success).toBe(true);
    });
  });

  describe("resetPasswordSchema", () => {
    it("parses with matching passwords", () => {
      const result = resetPasswordSchema.safeParse({
        token: "abc",
        password: "newpass1",
        confirmPassword: "newpass1",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mismatched passwords", () => {
      const result = resetPasswordSchema.safeParse({
        token: "abc",
        password: "newpass1",
        confirmPassword: "different",
      });
      expect(result.success).toBe(false);
    });
  });
});
