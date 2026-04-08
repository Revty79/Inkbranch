import "server-only";

import { users } from "@/db/schema";
import { db } from "@/lib/db/server";
import type { UserPublicRecord } from "@/types/auth";
import { eq } from "drizzle-orm";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PASSWORD_HASH_KEYLEN = 64;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, PASSWORD_HASH_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const derivedHash = scryptSync(password, salt, PASSWORD_HASH_KEYLEN).toString("hex");
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(derivedHash, "hex");
  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

function toPublicUser(row: typeof users.$inferSelect): UserPublicRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}

export async function listBootstrapUsers() {
  return [] as Array<{ email: string; role: string; password: string }>;
}

export async function findUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ? toPublicUser(user) : null;
}

export async function authenticateUser(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return toPublicUser(user);
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (name.length < 2) {
    throw new Error("Name must be at least 2 characters.");
  }

  if (!email.includes("@") || email.length < 5) {
    throw new Error("Please provide a valid email address.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    throw new Error("Email already in use.");
  }

  const [inserted] = await db
    .insert(users)
    .values({
      email,
      name,
      role: "reader",
      passwordHash: hashPassword(password),
    })
    .returning();

  return toPublicUser(inserted);
}
