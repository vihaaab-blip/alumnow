"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
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
    const result = await forgotPassword({ email });
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-128px)] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-primary">Check your email</h1>
        <p className="mt-3 text-muted-foreground">
          We&apos;ve sent a password reset link to <strong className="text-primary">{email}</strong>. It will expire in 15 minutes.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Didn&apos;t receive it?{" "}
          <button onClick={() => { setSent(false); setSubmitting(false); }} className="font-semibold text-primary underline">Try again</button>
        </p>
        <Link href="/login" className="mt-8 text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-primary mb-4">
        <Mail className="h-6 w-6" />
      </div>
      <h1 className="text-3xl font-semibold text-primary">Forgot your password?</h1>
        <p className="mt-2 text-muted-foreground">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block text-sm font-semibold">
          Email address
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" placeholder="you@example.com" />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button disabled={submitting} className="w-full">
          {submitting ? "Sending reset link..." : "Send reset link"}
        </Button>
      </form>
    </div>
  );
}
