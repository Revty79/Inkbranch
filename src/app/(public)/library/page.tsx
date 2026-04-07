import { InkCard } from "@/components/ui/ink-card";
import { loadPublishedLibrary } from "@/features/library";
import Link from "next/link";

export default async function PublicLibraryPage() {
  const worlds = await loadPublishedLibrary();

  return (
    <div className="space-y-5">
      <header>
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-accent)]">
          Story Library
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Published Worlds
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-text-muted)]">
          Preview the worlds available in Inkbranch. Sign-in flows and Chronicle
          creation are scaffolded in the app shell.
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
            <p className="mt-3 font-sans text-xs uppercase tracking-[0.16em] text-[var(--ink-accent)]">
              {entry.playablePerspectiveCount} playable perspectives
            </p>
          </InkCard>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-[var(--ink-border)] bg-[var(--ink-surface)]/70 p-4 text-sm text-[var(--ink-text-muted)]">
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
