import "server-only";

import { findUserById } from "@/features/auth/users";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import type { UserRole } from "@/types/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  const user = findUserById(session.userId);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireAuthenticatedUser();
  if (user.role !== role) {
    redirect("/app");
  }

  return user;
}
