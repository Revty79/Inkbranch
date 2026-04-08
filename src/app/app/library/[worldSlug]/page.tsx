import { InkCard } from "@/components/ui/ink-card";
import { startChronicleAction } from "@/features/chronicles/actions";
import { loadStoryDetail } from "@/features/library";
import Link from "next/link";
import { notFound } from "next/navigation";

type StoryDetailPageProps = {
  params: Promise<{ worldSlug: string }>;
};

export default async function StoryDetailPage({ params }: StoryDetailPageProps) {
  const { worldSlug } = await params;
  const detail = await loadStoryDetail(worldSlug);
  if (!detail) {
    notFound();
  }

  const { world, version, viewpoints } = detail;

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="ink-label">Story Start</p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          {world.title}
        </h1>
        <p className="max-w-2xl text-[var(--ink-text-muted)]">{world.synopsis}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <InkCard eyebrow={world.tone} title={`Version: ${version.versionLabel}`}>
          <p className="text-sm leading-relaxed">{version.description}</p>
          <p className="ink-pill mt-3">Published story cut</p>
          <form action={startChronicleAction} className="mt-4">
            <input type="hidden" name="versionId" value={version.id} />
            <input type="hidden" name="worldSlug" value={world.slug} />
            <button type="submit" className="ink-btn ink-btn-primary w-full">
              Start Chronicle
            </button>
          </form>
        </InkCard>
        {viewpoints.map((viewpoint) => (
          <InkCard
            key={viewpoint.id}
            eyebrow={viewpoint.label}
            title={viewpoint.character.name}
          >
            <p className="text-sm leading-relaxed">{viewpoint.character.summary}</p>
            <p className="mt-2 text-sm text-[var(--ink-text-muted)]">
              {viewpoint.description}
            </p>
          </InkCard>
        ))}
      </div>

      <div className="ink-panel p-4 text-sm text-[var(--ink-text-muted)]">
        Returning reader? Resume from your Chronicle list.
        <Link
          href="/app/chronicles"
          className="ml-2 font-sans font-semibold text-[var(--ink-accent)] underline-offset-4 hover:underline"
        >
          Open Chronicles
        </Link>
      </div>
    </div>
  );
}
