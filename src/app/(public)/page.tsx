import { InkCard } from "@/components/ui/ink-card";
import Link from "next/link";

const pillars = [
  {
    title: "Shared Canon",
    detail:
      "Every Chronicle keeps one evolving world truth, so each perspective stays coherent with what already happened.",
  },
  {
    title: "Perspective Integrity",
    detail:
      "Readers can inhabit different playable characters without collapsing separate knowledge into one voice.",
  },
  {
    title: "Structured Story Logic",
    detail:
      "Scenes, choices, and consequence scopes shape progression before narration is rendered on screen.",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="ink-paper relative overflow-hidden p-6 sm:p-10">
        <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[color-mix(in_srgb,var(--ink-highlight)_60%,white)] blur-3xl" />
        <p className="ink-label">Web-first - Mobile-first Interactive Fiction</p>
        <h1 className="mt-4 max-w-3xl font-sans text-3xl font-semibold leading-tight text-[var(--ink-text)] sm:text-5xl">
          Inkbranch turns story worlds into living Chronicles across multiple
          playable viewpoints.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink-text-muted)] sm:text-lg">
          Readers do not chat with a random model. They enter authored worlds,
          choose perspective characters, and shape a structured narrative that
          keeps continuity across every return.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/library" className="ink-btn ink-btn-primary">
            Browse Library
          </Link>
          <Link href="/app" className="ink-btn ink-btn-secondary">
            Open App Shell
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <InkCard key={pillar.title} title={pillar.title} eyebrow="Core Rule">
            <p className="text-sm leading-relaxed">{pillar.detail}</p>
          </InkCard>
        ))}
      </section>
    </div>
  );
}
