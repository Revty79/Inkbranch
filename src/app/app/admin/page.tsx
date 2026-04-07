import {
  createBeatAction,
  createCanonEntryAction,
  createCharacterAction,
  createChoiceAction,
  createVersionAction,
  createViewpointAction,
  createWorldAction,
  updateBeatAction,
  updateChoiceAction,
  updateVersionAction,
  updateWorldAction,
} from "@/features/admin/actions";
import { listAdminStoryData } from "@/features/story/repository";
import { requireRole } from "@/lib/auth/server";
import type { ReactNode } from "react";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-[var(--ink-border)] bg-[var(--ink-surface)] p-4 sm:p-5">
      <header>
        <h2 className="font-sans text-xl font-semibold text-[var(--ink-text)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--ink-text-muted)]">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

export default async function AdminPage() {
  await requireRole("admin");
  const data = await listAdminStoryData();

  return (
    <div className="space-y-5 pb-12">
      <header className="space-y-2">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-accent)]">
          Internal Admin Tools
        </p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Story Seed Management
        </h1>
        <p className="max-w-3xl text-[var(--ink-text-muted)]">
          Internal-only tooling for worlds, versions, viewpoints, canon, beats,
          and choices. Published versions feed the reader library directly.
        </p>
      </header>

      <Section
        title="Story Worlds"
        subtitle="Create and edit core world metadata used by library cards."
      >
        <form
          action={createWorldAction}
          className="grid gap-2 rounded-xl border border-dashed border-[var(--ink-border)] p-3 md:grid-cols-2"
        >
          <input
            name="slug"
            required
            placeholder="world-slug"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="title"
            required
            placeholder="World title"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="tone"
            required
            placeholder="Tone"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm">
            <input type="checkbox" name="isFeatured" />
            Featured
          </label>
          <textarea
            name="synopsis"
            required
            placeholder="World synopsis"
            className="md:col-span-2 min-h-20 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="md:col-span-2 rounded-full bg-[var(--ink-accent)] px-4 py-2 font-sans text-sm font-semibold text-[#fff8ef]"
          >
            Create World
          </button>
        </form>

        <div className="space-y-2">
          {data.storyWorlds.map((world) => (
            <form
              key={world.id}
              action={updateWorldAction}
              className="grid gap-2 rounded-xl border border-[var(--ink-border)] p-3 md:grid-cols-2"
            >
              <input type="hidden" name="worldId" value={world.id} />
              <input
                name="title"
                defaultValue={world.title}
                required
                className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
              />
              <input
                name="tone"
                defaultValue={world.tone}
                required
                className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="isFeatured"
                  defaultChecked={world.isFeatured}
                />
                Featured
              </label>
              <div className="rounded-lg border border-dashed border-[var(--ink-border)] px-3 py-2 text-xs text-[var(--ink-text-muted)]">
                slug: {world.slug}
              </div>
              <textarea
                name="synopsis"
                defaultValue={world.synopsis}
                required
                className="md:col-span-2 min-h-16 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="md:col-span-2 rounded-full border border-[var(--ink-border)] px-4 py-2 font-sans text-sm font-semibold text-[var(--ink-accent)]"
              >
                Save World
              </button>
            </form>
          ))}
        </div>
      </Section>

      <Section
        title="Story Versions"
        subtitle="Create draft or published versions and control default published state."
      >
        <form
          action={createVersionAction}
          className="grid gap-2 rounded-xl border border-dashed border-[var(--ink-border)] p-3 md:grid-cols-2"
        >
          <select
            name="worldId"
            required
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="">Select world</option>
            {data.storyWorlds.map((world) => (
              <option key={world.id} value={world.id}>
                {world.title}
              </option>
            ))}
          </select>
          <input
            name="versionLabel"
            required
            placeholder="Version label"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue="draft"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm">
            <input type="checkbox" name="isDefaultPublished" />
            Default published for world
          </label>
          <textarea
            name="description"
            required
            placeholder="Version description"
            className="md:col-span-2 min-h-16 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="md:col-span-2 rounded-full bg-[var(--ink-accent)] px-4 py-2 font-sans text-sm font-semibold text-[#fff8ef]"
          >
            Create Version
          </button>
        </form>

        <div className="space-y-2">
          {data.storyVersions.map((version) => (
            <form
              key={version.id}
              action={updateVersionAction}
              className="grid gap-2 rounded-xl border border-[var(--ink-border)] p-3 md:grid-cols-2"
            >
              <input type="hidden" name="versionId" value={version.id} />
              <div className="rounded-lg border border-dashed border-[var(--ink-border)] px-3 py-2 text-xs text-[var(--ink-text-muted)]">
                {version.versionLabel}
              </div>
              <select
                name="status"
                defaultValue={version.status}
                className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
              <label className="md:col-span-2 flex items-center gap-2 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="isDefaultPublished"
                  defaultChecked={version.isDefaultPublished}
                />
                Default published for world
              </label>
              <textarea
                name="description"
                defaultValue={version.description}
                required
                className="md:col-span-2 min-h-16 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="md:col-span-2 rounded-full border border-[var(--ink-border)] px-4 py-2 font-sans text-sm font-semibold text-[var(--ink-accent)]"
              >
                Save Version
              </button>
            </form>
          ))}
        </div>
      </Section>

      <Section
        title="Characters And Viewpoints"
        subtitle="Define character records and map playable viewpoints to versions."
      >
        <form
          action={createCharacterAction}
          className="grid gap-2 rounded-xl border border-dashed border-[var(--ink-border)] p-3 md:grid-cols-2"
        >
          <select
            name="worldId"
            required
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="">Select world</option>
            {data.storyWorlds.map((world) => (
              <option key={world.id} value={world.id}>
                {world.title}
              </option>
            ))}
          </select>
          <input
            name="slug"
            required
            placeholder="character-slug"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="name"
            required
            placeholder="Character name"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <textarea
            name="summary"
            required
            placeholder="Character summary"
            className="min-h-16 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="submit"
            className="md:col-span-2 rounded-full bg-[var(--ink-accent)] px-4 py-2 font-sans text-sm font-semibold text-[#fff8ef]"
          >
            Create Character
          </button>
        </form>

        <form
          action={createViewpointAction}
          className="grid gap-2 rounded-xl border border-dashed border-[var(--ink-border)] p-3 md:grid-cols-2"
        >
          <select
            name="versionId"
            required
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="">Select version</option>
            {data.storyVersions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.versionLabel} ({version.status})
              </option>
            ))}
          </select>
          <select
            name="characterId"
            required
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="">Select character</option>
            {data.storyCharacters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
          <input
            name="label"
            required
            placeholder="Viewpoint label"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="orderIndex"
            defaultValue={100}
            placeholder="Order index"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="startBeatId"
            placeholder="Optional start beat id"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            name="description"
            required
            placeholder="Viewpoint description"
            className="md:col-span-2 min-h-16 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="md:col-span-2 rounded-full bg-[var(--ink-accent)] px-4 py-2 font-sans text-sm font-semibold text-[#fff8ef]"
          >
            Create Viewpoint
          </button>
        </form>
      </Section>

      <Section
        title="Canon Entries"
        subtitle="Capture world truths and contradiction-sensitive rules."
      >
        <form
          action={createCanonEntryAction}
          className="grid gap-2 rounded-xl border border-dashed border-[var(--ink-border)] p-3 md:grid-cols-2"
        >
          <select
            name="versionId"
            required
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="">Select version</option>
            {data.storyVersions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.versionLabel}
              </option>
            ))}
          </select>
          <select
            name="entryType"
            defaultValue="world_truth"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="world_truth">world_truth</option>
            <option value="character_truth">character_truth</option>
            <option value="item_truth">item_truth</option>
            <option value="place_truth">place_truth</option>
            <option value="rule">rule</option>
          </select>
          <input
            name="canonKey"
            required
            placeholder="canon_key"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="title"
            required
            placeholder="Canon title"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <textarea
            name="body"
            required
            placeholder="Canon body"
            className="md:col-span-2 min-h-20 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="md:col-span-2 rounded-full bg-[var(--ink-accent)] px-4 py-2 font-sans text-sm font-semibold text-[#fff8ef]"
          >
            Create Canon Entry
          </button>
        </form>
      </Section>

      <Section
        title="Beats"
        subtitle="Create and edit structural beats used by the reader run."
      >
        <form
          action={createBeatAction}
          className="grid gap-2 rounded-xl border border-dashed border-[var(--ink-border)] p-3 md:grid-cols-2"
        >
          <select
            name="versionId"
            required
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="">Select version</option>
            {data.storyVersions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.versionLabel}
              </option>
            ))}
          </select>
          <input
            name="slug"
            required
            placeholder="beat-slug"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="title"
            required
            placeholder="Beat title"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <select
            name="beatType"
            defaultValue="perspective"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="world">world</option>
            <option value="perspective">perspective</option>
            <option value="interlock">interlock</option>
          </select>
          <input
            name="orderIndex"
            defaultValue={100}
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm">
            <input type="checkbox" name="isTerminal" />
            Terminal beat
          </label>
          <textarea
            name="summary"
            required
            placeholder="Beat summary"
            className="md:col-span-2 min-h-16 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <textarea
            name="narration"
            required
            placeholder="Beat narration text"
            className="md:col-span-2 min-h-24 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="md:col-span-2 rounded-full bg-[var(--ink-accent)] px-4 py-2 font-sans text-sm font-semibold text-[#fff8ef]"
          >
            Create Beat
          </button>
        </form>

        <div className="space-y-2">
          {data.storyBeats.map((beat) => (
            <form
              key={beat.id}
              action={updateBeatAction}
              className="grid gap-2 rounded-xl border border-[var(--ink-border)] p-3 md:grid-cols-2"
            >
              <input type="hidden" name="beatId" value={beat.id} />
              <input
                name="title"
                defaultValue={beat.title}
                required
                className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
              />
              <input
                name="orderIndex"
                defaultValue={beat.orderIndex}
                className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm">
                <input type="checkbox" name="isTerminal" defaultChecked={beat.isTerminal} />
                Terminal
              </label>
              <div className="rounded-lg border border-dashed border-[var(--ink-border)] px-3 py-2 text-xs text-[var(--ink-text-muted)]">
                slug: {beat.slug}
              </div>
              <textarea
                name="summary"
                defaultValue={beat.summary}
                required
                className="md:col-span-2 min-h-16 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
              />
              <textarea
                name="narration"
                defaultValue={beat.narration}
                required
                className="md:col-span-2 min-h-24 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="md:col-span-2 rounded-full border border-[var(--ink-border)] px-4 py-2 font-sans text-sm font-semibold text-[var(--ink-accent)]"
              >
                Save Beat
              </button>
            </form>
          ))}
        </div>
      </Section>

      <Section
        title="Choices"
        subtitle="Create and edit beat-linked choices with next-beat and consequence scaffolding."
      >
        <form
          action={createChoiceAction}
          className="grid gap-2 rounded-xl border border-dashed border-[var(--ink-border)] p-3 md:grid-cols-2"
        >
          <select
            name="beatId"
            required
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="">Source beat</option>
            {data.storyBeats.map((beat) => (
              <option key={beat.id} value={beat.id}>
                {beat.title}
              </option>
            ))}
          </select>
          <select
            name="nextBeatId"
            required
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="">Next beat</option>
            {data.storyBeats.map((beat) => (
              <option key={beat.id} value={beat.id}>
                {beat.title}
              </option>
            ))}
          </select>
          <input
            name="label"
            required
            placeholder="Choice label"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="orderIndex"
            defaultValue={100}
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            placeholder="Choice description"
            className="md:col-span-2 min-h-16 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <select
            name="consequenceScope"
            defaultValue="perspective"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="global">global</option>
            <option value="perspective">perspective</option>
            <option value="knowledge">knowledge</option>
          </select>
          <input
            name="consequenceKey"
            placeholder="consequence key"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="consequenceValue"
            placeholder='consequence value (e.g. true or "known")'
            className="md:col-span-2 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="gateScope"
            placeholder="optional gate scope"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="gateKey"
            placeholder="optional gate key"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="gateEquals"
            placeholder="gate equals"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="gateNotEquals"
            placeholder="gate not equals"
            className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="md:col-span-2 rounded-full bg-[var(--ink-accent)] px-4 py-2 font-sans text-sm font-semibold text-[#fff8ef]"
          >
            Create Choice
          </button>
        </form>

        <div className="space-y-2">
          {data.beatChoices.map((choice) => (
            <form
              key={choice.id}
              action={updateChoiceAction}
              className="grid gap-2 rounded-xl border border-[var(--ink-border)] p-3 md:grid-cols-2"
            >
              <input type="hidden" name="choiceId" value={choice.id} />
              <input
                name="label"
                defaultValue={choice.label}
                required
                className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
              />
              <input
                name="orderIndex"
                defaultValue={choice.orderIndex}
                className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
              />
              <select
                name="nextBeatId"
                defaultValue={choice.nextBeatId ?? ""}
                className="rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm md:col-span-2"
              >
                {data.storyBeats.map((beat) => (
                  <option key={beat.id} value={beat.id}>
                    {beat.title}
                  </option>
                ))}
              </select>
              <textarea
                name="description"
                defaultValue={choice.description ?? ""}
                className="md:col-span-2 min-h-14 rounded-lg border border-[var(--ink-border)] bg-white px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="md:col-span-2 rounded-full border border-[var(--ink-border)] px-4 py-2 font-sans text-sm font-semibold text-[var(--ink-accent)]"
              >
                Save Choice
              </button>
            </form>
          ))}
        </div>
      </Section>
    </div>
  );
}
