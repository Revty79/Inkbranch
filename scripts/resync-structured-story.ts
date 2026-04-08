import Module from "node:module";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });

const moduleLoader = Module as unknown as {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown;
};

const originalLoad = moduleLoader._load;
moduleLoader._load = function patchedLoad(
  request: string,
  parent: unknown,
  isMain: boolean,
) {
  if (request === "server-only") {
    return {};
  }

  return originalLoad.apply(this, [request, parent, isMain]);
};

async function main() {
  const repository = await import("../src/features/story/repository");
  const result = await repository.resyncStructuredStoryProjection();
  console.log("[story:resync] Structured projection refreshed:", result);
}

main().catch((error) => {
  console.error("[story:resync] Failed:", error);
  process.exit(1);
});
