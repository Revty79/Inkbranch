import { getCurrentUser } from "@/lib/auth/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

function errorMessage(error: string | undefined) {
  if (error === "password_mismatch") {
    return "Passwords do not match.";
  }
  if (error === "email_taken") {
    return "An account with this email already exists.";
  }
  if (error === "password_short") {
    return "Password must be at least 8 characters.";
  }
  if (error === "invalid_input") {
    return "Please check the form fields and try again.";
  }

  return null;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/app");
  }

  const params = await searchParams;
  const nextValue =
    typeof params.next === "string" && params.next.startsWith("/")
      ? params.next
      : "/app";
  const message = errorMessage(params.error);

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <header>
        <p className="ink-label">Account Access</p>
        <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[var(--ink-text)]">
          Create Your Inkbranch Account
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-text-muted)]">
          New accounts can begin Chronicles immediately. In a fresh database, the first
          registered account becomes admin for initial setup.
        </p>
      </header>

      <form action="/auth/register" method="post" className="ink-paper space-y-4 p-5">
        <input type="hidden" name="next" value={nextValue} />
        <label className="block space-y-1.5">
          <span className="font-sans text-sm font-medium text-[var(--ink-text)]">
            Name
          </span>
          <input required name="name" type="text" className="ink-field" placeholder="Your name" />
        </label>
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
            minLength={8}
            className="ink-field"
            placeholder="At least 8 characters"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="font-sans text-sm font-medium text-[var(--ink-text)]">
            Confirm Password
          </span>
          <input
            required
            name="confirmPassword"
            type="password"
            minLength={8}
            className="ink-field"
            placeholder="Repeat your password"
          />
        </label>
        {message ? <p className="ink-danger-note text-sm">{message}</p> : null}
        <button type="submit" className="ink-btn ink-btn-primary w-full">
          Create Account
        </button>
        <p className="text-center text-sm text-[var(--ink-text-muted)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-[var(--ink-accent)]">
            Sign in
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
