"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("No account found with this email. Please sign up first.");
        setSubmitting(false);
        return;
      }
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await sessionResponse.json();
      const role = session?.user?.role;
      router.refresh();
      window.location.replace(role === "admin" ? "/admin" : role === "alumnus" ? "/alumni/dashboard" : "/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
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
