import { InkCard } from "@/components/ui/ink-card";
import { loadPublishedLibrary } from "@/features/library";
import Link from "next/link";

export default async function PublicLibraryPage() {
  const worlds = await loadPublishedLibrary();

  return (
    <div className="space-y-5">
      <header>
        <p className="ink-label">Story Library</p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Published Worlds
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-text-muted)]">
          Preview the worlds currently available in Inkbranch. Sign in to create
          a Chronicle and play from any perspective route.
        </p>
      </header>

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
          </InkCard>
        ))}
      </div>

      <div className="ink-panel p-4 text-sm text-[var(--ink-text-muted)]">
        Ready to begin a Chronicle? Continue into the signed-in app shell.
        <Link
          href="/app/library"
          className="ml-2 font-sans font-semibold text-[var(--ink-accent)] underline-offset-4 hover:underline"
        >
          Open app library
        </Link>
      </div>
    </div>
  );
}
