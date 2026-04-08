import "server-only";

import * as schema from "@/db/schema";
import { env } from "@/lib/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

type GlobalDbCache = {
  inkbranchPool?: Pool;
  inkbranchDb?: ReturnType<typeof drizzle<typeof schema>>;
};

const globalDb = globalThis as unknown as GlobalDbCache;

function createPool() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required for Postgres-backed Inkbranch runtime.");
  }

  return new Pool({
    connectionString: env.databaseUrl,
    max: 10,
  });
}

export const pool = globalDb.inkbranchPool ?? createPool();
export const db = globalDb.inkbranchDb ?? drizzle(pool, { schema });

if (env.nodeEnv !== "production") {
  globalDb.inkbranchPool = pool;
  globalDb.inkbranchDb = db;
}

