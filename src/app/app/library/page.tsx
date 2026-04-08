import { InkCard } from "@/components/ui/ink-card";
import { loadPublishedLibrary } from "@/features/library";
import Link from "next/link";

export default async function AppLibraryPage() {
  const worlds = await loadPublishedLibrary();

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="ink-label">Reader Library</p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Choose A Story World
        </h1>
        <p className="max-w-2xl text-[var(--ink-text-muted)]">
          Every world has at least one published version and one or more
          playable perspectives. Opening a world prepares a new Chronicle.
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
              <p className="ink-pill mt-3">
                {entry.playablePerspectiveCount} playable perspectives
              </p>
              <Link
                href={`/app/library/${entry.world.slug}`}
                className="ink-btn ink-btn-secondary mt-4"
              >
                Open World
              </Link>
            </InkCard>
          ))}
        </div>
      ) : (
        <div className="ink-panel p-5 text-sm text-[var(--ink-text-muted)]">
          No published worlds are available yet. Admin can publish a story
          version from `/app/admin`.
        </div>
      )}
    </div>
  );
}
