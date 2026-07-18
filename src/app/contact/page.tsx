import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Contact — alumnow.",
  description: "Get in touch with the alumnow team.",
};

export default function ContactPage() {
  return (
    <main className="bg-[#0D0D0D]">
      <section className="relative isolate min-h-[calc(100dvh-64px)] overflow-hidden bg-[#0D0D0D] px-6 py-24 text-white sm:px-10 lg:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(232,87,58,0.06),transparent_60%)]" />
        <div className="relative mx-auto max-w-[1400px]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors mb-12"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[.2em] text-white/60">
              <span className="h-px w-10 bg-coral" />
              Contact
            </p>
            <h1 className="mt-6 text-5xl leading-[.9] tracking-[-.04em] font-semibold text-white sm:text-6xl font-heading">
              Let&apos;s talk.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
              Have a question, partnership inquiry, or feedback? We&apos;d love
              to hear from you. Reach out and we&apos;ll get back to you within
              24 hours.
            </p>

            <div className="mt-12 rounded-2xl border border-white/5 bg-white/[0.03] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coral/10 text-coral">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Email us</p>
                  <a
                    href="mailto:hello@alumnow.com"
                    className="text-sm text-white/40 hover:text-coral transition-colors"
                  >
                    hello@alumnow.com
                  </a>
                </div>
              </div>
              <p className="text-sm leading-6 text-white/40">
                Whether you&apos;re a student with questions about university, an
                alumni interested in mentoring, or an institution looking to
                partner — we&apos;re here to help.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
