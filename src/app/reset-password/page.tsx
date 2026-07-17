"use client";
import { useState, use } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { resetPassword } from "@/actions/auth.actions";

export default function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const params = use(searchParams);
  const token = params.token ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    const result = await resetPassword({ token, password, confirmPassword });
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-128px)] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-primary">Password reset successful</h1>
        <p className="mt-3 text-muted-foreground">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Link href="/login" className="mt-8">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-128px)] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-semibold text-primary">Invalid reset link</h1>
        <p className="mt-3 text-muted-foreground">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link href="/forgot-password" className="mt-8">
          <Button>Request new link</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-primary mb-4">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="text-3xl font-semibold text-primary">Reset your password</h1>
      <p className="mt-2 text-muted-foreground">
        Enter your new password below.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block text-sm font-semibold">
          New password
          <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" />
        </label>
        <label className="block text-sm font-semibold">
          Confirm new password
          <Input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2" />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button disabled={submitting} className="w-full">
          {submitting ? "Resetting password..." : "Reset password"}
        </Button>
      </form>
    </div>
  );
}
