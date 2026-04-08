import { PublicHeader } from "@/components/layout/public-header";
import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-7 sm:px-6 sm:pt-8 lg:px-8">
        <div className="ink-shell px-4 py-5 sm:px-6 sm:py-7">{children}</div>
      </main>
    </div>
  );
}
