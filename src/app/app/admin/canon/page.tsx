import { FieldBlock } from "@/components/admin/field-block";
import { GuideCallout } from "@/components/admin/guide-callout";
import { StudioSection } from "@/components/admin/studio-section";
import { createCanonEntryAction } from "@/features/admin/actions";
import { listAdminStoryData } from "@/features/story/repository";

export default async function AdminCanonPage() {
  const data = await listAdminStoryData();

  return (
    <StudioSection
      step="4"
      title="Canon Entries"
      description="Canon stores truths and rules that keep generated scenes and branches coherent."
      before="Cast + Viewpoints"
      next="Scenes"
    >
      <GuideCallout title="How To Think About Canon">
        <p>
          Canon entries are the rules your story logic should not violate.
          Treat canon as persistent source-of-truth, not optional notes.
        </p>
        <p>
          Use stable canon keys so downstream tooling can reference entries
          reliably.
        </p>
      </GuideCallout>

      <form action={createCanonEntryAction} className="grid gap-3 md:grid-cols-2">
        <FieldBlock
          label="Version"
          help="Canon is versioned. Choose the version this truth belongs to."
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
          label="Entry Type"
          help="Classifies the canon item (world, character, item, place, rule)."
        >
          <select name="entryType" defaultValue="world_truth" className="ink-select">
            <option value="world_truth">world_truth</option>
            <option value="character_truth">character_truth</option>
            <option value="item_truth">item_truth</option>
            <option value="place_truth">place_truth</option>
            <option value="rule">rule</option>
          </select>
        </FieldBlock>
        <FieldBlock
          label="Canon Key"
          help="Stable machine-friendly identifier, for example north_gate_protocol."
        >
          <input
            name="canonKey"
            required
            placeholder="canon_key"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Canon Title"
          help="Human-readable title shown in studio tools."
        >
          <input
            name="title"
            required
            placeholder="Canon title"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Canon Body"
          help="Write the actual truth/rule and constraints clearly."
          className="md:col-span-2"
        >
          <textarea
            name="body"
            required
            placeholder="Canon body"
            className="ink-textarea"
          />
        </FieldBlock>
        <button type="submit" className="ink-btn ink-btn-primary md:col-span-2">
          Create Canon Entry
        </button>
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {data.storyCanonEntries.map((entry) => (
          <div key={entry.id} className="ink-panel p-3">
            <p className="ink-label">{entry.entryType}</p>
            <p className="mt-1 font-sans text-lg font-semibold text-[var(--ink-text)]">
              {entry.title}
            </p>
            <p className="mt-1 text-xs text-[var(--ink-text-soft)]">
              key: {entry.canonKey}
            </p>
            <p className="mt-2 text-sm text-[var(--ink-text-muted)]">{entry.body}</p>
          </div>
        ))}
      </div>
    </StudioSection>
  );
}
