import { InkCard } from "@/components/ui/ink-card";
import { listAdminStoryData } from "@/features/story/repository";
import Link from "next/link";

const workflow = [
  {
    step: "1",
    title: "Worlds",
    description: "Set story identity, synopsis, and tone.",
    href: "/app/admin/worlds",
  },
  {
    step: "2",
    title: "Versions",
    description: "Create publishable cuts and control publish state.",
    href: "/app/admin/versions",
  },
  {
    step: "3",
    title: "Cast + Viewpoints",
    description: "Define characters and who can be played.",
    href: "/app/admin/cast",
  },
  {
    step: "4",
    title: "Canon",
    description: "Capture truths and contradiction-sensitive rules.",
    href: "/app/admin/canon",
  },
  {
    step: "5",
    title: "Scenes",
    description: "Author scene-level narrative units and guided-action rails.",
    href: "/app/admin/scenes",
  },
  {
    step: "6",
    title: "Choices",
    description: "Wire decisions, gating, consequence scope, and intent tags.",
    href: "/app/admin/choices",
  },
];

export default async function AdminStudioOverviewPage() {
  const data = await listAdminStoryData();

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InkCard eyebrow="Current Data" title="Worlds">
          <p className="text-sm">{data.storyWorlds.length} story worlds</p>
        </InkCard>
        <InkCard eyebrow="Current Data" title="Versions">
          <p className="text-sm">{data.storyVersions.length} story versions</p>
        </InkCard>
        <InkCard eyebrow="Current Data" title="Scenes + Choices">
          <p className="text-sm">
            {data.storyBeats.length} scenes, {data.beatChoices.length} choices
          </p>
        </InkCard>
      </section>

      <div className="ink-panel flex flex-wrap items-center justify-between gap-3 p-3">
        <p className="text-sm text-[var(--ink-text-muted)]">
          Need concept definitions for fields like world slug, consequence scope,
          or intent tags?
        </p>
        <Link href="/app/admin/tutorial" className="ink-btn ink-btn-secondary">
          Open Creator Tutorial
        </Link>
      </div>

      <section className="space-y-3">
        <p className="ink-label">Recommended Build Sequence</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workflow.map((item) => (
            <div key={item.href} className="ink-panel p-3">
              <p className="ink-label">Step {item.step}</p>
              <h2 className="mt-1 font-sans text-lg font-semibold text-[var(--ink-text)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-text-muted)]">
                {item.description}
              </p>
              <Link href={item.href} className="ink-btn ink-btn-secondary mt-3">
                Open {item.title}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
