import { FieldBlock } from "@/components/admin/field-block";
import { GuideCallout } from "@/components/admin/guide-callout";
import { StudioSection } from "@/components/admin/studio-section";
import { createWorldAction, updateWorldAction } from "@/features/admin/actions";
import { listAdminStoryData } from "@/features/story/repository";

export default async function AdminWorldsPage() {
  const data = await listAdminStoryData();

  return (
    <StudioSection
      step="1"
      title="Story Worlds"
      description="Create and edit world identity used throughout the reader library and Chronicle starts."
      next="Versions"
    >
      <GuideCallout title="What A World Does">
        <p>
          A world is your top-level story product. Readers browse and start from
          worlds first.
        </p>
        <p>
          A world slug is the stable URL identifier (for example
          `ashfall-lanterns`). Keep it lowercase with hyphens.
        </p>
      </GuideCallout>

      <form action={createWorldAction} className="grid gap-3 md:grid-cols-2">
        <FieldBlock
          label="World Slug"
          help="Permanent URL-safe identifier. Use lowercase words with hyphens."
        >
          <input name="slug" required placeholder="world-slug" className="ink-field" />
        </FieldBlock>
        <FieldBlock
          label="World Title"
          help="Reader-facing title shown in library and Chronicle pages."
        >
          <input name="title" required placeholder="World title" className="ink-field" />
        </FieldBlock>
        <FieldBlock
          label="Tone"
          help="Short style descriptor that sets reader expectation."
        >
          <input name="tone" required placeholder="Tone" className="ink-field" />
        </FieldBlock>
        <FieldBlock
          label="Featured World"
          help="Featured worlds can be prioritized in discovery surfaces."
        >
          <label className="ink-panel flex items-center gap-2 px-3 py-2 text-sm">
            <input type="checkbox" name="isFeatured" className="ink-checkbox" />
            Mark as featured
          </label>
        </FieldBlock>
        <FieldBlock
          label="Synopsis"
          help="Short pitch paragraph used on world cards and world detail."
          className="md:col-span-2"
        >
          <textarea
            name="synopsis"
            required
            placeholder="World synopsis"
            className="ink-textarea"
          />
        </FieldBlock>
        <button type="submit" className="ink-btn ink-btn-primary md:col-span-2">
          Create World
        </button>
      </form>

      <GuideCallout title="Editing Existing Worlds">
        <p>
          Slugs are intentionally stable and shown read-only here so old links
          and save flows do not break.
        </p>
      </GuideCallout>

      <div className="space-y-3">
        {data.storyWorlds.map((world) => (
          <form
            key={world.id}
            action={updateWorldAction}
            className="ink-panel grid gap-3 p-3 md:grid-cols-2"
          >
            <input type="hidden" name="worldId" value={world.id} />
            <FieldBlock
              label="World Title"
              help="Reader-facing title displayed in all story surfaces."
            >
              <input
                name="title"
                defaultValue={world.title}
                required
                className="ink-field"
              />
            </FieldBlock>
            <FieldBlock label="Tone" help="Current narrative tone label.">
              <input name="tone" defaultValue={world.tone} required className="ink-field" />
            </FieldBlock>
            <FieldBlock
              label="Featured"
              help="Controls whether this world is highlighted."
            >
              <label className="ink-panel flex items-center gap-2 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="isFeatured"
                  defaultChecked={world.isFeatured}
                  className="ink-checkbox"
                />
                Featured
              </label>
            </FieldBlock>
            <FieldBlock label="World Slug" help="Stable identifier (read-only).">
              <div className="ink-panel px-3 py-2 text-xs text-[var(--ink-text-muted)]">
                {world.slug}
              </div>
            </FieldBlock>
            <FieldBlock
              label="Synopsis"
              help="Update your world pitch and narrative premise."
              className="md:col-span-2"
            >
              <textarea
                name="synopsis"
                defaultValue={world.synopsis}
                required
                className="ink-textarea"
              />
            </FieldBlock>
            <button type="submit" className="ink-btn ink-btn-secondary md:col-span-2">
              Save World
            </button>
          </form>
        ))}
      </div>
    </StudioSection>
  );
}
