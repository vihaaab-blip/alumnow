import Link from "next/link";

export const metadata = {
  title: "Terms of Use — alumnow.",
  description: "AlumNow terms of use. Read our terms and conditions.",
};

export default function TermsPage() {
  return (
    <main className="bg-[#0D0D0D]">
      <section className="relative isolate overflow-hidden bg-[#0D0D0D] px-6 py-24 text-white sm:px-10 lg:px-16">
        <div className="relative mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors mb-12"
          >
            Back to home
          </Link>

          <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/40">
            Legal
          </p>
          <h1 className="mt-4 text-4xl leading-[.95] tracking-[-.03em] font-semibold text-white sm:text-5xl font-heading">
            Terms of Use
          </h1>
          <p className="mt-3 text-sm text-white/30">Last updated: July 2026</p>

          <div className="mt-12 space-y-10 text-sm leading-7 text-white/50">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using AlumNow, you agree to be bound by these terms. If you do
                not agree, please do not use the platform. AlumNow is a service that connects
                students with alumni mentors for informational and educational purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">2. Eligibility</h2>
              <p>
                You must be at least 16 years old to use AlumNow. By creating an account, you
                confirm that you meet this age requirement and have the capacity to enter into
                a binding agreement.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">3. Accounts and Conduct</h2>
              <p>
                You are responsible for maintaining the security of your account. You agree not
                to impersonate others, misuse the platform for spam or harassment, or attempt to
                circumvent any security measures. Alumni mentors agree to provide honest,
                constructive guidance.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">4. Sessions and Payments</h2>
              <p>
                Sessions are booked directly through the platform. Payments are processed by our
                payment provider. Cancellations made at least 24 hours before a session are
                eligible for a full refund. No-shows are not eligible for refunds. AlumNow
                charges a platform fee on each transaction.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">5. Intellectual Property</h2>
              <p>
                All content on AlumNow, including logos, designs, and code, is the property of
                AlumNow and may not be reproduced without written permission. User-generated
                content (reviews, profiles) remains the property of the user but grants AlumNow
                a license to display it on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">6. Limitation of Liability</h2>
              <p>
                AlumNow is an informational platform. We do not guarantee outcomes from mentoring
                sessions. We are not liable for any decisions made based on information received
                through the platform. Our total liability shall not exceed the fees paid in the
                12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">7. Termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms.
                You may delete your account at any time from your account settings. Upon
                termination, your data will be handled in accordance with our{" "}
                <Link href="/privacy" className="text-coral hover:text-coral-light transition-colors underline underline-offset-2">
                  Privacy Policy
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">8. Governing Law</h2>
              <p>
                These terms are governed by the laws of India. Any disputes shall be resolved
                in the courts of Mumbai, India.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
