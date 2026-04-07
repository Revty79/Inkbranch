import { getCurrentUser } from "@/lib/auth/server";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Library" },
];

export async function PublicHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--ink-border)]/70 bg-[color-mix(in_srgb,var(--ink-surface)_86%,white)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="font-sans text-lg font-semibold tracking-tight">
          Inkbranch
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-[var(--ink-border)] bg-[var(--ink-surface-muted)] p-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 font-sans text-sm font-medium text-[var(--ink-text-muted)] transition hover:bg-[var(--ink-surface)] hover:text-[var(--ink-text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <div className="flex items-center gap-2">
            <p className="hidden text-sm text-[var(--ink-text-muted)] sm:block">
              {user.name}
            </p>
            <Link
              href="/app"
              className="rounded-full border border-[var(--ink-border)] bg-[var(--ink-surface-muted)] px-4 py-2 font-sans text-sm font-semibold text-[var(--ink-text)] transition hover:bg-[var(--ink-surface)]"
            >
              Open App
            </Link>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="rounded-full bg-[var(--ink-accent)] px-4 py-2 font-sans text-sm font-semibold text-[#fff8ef] transition hover:bg-[var(--ink-accent-soft)]"
              >
                Sign Out
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/sign-in"
            className="rounded-full bg-[var(--ink-accent)] px-4 py-2 font-sans text-sm font-semibold text-[#fff8ef] transition hover:bg-[var(--ink-accent-soft)]"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
