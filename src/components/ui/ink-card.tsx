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
        "ink-paper p-5 sm:p-6",
        className,
      )}
    >
      {eyebrow ? (
        <p className="ink-label">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="mt-2 font-sans text-xl font-semibold tracking-tight text-[var(--ink-text)]">
          {title}
        </h2>
      ) : null}
      <div
        className={cx(
          title ? "mt-3" : "mt-0",
          "space-y-2 text-[var(--ink-text-muted)] leading-relaxed",
        )}
      >
        {children}
      </div>
    </section>
  );
}
