import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const {
    createBeatChoice,
    createChronicleForUser,
    createPerspectiveRunForUser,
    createPlayableViewpoint,
    createStoryBeat,
    createStoryCharacter,
    createStoryVersion,
    createStoryWorld,
    listAdminStoryData,
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
    throw new Error("No user account found. Register first.");
  }

  const seedSlug = "minimum-chronicle";
  const admin = await listAdminStoryData();

  const world =
    admin.storyWorlds.find((entry) => entry.slug === seedSlug) ??
    (await createStoryWorld({
      slug: seedSlug,
      title: "Minimum Chronicle",
      synopsis:
        "A compact test world for validating Chronicle creation, run startup, and AI scene flow.",
      tone: "Grounded, tense, and character-centered.",
      isFeatured: true,
    }));

  const version =
    admin.storyVersions.find(
      (entry) => entry.worldId === world.id && entry.status === "published",
    ) ??
    (await createStoryVersion({
      worldId: world.id,
      versionLabel: "v0-minimum",
      description: "Minimum published version for end-to-end testing.",
      status: "published",
      isDefaultPublished: true,
    }));

  const character =
    admin.storyCharacters.find(
      (entry) => entry.worldId === world.id && entry.slug === "tester-protagonist",
    ) ??
    (await createStoryCharacter({
      worldId: world.id,
      slug: "tester-protagonist",
      name: "Tess Arlen",
      summary:
        "A practical investigator who notices social pressure shifts before anyone else.",
    }));

  const openingBeat =
    admin.storyBeats.find(
      (entry) => entry.versionId === version.id && entry.slug === "min-opening",
    ) ??
    (await createStoryBeat({
      versionId: version.id,
      slug: "min-opening",
      title: "The First Alarm",
      sceneSubtitle: "Opening Test Beat",
      chapterLabel: "Chapter 1",
      summary: "An alarm bell fractures the market hush and forces immediate choices.",
      narration:
        "A thin alarm note skips across the square, then fractures into rough harmonics that leave everyone listening for blame.",
      atmosphere: "wet stone, crowded stalls, held breath",
      allowsGuidedAction: true,
      guidedActionPrompt:
        "Type a brief intent for how Tess should approach the first shock in the square.",
      allowedActionTags: ["investigate", "observe", "protect"],
      fallbackChoiceId: undefined,
      beatType: "perspective",
      orderIndex: 10,
      isTerminal: false,
    }));

  const investigateBeat =
    admin.storyBeats.find(
      (entry) => entry.versionId === version.id && entry.slug === "min-investigate",
    ) ??
    (await createStoryBeat({
      versionId: version.id,
      slug: "min-investigate",
      title: "Trace the Fracture",
      sceneSubtitle: "Branch A",
      chapterLabel: "Chapter 1",
      summary: "Tess follows the crack pattern back toward the bell housing.",
      narration:
        "Tess moves with the crowd but watches the bell tower frame, tracking each vibration like a map with missing streets.",
      atmosphere: "focused urgency",
      allowsGuidedAction: true,
      guidedActionPrompt: "Keep this branch investigative and evidence-driven.",
      allowedActionTags: ["investigate", "observe", "signal"],
      fallbackChoiceId: undefined,
      beatType: "perspective",
      orderIndex: 20,
      isTerminal: false,
    }));

  const stabilizeBeat =
    admin.storyBeats.find(
      (entry) => entry.versionId === version.id && entry.slug === "min-stabilize",
    ) ??
    (await createStoryBeat({
      versionId: version.id,
      slug: "min-stabilize",
      title: "Stabilize the Crowd",
      sceneSubtitle: "Branch B",
      chapterLabel: "Chapter 1",
      summary: "Tess keeps panic from spreading while trying to preserve witness memory.",
      narration:
        "She plants her boots near the fountain lip and raises her voice just enough to create a centerline people can hear.",
      atmosphere: "social pressure under strain",
      allowsGuidedAction: true,
      guidedActionPrompt: "Keep this branch social, controlled, and continuity-safe.",
      allowedActionTags: ["protect", "secure", "observe"],
      fallbackChoiceId: undefined,
      beatType: "perspective",
      orderIndex: 30,
      isTerminal: false,
    }));

  const viewpoint =
    admin.playableViewpoints.find(
      (entry) =>
        entry.versionId === version.id &&
        entry.characterId === character.id &&
        entry.label === "Tess Perspective",
    ) ??
    (await createPlayableViewpoint({
      versionId: version.id,
      characterId: character.id,
      label: "Tess Perspective",
      description:
        "Primary testing perspective with one opening beat and two deterministic branch exits.",
      startBeatId: openingBeat.id,
      orderIndex: 1,
    }));

  const latestAdmin = await listAdminStoryData();
  const existingOpeningChoices = latestAdmin.beatChoices.filter(
    (entry) => entry.beatId === openingBeat.id,
  );
  if (existingOpeningChoices.length < 2) {
    if (
      !existingOpeningChoices.some((entry) =>
        entry.label.toLowerCase().includes("inspect"),
      )
    ) {
      await createBeatChoice({
        beatId: openingBeat.id,
        label: "Inspect the bell housing immediately",
        description: "Move toward the source and lock down physical evidence first.",
        intentTags: ["investigate", "observe"],
        orderIndex: 1,
        nextBeatId: investigateBeat.id,
        consequenceScope: "perspective",
        consequences: [
          { scope: "perspective", key: "opening_choice", value: "inspect_bell" },
          { scope: "perspective", key: "route_priority", value: "evidence" },
        ],
      });
    }

    if (
      !existingOpeningChoices.some((entry) =>
        entry.label.toLowerCase().includes("steady"),
      )
    ) {
      await createBeatChoice({
        beatId: openingBeat.id,
        label: "Steady the crowd before details vanish",
        description: "Contain panic and preserve witness memory before it fragments.",
        intentTags: ["protect", "secure", "observe"],
        orderIndex: 2,
        nextBeatId: stabilizeBeat.id,
        consequenceScope: "perspective",
        consequences: [
          { scope: "perspective", key: "opening_choice", value: "stabilize_crowd" },
          { scope: "perspective", key: "route_priority", value: "social_stability" },
        ],
      });
    }
  }

  const chronicle = await createChronicleForUser({
    userId: actor.id,
    versionId: version.id,
  });
  const run = await createPerspectiveRunForUser({
    userId: actor.id,
    chronicleId: chronicle.id,
    viewpointId: viewpoint.id,
  });

  console.log(
    JSON.stringify(
      {
        seededForEmail: actor.email,
        seededForRole: actor.role,
        worldSlug: world.slug,
        chronicleId: chronicle.id,
        runId: run.id,
        runUrl: `/app/chronicles/${chronicle.id}/runs/${run.id}`,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown seed error.";
  console.error(message);
  process.exit(1);
});
