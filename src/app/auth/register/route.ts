import { registerUser } from "@/features/auth/users";
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
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const nextCandidate = String(formData.get("next") ?? "");

  if (password !== confirmPassword) {
    const redirectUrl = new URL("/register?error=password_mismatch", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  let user;
  try {
    user = await registerUser({ name, email, password });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    const errorCode =
      message === "Email already in use."
        ? "email_taken"
        : message === "Password must be at least 8 characters."
          ? "password_short"
          : "invalid_input";
    const redirectUrl = new URL(`/register?error=${errorCode}`, request.url);
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

