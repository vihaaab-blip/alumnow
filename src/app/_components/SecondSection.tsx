import Link from "next/link";
import { ArrowRight, Compass, MessageCircle, Sparkles } from "lucide-react";
const backgroundVideo = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_230229_7c9bc431-46cf-489a-948d-e8144d8eb5d4.mp4";
const points = [{ icon: Compass, title: "Start with context", body: "Find someone who knows the university, the course, and the questions behind your decision." }, { icon: MessageCircle, title: "Have the real conversation", body: "Ask what a prospectus cannot answer: the everyday trade-offs, surprises, and details." }, { icon: Sparkles, title: "Leave with direction", body: "Turn a useful conversation into one clear next step for your application or career." }];
export function SecondSection() {
  return (
    <section className="relative isolate min-h-[100dvh] overflow-hidden bg-black text-white">
      <video src={backgroundVideo} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-70" aria-hidden="true" />
      {/* Top gradient fade — blends from black */}
      <div className="absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-black via-black/60 to-transparent z-[1] pointer-events-none" />
      {/* Bottom gradient fade — blends into black */}
      <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black via-black/60 to-transparent z-[1] pointer-events-none" />
      <div className="absolute inset-0 bg-black/25 z-[1] pointer-events-none" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1500px] flex-col justify-between px-6 pb-10 pt-16 sm:px-10 sm:pb-14 sm:pt-20 lg:px-16">
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/50">The conversation after the search</p>
          <span className="font-mono text-xs text-white/30">02 / 02</span>
        </div>
        <div className="grid gap-12 py-24 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[.2em] text-accent">What happens next</p>
            <h2 className="max-w-3xl text-6xl leading-[.88] tracking-[-.04em] font-semibold sm:text-7xl">A better question can change the <em className="not-italic text-accent">whole route.</em></h2>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/60 sm:text-lg">AlumNow makes the space between &ldquo;I&rsquo;m not sure&rdquo; and &ldquo;I know what to do next&rdquo; feel smaller.</p>
            <Link href="/browse" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 transition-colors">Explore the network <ArrowRight size={16} /></Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {points.map(({ icon: Icon, title, body }, index) => (
              <article key={title} className="liquid-glass-strong rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-accent">0{index + 1}</span>
                  <Icon size={20} className="text-white/60" />
                </div>
                <h3 className="mt-12 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
