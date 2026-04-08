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
        <p className="ink-label">Chronicle Hub</p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Shared Story Instances
        </h1>
        <p className="max-w-2xl text-[var(--ink-text-muted)]">
          A Chronicle is one evolving story reality. Perspective runs are
          different character routes inside that shared world state.
        </p>
      </header>

      {chronicles.length ? (
        <div className="grid gap-4">
          {chronicles.map((entry) => (
            <InkCard
              key={entry.chronicle.id}
              eyebrow={`${entry.chronicle.status} chronicle`}
              title={entry.world.title}
            >
              <div className="flex flex-wrap gap-2">
                <span className="ink-pill">{entry.version.versionLabel}</span>
                <span className="ink-pill">
                  {entry.completedRunCount}/{entry.viewpointCount} perspectives
                  completed
                </span>
                <span className="ink-pill">
                  {entry.worldStateCount} world-state changes
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed">
                Started{" "}
                {new Date(entry.chronicle.startedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                . Last active{" "}
                {new Date(entry.chronicle.lastActiveAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                .
              </p>

              {entry.runs.length ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {entry.runs.map((runEntry) => (
                    <li key={runEntry.run.id} className="ink-panel p-2.5">
                      <p className="font-medium text-[var(--ink-text)]">
                        {runEntry.character.name} - {runEntry.run.status}
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-text-muted)]">
                        Current scene: {runEntry.beat.title}
                      </p>
                      <Link
                        href={`/app/chronicles/${entry.chronicle.id}/runs/${runEntry.run.id}`}
                        className="mt-2 inline-flex font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-accent)] underline-offset-4 hover:underline"
                      >
                        Resume route
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[var(--ink-text-muted)]">
                  No perspective runs started yet.
                </p>
              )}

              {entry.recentEvents.length ? (
                <div className="mt-3">
                  <p className="ink-label">Recent carryover</p>
                  <ul className="mt-2 space-y-1 text-sm text-[var(--ink-text-muted)]">
                    {entry.recentEvents.map((event) => (
                      <li key={event.id}>- {event.summary}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/app/chronicles/${entry.chronicle.id}`}
                  className="ink-btn ink-btn-secondary"
                >
                  Open Chronicle
                </Link>
                <Link
                  href={`/app/chronicles/${entry.chronicle.id}/select-perspective`}
                  className="ink-btn ink-btn-ghost"
                >
                  Choose Perspective
                </Link>
              </div>
            </InkCard>
          ))}
        </div>
      ) : (
        <div className="ink-panel p-5 text-sm text-[var(--ink-text-muted)]">
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
