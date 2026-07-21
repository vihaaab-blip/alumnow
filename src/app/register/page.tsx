"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Check,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { signup, signupAlumni } from "@/actions/auth.actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";


const inputDark =
  "bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-coral/50 focus:ring-coral/10";

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Singapore", "Germany", "France", "Other",
];

function StudentForm({
  onStatusChange,
}: {
  onStatusChange: (s: string) => void;
}) {
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setStatus("creating");
    onStatusChange("creating");
    const r = await signup({
      email, password, fullName, phone,
      dateOfBirth: null, currentGrade: "Other",
      school: school || "Not specified",
      confirmPassword, tosAccepted: true,
    });
    if (r.error) {
      setError(r.error);
      setStatus("idle");
      onStatusChange("idle");
      return;
    }
    const result = await signIn("credentials", {
      email,
      password,
      createIfMissing: "student",
      fullName,
      phone,
      school: school || "Not specified",
      redirect: false,
    });
    if (result?.error) {
      setError("Account created but sign-in failed. Please go to login.");
      setStatus("idle");
      onStatusChange("idle");
      return;
    }
    setStatus("verified");
    onStatusChange("verified");
    window.location.replace(r.data?.redirectTo ?? "/dashboard");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-semibold text-white/70">
        Full name
        <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={`mt-2 ${inputDark}`} placeholder="Your full name" />
      </label>
      <label className="block text-sm font-semibold text-white/70">
        Email
        <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-2 ${inputDark}`} placeholder="you@example.com" />
      </label>
      <label className="block text-sm font-semibold text-white/70">
        Phone
        <Input required value={phone} onChange={(e) => setPhone(e.target.value)} className={`mt-2 ${inputDark}`} placeholder="+919876543210" />
      </label>
      <label className="block text-sm font-semibold text-white/70">
        School / College
        <Input value={school} onChange={(e) => setSchool(e.target.value)} className={`mt-2 ${inputDark}`} placeholder="e.g. JBCN International School" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-white/70">
          Password
          <Input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-2 ${inputDark}`} placeholder="At least 8 characters" />
        </label>
        <label className="block text-sm font-semibold text-white/70">
          Confirm
          <Input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`mt-2 ${inputDark}`} placeholder="Re-enter password" />
        </label>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={status !== "idle"} className="w-full" variant="accent">
        {status === "idle" ? "Create account" : "Creating..."}
      </Button>
      <p className="text-center text-xs text-white/25">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="text-white/50 hover:text-white underline underline-offset-2">Terms</Link>{" "}
        &{" "}
        <Link href="/privacy" className="text-white/50 hover:text-white underline underline-offset-2">Privacy Policy</Link>
      </p>
    </form>
  );
}

