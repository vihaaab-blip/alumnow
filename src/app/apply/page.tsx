"use client";
import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { applyAsAlumni } from "@/actions/alumni.actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";

type Form = {
  fullName: string; email: string; phone: string; password: string;
  confirmPassword: string; universityName: string; course: string;
  graduationYearJbcn: string; country: string; bio: string;
  languages: string; currentStudyLevel: string; linkedinUrl: string;
  tosAccepted: boolean;
};

const initial: Form = {
  fullName: "", email: "", phone: "", password: "", confirmPassword: "",
  universityName: "", course: "", graduationYearJbcn: "", country: "India",
  bio: "", languages: "English, Hindi", currentStudyLevel: "undergraduate",
  linkedinUrl: "", tosAccepted: false,
};

const inputDark =
  "bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-coral/50 focus:ring-coral/10";

export default function ApplyPage() {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<"idle" | "creating" | "submitted">("idle");

  const update = (key: keyof Form, value: string | boolean) =>
    setData((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setErrors({});
    if (data.password !== data.confirmPassword) {
      setErrors({ confirmPassword: ["Passwords don't match"] });
      return;
    }
    if (data.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!data.tosAccepted) {
      setError("You must accept the Terms of Service");
      return;
    }
    setStatus("creating");
    const result = await applyAsAlumni(data);
    if (!result.success) {
      setError(result.error ?? "Please check your details.");
      setStatus("idle");
      return;
    }
    setStatus("submitted");
  }

  if (status !== "idle") {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0D0D0D]">
        <div className="relative z-10 mx-auto flex min-h-screen max-w-md items-center justify-center px-6 text-center">
          <div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mx-auto">
              {status === "submitted" ? (
                <Check size={30} className="text-white" />
              ) : (
                <LoaderCircle className="animate-spin text-coral" size={28} />
              )}
            </div>
            <h1 className="mt-6 text-3xl font-semibold text-white font-heading">
              {status === "creating"
                ? "Submitting your application..."
                : "Application submitted!"}
            </h1>
            <p className="mt-3 text-white/40">
              {status === "submitted"
                ? "Your mentor application is pending review. You will be notified once it is approved."
                : "This will only take a moment."}
            </p>
            {status === "submitted" && (
              <button
                onClick={() => { window.location.href = "/login"; }}
                className="mt-6 rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-white hover:bg-coral-light transition-all"
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0D0D0D]">
      <div className="relative mx-auto max-w-xl px-6 py-14">
        <div className="rounded-2xl border border-white/10 bg-[#1A1A1A] shadow-lg p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/40">
            Apply as mentor
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white font-heading">
            Become an alumni mentor
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Help students make informed decisions about their future.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-white/70">
                Full name
                <Input required value={data.fullName} onChange={(e) => update("fullName", e.target.value)} className={`mt-2 ${inputDark}`} placeholder="Your full name" />
              </label>
              <label className="block text-sm font-semibold text-white/70">
                Email
                <Input required type="email" value={data.email} onChange={(e) => update("email", e.target.value)} className={`mt-2 ${inputDark}`} placeholder="you@example.com" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-white/70">
                Phone
                <Input required value={data.phone} onChange={(e) => update("phone", e.target.value)} className={`mt-2 ${inputDark}`} placeholder="+919876543210" />
              </label>
              <label className="block text-sm font-semibold text-white/70">
                University
                <Input required value={data.universityName} onChange={(e) => update("universityName", e.target.value)} className={`mt-2 ${inputDark}`} placeholder="e.g. UC Berkeley" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-white/70">
                Course
                <Input required value={data.course} onChange={(e) => update("course", e.target.value)} className={`mt-2 ${inputDark}`} placeholder="e.g. B.Sc. Computer Science" />
              </label>
              <label className="block text-sm font-semibold text-white/70">
                Graduation year
                <Input required type="number" min={2000} max={2030} value={data.graduationYearJbcn} onChange={(e) => update("graduationYearJbcn", e.target.value)} className={`mt-2 ${inputDark}`} placeholder="e.g. 2023" />
              </label>
            </div>
            <label className="block text-sm font-semibold text-white/70">
              Country
              <Input required value={data.country} onChange={(e) => update("country", e.target.value)} className={`mt-2 ${inputDark}`} placeholder="e.g. United States" />
            </label>
            <label className="block text-sm font-semibold text-white/70">
              Bio
              <textarea
                value={data.bio}
                onChange={(e) => update("bio", e.target.value)}
                rows={3}
                className={`mt-2 w-full resize-none ${inputDark} rounded-[10px] px-3 py-2.5 text-sm outline-none`}
                placeholder="Tell students about your experience..."
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-white/70">
                Password
                <Input required minLength={8} type="password" value={data.password} onChange={(e) => update("password", e.target.value)} className={`mt-2 ${inputDark}`} placeholder="At least 8 characters" />
              </label>
              <label className="block text-sm font-semibold text-white/70">
                Confirm password
                <Input required type="password" value={data.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className={`mt-2 ${inputDark}`} placeholder="Re-enter password" />
              </label>
            </div>
            {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword[0]}</p>}

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={data.tosAccepted}
                onCheckedChange={(checked) => update("tosAccepted", Boolean(checked))}
                className="mt-0.5 border-white/20 data-[state=checked]:bg-coral data-[state=checked]:border-coral"
              />
              <span className="text-sm text-white/40">
                I agree to the{" "}
                <a href="/terms" className="text-white/60 hover:text-white underline underline-offset-2">Terms of Service</a>{" "}
                and{" "}
                <a href="/privacy" className="text-white/60 hover:text-white underline underline-offset-2">Privacy Policy</a>
              </span>
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" disabled={status !== "idle"} className="w-full" variant="accent">
              {status === "idle" ? "Submit application" : "Submitting..."}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
