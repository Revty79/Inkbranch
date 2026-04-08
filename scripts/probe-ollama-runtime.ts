import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const {
    createChronicleForUser,
    createPerspectiveRunForUser,
    getChronicleByIdForUser,
    getPerspectiveRunContextForUser,
    listReaderWorldCards,
  } = await import("@/features/story/repository");
  const { db } = await import("@/lib/db/server");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const reader = await db.query.users.findFirst({
    where: eq(users.role, "reader"),
    orderBy: (table, { asc }) => asc(table.createdAt),
  });
  const fallbackUser = reader
    ? null
    : await db.query.users.findFirst({
        orderBy: (table, { asc }) => asc(table.createdAt),
      });
  const actor = reader ?? fallbackUser;

  if (!actor) {
    throw new Error("No user account found. Register an account first.");
  }

  const worlds = await listReaderWorldCards();
  const world = worlds[0];
  if (!world) {
    throw new Error("No published world available to start a Chronicle.");
  }

  const chronicle = await createChronicleForUser({
    userId: actor.id,
    versionId: world.version.id,
  });

  const chronicleDetail = await getChronicleByIdForUser({
    chronicleId: chronicle.id,
    userId: actor.id,
  });
  const firstViewpoint = chronicleDetail.viewpointProgress[0]?.viewpoint;
  if (!firstViewpoint) {
    throw new Error("No playable viewpoint found for the Chronicle.");
  }

  const run = await createPerspectiveRunForUser({
    userId: actor.id,
    chronicleId: chronicle.id,
    viewpointId: firstViewpoint.id,
  });

  const context = await getPerspectiveRunContextForUser({
    userId: actor.id,
    chronicleId: chronicle.id,
    runId: run.id,
  });

  const latestScene = context.sceneHistory[context.sceneHistory.length - 1];
  const fallbackReason =
    latestScene?.metadata && typeof latestScene.metadata === "object"
      ? ((latestScene.metadata as Record<string, unknown>).fallbackReason ?? null)
      : null;
  const generationMode =
    latestScene?.metadata && typeof latestScene.metadata === "object"
      ? ((latestScene.metadata as Record<string, unknown>).generationMode ?? null)
      : null;

  console.log("probe_result");
  console.log(
    JSON.stringify(
      {
        readerEmail: actor.email,
        readerRole: actor.role,
        chronicleId: chronicle.id,
        runId: run.id,
        latestSceneSource: latestScene?.sourceLabel ?? null,
        latestSceneGenerationMode: generationMode,
        latestSceneFallbackReason: fallbackReason,
        chapterWordCount: context.bookPlan.chapterWordCount,
        chapterSceneCount: context.bookPlan.chapterSceneCount,
        chapterReady: context.bookPlan.chapterReady,
        chapterProgress: `${context.bookPlan.currentChapterNumber}/${context.bookPlan.totalChapterCount}`,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown probe error.";
  console.error(message);
  process.exit(1);
});
