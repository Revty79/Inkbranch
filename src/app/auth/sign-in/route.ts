import { authenticateDemoUser } from "@/features/auth/users";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  getSessionCookieOptions,
} from "@/lib/auth/session";
import { NextResponse } from "next/server";

function getSafeRedirectTarget(candidate: string | null) {
  if (!candidate) {
    return "/app";
  }

  return candidate.startsWith("/") ? candidate : "/app";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextCandidate = String(formData.get("next") ?? "");

  const user = authenticateDemoUser(email, password);
  if (!user) {
    const redirectUrl = new URL("/sign-in?error=invalid_credentials", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const token = createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  const target = getSafeRedirectTarget(nextCandidate);
  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

  return response;
}
