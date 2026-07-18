"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { LoaderCircle, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setSubmitting(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  async function handleGoogleSignIn() {
    try {
      await signIn("google", { redirectTo: "/dashboard" });
    } catch {
      setError(
        "Google Sign-In requires OAuth credentials. Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to your .env file."
      );
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0D0D0D]">
      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-[1040px] min-h-[650px] flex-col overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#1A1A1A] shadow-lg md:flex-row">
          {/* Left — Branding */}
          <div className="relative w-full md:w-[45%] min-h-[300px] md:min-h-full overflow-hidden rounded-[2rem] bg-[#0D0D0D] m-2 flex items-center justify-center">
            <div className="text-center px-8">
              <Logo className="text-4xl" />
              <p className="mt-3 text-sm text-white/40 max-w-[240px]">
                <span className="text-coral">From</span> where you are.{" "}
                <span className="text-coral">To</span> where you want to be.
              </p>
            </div>
          </div>

          {/* Right — Form */}
          <div className="relative flex w-full md:w-[55%] flex-col justify-center px-10 py-12 md:px-14">
            <div className="relative z-10">
              <h1 className="text-center text-[40px] font-semibold tracking-tight text-white font-heading">
                Welcome back
              </h1>
              <p className="mt-2 text-center text-sm text-white/40">
                Sign in to your account
              </p>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="group flex w-full items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium text-white/80 transition-all hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </span>
                  <ArrowRight
                    size={18}
                    className="text-white/30 transition-all group-hover:text-white/50"
                  />
                </button>
              </div>

              <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
                  OR
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="group flex items-center gap-2 rounded-[1.25rem] border border-white/10 bg-white/5 p-2 transition-all focus-within:border-coral/50 focus-within:ring-2 focus-within:ring-coral/10">
                  <div className="flex-1 pl-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/25">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-0.5 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                      placeholder="Enter your email"
                    />
                  </div>
                  <button
                    type="submit"
                    className="group/btn relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full"
                    disabled={submitting}
                  >
                    <div className="absolute inset-0 rounded-full bg-coral group-hover/btn:bg-coral-light transition-colors">
                      <div className="relative z-10 flex h-[52px] w-[52px] items-center justify-center">
                        {submitting ? (
                          <LoaderCircle
                            size={20}
                            className="animate-spin text-white"
                          />
                        ) : (
                          <ArrowRight
                            size={20}
                            className="text-white transition-transform duration-200 group-hover/btn:translate-x-0.5"
                          />
                        )}
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-4">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1">
                    Password
                  </label>
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-2 transition-all focus-within:border-coral/50 focus-within:ring-2 focus-within:ring-coral/10">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-white/25"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-white/30 hover:text-white/60 underline underline-offset-2"
                  >
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <p className="mt-3 text-sm text-red-400">{error}</p>
                )}
              </form>
            </div>

            <p className="mt-8 text-center text-sm text-white/30">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-coral hover:text-coral-light"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
