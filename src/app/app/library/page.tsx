import { InkCard } from "@/components/ui/ink-card";
import { loadPublishedLibrary } from "@/features/library";
import Link from "next/link";

export default async function AppLibraryPage() {
  const worlds = await loadPublishedLibrary();

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-accent)]">
          Reader Library
        </p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Choose A Story World
        </h1>
        <p className="max-w-2xl text-[var(--ink-text-muted)]">
          Story detail routes are scaffolded for Chronicle creation and
          perspective selection in later prompts.
        </p>
      </header>

      {worlds.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worlds.map((entry) => (
            <InkCard
              key={entry.world.id}
              eyebrow={entry.world.tone}
              title={entry.world.title}
            >
              <p className="text-sm leading-relaxed">{entry.world.synopsis}</p>
              <p className="mt-3 font-sans text-xs uppercase tracking-[0.16em] text-[var(--ink-accent)]">
                {entry.playablePerspectiveCount} playable perspectives
              </p>
              <Link
                href={`/app/library/${entry.world.slug}`}
                className="mt-4 inline-flex rounded-full border border-[var(--ink-border)] px-3 py-1.5 font-sans text-sm font-semibold text-[var(--ink-accent)] transition hover:bg-[var(--ink-surface-muted)]"
              >
                Open world
              </Link>
            </InkCard>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--ink-border)] bg-[var(--ink-surface)]/60 p-5 text-sm text-[var(--ink-text-muted)]">
          No published worlds are available yet. Admin can publish a story
          version from `/app/admin`.
        </div>
      )}
    </div>
  );
}
