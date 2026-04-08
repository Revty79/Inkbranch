import { InkCard } from "@/components/ui/ink-card";
import { loadChronicleSummaries } from "@/features/chronicles";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import Link from "next/link";

export default async function AppHomePage() {
  const user = await requireAuthenticatedUser();
  const chronicles = await loadChronicleSummaries(user.id);
  const activeCount = chronicles.filter(
    (entry) => entry.chronicle.status !== "completed",
  ).length;

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="ink-label">Signed-in Reader Area</p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Chronicle Overview
        </h1>
        <p className="max-w-2xl text-[var(--ink-text-muted)]">
          Signed in as {user.email}. Continue your campaign journal, revisit
          finished perspectives, or begin a new Chronicle from the library.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <InkCard eyebrow="Reader" title="Story Library">
          <p className="text-sm leading-relaxed">
            Browse published worlds and start a new Chronicle from a selected
            story version.
          </p>
          <Link href="/app/library" className="ink-btn ink-btn-secondary mt-4">
            Open Library
          </Link>
        </InkCard>
        <InkCard eyebrow="Continuity" title="Chronicle Progress">
          <p className="text-sm leading-relaxed">
            You currently have {chronicles.length} Chronicle
            {chronicles.length === 1 ? "" : "s"}, with {activeCount} still in
            progress.
          </p>
          <Link href="/app/chronicles" className="ink-btn ink-btn-secondary mt-4">
            View Chronicles
          </Link>
        </InkCard>
        <InkCard eyebrow="Identity" title="Current Shelf">
          <p className="text-sm leading-relaxed">
            Your role is <span className="font-semibold">{user.role}</span>.
            Admin tools stay internal, while reader routes keep story flow
            front-and-center.
          </p>
          <p className="ink-pill mt-4">{chronicles.length} saved chronicles</p>
        </InkCard>
      </div>
    </div>
  );
}
