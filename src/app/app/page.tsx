import { InkCard } from "@/components/ui/ink-card";
import { loadChronicleSummaries } from "@/features/chronicles";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import Link from "next/link";

export default async function AppHomePage() {
  const user = await requireAuthenticatedUser();
  const chronicles = await loadChronicleSummaries(user.id);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-accent)]">
          Signed-in Reader Area
        </p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Chronicle Overview
        </h1>
        <p className="max-w-2xl text-[var(--ink-text-muted)]">
          Signed in as {user.email}. Continue existing Chronicles or begin a new
          story world from the reader library.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <InkCard eyebrow="Reader" title="Story Library">
          <p className="text-sm leading-relaxed">
            Browse published worlds and start a new Chronicle from a selected
            story version.
          </p>
          <Link
            href="/app/library"
            className="mt-4 inline-flex rounded-full border border-[var(--ink-border)] px-3 py-1.5 font-sans text-sm font-semibold text-[var(--ink-accent)] transition hover:bg-[var(--ink-surface-muted)]"
          >
            Open Library
          </Link>
        </InkCard>
        <InkCard eyebrow="Continuity" title="Chronicle Progress">
          <p className="text-sm leading-relaxed">
            You currently have {chronicles.length} Chronicle
            {chronicles.length === 1 ? "" : "s"}.
          </p>
          <Link
            href="/app/chronicles"
            className="mt-4 inline-flex rounded-full border border-[var(--ink-border)] px-3 py-1.5 font-sans text-sm font-semibold text-[var(--ink-accent)] transition hover:bg-[var(--ink-surface-muted)]"
          >
            View Chronicles
          </Link>
        </InkCard>
      </div>
    </div>
  );
}
