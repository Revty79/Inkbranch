import { cx } from "@/lib/utils";
import type { ReactNode } from "react";

type FieldBlockProps = {
  label: string;
  help: string;
  className?: string;
  children: ReactNode;
};

export function FieldBlock({ label, help, className, children }: FieldBlockProps) {
  return (
    <div className={cx("space-y-1.5", className)}>
      <p className="font-sans text-sm font-semibold text-[var(--ink-text)]">{label}</p>
      <p className="text-xs leading-relaxed text-[var(--ink-text-soft)]">{help}</p>
      {children}
    </div>
  );
}
