import { FieldBlock } from "@/components/admin/field-block";
import { GuideCallout } from "@/components/admin/guide-callout";
import { StudioSection } from "@/components/admin/studio-section";
import { createCharacterAction, createViewpointAction } from "@/features/admin/actions";
import { listAdminStoryData } from "@/features/story/repository";

export default async function AdminCastPage() {
  const data = await listAdminStoryData();

  return (
    <StudioSection
      step="3"
      title="Characters And Viewpoints"
      description="Characters are story entities. Viewpoints decide which characters are playable in a specific story version."
      before="Versions"
      next="Canon"
    >
      <GuideCallout title="Character vs Viewpoint">
        <p>
          Character is the narrative person. Viewpoint is the playable lens for
          that character in one specific version.
        </p>
        <p>
          The same character can appear in many scenes, but viewpoint settings
          define route start and player-facing role label.
        </p>
      </GuideCallout>

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={createCharacterAction} className="ink-panel grid gap-3 p-3">
          <p className="ink-label">Create Character</p>
          <FieldBlock
            label="World"
            help="Character belongs to one world and can only be used with versions from that world."
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
            label="Character Slug"
            help="Stable identifier in this world. Use lowercase words and hyphens."
          >
            <input
              name="slug"
              required
              placeholder="character-slug"
              className="ink-field"
            />
          </FieldBlock>
          <FieldBlock
            label="Character Name"
            help="Reader-facing character name."
          >
            <input
              name="name"
              required
              placeholder="Character name"
              className="ink-field"
            />
          </FieldBlock>
          <FieldBlock
            label="Character Summary"
            help="Short profile used in viewpoint selection and context."
          >
            <textarea
              name="summary"
              required
              placeholder="Character summary"
              className="ink-textarea"
            />
          </FieldBlock>
          <button type="submit" className="ink-btn ink-btn-primary">
            Create Character
          </button>
        </form>

        <form action={createViewpointAction} className="ink-panel grid gap-3 p-3">
          <p className="ink-label">Create Viewpoint</p>
          <FieldBlock
            label="Version"
            help="Viewpoint is tied to one version and only available there."
          >
            <select name="versionId" required className="ink-select">
              <option value="">Select version</option>
              {data.storyVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.versionLabel} ({version.status})
                </option>
              ))}
            </select>
          </FieldBlock>
          <FieldBlock
            label="Character"
            help="Playable character for this viewpoint."
          >
            <select name="characterId" required className="ink-select">
              <option value="">Select character</option>
              {data.storyCharacters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </FieldBlock>
          <FieldBlock
            label="Viewpoint Label"
            help="Short route label shown to readers (for example Night Courier)."
          >
            <input
              name="label"
              required
              placeholder="Viewpoint label"
              className="ink-field"
            />
          </FieldBlock>
          <FieldBlock
            label="Order Index"
            help="Smaller numbers appear first in selection lists."
          >
            <input name="orderIndex" defaultValue={100} className="ink-field" />
          </FieldBlock>
          <FieldBlock
            label="Start Scene ID (optional)"
            help="If blank, route starts at the first scene by order."
          >
            <input
              name="startBeatId"
              placeholder="Optional start scene id"
              className="ink-field"
            />
          </FieldBlock>
          <FieldBlock
            label="Viewpoint Description"
            help="Reader-facing route description shown in perspective selection."
          >
            <textarea
              name="description"
              required
              placeholder="Viewpoint description"
              className="ink-textarea"
            />
          </FieldBlock>
          <button type="submit" className="ink-btn ink-btn-primary">
            Create Viewpoint
          </button>
        </form>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="ink-panel p-3">
          <p className="ink-label">Character List</p>
          <ul className="mt-2 space-y-2 text-sm">
            {data.storyCharacters.map((character) => (
              <li key={character.id} className="ink-panel p-2.5">
                <p className="font-semibold text-[var(--ink-text)]">{character.name}</p>
                <p className="mt-1 text-xs text-[var(--ink-text-muted)]">
                  {character.summary}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="ink-panel p-3">
          <p className="ink-label">Viewpoint List</p>
          <ul className="mt-2 space-y-2 text-sm">
            {data.playableViewpoints.map((viewpoint) => (
              <li key={viewpoint.id} className="ink-panel p-2.5">
                <p className="font-semibold text-[var(--ink-text)]">{viewpoint.label}</p>
                <p className="mt-1 text-xs text-[var(--ink-text-muted)]">
                  {viewpoint.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </StudioSection>
  );
}
