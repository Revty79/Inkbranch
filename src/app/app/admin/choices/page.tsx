import { FieldBlock } from "@/components/admin/field-block";
import { GuideCallout } from "@/components/admin/guide-callout";
import { StudioSection } from "@/components/admin/studio-section";
import { createChoiceAction, updateChoiceAction } from "@/features/admin/actions";
import { listAdminStoryData } from "@/features/story/repository";

export default async function AdminChoicesPage() {
  const data = await listAdminStoryData();

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

      <form action={createChoiceAction} className="grid gap-3 md:grid-cols-2">
        <FieldBlock
          label="Source Scene"
          help="Scene where this choice appears."
        >
          <select name="beatId" required className="ink-select">
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
          <select name="nextBeatId" required className="ink-select">
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
            placeholder="Choice label"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Order Index"
          help="Lower values appear earlier in the choice list."
        >
          <input name="orderIndex" defaultValue={100} className="ink-field" />
        </FieldBlock>
        <FieldBlock
          label="Choice Description"
          help="Optional supporting context shown below the label."
          className="md:col-span-2"
        >
          <textarea
            name="description"
            placeholder="Choice description"
            className="ink-textarea"
          />
        </FieldBlock>
        <FieldBlock
          label="Consequence Scope"
          help="global updates Chronicle state, perspective updates this route, knowledge updates known flags."
        >
          <select name="consequenceScope" defaultValue="perspective" className="ink-select">
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
            placeholder='Consequence value, e.g. true or "known"'
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Gate Scope (optional)"
          help="Set to global, perspective, or knowledge to conditionally show this choice."
        >
          <input name="gateScope" placeholder="Optional gate scope" className="ink-field" />
        </FieldBlock>
        <FieldBlock
          label="Gate Key (optional)"
          help="State key checked by gate logic."
        >
          <input name="gateKey" placeholder="Optional gate key" className="ink-field" />
        </FieldBlock>
        <FieldBlock
          label="Gate Equals (optional)"
          help="Choice appears when state equals this value."
        >
          <input name="gateEquals" placeholder="Gate equals" className="ink-field" />
        </FieldBlock>
        <FieldBlock
          label="Gate Not Equals (optional)"
          help="Choice appears when state does not equal this value."
        >
          <input name="gateNotEquals" placeholder="Gate not equals" className="ink-field" />
        </FieldBlock>
        <button type="submit" className="ink-btn ink-btn-primary md:col-span-2">
          Create Choice
        </button>
      </form>

      <GuideCallout title="Editing Existing Choices">
        <p>
          Keep labels clear and intent tags aligned to expected reader language.
          Update destination scenes carefully to preserve route continuity.
        </p>
      </GuideCallout>

      <div className="space-y-3">
        {data.beatChoices.map((choice) => (
          <form
            key={choice.id}
            action={updateChoiceAction}
            className="ink-panel grid gap-3 p-3 md:grid-cols-2"
          >
            <input type="hidden" name="choiceId" value={choice.id} />
            <FieldBlock label="Choice Label" help="Reader-facing decision text.">
              <input
                name="label"
                defaultValue={choice.label}
                required
                className="ink-field"
              />
            </FieldBlock>
            <FieldBlock label="Order Index" help="Display order for this choice.">
              <input
                name="orderIndex"
                defaultValue={choice.orderIndex}
                className="ink-field"
              />
            </FieldBlock>
            <FieldBlock
              label="Next Scene"
              help="Destination scene after this choice."
              className="md:col-span-2"
            >
              <select
                name="nextBeatId"
                defaultValue={choice.nextBeatId ?? ""}
                className="ink-select"
              >
                {data.storyBeats.map((beat) => (
                  <option key={beat.id} value={beat.id}>
                    {beat.title}
                  </option>
                ))}
              </select>
            </FieldBlock>
            <FieldBlock
              label="Choice Description"
              help="Optional explanatory text."
              className="md:col-span-2"
            >
              <textarea
                name="description"
                defaultValue={choice.description ?? ""}
                className="ink-textarea"
              />
            </FieldBlock>
            <FieldBlock
              label="Intent Tags"
              help="Comma-separated guided-action mapping hints."
              className="md:col-span-2"
            >
              <input
                name="intentTags"
                defaultValue={choice.intentTags.join(", ")}
                className="ink-field"
                placeholder="Intent tags (comma separated)"
              />
            </FieldBlock>
            <button type="submit" className="ink-btn ink-btn-secondary md:col-span-2">
              Save Choice
            </button>
          </form>
        ))}
      </div>
    </StudioSection>
  );
}
