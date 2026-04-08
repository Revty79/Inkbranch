import { listBootstrapUsers } from "@/features/auth/users";
import { getCurrentUser } from "@/lib/auth/server";
import Link from "next/link";
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
  const bootstrapUsers = await listBootstrapUsers();

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <header>
        <p className="ink-label">Account Access</p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Sign In To Inkbranch
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-text-muted)]">
          Use your account credentials to continue your Chronicles.
        </p>
      </header>

      <form action="/auth/sign-in" method="post" className="ink-paper space-y-4 p-5">
        <input type="hidden" name="next" value={nextValue} />
        <label className="block space-y-1.5">
          <span className="font-sans text-sm font-medium text-[var(--ink-text)]">
            Email
          </span>
          <input
            required
            name="email"
            type="email"
            className="ink-field"
            placeholder="you@example.com"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="font-sans text-sm font-medium text-[var(--ink-text)]">
            Password
          </span>
          <input
            required
            name="password"
            type="password"
            className="ink-field"
            placeholder="************"
          />
        </label>
        {hasError ? (
          <p className="ink-danger-note text-sm">
            Sign-in failed. Verify your email and password.
          </p>
        ) : null}
        <button type="submit" className="ink-btn ink-btn-primary w-full">
          Enter The App
        </button>
        <p className="text-center text-sm text-[var(--ink-text-muted)]">
          Need an account?{" "}
          <Link href="/register" className="font-semibold text-[var(--ink-accent)]">
            Register here
          </Link>
          .
        </p>
      </form>

      {bootstrapUsers.length ? (
        <section className="ink-panel p-4">
          <h2 className="font-sans text-sm font-semibold text-[var(--ink-text)]">
            Local Bootstrap Accounts
          </h2>
          <p className="mt-2 text-xs text-[var(--ink-text-soft)]">
            Development only: these accounts are auto-seeded in non-production environments.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--ink-text-muted)]">
            {bootstrapUsers.map((bootstrapUser) => (
              <li key={bootstrapUser.email}>
                <span className="font-semibold text-[var(--ink-text)]">
                  {bootstrapUser.role}
                </span>{" "}
                - {bootstrapUser.email} / {bootstrapUser.password}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

