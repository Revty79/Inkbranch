import { InkCard } from "@/components/ui/ink-card";
import { loadChronicle } from "@/features/chronicles";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import Link from "next/link";

type ChronicleDetailPageProps = {
  params: Promise<{ chronicleId: string }>;
  searchParams: Promise<{ guided?: string }>;
};

export default async function ChronicleDetailPage({
  params,
  searchParams,
}: ChronicleDetailPageProps) {
  const { chronicleId } = await params;
  const { guided } = await searchParams;
  const user = await requireAuthenticatedUser();
  const chronicleData = await loadChronicle(user.id, chronicleId);

  const guidedMessage =
    guided === "completed"
      ? "Guided action advanced your route and completed that perspective."
      : null;

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="ink-label">Chronicle Detail</p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          {chronicleData.world.title}
        </h1>
        <p className="max-w-2xl text-[var(--ink-text-muted)]">
          Version {chronicleData.version.versionLabel} - status{" "}
          {chronicleData.chronicle.status}
        </p>
        {chronicleData.unlockState.totalChapterCount ? (
          <p className="text-sm text-[var(--ink-text-soft)]">
            Planned book length: {chronicleData.unlockState.totalChapterCount} chapters.
          </p>
        ) : null}
      </header>

      {guidedMessage ? (
        <div className="ink-panel p-3 text-sm text-[var(--ink-text-muted)]">
          {guidedMessage}
        </div>
      ) : null}
      {!chronicleData.unlockState.firstReadComplete ? (
        <div className="ink-panel p-3 text-sm text-[var(--ink-text-muted)]">
          Perspective discovery is locked during first read-through. Complete one
          full run to reveal additional character viewpoints in this Chronicle.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <InkCard eyebrow="Shared Canon" title="Chronicle Consequences">
          {chronicleData.worldState.length ? (
            <ul className="space-y-2 text-sm">
              {chronicleData.worldState.map((entry) => (
                <li key={entry.id} className="ink-panel p-2.5">
                  <span className="font-semibold text-[var(--ink-text)]">
                    {entry.stateKey}
                  </span>{" "}
                  = {JSON.stringify(entry.stateValue)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">No Chronicle-level state changes recorded yet.</p>
          )}
        </InkCard>

        <InkCard eyebrow="Perspective Ledger" title="Route Progress">
          <ul className="space-y-2 text-sm">
            {chronicleData.viewpointProgress.map((entry) => (
              <li key={entry.viewpoint.id} className="ink-panel p-2.5">
                <p className="font-medium text-[var(--ink-text)]">
                  {entry.character.name}
                </p>
                {entry.run ? (
                  <p className="mt-1 text-xs text-[var(--ink-text-muted)]">
                    {entry.run.status} - {entry.beat?.title ?? "unknown scene"}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-[var(--ink-text-soft)]">
                    Not started
                  </p>
                )}
              </li>
            ))}
          </ul>
          <Link
            href={`/app/chronicles/${chronicleId}/select-perspective`}
            className="ink-btn ink-btn-secondary mt-4"
          >
            Choose Perspective
          </Link>
        </InkCard>

        <InkCard eyebrow="Carryover" title="Recent Chronicle Events">
          {chronicleData.recentEvents.length ? (
            <ul className="space-y-2 text-sm">
              {chronicleData.recentEvents.slice(0, 8).map((event) => (
                <li key={event.id} className="ink-panel p-2.5">
                  <p className="font-medium text-[var(--ink-text)]">{event.summary}</p>
                  <p className="mt-1 text-xs text-[var(--ink-text-muted)]">
                    {new Date(event.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">No Chronicle events have been recorded yet.</p>
          )}
        </InkCard>
      </div>

      <section className="space-y-3">
        <p className="ink-label">Fast Resume</p>
        {chronicleData.runs.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {chronicleData.runs.map((entry) => (
              <div key={entry.run.id} className="ink-panel p-3">
                <p className="font-sans text-sm font-semibold text-[var(--ink-text)]">
                  {entry.character.name}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-text-muted)]">
                  {entry.run.status} - {entry.beat.title}
                </p>
                <Link
                  href={`/app/chronicles/${chronicleId}/runs/${entry.run.id}`}
                  className="ink-btn ink-btn-ghost mt-3"
                >
                  Resume Route
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="ink-panel p-4 text-sm text-[var(--ink-text-muted)]">
            No perspective routes have started yet.
          </div>
        )}
      </section>
    </div>
  );
}
