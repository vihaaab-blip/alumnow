"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Check, LoaderCircle, Sun, Moon, Plus, X, Video, Users, Upload } from "lucide-react";
import { signup, signupAlumni } from "@/actions/auth.actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/* ─── Constants ─── */
const inputGlass = "bg-white/10 border-white/20 text-white placeholder:text-white/40 backdrop-blur-md focus:border-white/50 focus:ring-white/30";
const DEMO_ALUMNI = {
  fullName: "Ananya Patel", email: "alumni1@alumnow.com", phone: "+919876543210", password: "password123",
  universityName: "University of California, Berkeley", course: "Computer Science", country: "United States",
  graduationYearJbcn: 2021, bio: "Ex-JBCN student now studying CS at UC Berkeley. Happy to help with college apps and CS career advice.",
  sessionTypes: [
    { type: "one_on_one_video", pricePaise: 99900, descriptionOneLiner: "In-depth conversation about your future" },
    { type: "group_session", pricePaise: 49900, maxParticipants: 10, descriptionOneLiner: "Small group discussion" },
  ],
  availability: [
    { dayOfWeek: 0, startTime: "13:00", endTime: "14:00" },
    { dayOfWeek: 0, startTime: "14:00", endTime: "15:00" },
    { dayOfWeek: 2, startTime: "10:00", endTime: "11:00" },
    { dayOfWeek: 4, startTime: "15:00", endTime: "16:00" },
    { dayOfWeek: 6, startTime: "09:00", endTime: "10:00" },
  ],
};

const SESSION_TYPE_OPTIONS = [
  { value: "one_on_one_video", label: "1:1 Video Call", icon: <Video size={16} /> },
  { value: "group_session", label: "Group Session", icon: <Users size={16} /> },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "Germany", "France", "Other"];

type SessionTypeRow = { type: string; pricePaise: number; maxParticipants: number; descriptionOneLiner: string };
type AvailRow = { dayOfWeek: number; startTime: string; endTime: string };

/* ─── Student Form ─── */
function StudentForm({ onStatusChange }: { onStatusChange: (s: string) => void }) {
  const errorState = useState("");
  const error = errorState[0]!;
  const setError = errorState[1]!;
  const statusState = useState("idle");
  const status = statusState[0]!;
  const setStatus = statusState[1]!;
  const emailState = useState("");
  const email = emailState[0]!;
  const setEmail = emailState[1]!;
  const passwordState = useState("");
  const password = passwordState[0]!;
  const setPassword = passwordState[1]!;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setStatus("creating"); onStatusChange("creating");
    const name = email.split("@")[0]!.replace(/[^a-zA-Z0-9]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const r = await signup({
      email,
      password,
      fullName: name,
      phone: "+919876543210",
      dateOfBirth: null,
      currentGrade: "Other",
      school: "JBCN International School Borivali",
      confirmPassword: password,
      tosAccepted: true,
    });
    if (r.error) { setError(r.error); setStatus("idle"); onStatusChange("idle"); return; }
    setStatus("verifying"); onStatusChange("verifying");
    await new Promise((r) => setTimeout(r, 800));
    setStatus("verified"); onStatusChange("verified");
    await new Promise((r) => setTimeout(r, 700));
    window.location.href = "/dashboard";
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-semibold text-white/80">Email
        <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-2 ${inputGlass}`} placeholder="you@example.com" />
      </label>
      <label className="block text-sm font-semibold text-white/80">Password
        <Input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-2 ${inputGlass}`} placeholder="At least 8 characters" />
      </label>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <Button disabled={status !== "idle"} className="w-full bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md">
        {status === "idle" ? "Create account" : "Creating..."}
      </Button>
      <p className="text-center text-xs text-white/40">By creating an account you agree to our <Link href="/terms" className="text-white/70 hover:text-white underline underline-offset-2">Terms</Link> & <Link href="/privacy" className="text-white/70 hover:text-white underline underline-offset-2">Privacy Policy</Link></p>
    </form>
  );
}

