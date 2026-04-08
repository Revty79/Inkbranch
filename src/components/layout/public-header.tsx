import { getCurrentUser } from "@/lib/auth/server";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Library" },
];

export async function PublicHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--ink-border)]/75 bg-[color-mix(in_srgb,var(--ink-surface)_72%,white)]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group">
          <span className="ink-label block text-[0.62rem] tracking-[0.28em]">
            Inkbranch
          </span>
          <span className="mt-1 block font-sans text-lg font-semibold tracking-tight text-[var(--ink-text)] transition group-hover:text-[var(--ink-accent)]">
            Shared Chronicle Fiction
          </span>
        </Link>
        <nav className="hidden items-center gap-1 rounded-full border border-[var(--ink-border)] bg-[var(--ink-surface-muted)]/85 p-1 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 font-sans text-sm font-medium text-[var(--ink-text-muted)] transition hover:bg-[var(--ink-surface-strong)] hover:text-[var(--ink-text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <nav className="flex items-center gap-1 rounded-full border border-[var(--ink-border)] bg-[var(--ink-surface-muted)]/85 p-1 sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-2.5 py-1.5 font-sans text-xs font-medium uppercase tracking-[0.1em] text-[var(--ink-text-muted)] transition hover:bg-[var(--ink-surface-strong)] hover:text-[var(--ink-text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <div className="flex items-center gap-2">
            <p className="hidden text-sm text-[var(--ink-text-muted)] lg:block">
              {user.name}
            </p>
            <Link href="/app" className="ink-btn ink-btn-secondary">
              Open App
            </Link>
            <form action="/auth/sign-out" method="post">
              <button type="submit" className="ink-btn ink-btn-primary">
                Sign Out
              </button>
            </form>
          </div>
        ) : (
          <Link href="/sign-in" className="ink-btn ink-btn-primary">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
