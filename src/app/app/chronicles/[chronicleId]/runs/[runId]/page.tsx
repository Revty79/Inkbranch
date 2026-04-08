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

function asTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asStringList(value: unknown, maxItems = 6) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, maxItems);
}

function asNonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function normalizeLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return value.trim().toLowerCase();
}

function countWords(value: string | null) {
  if (!value) {
    return 0;
  }

  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

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
  const latestCommittedScene =
    [...context.sceneHistory]
      .reverse()
      .find((scene) => scene.beatId === context.beat.id) ?? null;
  const sceneTitle =
    asTrimmedString(latestCommittedScene?.metadata["sceneTitle"]) ?? context.beat.title;
  const shortSummary =
    asTrimmedString(latestCommittedScene?.metadata["shortSummary"]) ?? context.beat.summary;
  const sceneText =
    asTrimmedString(latestCommittedScene?.sceneText) ?? context.beat.narration;
  const activeChapterLabel =
    context.beat.chapterLabel ??
    asTrimmedString(latestCommittedScene?.metadata["chapterLabel"]);
  const activeChapterLabelKey = normalizeLabel(activeChapterLabel);
  const chapterSceneHistory = context.sceneHistory.filter((scene) => {
    if (!activeChapterLabelKey) {
      return true;
    }

    const sceneChapterLabel = asTrimmedString(scene.metadata["chapterLabel"]);
    return normalizeLabel(sceneChapterLabel) === activeChapterLabelKey;
  });
  const fallbackManuscriptHistory =
    chapterSceneHistory.length > 0
      ? chapterSceneHistory
      : latestCommittedScene
        ? [latestCommittedScene]
        : [];
  const chapterManuscriptScenes = fallbackManuscriptHistory.slice(-6);
  const hiddenChapterSceneCount = Math.max(
    0,
    fallbackManuscriptHistory.length - chapterManuscriptScenes.length,
  );
  const chapterWordCount = chapterManuscriptScenes.reduce((totalWords, scene) => {
    const text = asTrimmedString(scene.sceneText);
    return totalWords + countWords(text);
  }, 0);
  const visibleStateHints = asStringList(
    latestCommittedScene?.metadata["visibleStateHints"],
    5,
  );
  const continuityNotes = asStringList(
    latestCommittedScene?.metadata["continuityNotes"],
    5,
  );
  const suggestedChoiceMood = asTrimmedString(
    latestCommittedScene?.metadata["suggestedChoiceMood"],
  );
  const generationModel = asTrimmedString(latestCommittedScene?.metadata["model"]);
  const fallbackReason = asTrimmedString(latestCommittedScene?.metadata["fallbackReason"]);
  const lockedCanonCount = asNonNegativeNumber(
    latestCommittedScene?.metadata["lockedCanonCount"],
  );
  const plannedChapterCount = asNonNegativeNumber(context.bookPlan?.totalChapterCount);
  const currentChapterNumber = asNonNegativeNumber(context.bookPlan?.currentChapterNumber);
  const currentSceneIndex = asNonNegativeNumber(context.bookPlan?.currentSceneIndex);
  const chapterWordCountCommitted = asNonNegativeNumber(
    context.bookPlan?.chapterWordCount,
  );
  const chapterSceneCount = asNonNegativeNumber(context.bookPlan?.chapterSceneCount);
  const chapterReady = context.bookPlan?.chapterReady === true;

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
            Narration source: {latestCommittedScene?.sourceLabel ?? "baseline"}
          </span>
          {generationModel ? (
            <span className="ink-pill">model: {generationModel}</span>
          ) : null}
          {lockedCanonCount && lockedCanonCount > 0 ? (
            <span className="ink-pill">canon locked: {lockedCanonCount}</span>
          ) : null}
          <span className="ink-pill">
            Scene {context.sceneHistory.length} in this route
          </span>
          {plannedChapterCount && currentChapterNumber ? (
            <span className="ink-pill">
              Chapter {currentChapterNumber} / {plannedChapterCount}
            </span>
          ) : null}
          {currentSceneIndex ? (
            <span className="ink-pill">Chapter scene {currentSceneIndex}</span>
          ) : null}
          {chapterWordCountCommitted ? (
            <span className="ink-pill">
              Chapter draft words: {chapterWordCountCommitted}
            </span>
          ) : null}
          {chapterSceneCount ? (
            <span className="ink-pill">Chapter scenes: {chapterSceneCount}</span>
          ) : null}
          {chapterReady ? (
            <span className="ink-pill">Chapter length ready</span>
          ) : null}
          <span className="ink-pill">
            {activeChapterLabel ? `${activeChapterLabel}` : "Route manuscript"}:{" "}
            {fallbackManuscriptHistory.length} committed scene
            {fallbackManuscriptHistory.length === 1 ? "" : "s"}
          </span>
          {chapterWordCount > 0 ? (
            <span className="ink-pill">{chapterWordCount} words in view</span>
          ) : null}
        </div>
        <h2 className="mt-4 font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          {sceneTitle}
        </h2>
        {context.beat.sceneSubtitle ? (
          <p className="mt-1 font-sans text-sm uppercase tracking-[0.1em] text-[var(--ink-text-soft)]">
            {context.beat.sceneSubtitle}
          </p>
        ) : null}
        <p className="mt-4 text-[var(--ink-text-muted)]">{shortSummary}</p>
        {context.beat.atmosphere ? (
          <p className="mt-2 text-sm italic text-[var(--ink-text-soft)]">
            Atmosphere: {context.beat.atmosphere}
          </p>
        ) : null}
        {!latestCommittedScene ? (
          <p className="mt-3 rounded-md border border-[var(--ink-border)] bg-[var(--ink-surface)] p-3 text-sm text-[var(--ink-text-soft)]">
            No committed generated scene exists yet for this beat, so baseline beat narration
            is shown.
          </p>
        ) : null}
        {fallbackReason ? (
          <p className="mt-3 rounded-md border border-[var(--ink-border)] bg-[var(--ink-surface)] p-3 text-xs text-[var(--ink-text-soft)]">
            AI fallback reason: {fallbackReason}
          </p>
        ) : null}
        <div className="mt-5 space-y-4 border-t border-[var(--ink-border)] pt-5">
          {hiddenChapterSceneCount > 0 ? (
            <p className="rounded-md border border-[var(--ink-border)] bg-[var(--ink-surface)] p-3 text-xs text-[var(--ink-text-soft)]">
              Showing the latest {chapterManuscriptScenes.length} committed scenes from this
              chapter manuscript.
            </p>
          ) : null}
          {chapterManuscriptScenes.length ? (
            chapterManuscriptScenes.map((scene, index) => {
              const manuscriptSceneTitle =
                asTrimmedString(scene.metadata["sceneTitle"]) ??
                `Section ${hiddenChapterSceneCount + index + 1}`;
              const manuscriptSummary = asTrimmedString(scene.metadata["shortSummary"]);
              const manuscriptText = asTrimmedString(scene.sceneText) ?? "";
              const isLatestScene = latestCommittedScene
                ? scene.id === latestCommittedScene.id
                : index === chapterManuscriptScenes.length - 1;

              return (
                <section
                  key={scene.id}
                  className={`rounded-md border p-4 ${
                    isLatestScene
                      ? "border-[var(--ink-text-soft)] bg-[var(--ink-surface)]"
                      : "border-[var(--ink-border)]"
                  }`}
                >
                  <p className="ink-label">
                    {isLatestScene ? "Current Scene" : "Earlier Chapter Section"}
                  </p>
                  <h3 className="mt-2 font-sans text-xl font-semibold text-[var(--ink-text)]">
                    {manuscriptSceneTitle}
                  </h3>
                  {manuscriptSummary ? (
                    <p className="mt-2 text-sm text-[var(--ink-text-muted)]">
                      {manuscriptSummary}
                    </p>
                  ) : null}
                  <p className="mt-3 whitespace-pre-line text-base leading-8 text-[var(--ink-text)] sm:text-lg">
                    {manuscriptText}
                  </p>
                </section>
              );
            })
          ) : (
            <p className="whitespace-pre-line text-base leading-8 text-[var(--ink-text)] sm:text-lg">
              {sceneText}
            </p>
          )}
        </div>
        {visibleStateHints.length || continuityNotes.length || suggestedChoiceMood ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {visibleStateHints.length ? (
              <div className="ink-panel p-3">
                <p className="ink-label">Visible State Hints</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--ink-text-muted)]">
                  {visibleStateHints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {continuityNotes.length || suggestedChoiceMood ? (
              <div className="ink-panel p-3">
                {continuityNotes.length ? (
                  <>
                    <p className="ink-label">Continuity Notes</p>
                    <ul className="mt-2 space-y-1 text-sm text-[var(--ink-text-muted)]">
                      {continuityNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {suggestedChoiceMood ? (
                  <p className="text-sm text-[var(--ink-text-muted)]">
                    Suggested choice mood:{" "}
                    <span className="font-medium text-[var(--ink-text)]">
                      {suggestedChoiceMood}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </article>

      <section className="space-y-3">
        <h2 className="font-sans text-xl font-semibold text-[var(--ink-text)]">
          What do you do?
        </h2>
        <p className="text-sm text-[var(--ink-text-muted)]">
          Choose a route decision below. Choices are committed as this chapter evolves
          and remain constrained by Chronicle continuity, perspective state, and known
          information.
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
                <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-text-soft)]">
                  Optional scene flavor note
                </label>
                <input
                  name="actionNote"
                  maxLength={180}
                  className="ink-field mt-1"
                  placeholder="Example: keep this tense but controlled"
                />
                <p className="mt-1 text-xs text-[var(--ink-text-soft)]">
                  This flavors generated prose only. Route transitions still follow fixed
                  beat/choice rules.
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
