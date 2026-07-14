"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useTheme } from "next-themes";
import { login } from "@/actions/auth.actions";
import { LoaderCircle, Sun, Moon, ArrowRight } from "lucide-react";

const DEMO_ACCOUNTS = [
  { label: "Student", email: "student1@alumnow.com", password: "password123", subtitle: "Dashboard & browse mentors" },
  { label: "Alumni", email: "alumni1@alumnow.com", password: "password123", subtitle: "Manage sessions & students" },
  { label: "Admin", email: "admin@alumnow.com", password: "password123", subtitle: "Platform administration" },
];

export default function LoginPage() {
  const { theme, setTheme } = useTheme();
  const mountedState = useState(false);
  const mounted = mountedState[0]!;
  const setMounted = mountedState[1]!;
  useEffect(() => setMounted(true), []);
  const emailState = useState("");
  const email = emailState[0]!;
  const setEmail = emailState[1]!;
  const passwordState = useState("");
  const password = passwordState[0]!;
  const setPassword = passwordState[1]!;
  const errorState = useState("");
  const error = errorState[0]!;
  const setError = errorState[1]!;
  const submittingState = useState(false);
  const submitting = submittingState[0]!;
  const setSubmitting = submittingState[1]!;
  const signInWithRedirect = async (emailVal: string, passwordVal: string) => {
    setSubmitting(true);
    setError("");
    const result = await login({ email: emailVal, password: passwordVal });
    if (result.error) { setError(result.error); setSubmitting(false); return; }
    window.location.href = result.data?.redirectTo ?? "/dashboard";
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signInWithRedirect(email, password);
  }

  async function handleGoogleSignIn() {
    try {
      await signIn("google", { redirectTo: "/dashboard" });
    } catch {
      setError("Google Sign-In is not configured. Please use email and password.");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {mounted && (
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="fixed top-4 right-4 z-50 h-9 w-9 rounded-[10px] bg-white/15 backdrop-blur-lg border border-white/20 flex items-center justify-center shadow-sm hover:bg-white/25 transition-all duration-150"
          title={theme === "dark" ? "Light mode" : "Dark mode"}>
          {theme === "dark" ? <Sun size={15} className="text-white" /> : <Moon size={15} className="text-white" />}
        </button>
      )}

      {/* Fixed background video + overlay */}
      <video autoPlay muted loop playsInline className="fixed inset-0 w-full h-full object-cover scale-105">
        <source src="https://cdn.midjourney.com/video/71048e88-d8e6-470e-88ef-555c01eacb12/0.mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />

      {/* Main card */}
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-[1040px] min-h-[650px] flex-col overflow-hidden rounded-[2.5rem] border border-gray-200 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.25)] md:flex-row">

          {/* Left — Video mask */}
          <div className="relative w-full md:w-[45%] min-h-[300px] md:min-h-full overflow-hidden rounded-[2rem] bg-[#0c0c0e] m-2">
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
              <source src="https://cdn.midjourney.com/video/71048e88-d8e6-470e-88ef-555c01eacb12/0.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Right — Form */}
          <div className="relative flex w-full md:w-[55%] flex-col justify-center px-10 py-12 md:px-14">
            {/* Decorative blurred circle */}
            <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#FF512F] to-[#F09819] opacity-20 blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              {/* Header */}
              <h1 className="text-center text-[40px] font-semibold tracking-tight text-gray-900">Welcome back</h1>
              <p className="mt-2 text-center text-sm text-gray-500">Sign in to your account</p>

              {/* Social buttons */}
              <div className="mt-8 space-y-3">
                <button type="button" onClick={handleGoogleSignIn}
                  className="group flex w-full items-center justify-between rounded-[1.25rem] border border-gray-200 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100">
                  <span className="flex items-center gap-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </span>
                  <ArrowRight size={18} className="text-gray-400 transition-all group-hover:text-gray-600" />
                </button>

                <button type="button"
                  onClick={() => setError("X Sign-In is not configured.")}
                  className="group flex w-full items-center justify-between rounded-[1.25rem] border border-gray-200 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100">
                  <span className="flex items-center gap-3">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Continue with X
                  </span>
                  <ArrowRight size={18} className="text-gray-400 transition-all group-hover:text-gray-600" />
                </button>
              </div>

              {/* OR Divider */}
              <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">OR</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit}>
                <div className="group flex items-center gap-2 rounded-[1.25rem] border border-gray-200 bg-gray-50 p-2 transition-all focus-within:border-gray-300 focus-within:bg-white">
                  <div className="flex-1 pl-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Email</label>
                    <input type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-0.5 w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                      placeholder="Enter your email" />
                  </div>
                  <button type="submit"
                    className="group/btn relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full"
                    disabled={submitting}>
                    {/* Glow ring (hidden by default, visible on hover) */}
                    <div className="absolute inset-[-6px] rounded-full bg-[conic-gradient(#00c6ff,#0072ff,#ff007a,#ff8a00,#00c6ff)] opacity-0 blur-md transition-opacity duration-300 group-hover/btn:opacity-100 group-hover/btn:animate-spin" />
                    {/* Conic gradient border */}
                    <div className="absolute inset-0 rounded-full bg-[conic-gradient(#00c6ff,#0072ff,#ff007a,#ff8a00,#00c6ff)] group-hover/btn:animate-spin" />
                    {/* Inner black button */}
                    <div className="relative z-10 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                      {submitting ? (
                        <LoaderCircle size={20} className="animate-spin text-white" />
                      ) : (
                        <ArrowRight size={20} className="text-white transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Password field */}
                <div className="mt-4">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Password</label>
                  <div className="rounded-[1.25rem] border border-gray-200 bg-gray-50 p-2 transition-all focus-within:border-gray-300 focus-within:bg-white">
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent px-2 py-1.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                      placeholder="Enter your password" />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Link href="/forgot-password" className="text-sm font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2">Forgot password?</Link>
                </div>

                {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
              </form>
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold bg-gradient-to-r from-[#FF512F] to-[#F09819] bg-clip-text text-transparent">Sign up</Link>
            </p>

            {/* Demo accounts (collapsed) */}
            <div className="mt-6 space-y-1.5">
              <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400">Quick access</p>
              {DEMO_ACCOUNTS.map((acc) => (
                <button key={acc.email} type="button" onClick={() => signInWithRedirect(acc.email, acc.password)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-2.5 text-left text-sm text-gray-600 transition-all hover:bg-gray-100">
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 uppercase">
                      {acc.label[0]!}
                    </span>
                    <span className="font-medium">{acc.label}</span>
                    <span className="text-gray-400">—</span>
                    <span className="text-gray-400">{acc.subtitle}</span>
                  </span>
                  <ArrowRight size={14} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
