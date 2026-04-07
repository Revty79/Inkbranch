import { InkCard } from "@/components/ui/ink-card";
import { loadChronicleSummaries } from "@/features/chronicles";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import Link from "next/link";

export default async function ChroniclesPage() {
  const user = await requireAuthenticatedUser();
  const chronicles = await loadChronicleSummaries(user.id);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-accent)]">
          Chronicle Hub
        </p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Your Active Runs
        </h1>
        <p className="max-w-2xl text-[var(--ink-text-muted)]">
          Your active Chronicles will appear here, including each run&apos;s current
          perspective and continuity status.
        </p>
      </header>

      {chronicles.length ? (
        <div className="grid gap-4">
          {chronicles.map((entry) => (
            <InkCard
              key={entry.chronicle.id}
              eyebrow={entry.chronicle.status}
              title={entry.world.title}
            >
              <p className="text-sm leading-relaxed">
                Version: {entry.version.versionLabel}
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                Started:{" "}
                {new Date(entry.chronicle.startedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/app/chronicles/${entry.chronicle.id}`}
                  className="rounded-full border border-[var(--ink-border)] px-3 py-1.5 font-sans text-sm font-semibold text-[var(--ink-accent)] transition hover:bg-[var(--ink-surface-muted)]"
                >
                  Open Chronicle
                </Link>
                <Link
                  href={`/app/chronicles/${entry.chronicle.id}/select-perspective`}
                  className="rounded-full border border-[var(--ink-border)] px-3 py-1.5 font-sans text-sm font-semibold text-[var(--ink-accent)] transition hover:bg-[var(--ink-surface-muted)]"
                >
                  Choose Perspective
                </Link>
              </div>
              {entry.runs.length ? (
                <ul className="mt-4 space-y-2 text-sm text-[var(--ink-text-muted)]">
                  {entry.runs.map((runEntry) => (
                    <li key={runEntry.run.id}>
                      {runEntry.character.name} · {runEntry.beat.title} ·{" "}
                      <Link
                        href={`/app/chronicles/${entry.chronicle.id}/runs/${runEntry.run.id}`}
                        className="font-sans font-semibold text-[var(--ink-accent)] underline-offset-4 hover:underline"
                      >
                        Resume
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[var(--ink-text-muted)]">
                  No Perspective Runs yet for this Chronicle.
                </p>
              )}
            </InkCard>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--ink-border)] bg-[var(--ink-surface)]/60 p-5 text-sm text-[var(--ink-text-muted)]">
          No Chronicles found yet. Start one from the
          <Link
            href="/app/library"
            className="ml-1 font-sans font-semibold text-[var(--ink-accent)] underline-offset-4 hover:underline"
          >
            library
          </Link>
          .
        </div>
      )}
    </div>
  );
}
