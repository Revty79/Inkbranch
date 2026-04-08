import { InkCard } from "@/components/ui/ink-card";
import {
  chooseBeatChoiceAction,
  chooseGuidedActionAction,
} from "@/features/chronicles/actions";
import { loadPerspectiveRun } from "@/features/chronicles";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import Link from "next/link";

type ReaderRunPageProps = {
  params: Promise<{ chronicleId: string; runId: string }>;
  searchParams: Promise<{ guided?: string }>;
};

function guidedStatusMessage(status: string | undefined) {
  if (status === "resolved") {
    return "Your typed action was interpreted and mapped to a valid scene decision.";
  }
  if (status === "fallback") {
    return "Your action used this scene's fallback decision to stay inside canon rails.";
  }
  if (status === "unsupported") {
    return "That action could not be mapped safely. Try one of the listed guided action styles.";
  }

  return null;
}

export default async function ReaderRunPage({
  params,
  searchParams,
}: ReaderRunPageProps) {
  const { chronicleId, runId } = await params;
  const { guided } = await searchParams;
  const user = await requireAuthenticatedUser();
  const context = await loadPerspectiveRun(user.id, chronicleId, runId);
  const message = guidedStatusMessage(guided);

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="ink-label">Reader Run</p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          {context.world.title}
        </h1>
        <p className="text-[var(--ink-text-muted)]">
          Playing as <span className="font-semibold">{context.character.name}</span> (
          {context.viewpoint.label})
        </p>
      </header>

      {message ? (
        <div className="ink-panel p-3 text-sm text-[var(--ink-text-muted)]">{message}</div>
      ) : null}

      <article className="ink-paper p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {context.beat.chapterLabel ? (
            <span className="ink-pill">{context.beat.chapterLabel}</span>
          ) : null}
          <span className="ink-pill">{context.beat.beatType} scene</span>
          <span className="ink-pill">
            Scene {context.sceneHistory.length} in this route
          </span>
        </div>
        <h2 className="mt-4 font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          {context.beat.title}
        </h2>
        {context.beat.sceneSubtitle ? (
          <p className="mt-1 font-sans text-sm uppercase tracking-[0.1em] text-[var(--ink-text-soft)]">
            {context.beat.sceneSubtitle}
          </p>
        ) : null}
        <p className="mt-4 text-[var(--ink-text-muted)]">{context.beat.summary}</p>
        {context.beat.atmosphere ? (
          <p className="mt-2 text-sm italic text-[var(--ink-text-soft)]">
            Atmosphere: {context.beat.atmosphere}
          </p>
        ) : null}
        <div className="mt-5 border-t border-[var(--ink-border)] pt-5">
          <p className="whitespace-pre-line text-base leading-8 text-[var(--ink-text)] sm:text-lg">
            {context.beat.narration}
          </p>
        </div>
      </article>

      <section className="space-y-3">
        <h2 className="font-sans text-xl font-semibold text-[var(--ink-text)]">
          What do you do?
        </h2>
        <p className="text-sm text-[var(--ink-text-muted)]">
          Choose a route decision below. Decisions remain constrained by Chronicle
          continuity, perspective state, and known information.
        </p>

        {context.choices.length ? (
          <div className="grid gap-3">
            {context.choices.map((choice) => (
              <form
                key={choice.id}
                action={chooseBeatChoiceAction}
                className="ink-paper p-4 sm:p-5"
              >
                <input type="hidden" name="chronicleId" value={chronicleId} />
                <input type="hidden" name="runId" value={runId} />
                <input type="hidden" name="choiceId" value={choice.id} />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="ink-pill">{choice.consequenceScope} consequence</span>
                  {choice.intentTags.map((tag) => (
                    <span key={tag} className="ink-pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="mt-3 font-sans text-lg font-semibold text-[var(--ink-text)]">
                  {choice.label}
                </h3>
                <p className="mt-2 text-sm text-[var(--ink-text-muted)]">
                  {choice.description ?? "Advance this perspective route."}
                </p>
                <button type="submit" className="ink-btn ink-btn-primary mt-4 w-full">
                  Choose This Action
                </button>
              </form>
            ))}
          </div>
        ) : (
          <InkCard eyebrow="Route State" title="No available decisions">
            <p className="text-sm">
              This scene currently has no valid actions for the stored state.
            </p>
          </InkCard>
        )}

        {context.beat.allowsGuidedAction ? (
          <form action={chooseGuidedActionAction} className="ink-panel space-y-3 p-4 sm:p-5">
            <input type="hidden" name="chronicleId" value={chronicleId} />
            <input type="hidden" name="runId" value={runId} />
            <p className="ink-label">Guided Action</p>
            <p className="text-sm text-[var(--ink-text-muted)]">
              {context.beat.guidedActionPrompt ??
                "Type a short intent and Inkbranch will map it to a safe, structured route decision."}
            </p>
            <input
              name="actionText"
              maxLength={180}
              required
              className="ink-field"
              placeholder="Example: quietly investigate the ledger trail"
            />
            {context.beat.allowedActionTags.length ? (
              <div className="flex flex-wrap gap-2">
                {context.beat.allowedActionTags.map((tag) => (
                  <span key={tag} className="ink-pill">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <button type="submit" className="ink-btn ink-btn-secondary">
              Try Guided Action
            </button>
          </form>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <InkCard eyebrow="Chronicle Signals" title="Recent Event Carryover">
          {context.recentChronicleEvents.length ? (
            <ul className="space-y-2 text-sm">
              {context.recentChronicleEvents.slice(0, 5).map((event) => (
                <li key={event.id} className="ink-panel p-2.5">
                  <p className="font-medium text-[var(--ink-text)]">{event.summary}</p>
                  <p className="mt-1 text-xs text-[var(--ink-text-soft)]">
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
            <p className="text-sm">No Chronicle-level events have been logged yet.</p>
          )}
        </InkCard>
        <InkCard eyebrow="Other Perspectives" title="Shared Chronicle Routes">
          {context.otherRuns.length ? (
            <ul className="space-y-2 text-sm">
              {context.otherRuns.map((entry) => (
                <li key={entry.run.id} className="ink-panel p-2.5">
                  <p className="font-medium text-[var(--ink-text)]">
                    {entry.character.name} - {entry.run.status}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-text-muted)]">
                    Current scene: {entry.beat.title}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">
              No other perspective routes have started in this Chronicle yet.
            </p>
          )}
        </InkCard>
      </section>

      <details className="ink-panel group p-4">
        <summary className="cursor-pointer list-none font-sans text-sm font-semibold text-[var(--ink-text)]">
          Continuity details (debug)
          <span className="ml-2 text-[var(--ink-text-soft)] group-open:hidden">
            Show
          </span>
          <span className="ml-2 hidden text-[var(--ink-text-soft)] group-open:inline">
            Hide
          </span>
        </summary>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
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
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <Link href={`/app/chronicles/${chronicleId}`} className="ink-btn ink-btn-secondary">
          Chronicle Overview
        </Link>
        <Link href="/app/chronicles" className="ink-btn ink-btn-ghost">
          All Chronicles
        </Link>
      </div>
    </div>
  );
}
