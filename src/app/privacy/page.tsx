import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — alumnow.",
  description: "AlumNow privacy policy. Learn how we handle your data.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-white/30">Last updated: July 2026</p>

          <div className="mt-12 space-y-10 text-sm leading-7 text-white/50">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
              <p>
                When you create an account, we collect your email address, name, and any profile
                information you choose to provide (such as university, course, and bio). When you
                book a session, we process payment information through our payment provider. We do
                not store credit card numbers on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h2>
              <p>
                We use your information to provide and improve our services, including matching
                students with alumni, processing bookings, and sending transactional emails (such
                as booking confirmations and session reminders). We do not sell your personal
                information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">3. Cookies and Tracking</h2>
              <p>
                We use essential cookies to maintain your session and remember your preferences.
                We do not use third-party advertising cookies or tracking pixels. Analytics data
                is collected anonymously to help us improve the platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">4. Data Sharing</h2>
              <p>
                Your profile information is visible to other users of the platform as part of the
                marketplace experience. We share data with payment processors solely to complete
                transactions. We may disclose information if required by law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">5. Data Retention</h2>
              <p>
                We retain your account information for as long as your account is active. You may
                request deletion of your account and associated data at any time by contacting us.
                Session records are retained for 12 months for quality and support purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">6. Security</h2>
              <p>
                We implement industry-standard security measures to protect your data, including
                encrypted transmission (TLS), hashed passwords, and access controls. No method
                of transmission is 100% secure, but we take every reasonable precaution.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">7. Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal data. To exercise
                these rights, contact us at{" "}
                <a href="mailto:hello@alumnow.com" className="text-coral hover:text-coral-light transition-colors">
                  hello@alumnow.com
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">8. Changes to This Policy</h2>
              <p>
                We may update this policy from time to time. Material changes will be communicated
                via email or a prominent notice on the platform.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
