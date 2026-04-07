const serverEnv = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  authSecret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "",
  authUrl: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
};

const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

export const env = {
  ...serverEnv,
  ...publicEnv,
};

export function getMissingRequiredEnv() {
  const missing: string[] = [];

  if (!serverEnv.databaseUrl) missing.push("DATABASE_URL");
  if (!serverEnv.authSecret) missing.push("AUTH_SECRET (or NEXTAUTH_SECRET)");
  if (!serverEnv.authUrl) missing.push("AUTH_URL (or NEXTAUTH_URL)");

  return missing;
}
