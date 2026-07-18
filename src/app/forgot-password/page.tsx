"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, LoaderCircle } from "lucide-react";
import { forgotPassword } from "@/actions/auth.actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await forgotPassword({ email: email.trim() });
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0D0D0D]">
        <div className="relative z-10 mx-auto flex min-h-screen max-w-md items-center justify-center px-6 text-center">
          <div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mx-auto">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold text-white font-heading">Check your email</h1>
            <p className="mt-3 text-sm text-white/40">
              We&apos;ve sent a password reset link to{" "}
              <span className="text-white">{email}</span>. It will expire in
              15 minutes.
            </p>
            <p className="mt-2 text-sm text-white/30">
              Didn&apos;t receive it?{" "}
              <button
                onClick={() => {
                  setSent(false);
                  setSubmitting(false);
                }}
                className="font-semibold text-coral hover:text-coral-light underline underline-offset-2"
              >
                Try again
              </button>
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0D0D0D]">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
        <div className="w-full">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back to login
          </Link>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white mb-4">
            <Mail size={22} />
          </div>
          <h1 className="text-3xl font-semibold text-white font-heading">
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/25 mb-1">
                Email address
              </label>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-2 transition-all focus-within:border-coral/50 focus-within:ring-2 focus-within:ring-coral/10">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-white/25"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-coral px-4 py-3 text-sm font-semibold text-white hover:bg-coral-light transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
