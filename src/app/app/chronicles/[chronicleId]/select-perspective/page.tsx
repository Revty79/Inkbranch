import { InkCard } from "@/components/ui/ink-card";
import { startPerspectiveRunAction } from "@/features/chronicles/actions";
import { loadPerspectiveSelection } from "@/features/chronicles";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import Link from "next/link";

type SelectPerspectivePageProps = {
  params: Promise<{ chronicleId: string }>;
};

export default async function SelectPerspectivePage({
  params,
}: SelectPerspectivePageProps) {
  const { chronicleId } = await params;
  const user = await requireAuthenticatedUser();
  const viewpoints = await loadPerspectiveSelection(user.id, chronicleId);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-accent)]">
          Perspective Selection
        </p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Choose Your Viewpoint
        </h1>
        <p className="max-w-2xl text-[var(--ink-text-muted)]">
          Select a character route inside this Chronicle. Existing runs can be
          resumed instead of recreated.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {viewpoints.map((entry) => (
          <InkCard
            key={entry.viewpoint.id}
            eyebrow={entry.viewpoint.label}
            title={entry.character.name}
          >
            <p className="text-sm leading-relaxed">{entry.character.summary}</p>
            <p className="mt-2 text-sm text-[var(--ink-text-muted)]">
              {entry.viewpoint.description}
            </p>
            {entry.existingRun ? (
              <Link
                href={`/app/chronicles/${chronicleId}/runs/${entry.existingRun.id}`}
                className="mt-4 inline-flex rounded-full border border-[var(--ink-border)] px-3 py-1.5 font-sans text-sm font-semibold text-[var(--ink-accent)] transition hover:bg-[var(--ink-surface-muted)]"
              >
                Resume Existing Run
              </Link>
            ) : (
              <form action={startPerspectiveRunAction} className="mt-4">
                <input type="hidden" name="chronicleId" value={chronicleId} />
                <input
                  type="hidden"
                  name="viewpointId"
                  value={entry.viewpoint.id}
                />
                <button
                  type="submit"
                  className="rounded-full bg-[var(--ink-accent)] px-4 py-2 font-sans text-sm font-semibold text-[#fff8ef] transition hover:bg-[var(--ink-accent-soft)]"
                >
                  Start Perspective Run
                </button>
              </form>
            )}
          </InkCard>
        ))}
      </div>
    </div>
  );
}
