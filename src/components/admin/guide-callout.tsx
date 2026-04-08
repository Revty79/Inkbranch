import { cx } from "@/lib/utils";
import type { ReactNode } from "react";

type GuideCalloutProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function GuideCallout({ title, children, className }: GuideCalloutProps) {
  return (
    <aside className={cx("ink-panel p-3 sm:p-4", className)}>
      <p className="ink-label">{title}</p>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--ink-text-muted)]">
        {children}
      </div>
    </aside>
  );
}
