import { FieldBlock } from "@/components/admin/field-block";
import { GuideCallout } from "@/components/admin/guide-callout";
import { StudioSection } from "@/components/admin/studio-section";
import { createVersionAction, updateVersionAction } from "@/features/admin/actions";
import { listAdminStoryData } from "@/features/story/repository";

export default async function AdminVersionsPage() {
  const data = await listAdminStoryData();

  return (
    <StudioSection
      step="2"
      title="Story Versions"
      description="A version is a publishable story cut tied to Chronicle integrity. Chronicles stay bound to the version they started on."
      before="Worlds"
      next="Cast + Viewpoints"
    >
      <GuideCallout title="What A Version Does">
        <p>
          Versions let you iterate safely. Readers only start new Chronicles on
          published versions.
        </p>
        <p>
          Existing Chronicles stay pinned to their start version so updates do
          not silently break saved routes.
        </p>
      </GuideCallout>

      <form action={createVersionAction} className="grid gap-3 md:grid-cols-2">
        <FieldBlock
          label="World"
          help="Pick the world this version belongs to."
        >
          <select name="worldId" required className="ink-select">
            <option value="">Select world</option>
            {data.storyWorlds.map((world) => (
              <option key={world.id} value={world.id}>
                {world.title}
              </option>
            ))}
          </select>
        </FieldBlock>
        <FieldBlock
          label="Version Label"
          help="Short creator-facing version name, for example Launch Cut or v2 Beta."
        >
          <input
            name="versionLabel"
            required
            placeholder="Version label"
            className="ink-field"
          />
        </FieldBlock>
        <FieldBlock
          label="Status"
          help="Draft is private, published is startable, archived is legacy."
        >
          <select name="status" defaultValue="draft" className="ink-select">
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </FieldBlock>
        <FieldBlock
          label="Default Published"
          help="When multiple published versions exist, this is the default for new starts."
        >
          <label className="ink-panel flex items-center gap-2 px-3 py-2 text-sm">
            <input type="checkbox" name="isDefaultPublished" className="ink-checkbox" />
            Set as default published
          </label>
        </FieldBlock>
        <FieldBlock
          label="Version Description"
          help="Describe what this cut includes and how it differs."
          className="md:col-span-2"
        >
          <textarea
            name="description"
            required
            placeholder="Version description"
            className="ink-textarea"
          />
        </FieldBlock>
        <button type="submit" className="ink-btn ink-btn-primary md:col-span-2">
          Create Version
        </button>
      </form>

      <GuideCallout title="Updating Existing Versions">
        <p>
          Change status and description as content evolves. Default published is
          scoped per world.
        </p>
      </GuideCallout>

      <div className="space-y-3">
        {data.storyVersions.map((version) => (
          <form
            key={version.id}
            action={updateVersionAction}
            className="ink-panel grid gap-3 p-3 md:grid-cols-2"
          >
            <input type="hidden" name="versionId" value={version.id} />
            <FieldBlock label="Version Label" help="Read-only label for this version.">
              <div className="ink-panel px-3 py-2 text-xs text-[var(--ink-text-muted)]">
                {version.versionLabel}
              </div>
            </FieldBlock>
            <FieldBlock label="Status" help="Controls availability for new Chronicles.">
              <select name="status" defaultValue={version.status} className="ink-select">
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </FieldBlock>
            <FieldBlock
              label="Default Published"
              help="Set as preferred published cut for this world."
              className="md:col-span-2"
            >
              <label className="ink-panel flex items-center gap-2 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="isDefaultPublished"
                  defaultChecked={version.isDefaultPublished}
                  className="ink-checkbox"
                />
                Default published for world
              </label>
            </FieldBlock>
            <FieldBlock
              label="Description"
              help="Update release notes and cut scope."
              className="md:col-span-2"
            >
              <textarea
                name="description"
                defaultValue={version.description}
                required
                className="ink-textarea"
              />
            </FieldBlock>
            <button type="submit" className="ink-btn ink-btn-secondary md:col-span-2">
              Save Version
            </button>
          </form>
        ))}
      </div>
    </StudioSection>
  );
}
