import { AppShellNav } from "@/components/layout/app-shell-nav";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import type { ReactNode } from "react";

export default async function SignedInLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAuthenticatedUser();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <AppShellNav userName={user.name} role={user.role} />
      <main>{children}</main>
    </div>
  );
}
