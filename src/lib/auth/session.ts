import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/auth/constants";
import type { SessionPayload } from "@/types/auth";
import { createHmac, timingSafeEqual } from "node:crypto";

type SessionInput = Omit<SessionPayload, "exp">;

function getSessionSecret() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "inkbranch-dev-secret";
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(paddingLength);
  return Buffer.from(padded, "base64").toString("utf8");
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(input: SessionInput) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload: SessionPayload = { ...input, exp };
  const payloadSegment = base64UrlEncode(JSON.stringify(payload));
  const signature = signValue(payloadSegment);

  return `${payloadSegment}.${signature}`;
}

export function verifySessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [payloadSegment, signature] = token.split(".");
  if (!payloadSegment || !signature) {
    return null;
  }

  const expectedSignature = signValue(payloadSegment);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadSegment)) as SessionPayload;
    if (!payload.userId || !payload.role || !payload.exp) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS };
