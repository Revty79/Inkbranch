import { InkCard } from "@/components/ui/ink-card";
import { chooseBeatChoiceAction } from "@/features/chronicles/actions";
import { loadPerspectiveRun } from "@/features/chronicles";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import Link from "next/link";

type ReaderRunPageProps = {
  params: Promise<{ chronicleId: string; runId: string }>;
};

export default async function ReaderRunPage({ params }: ReaderRunPageProps) {
  const { chronicleId, runId } = await params;
  const user = await requireAuthenticatedUser();
  const context = await loadPerspectiveRun(user.id, chronicleId, runId);

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-accent)]">
          Reader View
        </p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          {context.world.title} · {context.character.name}
        </h1>
        <p className="max-w-2xl text-[var(--ink-text-muted)]">
          Perspective: {context.viewpoint.label} · Beat: {context.beat.title}
        </p>
      </header>

      <article className="rounded-3xl border border-[var(--ink-border)] bg-[var(--ink-surface)] px-5 py-6 shadow-[0_16px_36px_rgba(74,46,15,0.08)] sm:px-8">
        <p className="text-pretty text-base leading-8 text-[var(--ink-text)] sm:text-lg">
          {context.beat.narration}
        </p>
      </article>

      <section className="space-y-3">
        <h2 className="font-sans text-lg font-semibold text-[var(--ink-text)]">Choices</h2>
        {context.choices.length ? (
          <div className="space-y-3">
            {context.choices.map((choice) => (
              <form
                key={choice.id}
                action={chooseBeatChoiceAction}
                className="rounded-2xl border border-[var(--ink-border)] bg-[var(--ink-surface)] p-4"
              >
                <input type="hidden" name="chronicleId" value={chronicleId} />
                <input type="hidden" name="runId" value={runId} />
                <input type="hidden" name="choiceId" value={choice.id} />
                <p className="text-sm text-[var(--ink-text-muted)]">
                  {choice.description ?? "Advance this perspective route."}
                </p>
                <button
                  type="submit"
                  className="mt-3 w-full rounded-full bg-[var(--ink-accent)] px-4 py-2.5 font-sans text-sm font-semibold text-[#fff8ef] transition hover:bg-[var(--ink-accent-soft)]"
                >
                  {choice.label}
                </button>
              </form>
            ))}
          </div>
        ) : (
          <InkCard eyebrow="Route State" title="No available choices">
            <p className="text-sm">
              This beat currently has no valid next actions for the stored state.
            </p>
          </InkCard>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InkCard eyebrow="Chronicle" title="World State">
          {context.globalStateEntries.length ? (
            <ul className="space-y-1 text-sm">
              {context.globalStateEntries.map((entry) => (
                <li key={entry.id}>
                  {entry.stateKey}: {JSON.stringify(entry.stateValue)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">No global consequences recorded yet.</p>
          )}
        </InkCard>
        <InkCard eyebrow="Perspective" title="Run State">
          {context.perspectiveStateEntries.length ? (
            <ul className="space-y-1 text-sm">
              {context.perspectiveStateEntries.map((entry) => (
                <li key={entry.id}>
                  {entry.stateKey}: {JSON.stringify(entry.stateValue)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">No perspective state values yet.</p>
          )}
        </InkCard>
        <InkCard eyebrow="Knowledge" title="Known Flags">
          {context.knowledgeEntries.length ? (
            <ul className="space-y-1 text-sm">
              {context.knowledgeEntries.map((entry) => (
                <li key={entry.id}>
                  {entry.flagKey}: {entry.status}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">No knowledge flags recorded yet.</p>
          )}
        </InkCard>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/app/chronicles/${chronicleId}`}
          className="rounded-full border border-[var(--ink-border)] px-3 py-1.5 font-sans text-sm font-semibold text-[var(--ink-accent)] transition hover:bg-[var(--ink-surface-muted)]"
        >
          Chronicle Overview
        </Link>
        <Link
          href="/app/chronicles"
          className="rounded-full border border-[var(--ink-border)] px-3 py-1.5 font-sans text-sm font-semibold text-[var(--ink-accent)] transition hover:bg-[var(--ink-surface-muted)]"
        >
          All Chronicles
        </Link>
      </div>
    </div>
  );
}
