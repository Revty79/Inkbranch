import { cx } from "@/lib/utils";
import type { ReactNode } from "react";

type InkCardProps = {
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  title?: string;
};

export function InkCard({ children, className, eyebrow, title }: InkCardProps) {
  return (
    <section
      className={cx(
        "rounded-2xl border border-[var(--ink-border)] bg-[var(--ink-surface)]/90 p-5 shadow-[0_8px_30px_rgba(74,46,15,0.08)] backdrop-blur",
        className,
      )}
    >
      {eyebrow ? (
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-accent)]">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="mt-2 text-balance font-sans text-xl font-semibold text-[var(--ink-text)]">
          {title}
        </h2>
      ) : null}
      <div className={cx(title ? "mt-3" : "mt-0", "text-[var(--ink-text-muted)]")}>
        {children}
      </div>
    </section>
  );
}
