import { AdminStudioNav } from "@/components/admin/admin-studio-nav";
import { requireRole } from "@/lib/auth/server";
import Link from "next/link";
import type { ReactNode } from "react";

export default async function AdminStudioLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("admin");

  return (
    <div className="space-y-5 pb-10">
      <header className="space-y-2">
        <p className="ink-label">Internal Creator Studio</p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Story Authoring Workflow
        </h1>
        <p className="max-w-3xl text-[var(--ink-text-muted)]">
          Build in order: world, version, cast, canon, scenes, and choices.
          Each section explains what it controls and what to do next.
        </p>
        <Link href="/app/admin/tutorial" className="ink-btn ink-btn-secondary">
          Open Full Tutorial
        </Link>
      </header>
      <AdminStudioNav />
      {children}
    </div>
  );
}
