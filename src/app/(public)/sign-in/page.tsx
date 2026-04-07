import { listDemoUsers } from "@/features/auth/users";
import { getCurrentUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/app");
  }

  const params = await searchParams;
  const nextValue =
    typeof params.next === "string" && params.next.startsWith("/")
      ? params.next
      : "/app";

  const hasError = params.error === "invalid_credentials";

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <header>
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-accent)]">
          Account Access
        </p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Sign In To Inkbranch
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-text-muted)]">
          Use one of the internal demo identities for Phase 01 development.
        </p>
      </header>

      <form
        action="/auth/sign-in"
        method="post"
        className="space-y-4 rounded-2xl border border-[var(--ink-border)] bg-[var(--ink-surface)] p-5 shadow-[0_12px_30px_rgba(74,46,15,0.08)]"
      >
        <input type="hidden" name="next" value={nextValue} />
        <label className="block space-y-1">
          <span className="font-sans text-sm font-medium text-[var(--ink-text)]">
            Email
          </span>
          <input
            required
            name="email"
            type="email"
            className="w-full rounded-xl border border-[var(--ink-border)] bg-white px-3 py-2 text-sm outline-none ring-[var(--ink-accent)] transition focus:ring-2"
            placeholder="reader@inkbranch.local"
          />
        </label>
        <label className="block space-y-1">
          <span className="font-sans text-sm font-medium text-[var(--ink-text)]">
            Password
          </span>
          <input
            required
            name="password"
            type="password"
            className="w-full rounded-xl border border-[var(--ink-border)] bg-white px-3 py-2 text-sm outline-none ring-[var(--ink-accent)] transition focus:ring-2"
            placeholder="••••••••••••"
          />
        </label>
        {hasError ? (
          <p className="rounded-xl border border-[#b8482b]/25 bg-[#f8d9d0] px-3 py-2 text-sm text-[#7c1f0f]">
            Sign-in failed. Verify your email and password.
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-full bg-[var(--ink-accent)] px-4 py-2.5 font-sans text-sm font-semibold text-[#fff8ef] transition hover:bg-[var(--ink-accent-soft)]"
        >
          Enter The App
        </button>
      </form>

      <section className="rounded-2xl border border-dashed border-[var(--ink-border)] bg-[var(--ink-surface)]/70 p-4">
        <h2 className="font-sans text-sm font-semibold text-[var(--ink-text)]">
          Demo Accounts
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--ink-text-muted)]">
          {listDemoUsers().map((demoUser) => (
            <li key={demoUser.id}>
              <span className="font-semibold text-[var(--ink-text)]">
                {demoUser.role}
              </span>{" "}
              - {demoUser.email} / {demoUser.password}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
