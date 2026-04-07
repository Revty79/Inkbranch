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
      "Beats, choices, and consequence scopes shape progression before narration is rendered on screen.",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="rounded-3xl border border-[var(--ink-border)] bg-[var(--ink-surface)]/90 p-6 shadow-[0_14px_40px_rgba(74,46,15,0.12)] sm:p-10">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-accent)]">
          Web-first • Mobile-first Interactive Fiction
        </p>
        <h1 className="mt-4 max-w-3xl text-balance font-sans text-3xl font-semibold leading-tight text-[var(--ink-text)] sm:text-5xl">
          Inkbranch turns story worlds into living Chronicles across multiple
          playable viewpoints.
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-[var(--ink-text-muted)] sm:text-lg">
          Readers do not chat with a random model. They enter authored worlds,
          choose perspective characters, and shape a structured narrative that
          keeps continuity across every return.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/library"
            className="rounded-full bg-[var(--ink-accent)] px-5 py-2.5 font-sans text-sm font-semibold text-[#fff8ef] transition hover:bg-[var(--ink-accent-soft)]"
          >
            Browse Library
          </Link>
          <Link
            href="/app"
            className="rounded-full border border-[var(--ink-border)] bg-[var(--ink-surface-muted)] px-5 py-2.5 font-sans text-sm font-semibold text-[var(--ink-text)] transition hover:bg-[var(--ink-surface)]"
          >
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
