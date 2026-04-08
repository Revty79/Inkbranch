import { FieldBlock } from "@/components/admin/field-block";
import { GuideCallout } from "@/components/admin/guide-callout";
import { StudioSection } from "@/components/admin/studio-section";
import { createBeatAction, updateBeatAction } from "@/features/admin/actions";
import { listAdminStoryData } from "@/features/story/repository";

export default async function AdminScenesPage() {
  const data = await listAdminStoryData();
  const choicesByBeat = new Map<string, typeof data.beatChoices>();
  for (const choice of data.beatChoices) {
    const bucket = choicesByBeat.get(choice.beatId);
    if (bucket) {
      bucket.push(choice);
    } else {
      choicesByBeat.set(choice.beatId, [choice]);
    }
  }

  return (
    <StudioSection
      step="5"
      title="Scene Authoring"
      description="The engine still uses beats, but author-facing language and fields are scene-first."
      before="Canon"
      next="Choices"
    >
      <GuideCallout title="Scene Model Notes">
        <p>
          Scene slug is the stable identifier. Title, subtitle, and chapter are
          reader-facing framing.
        </p>
        <p>
          Beat type is still engine structure (`world`, `perspective`,
          `interlock`) and helps continuity tooling reason about the scene.
        </p>
      </GuideCallout>

      <form action={createBeatAction} className="grid gap-3 md:grid-cols-2">
        <FieldBlock
          label="Version"
          help="Scene belongs to one version only."
        >
          <select name="versionId" required className="ink-select">
            <option value="">Select version</option>
            {data.storyVersions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.versionLabel}
              </option>
            ))}
          </select>
        </FieldBlock>
        <FieldBlock
          label="Scene Slug"
          help="Stable scene identifier used by links/tools. Lowercase + hyphens."
        >
          <input name="slug" required placeholder="scene-slug" className="ink-field" />
        </FieldBlock>
        <FieldBlock label="Scene Title" help="Main reader-facing scene heading.">
          <input name="title" required placeholder="Scene title" className="ink-field" />
        </FieldBlock>
        <FieldBlock
          label="Scene Subtitle"
          help="Optional subheading for location, time, or mood."
        >
          <input
            name="sceneSubtitle"
            placeholder="Scene subtitle (optional)"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Chapter Label"
          help="Optional grouping label for chapter-style progression."
        >
          <input
            name="chapterLabel"
            placeholder="Chapter label (optional)"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Beat Type"
          help="world affects shared timeline, perspective is character-specific, interlock bridges routes."
        >
          <select name="beatType" defaultValue="perspective" className="ink-select">
            <option value="world">world</option>
            <option value="perspective">perspective</option>
            <option value="interlock">interlock</option>
          </select>
        </FieldBlock>
        <FieldBlock
          label="Order Index"
          help="Lower numbers appear earlier when auto-selecting first scene."
        >
          <input name="orderIndex" defaultValue={100} className="ink-field" />
        </FieldBlock>
        <FieldBlock
          label="Terminal Scene"
          help="Marks this scene as a route endpoint."
        >
          <label className="ink-panel flex items-center gap-2 px-3 py-2 text-sm">
            <input type="checkbox" name="isTerminal" className="ink-checkbox" />
            Terminal scene
          </label>
        </FieldBlock>
        <FieldBlock
          label="Atmosphere Notes"
          help="Optional tonal cue shown in reader framing."
          className="md:col-span-2"
        >
          <input
            name="atmosphere"
            placeholder="Atmosphere notes"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Scene Summary"
          help="Short synopsis line used in route context."
          className="md:col-span-2"
        >
          <textarea
            name="summary"
            required
            placeholder="Scene summary"
            className="ink-textarea"
          />
        </FieldBlock>
        <FieldBlock
          label="Scene Body"
          help="Main prose shown to readers."
          className="md:col-span-2"
        >
          <textarea
            name="narration"
            required
            placeholder="Scene body"
            className="ink-textarea min-h-32"
          />
        </FieldBlock>
        <FieldBlock
          label="Allow Guided Typed Actions"
          help="Enables constrained typed intent input on this scene."
          className="md:col-span-2"
        >
          <label className="ink-panel flex items-center gap-2 px-3 py-2 text-sm">
            <input type="checkbox" name="allowsGuidedAction" className="ink-checkbox" />
            Allow guided typed actions in this scene
          </label>
        </FieldBlock>
        <FieldBlock
          label="Guided Action Prompt"
          help="Reader instructions for what kinds of actions are expected."
          className="md:col-span-2"
        >
          <textarea
            name="guidedActionPrompt"
            placeholder="Guided action instructions shown to readers"
            className="ink-textarea"
          />
        </FieldBlock>
        <FieldBlock
          label="Allowed Action Tags"
          help="Comma-separated tags used for intent matching, for example investigate, secure, sneak."
          className="md:col-span-2"
        >
          <input
            name="allowedActionTags"
            placeholder="Allowed action tags (comma separated)"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Fallback Choice ID"
          help="Optional safety fallback if typed intent cannot be mapped confidently."
          className="md:col-span-2"
        >
          <input
            name="fallbackChoiceId"
            placeholder="Fallback choice id (optional)"
            className="ink-field"
          />
        </FieldBlock>
        <button type="submit" className="ink-btn ink-btn-primary md:col-span-2">
          Create Scene
        </button>
      </form>

      <GuideCallout title="Editing Existing Scenes">
        <p>
          Keep slug stable. Update framing and prose freely, then align
          associated choices if progression changes.
        </p>
      </GuideCallout>

      <div className="space-y-3">
        {data.storyBeats.map((beat) => (
          <form
            key={beat.id}
            action={updateBeatAction}
            className="ink-panel grid gap-3 p-3 md:grid-cols-2"
          >
            <input type="hidden" name="beatId" value={beat.id} />
            <FieldBlock label="Scene Title" help="Primary reader heading.">
              <input name="title" defaultValue={beat.title} required className="ink-field" />
            </FieldBlock>
            <FieldBlock label="Scene Subtitle" help="Optional subheading.">
              <input
                name="sceneSubtitle"
                defaultValue={beat.sceneSubtitle ?? ""}
                className="ink-field"
              />
            </FieldBlock>
            <FieldBlock label="Chapter Label" help="Optional chapter grouping.">
              <input
                name="chapterLabel"
                defaultValue={beat.chapterLabel ?? ""}
                className="ink-field"
              />
            </FieldBlock>
            <FieldBlock label="Order Index" help="Sorting order for scenes.">
              <input
                name="orderIndex"
                defaultValue={beat.orderIndex}
                className="ink-field"
              />
            </FieldBlock>
            <FieldBlock label="Terminal" help="Ends route if reached.">
              <label className="ink-panel flex items-center gap-2 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="isTerminal"
                  defaultChecked={beat.isTerminal}
                  className="ink-checkbox"
                />
                Terminal
              </label>
            </FieldBlock>
            <FieldBlock
              label="Atmosphere Notes"
              help="Optional tonal annotation."
              className="md:col-span-2"
            >
              <input
                name="atmosphere"
                defaultValue={beat.atmosphere ?? ""}
                className="ink-field"
                placeholder="Atmosphere notes"
              />
            </FieldBlock>
            <FieldBlock
              label="Scene Summary"
              help="Brief synopsis line."
              className="md:col-span-2"
            >
              <textarea
                name="summary"
                defaultValue={beat.summary}
                required
                className="ink-textarea"
              />
            </FieldBlock>
            <FieldBlock
              label="Scene Body"
              help="Main prose text shown to readers."
              className="md:col-span-2"
            >
              <textarea
                name="narration"
                defaultValue={beat.narration}
                required
                className="ink-textarea min-h-32"
              />
            </FieldBlock>
            <FieldBlock
              label="Allow Guided Actions"
              help="Enable constrained typed input on this scene."
              className="md:col-span-2"
            >
              <label className="ink-panel flex items-center gap-2 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="allowsGuidedAction"
                  defaultChecked={beat.allowsGuidedAction}
                  className="ink-checkbox"
                />
                Allow guided actions
              </label>
            </FieldBlock>
            <FieldBlock
              label="Guided Action Prompt"
              help="Reader-facing instruction text."
              className="md:col-span-2"
            >
              <textarea
                name="guidedActionPrompt"
                defaultValue={beat.guidedActionPrompt ?? ""}
                className="ink-textarea"
              />
            </FieldBlock>
            <FieldBlock
              label="Allowed Action Tags"
              help="Comma-separated tags used by intent mapping."
              className="md:col-span-2"
            >
              <input
                name="allowedActionTags"
                defaultValue={beat.allowedActionTags.join(", ")}
                className="ink-field"
              />
            </FieldBlock>
            <FieldBlock
              label="Fallback Choice"
              help="Optional safe default if typed action cannot be matched."
              className="md:col-span-2"
            >
              <select
                name="fallbackChoiceId"
                defaultValue={beat.fallbackChoiceId ?? ""}
                className="ink-select"
              >
                <option value="">No fallback choice</option>
                {(choicesByBeat.get(beat.id) ?? []).map((choice) => (
                  <option key={choice.id} value={choice.id}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </FieldBlock>
            <button type="submit" className="ink-btn ink-btn-secondary md:col-span-2">
              Save Scene
            </button>
          </form>
        ))}
      </div>
    </StudioSection>
  );
}
