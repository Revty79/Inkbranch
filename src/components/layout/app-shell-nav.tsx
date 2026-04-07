"use client";

import { cx } from "@/lib/utils";
import type { UserRole } from "@/types/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AppShellNavProps = {
  userName: string;
  role: UserRole;
};

const appLinks: Array<{ href: string; label: string; adminOnly?: boolean }> = [
  { href: "/app", label: "Overview" },
  { href: "/app/library", label: "Library" },
  { href: "/app/chronicles", label: "Chronicles" },
  { href: "/app/admin", label: "Admin", adminOnly: true },
];

function isLinkActive(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function AppShellNav({ userName, role }: AppShellNavProps) {
  const pathname = usePathname();
  const canAccessAdmin = role === "admin";

  return (
    <header className="rounded-2xl border border-[var(--ink-border)] bg-[var(--ink-surface)]/95 p-3 shadow-[0_8px_24px_rgba(74,46,15,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-accent)]">
            Signed-in Shell
          </p>
          <p className="mt-1 text-sm text-[var(--ink-text-muted)]">
            {userName} · role: {role}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-[var(--ink-border)] px-3 py-1.5 font-sans text-sm font-medium text-[var(--ink-text-muted)] transition hover:bg-[var(--ink-surface-muted)] hover:text-[var(--ink-text)]"
          >
            Public Site
          </Link>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="rounded-full bg-[var(--ink-accent)] px-3 py-1.5 font-sans text-sm font-semibold text-[#fff8ef] transition hover:bg-[var(--ink-accent-soft)]"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
      <nav className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {appLinks.map((link) => {
          if (link.adminOnly && !canAccessAdmin) {
            return (
              <span
                key={link.href}
                className="rounded-full border border-dashed border-[var(--ink-border)] px-3 py-2 text-center font-sans text-sm font-medium text-[var(--ink-text-muted)]/70"
              >
                Admin (restricted)
              </span>
            );
          }

          const active = isLinkActive(pathname, link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cx(
                "rounded-full px-3 py-2 text-center font-sans text-sm font-medium transition",
                active
                  ? "bg-[var(--ink-accent)] text-[#fff8ef]"
                  : "border border-[var(--ink-border)] text-[var(--ink-text-muted)] hover:bg-[var(--ink-surface-muted)] hover:text-[var(--ink-text)]",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
