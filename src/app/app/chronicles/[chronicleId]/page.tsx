import { InkCard } from "@/components/ui/ink-card";
import { loadChronicle } from "@/features/chronicles";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import Link from "next/link";

type ChronicleDetailPageProps = {
  params: Promise<{ chronicleId: string }>;
};

export default async function ChronicleDetailPage({
  params,
}: ChronicleDetailPageProps) {
  const { chronicleId } = await params;
  const user = await requireAuthenticatedUser();
  const chronicleData = await loadChronicle(user.id, chronicleId);

  const stateEntries = chronicleData.worldState;

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-accent)]">
          Chronicle Detail
        </p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          {chronicleData.world.title}
        </h1>
        <p className="max-w-2xl text-[var(--ink-text-muted)]">
          Version {chronicleData.version.versionLabel} · status{" "}
          {chronicleData.chronicle.status}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <InkCard eyebrow="World State" title="Chronicle Consequences">
          {stateEntries.length ? (
            <ul className="space-y-2 text-sm">
              {stateEntries.map((entry) => (
                <li key={entry.id}>
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
        <InkCard eyebrow="Perspective Runs" title="Playable Routes">
          {chronicleData.runs.length ? (
            <ul className="space-y-2 text-sm">
              {chronicleData.runs.map((run) => (
                <li key={run.id}>
                  <Link
                    href={`/app/chronicles/${chronicleId}/runs/${run.id}`}
                    className="font-sans font-semibold text-[var(--ink-accent)] underline-offset-4 hover:underline"
                  >
                    Open run {run.id.slice(0, 12)}...
                  </Link>{" "}
                  ({run.status})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">No Perspective Runs started yet.</p>
          )}
          <Link
            href={`/app/chronicles/${chronicleId}/select-perspective`}
            className="mt-4 inline-flex rounded-full border border-[var(--ink-border)] px-3 py-1.5 font-sans text-sm font-semibold text-[var(--ink-accent)] transition hover:bg-[var(--ink-surface-muted)]"
          >
            Select Perspective
          </Link>
        </InkCard>
      </div>
    </div>
  );
}