function AlumniWizard({
  onStatusChange,
}: {
  onStatusChange: (s: string) => void;
}) {
  const defaultSessionTypes = [
    {
      type: "call_30",
      pricePaise: 29900,
      maxParticipants: 1,
      descriptionOneLiner: "A focused 30-minute mentoring call",
    },
    {
      type: "call_60",
      pricePaise: 49900,
      maxParticipants: 1,
      descriptionOneLiner: "A deeper 60-minute mentoring session",
    },
  ];

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");

  const [acc, setAcc] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [profile, setProfile] = useState({ universityName: "", course: "", country: "", graduationYearJbcn: 2023, bio: "", profilePhotoUrl: "" });
  const [photoPreview, setPhotoPreview] = useState("");

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setProfile((p) => ({ ...p, profilePhotoUrl: ev.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (acc.password !== acc.confirmPassword) { setError("Passwords don't match"); return; }
    if (acc.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError(""); setStatus("creating"); onStatusChange("creating");
    try {
      const r = await signupAlumni({
        ...acc,
        ...profile,
        sessionTypes: defaultSessionTypes,
      });
      if (r.error) { setError(r.error); setStatus("idle"); onStatusChange("idle"); return; }
    } catch (e) {
      console.error("signupAlumni unexpected error:", e);
      setError("Something went wrong. Please try again.");
      setStatus("idle"); onStatusChange("idle");
      return;
    }
    setStatus("verified");
    onStatusChange("verified");
  };

  const totalSteps = 2;
  const canNext = () => {
    if (step === 1) return acc.fullName && acc.email && acc.phone && acc.password && acc.confirmPassword;
    if (step === 2) return profile.universityName && profile.course && profile.country && profile.graduationYearJbcn;
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-0">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex items-center">
            {s > 1 && <div className={`mx-2 h-px w-8 transition-colors ${step >= s ? "bg-coral" : "bg-white/10"}`} />}
            <button type="button" onClick={() => s < step && setStep(s)}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step > s ? "bg-coral/30 text-white" : step === s ? "bg-coral text-white" : "bg-white/10 text-white/25"
              }`}>
              {step > s ? <Check size={12} /> : s}
            </button>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/25">Step {step} of {totalSteps}</p>
        <h2 className="mt-1 text-xl font-semibold text-white font-heading">
          {step === 1 && "Create your alumni account"}
          {step === 2 && "Complete your profile"}
        </h2>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-white/70">Full name <Input required value={acc.fullName} onChange={(e) => setAcc((p) => ({ ...p, fullName: e.target.value }))} className={`mt-2 ${inputDark}`} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-white/70">Email <Input required type="email" value={acc.email} onChange={(e) => setAcc((p) => ({ ...p, email: e.target.value }))} className={`mt-2 ${inputDark}`} /></label>
            <label className="block text-sm font-semibold text-white/70">Phone <Input required placeholder="+919876543210" value={acc.phone} onChange={(e) => setAcc((p) => ({ ...p, phone: e.target.value }))} className={`mt-2 ${inputDark}`} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-white/70">Password <Input required minLength={8} type="password" value={acc.password} onChange={(e) => setAcc((p) => ({ ...p, password: e.target.value }))} className={`mt-2 ${inputDark}`} /></label>
            <label className="block text-sm font-semibold text-white/70">Confirm <Input required type="password" value={acc.confirmPassword} onChange={(e) => setAcc((p) => ({ ...p, confirmPassword: e.target.value }))} className={`mt-2 ${inputDark}`} /></label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/15"><Upload size={20} /></div>
              )}
            </div>
            <label className="cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50 hover:bg-white/10 transition-all">
              Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-white/70">University <Input required value={profile.universityName} onChange={(e) => setProfile((p) => ({ ...p, universityName: e.target.value }))} className={`mt-2 ${inputDark}`} /></label>
            <label className="block text-sm font-semibold text-white/70">Course <Input required value={profile.course} onChange={(e) => setProfile((p) => ({ ...p, course: e.target.value }))} className={`mt-2 ${inputDark}`} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-white/70">Country
              <select value={profile.country} onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                className={`mt-2 w-full ${inputDark} rounded-[10px] px-3 py-2.5 outline-none`}>
                <option value="" className="bg-[#1A1A1A] text-white/25">Select country</option>
                {COUNTRIES.map((c) => <option key={c} className="bg-[#1A1A1A] text-white" value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-white/70">Grad year <Input required type="number" min={2000} max={2030} value={profile.graduationYearJbcn} onChange={(e) => setProfile((p) => ({ ...p, graduationYearJbcn: parseInt(e.target.value) || 2023 }))} className={`mt-2 ${inputDark}`} /></label>
          </div>
          <label className="block text-sm font-semibold text-white/70">Bio <textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={3} className={`mt-2 w-full resize-none ${inputDark} rounded-[10px] px-3 py-2.5 text-sm outline-none`} /></label>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <button type="button" onClick={() => setStep((p) => p - 1)}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/50 hover:bg-white/10 transition-all">
            Back
          </button>
        )}
        {step < totalSteps ? (
          <button type="button" onClick={() => setStep((p) => p + 1)} disabled={!canNext()}
            className="flex-1 rounded-xl bg-coral px-4 py-3 text-sm font-semibold text-white hover:bg-coral-light transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Continue
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={!canNext() || status !== "idle"}
            className="flex-1 rounded-xl bg-coral px-4 py-3 text-sm font-semibold text-white hover:bg-coral-light transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {status === "idle" ? "Submit application" : "Submitting application..."}
          </button>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [role, setRole] = useState<"student" | "alumni">("student");
  const [status, setStatus] = useState("idle");

  if (status !== "idle") {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-6 bg-[#0D0D0D]">
        <div className="relative z-10 rounded-2xl border border-white/10 bg-[#1A1A1A] p-10 shadow-lg text-center max-w-sm w-full">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mx-auto">
            {status === "verified" ? <Check size={30} className="text-white" /> : <LoaderCircle className="animate-spin text-coral" size={28} />}
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-white font-heading">
            {status === "creating"
              ? (role === "alumni" ? "Submitting your application..." : "Creating your account...")
              : (role === "alumni" ? "Application submitted!" : "Account created!")}
          </h1>
          <p className="mt-2 text-white/40">
            {status === "verified"
              ? (role === "alumni" ? "Your mentor application is pending review. You will be notified once it is approved." : "Redirecting you...")
              : "This will only take a moment."}
          </p>
          {status === "verified" && role === "alumni" && (
            <button
              onClick={() => { window.location.href = "/login"; }}
              className="mt-6 rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-white hover:bg-coral-light transition-all"
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0D0D0D]">
      <div className="relative mx-auto max-w-xl px-6 py-14">
        <div className="rounded-2xl border border-white/10 bg-[#1A1A1A] shadow-lg p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/40">Join the network</p>
          <h1 className="mt-3 text-3xl font-semibold text-white font-heading">Create your account</h1>

          <div className="mt-6 flex gap-1.5 rounded-xl bg-white/5 p-1 border border-white/10">
            {(["student", "alumni"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-all ${
                  role === r ? "bg-coral text-white shadow-sm" : "text-white/35 hover:text-white/60"
                }`}>
                {r === "student" ? "Student" : "Alumni"}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {role === "student" ? <StudentForm onStatusChange={setStatus} /> : <AlumniWizard onStatusChange={setStatus} />}
          </div>

          <p className="mt-8 text-center text-sm text-white/30">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-white/70 hover:text-white underline underline-offset-2">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
