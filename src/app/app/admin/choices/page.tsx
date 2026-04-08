import { FieldBlock } from "@/components/admin/field-block";
import { GuideCallout } from "@/components/admin/guide-callout";
import { StudioSection } from "@/components/admin/studio-section";
import { createChoiceAction, updateChoiceAction } from "@/features/admin/actions";
import { listAdminStoryData } from "@/features/story/repository";
import type { JsonValue } from "@/types/story";
import Link from "next/link";

type AdminChoicesPageProps = {
  searchParams: Promise<{ editChoiceId?: string }>;
};

function formatJsonValue(value: JsonValue) {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return JSON.stringify(value);
}

export default async function AdminChoicesPage({ searchParams }: AdminChoicesPageProps) {
  const data = await listAdminStoryData();
  const params = await searchParams;
  const editChoiceId =
    typeof params.editChoiceId === "string" ? params.editChoiceId : null;
  const editingChoice = editChoiceId
    ? data.beatChoices.find((choice) => choice.id === editChoiceId) ?? null
    : null;
  const editingGate = editingChoice?.gatingRules[0] ?? null;
  const editingConsequence = editingChoice?.consequences[0] ?? null;
  const formAction = editingChoice ? updateChoiceAction : createChoiceAction;

  const beatTitleById = new Map(data.storyBeats.map((beat) => [beat.id, beat.title]));

  return (
    <StudioSection
      step="6"
      title="Choice Wiring"
      description="Choices determine progression, consequence scope, and how guided action intent can map to structured branches."
      before="Scenes"
      next="Reader testing in Chronicles"
    >
      <GuideCallout title="How Choice Logic Works">
        <p>
          A choice starts from one source scene and moves to one next scene.
          Consequences optionally write state.
        </p>
        <p>
          Gate fields are optional. Use them when a choice should only appear in
          specific state conditions.
        </p>
      </GuideCallout>

      <form action={formAction} className="grid gap-3 md:grid-cols-2">
        {editingChoice ? (
          <>
            <input type="hidden" name="choiceId" value={editingChoice.id} />
            <div className="md:col-span-2 rounded-md border border-[var(--ink-border)] bg-[var(--ink-surface)] p-3 text-sm text-[var(--ink-text-muted)]">
              Editing choice:{" "}
              <span className="font-semibold text-[var(--ink-text)]">
                {editingChoice.label}
              </span>
            </div>
          </>
        ) : null}
        <FieldBlock
          label="Source Scene"
          help="Scene where this choice appears."
        >
          <select
            name="beatId"
            required
            className="ink-select"
            defaultValue={editingChoice?.beatId ?? ""}
          >
            <option value="">Source scene</option>
            {data.storyBeats.map((beat) => (
              <option key={beat.id} value={beat.id}>
                {beat.title}
              </option>
            ))}
          </select>
        </FieldBlock>
        <FieldBlock
          label="Next Scene"
          help="Scene this choice transitions to when selected."
        >
          <select
            name="nextBeatId"
            required
            className="ink-select"
            defaultValue={editingChoice?.nextBeatId ?? ""}
          >
            <option value="">Next scene</option>
            {data.storyBeats.map((beat) => (
              <option key={beat.id} value={beat.id}>
                {beat.title}
              </option>
            ))}
          </select>
        </FieldBlock>
        <FieldBlock
          label="Choice Label"
          help="Reader-facing decision text."
        >
          <input
            name="label"
            required
            defaultValue={editingChoice?.label ?? ""}
            placeholder="Choice label"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Order Index"
          help="Lower values appear earlier in the choice list."
        >
          <input
            name="orderIndex"
            defaultValue={editingChoice?.orderIndex ?? 100}
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Choice Description"
          help="Optional supporting context shown below the label."
          className="md:col-span-2"
        >
          <textarea
            name="description"
            defaultValue={editingChoice?.description ?? ""}
            placeholder="Choice description"
            className="ink-textarea"
          />
        </FieldBlock>
        <FieldBlock
          label="Consequence Scope"
          help="global updates Chronicle state, perspective updates this route, knowledge updates known flags."
        >
          <select
            name="consequenceScope"
            className="ink-select"
            defaultValue={editingChoice?.consequenceScope ?? "perspective"}
          >
            <option value="global">global</option>
            <option value="perspective">perspective</option>
            <option value="knowledge">knowledge</option>
          </select>
        </FieldBlock>
        <FieldBlock
          label="Intent Tags"
          help="Comma-separated mapping hints for guided typed actions."
        >
          <input
            name="intentTags"
            defaultValue={editingChoice?.intentTags.join(", ") ?? ""}
            placeholder="Intent tags (comma separated)"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Consequence Key"
          help="State key to write when this choice is selected."
        >
          <input
            name="consequenceKey"
            defaultValue={editingConsequence?.key ?? ""}
            placeholder="Consequence key"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Consequence Value"
          help='Value to write, e.g. true, false, "known", "hostile".'
        >
          <input
            name="consequenceValue"
            defaultValue={
              editingConsequence ? formatJsonValue(editingConsequence.value) : ""
            }
            placeholder='Consequence value, e.g. true or "known"'
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Gate Scope (optional)"
          help="Set to global, perspective, or knowledge to conditionally show this choice."
        >
          <input
            name="gateScope"
            defaultValue={editingGate?.scope ?? ""}
            placeholder="Optional gate scope"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Gate Key (optional)"
          help="State key checked by gate logic."
        >
          <input
            name="gateKey"
            defaultValue={editingGate?.key ?? ""}
            placeholder="Optional gate key"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Gate Equals (optional)"
          help="Choice appears when state equals this value."
        >
          <input
            name="gateEquals"
            defaultValue={
              editingGate && editingGate.equals !== undefined
                ? formatJsonValue(editingGate.equals)
                : ""
            }
            placeholder="Gate equals"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Gate Not Equals (optional)"
          help="Choice appears when state does not equal this value."
        >
          <input
            name="gateNotEquals"
            defaultValue={
              editingGate && editingGate.notEquals !== undefined
                ? formatJsonValue(editingGate.notEquals)
                : ""
            }
            placeholder="Gate not equals"
            className="ink-field"
          />
        </FieldBlock>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button type="submit" className="ink-btn ink-btn-primary">
            {editingChoice ? "Save Edited Choice" : "Create Choice"}
          </button>
          {editingChoice ? (
            <Link href="/app/admin/choices" className="ink-btn ink-btn-secondary">
              Cancel Edit
            </Link>
          ) : null}
        </div>
      </form>

      <GuideCallout title="Editing Existing Choices">
        <p>
          Use the Edit button to repopulate a choice into the form above. Then
          adjust fields and save.
        </p>
      </GuideCallout>

      <div className="space-y-3">
        {data.beatChoices.map((choice) => (
          <div key={choice.id} className="ink-panel space-y-2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-sans text-lg font-semibold text-[var(--ink-text)]">
                {choice.label}
              </p>
              <Link
                href={`/app/admin/choices?editChoiceId=${choice.id}`}
                className="ink-btn ink-btn-secondary"
              >
                Edit Choice
              </Link>
            </div>
            <p className="text-sm text-[var(--ink-text-muted)]">
              {choice.description ?? "No description."}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-text-soft)]">
              <span className="ink-pill">
                Source: {beatTitleById.get(choice.beatId) ?? "Unknown"}
              </span>
              <span className="ink-pill">
                Next: {choice.nextBeatId ? beatTitleById.get(choice.nextBeatId) ?? "Unknown" : "None"}
              </span>
              <span className="ink-pill">Order: {choice.orderIndex}</span>
              <span className="ink-pill">Scope: {choice.consequenceScope}</span>
            </div>
          </div>
        ))}
      </div>
    </StudioSection>
  );
}

