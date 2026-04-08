import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const { generateNarrativeScene } = await import("@/features/story/scene-generator");
  const result = await generateNarrativeScene({
    worldTitle: "Inkbranch Test World",
    worldTone: "mysterious, atmospheric, and character-driven",
    worldSynopsis: "A coastal city where the bell towers keep weather memories.",
    versionLabel: "v-test",
    viewpointLabel: "Harbor Archivist",
    characterName: "Mara Vale",
    characterSummary: "A skeptical archivist trying to protect civic memory.",
    beatTitle: "The Bell Crack",
    beatSubtitle: null,
    beatSummary:
      "During the vigil, the glass bell cracks and the crowd fractures into fear and rumor.",
    beatNarration: "The bell sounded once, then split with a sound like winter timber.",
    beatAtmosphere: "rain-slick stone and watchful silence",
    beatType: "scene",
    chapterLabel: "Chapter 1",
    selectedChoiceLabel: "Stabilize the crowd before panic spreads",
    actionNote: "Keep the tone reflective but tense.",
    resolutionSource: "explicit_choice",
    canonEntries: [
      {
        canonKey: "world.bells",
        entryType: "rule",
        title: "Bell Rule",
        body: "Bell fractures must be recorded before dawn.",
      },
      {
        canonKey: "char.mara",
        entryType: "character_truth",
        title: "Mara",
        body: "Mara never lies in public hearings.",
      },
    ],
    globalState: [
      { key: "storm_pressure", value: "rising" },
      { key: "public_trust", value: "fragile" },
    ],
    perspectiveState: [{ key: "mara_risk", value: "medium" }],
    knowledgeState: [{ key: "knows_bell_history", status: "known" }],
    recentEvents: [
      {
        eventType: "world_change",
        summary: "A hairline fracture appeared in the central bell.",
      },
    ],
    availableChoices: [
      {
        label: "Question the watch captain",
        description: "Interrogate timeline inconsistencies.",
      },
      {
        label: "Inspect the bell chamber",
        description: "Look for tampering signs.",
      },
    ],
    recentSceneProse: [],
    chapterSceneIndex: 2,
    routeSceneIndex: 2,
  });

  const wordCount = result.payload.sceneText.trim().split(/\s+/).filter(Boolean).length;
  const paragraphCount = result.payload.sceneText
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean).length;

  console.log(
    JSON.stringify(
      {
        mode: result.mode,
        sourceLabel: result.sourceLabel,
        fallbackReason: result.fallbackReason ?? null,
        model: result.model ?? null,
        wordCount,
        paragraphCount,
        shortSummary: result.payload.shortSummary,
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
