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
  const firstReadComplete = viewpoints[0]?.firstReadComplete ?? true;

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="ink-label">Perspective Selection</p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Choose A Viewpoint Route
        </h1>
        <p className="max-w-2xl text-[var(--ink-text-muted)]">
          Each viewpoint enters the same Chronicle from a different life and
          knowledge boundary. Existing runs can be resumed at any time.
        </p>
        {!firstReadComplete ? (
          <p className="text-sm text-[var(--ink-text-soft)]">
            Additional perspectives stay hidden until your first full run is complete,
            so the initial canon can lock in cleanly.
          </p>
        ) : null}
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
            {entry.impactSummary ? (
              <div className="ink-panel mt-3 p-2.5 text-xs text-[var(--ink-text-muted)]">
                {entry.impactSummary}
              </div>
            ) : null}
            {entry.routeEventCount > 0 ? (
              <p className="ink-pill mt-3">{entry.routeEventCount} route events logged</p>
            ) : null}
            {entry.existingRun ? (
              <Link
                href={`/app/chronicles/${chronicleId}/runs/${entry.existingRun.id}`}
                className="ink-btn ink-btn-secondary mt-4"
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
                <button type="submit" className="ink-btn ink-btn-primary w-full">
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
