type InkbranchAiMode = "seeded" | "ollama";
type InkbranchStorageMode = "postgres" | "local_json";
type InkbranchRuntimeProfile = "quality" | "speed";
type InkbranchProjectionSyncMode = "eager" | "runtime_only";
type InkbranchBranchGenerationMode = "ai" | "seeded_fast";

function readAiMode(): InkbranchAiMode {
  const mode = (process.env.INKBRANCH_AI_MODE ?? "seeded").trim().toLowerCase();
  return mode === "ollama" ? "ollama" : "seeded";
}

function readOllamaTimeoutMs() {
  const raw = Number.parseInt(process.env.OLLAMA_TIMEOUT_MS ?? "180000", 10);
  if (!Number.isFinite(raw) || raw <= 0) {
    return 180000;
  }
  return raw;
}

function readStorageMode(): InkbranchStorageMode {
  const mode = (process.env.INKBRANCH_STORAGE_MODE ?? "postgres").trim().toLowerCase();
  return mode === "local_json" ? "local_json" : "postgres";
}

function readRuntimeProfile(): InkbranchRuntimeProfile {
  const profile = (process.env.INKBRANCH_RUNTIME_PROFILE ?? "quality").trim().toLowerCase();
  return profile === "speed" ? "speed" : "quality";
}

function readProjectionSyncMode(
  runtimeProfile: InkbranchRuntimeProfile,
): InkbranchProjectionSyncMode {
  const configured = (process.env.INKBRANCH_PROJECTION_SYNC_MODE ?? "")
    .trim()
    .toLowerCase();
  if (configured === "runtime_only") {
    return "runtime_only";
  }
  if (configured === "eager") {
    return "eager";
  }

  return runtimeProfile === "speed" ? "runtime_only" : "eager";
}

function readBranchGenerationMode(
  runtimeProfile: InkbranchRuntimeProfile,
): InkbranchBranchGenerationMode {
  const configured = (process.env.INKBRANCH_BRANCH_GENERATION_MODE ?? "")
    .trim()
    .toLowerCase();
  if (configured === "seeded_fast") {
    return "seeded_fast";
  }
  if (configured === "ai") {
    return "ai";
  }

  return runtimeProfile === "speed" ? "seeded_fast" : "ai";
}

const runtimeProfile = readRuntimeProfile();

const serverEnv = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  authSecret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "",
  authUrl: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  inkbranchStorageMode: readStorageMode(),
  inkbranchAiMode: readAiMode(),
  inkbranchRuntimeProfile: runtimeProfile,
  inkbranchProjectionSyncMode: readProjectionSyncMode(runtimeProfile),
  inkbranchBranchGenerationMode: readBranchGenerationMode(runtimeProfile),
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/api",
  ollamaModel: process.env.OLLAMA_MODEL ?? "gemma3",
  ollamaTimeoutMs: readOllamaTimeoutMs(),
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
