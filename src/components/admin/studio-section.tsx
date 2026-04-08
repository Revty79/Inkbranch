import type { ReactNode } from "react";

type StudioSectionProps = {
  step: string;
  title: string;
  description: string;
  before?: string;
  next?: string;
  children: ReactNode;
};

export function StudioSection({
  step,
  title,
  description,
  before,
  next,
  children,
}: StudioSectionProps) {
  return (
    <section className="ink-paper space-y-4 p-4 sm:p-5">
      <header className="space-y-2">
        <p className="ink-label">
          Step {step}
        </p>
        <h2 className="font-sans text-2xl font-semibold tracking-tight text-[var(--ink-text)]">
          {title}
        </h2>
        <p className="text-sm text-[var(--ink-text-muted)]">{description}</p>
        {before ? (
          <p className="text-xs text-[var(--ink-text-soft)]">
            Usually comes after: {before}
          </p>
        ) : null}
        {next ? (
          <p className="text-xs text-[var(--ink-text-soft)]">
            Usually leads to: {next}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
