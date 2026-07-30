"use client";

import Link from "next/link";
import { Clock, MailCheck, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentAlumniReviewStatus } from "@/actions/alumni-status.actions";

export default function AlumniApplicationUnderReviewPage() {
  const [status, setStatus] = useState<"loading" | "pending" | "approved" | "rejected" | "missing">("loading");

  useEffect(() => {
    getCurrentAlumniReviewStatus().then((review) => {
      setStatus(review.status);
      if (review.status === "approved") window.location.replace("/alumni/dashboard");
    });
  }, []);

  const rejected = status === "rejected";

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#0D0D0D] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-8 shadow-lg">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${rejected ? "bg-red-500/10 text-red-300" : "bg-coral/10 text-coral-light"}`}>
            {rejected ? <MailCheck size={26} /> : <Clock size={26} />}
          </div>
          <h1 className="mt-6 text-3xl font-semibold">
            {rejected ? "Application not approved" : "Application under review"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            {rejected
              ? "Your alumni mentor application has been reviewed. Please contact the team if you think this needs another look."
              : "Your alumni mentor account has been created, but it is not active yet. An admin needs to review the full application and approve it before you can use the alumni dashboard or appear on the network."}
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <ShieldCheck className="mt-0.5 shrink-0 text-coral" size={18} />
              <div>
                <p className="text-sm font-semibold">What happens next</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Admin reviews your name, email, phone, university, course, country, graduation year, bio, photo, and session offerings. After approval, logging in sends you straight to the alumni dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-[10px] bg-coral px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-light"
            >
              Back to login
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[10px] border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-white/10"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