/* ─── Alumni Wizard ─── */
function AlumniWizard({ onStatusChange }: { onStatusChange: (s: string) => void }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");

  /* Step 1 — Account */
  const [acc, setAcc] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const fillAcc = () => setAcc({ fullName: DEMO_ALUMNI.fullName, email: DEMO_ALUMNI.email, phone: DEMO_ALUMNI.phone, password: DEMO_ALUMNI.password, confirmPassword: DEMO_ALUMNI.password });

  /* Step 2 — Profile */
  const [profile, setProfile] = useState({ universityName: "", course: "", country: "", graduationYearJbcn: 2023, bio: "", profilePhotoUrl: "" });
  const [photoPreview, setPhotoPreview] = useState("");
  const fillProfile = () => setProfile({ universityName: DEMO_ALUMNI.universityName, course: DEMO_ALUMNI.course, country: DEMO_ALUMNI.country, graduationYearJbcn: DEMO_ALUMNI.graduationYearJbcn, bio: DEMO_ALUMNI.bio, profilePhotoUrl: "" });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  };

  /* Step 3 — Session Types */
  const [sessions, setSessions] = useState<SessionTypeRow[]>([{ type: "one_on_one_video", pricePaise: 99900, maxParticipants: 1, descriptionOneLiner: "" }]);
  const fillSessions = () => setSessions(DEMO_ALUMNI.sessionTypes.map((s) => ({ ...s, maxParticipants: s.maxParticipants ?? 1 })));
  const addSession = () => setSessions((p) => [...p, { type: "one_on_one_video", pricePaise: 99900, maxParticipants: 1, descriptionOneLiner: "" }]);
  const updSession = (i: number, k: keyof SessionTypeRow, v: any) => setSessions((p) => p.map((s, j) => j === i ? { ...s, [k]: v } : s));
  const delSession = (i: number) => setSessions((p) => p.filter((_, j) => j !== i));

  /* Step 4 — Availability */
  const [avail, setAvail] = useState<AvailRow[]>([{ dayOfWeek: 0, startTime: "09:00", endTime: "10:00" }]);
  const fillAvail = () => setAvail(DEMO_ALUMNI.availability);
  const addAvail = () => setAvail((p) => [...p, { dayOfWeek: 0, startTime: "09:00", endTime: "10:00" }]);
  const updAvail = (i: number, k: keyof AvailRow, v: any) => setAvail((p) => p.map((a, j) => j === i ? { ...a, [k]: v } : a));
  const delAvail = (i: number) => setAvail((p) => p.filter((_, j) => j !== i));

  const handleSubmit = async () => {
    if (acc.password !== acc.confirmPassword) { setError("Passwords don't match"); return; }
    setError(""); setStatus("creating"); onStatusChange("creating");
    const r = await signupAlumni({
      ...acc, ...profile,
      sessionTypes: sessions,
      availability: avail,
    });
    if (r.error) { setError(r.error); setStatus("idle"); onStatusChange("idle"); return; }
    setStatus("verifying"); onStatusChange("verifying");
    await new Promise((r) => setTimeout(r, 800));
    setStatus("verified"); onStatusChange("verified");
    await new Promise((r) => setTimeout(r, 700));
    window.location.href = "/alumni/dashboard";
  };

  const totalSteps = 4;
  const canNext = () => {
    if (step === 1) return acc.fullName && acc.email && acc.password && acc.confirmPassword;
    if (step === 2) return profile.universityName && profile.course && profile.country;
    if (step === 3) return sessions.length > 0 && sessions.every((s) => s.type && s.pricePaise > 0);
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex items-center">
            {s > 1 && <div className={`mx-2 h-px w-8 transition-colors ${step >= s ? "bg-white/50" : "bg-white/15"}`} />}
            <button type="button" onClick={() => s < step && setStep(s)}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step > s ? "bg-white/30 text-white" : step === s ? "bg-white text-[#18181B]" : "bg-white/10 text-white/40"
              }`}>
              {step > s ? <Check size={12} /> : s}
            </button>
          </div>
        ))}
      </div>

      {/* Step title */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Step {step} of {totalSteps}</p>
        <h2 className="mt-1 text-xl font-semibold text-white">
          {step === 1 && "Create your alumni account"}
          {step === 2 && "Complete your profile"}
          {step === 3 && "Set up session types & pricing"}
          {step === 4 && "Set your availability"}
        </h2>
      </div>

      {/* Step content */}
      {step === 1 && (
        <div className="space-y-4">
          <button type="button" onClick={fillAcc}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/50 hover:text-white/80 hover:border-white/30 hover:bg-white/10 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Auto-fill demo alumni data
          </button>
          <label className="block text-sm font-semibold text-white/80">Full name <Input required value={acc.fullName} onChange={(e) => setAcc((p) => ({ ...p, fullName: e.target.value }))} className={`mt-2 ${inputGlass}`} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-white/80">Email <Input required type="email" value={acc.email} onChange={(e) => setAcc((p) => ({ ...p, email: e.target.value }))} className={`mt-2 ${inputGlass}`} /></label>
            <label className="block text-sm font-semibold text-white/80">Phone <Input required placeholder="+919876543210" value={acc.phone} onChange={(e) => setAcc((p) => ({ ...p, phone: e.target.value }))} className={`mt-2 ${inputGlass}`} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-white/80">Password <Input required minLength={8} type="password" value={acc.password} onChange={(e) => setAcc((p) => ({ ...p, password: e.target.value }))} className={`mt-2 ${inputGlass}`} /></label>
            <label className="block text-sm font-semibold text-white/80">Confirm <Input required type="password" value={acc.confirmPassword} onChange={(e) => setAcc((p) => ({ ...p, confirmPassword: e.target.value }))} className={`mt-2 ${inputGlass}`} /></label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <button type="button" onClick={fillProfile}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/50 hover:text-white/80 hover:border-white/30 hover:bg-white/10 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Auto-fill demo profile data
          </button>
          {/* Photo upload */}
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/10">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/30"><Upload size={20} /></div>
              )}
            </div>
            <label className="cursor-pointer rounded-[10px] border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/20 transition-all">
              Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-white/80">University <Input required value={profile.universityName} onChange={(e) => setProfile((p) => ({ ...p, universityName: e.target.value }))} className={`mt-2 ${inputGlass}`} /></label>
            <label className="block text-sm font-semibold text-white/80">Course <Input required value={profile.course} onChange={(e) => setProfile((p) => ({ ...p, course: e.target.value }))} className={`mt-2 ${inputGlass}`} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-white/80">Country
              <select value={profile.country} onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                className={`mt-2 w-full ${inputGlass} rounded-[10px] px-3 py-2.5 outline-none`}>
                <option value="" className="bg-[#1C1C1E] text-white/40">Select country</option>
                {COUNTRIES.map((c) => <option key={c} className="bg-[#1C1C1E] text-white" value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-white/80">Grad year <Input required type="number" min={2000} max={2030} value={profile.graduationYearJbcn} onChange={(e) => setProfile((p) => ({ ...p, graduationYearJbcn: parseInt(e.target.value) || 2023 }))} className={`mt-2 ${inputGlass}`} /></label>
          </div>
          <label className="block text-sm font-semibold text-white/80">Bio <textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={3} className={`mt-2 w-full resize-none ${inputGlass} rounded-[10px] px-3 py-2.5 text-sm outline-none`} /></label>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <button type="button" onClick={fillSessions}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/50 hover:text-white/80 hover:border-white/30 hover:bg-white/10 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Auto-fill demo session types
          </button>
          {sessions.map((s, i) => (
            <div key={i} className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-3 relative">
              {sessions.length > 1 && <button type="button" onClick={() => delSession(i)} className="absolute top-3 right-3 text-white/30 hover:text-white/70"><X size={14} /></button>}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-white/60">Type
                  <select value={s.type} onChange={(e) => updSession(i, "type", e.target.value)}
                    className="mt-1 w-full rounded-[8px] bg-white/10 border border-white/20 text-white px-3 py-2 text-sm outline-none">
                    {SESSION_TYPE_OPTIONS.map((o) => <option key={o.value} className="bg-[#1C1C1E] text-white" value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-medium text-white/60">Price (₹)
                  <Input type="number" min={0} value={s.pricePaise} onChange={(e) => updSession(i, "pricePaise", parseInt(e.target.value) || 0)} className={`mt-1 ${inputGlass}`} />
                </label>
              </div>
              <label className="block text-xs font-medium text-white/60">Description <Input value={s.descriptionOneLiner} onChange={(e) => updSession(i, "descriptionOneLiner", e.target.value)} className={`mt-1 ${inputGlass}`} placeholder="Brief description" /></label>
            </div>
          ))}
          <button type="button" onClick={addSession}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/50 hover:text-white/80 hover:border-white/30 hover:bg-white/10 transition-all">
            <Plus size={16} /> Add another session type
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <button type="button" onClick={fillAvail}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/50 hover:text-white/80 hover:border-white/30 hover:bg-white/10 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Auto-fill demo availability
          </button>
          {avail.map((a, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-3">
              <select value={a.dayOfWeek} onChange={(e) => updAvail(i, "dayOfWeek", parseInt(e.target.value))}
                className="rounded-[8px] bg-white/10 border border-white/20 text-white px-2 py-2 text-sm outline-none">
                {DAYS.map((d, di) => <option key={d} className="bg-[#1C1C1E] text-white" value={di}>{d}</option>)}
              </select>
              <Input type="time" value={a.startTime} onChange={(e) => updAvail(i, "startTime", e.target.value)} className={`flex-1 ${inputGlass}`} />
              <span className="text-white/30">—</span>
              <Input type="time" value={a.endTime} onChange={(e) => updAvail(i, "endTime", e.target.value)} className={`flex-1 ${inputGlass}`} />
              {avail.length > 1 && <button type="button" onClick={() => delAvail(i)} className="text-white/30 hover:text-white/70 shrink-0"><X size={14} /></button>}
            </div>
          ))}
          <button type="button" onClick={addAvail}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/50 hover:text-white/80 hover:border-white/30 hover:bg-white/10 transition-all">
            <Plus size={16} /> Add time slot
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <button type="button" onClick={() => setStep((p) => p - 1)}
            className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/20 transition-all">
            Back
          </button>
        )}
        {step < totalSteps ? (
          <button type="button" onClick={() => setStep((p) => p + 1)} disabled={!canNext()}
            className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#18181B] hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Continue
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={!canNext() || status !== "idle"}
            className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#18181B] hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {status === "idle" ? "Create alumni account" : "Creating..."}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function RegisterPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [role, setRole] = useState<"student" | "alumni">("student");
  const [status, setStatus] = useState("idle");

  if (status !== "idle") {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover scale-105"
          poster="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260422_112520_ee819691-f2e8-4c54-bb77-3fb72c84eaa5.mp4">
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260422_112520_ee819691-f2e8-4c54-bb77-3fb72c84eaa5.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-2xl p-10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-center max-w-sm w-full">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur mx-auto">
            {status === "verified" ? <Check size={30} className="text-white" /> : <LoaderCircle className="animate-spin text-white" size={28} />}
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-white">
            {status === "creating" ? "Creating your account..." : status === "verifying" ? "Verifying your email..." : "Email verified!"}
          </h1>
          <p className="mt-2 text-white/60">{status === "verified" ? "Redirecting you..." : "This will only take a moment."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {mounted && (
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="fixed top-4 right-4 z-50 h-9 w-9 rounded-[10px] bg-white/15 backdrop-blur-lg border border-white/20 flex items-center justify-center shadow-sm hover:bg-white/25 transition-all duration-150">
          {theme === "dark" ? <Sun size={15} className="text-white" /> : <Moon size={15} className="text-white" />}
        </button>
      )}

      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover scale-105"
        poster="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260422_112520_ee819691-f2e8-4c54-bb77-3fb72c84eaa5.mp4">
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260422_112520_ee819691-f2e8-4c54-bb77-3fb72c84eaa5.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

      <div className="relative mx-auto max-w-xl px-6 py-14">
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/70">Join the network</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Create your account</h1>

          {/* Role selector */}
          <div className="mt-6 flex gap-1.5 rounded-xl bg-white/5 p-1 border border-white/10">
            {(["student", "alumni"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-all ${
                  role === r ? "bg-white text-[#18181B] shadow-sm" : "text-white/50 hover:text-white/80"
                }`}>
                {r === "student" ? "Student" : "Alumni"}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {role === "student" ? (
              <StudentForm onStatusChange={setStatus} />
            ) : (
              <AlumniWizard onStatusChange={setStatus} />
            )}
          </div>

          <p className="mt-8 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-white/90 hover:text-white underline underline-offset-2">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
