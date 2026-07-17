import Link from "next/link";
import {
  ArrowRight,
  Compass,
  HeartHandshake,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/Logo";

const principles = [
  {
    icon: Compass,
    title: "Context over comparison",
    body: "Rankings can start a search. Lived experience helps a student understand what a university, course, and day-to-day life actually feel like.",
  },
  {
    icon: MessageCircle,
    title: "Questions before answers",
    body: "A good session is specific. Students bring the uncertainty; alumni bring the context that helps turn it into a decision.",
  },
  {
    icon: HeartHandshake,
    title: "Trust at every step",
    body: "Every mentor belongs to the community and is reviewed before appearing in the network, so students and families can choose with confidence.",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-[#0D0D0D]">
      {/* Hero */}
      <section className="relative isolate min-h-[calc(100dvh-64px)] overflow-hidden bg-[#0D0D0D] px-6 py-24 text-white sm:px-10 lg:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(232,87,58,0.06),transparent_60%)]" />
        <div className="relative mx-auto flex min-h-[calc(100dvh-12rem)] max-w-[1400px] items-end">
          <div className="max-w-4xl pb-8">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[.2em] text-white/60">
              <span className="h-px w-10 bg-coral" />
              About alumnow.
            </p>
            <h1 className="mt-6 max-w-5xl text-[clamp(4rem,8vw,8rem)] leading-[.86] tracking-[-.05em] font-semibold font-heading">
              The advice that lives{" "}
              <em className="not-italic text-coral">between</em> the lines.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
              Choosing a university or course is too important to be reduced to
              a ranking table. AlumNow gives students a direct line to alumni
              who can share what a prospectus cannot.
            </p>
            <div className="mt-9">
              <Link href="/browse">
                <Button variant="accent" size="lg" className="rounded-full">
                  Meet the network <ArrowRight size={17} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="relative isolate overflow-hidden bg-[#0D0D0D] px-6 py-24 sm:px-10 lg:px-16">
        <div className="relative mx-auto max-w-[1400px]">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-coral">
                Why we built it
              </p>
              <h2 className="mt-4 max-w-md text-5xl leading-[.94] text-white font-semibold font-heading">
                A person can explain what a page cannot.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {principles.map(({ icon: Icon, title, body }) => (
                <Card key={title} className="p-5">
                  <Icon size={20} className="text-coral" />
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/40">
                    {body}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
