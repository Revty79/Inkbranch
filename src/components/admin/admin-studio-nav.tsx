"use client";

import { cx } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const studioLinks = [
  { href: "/app/admin", label: "Overview" },
  { href: "/app/admin/tutorial", label: "Tutorial" },
  { href: "/app/admin/worlds", label: "Worlds" },
  { href: "/app/admin/versions", label: "Versions" },
  { href: "/app/admin/cast", label: "Cast + Viewpoints" },
  { href: "/app/admin/canon", label: "Canon" },
  { href: "/app/admin/scenes", label: "Scenes" },
  { href: "/app/admin/choices", label: "Choices" },
];

export function AdminStudioNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {studioLinks.map((link) => {
        const active =
          pathname === link.href || (link.href !== "/app/admin" && pathname.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cx(
              "rounded-xl border px-3 py-2 text-center font-sans text-sm font-medium transition",
              active
                ? "border-[var(--ink-accent)] bg-[var(--ink-accent)] text-[#fff8ef]"
                : "border-[var(--ink-border)] bg-[var(--ink-surface-strong)] text-[var(--ink-text-muted)] hover:bg-[var(--ink-surface-muted)] hover:text-[var(--ink-text)]",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
