import "server-only";

import { createDefaultStorySeed } from "@/features/story/default-seed";
import type {
  BeatChoiceRecord,
  ChoiceCondition,
  ChoiceConsequence,
  ChronicleRecord,
  JsonValue,
  LocalStoryDb,
  PerspectiveKnowledgeRecord,
  PerspectiveRunRecord,
  PerspectiveStateRecord,
  ReaderChronicleSummary,
  ReaderStoryDetail,
  ReaderWorldCard,
  StoryBeatRecord,
} from "@/types/story";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIRECTORY, "inkbranch.local.json");

let dbCache: LocalStoryDb | null = null;

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

async function readDbFile() {
  try {
    const raw = await readFile(DB_FILE, "utf8");
    return JSON.parse(raw) as LocalStoryDb;
  } catch {
    return null;
  }
}

async function writeDbFile(db: LocalStoryDb) {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  await writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

async function ensureDbLoaded() {
  if (dbCache) {
    return structuredClone(dbCache);
  }

  const fromDisk = await readDbFile();
  if (fromDisk) {
    dbCache = fromDisk;
    return structuredClone(dbCache);
  }

  const seeded = createDefaultStorySeed();
  dbCache = seeded;
  await writeDbFile(seeded);
  return structuredClone(seeded);
}

async function saveDb(db: LocalStoryDb) {
  dbCache = structuredClone(db);
  await writeDbFile(dbCache);
}

async function withDbMutation<T>(mutate: (db: LocalStoryDb) => T | Promise<T>) {
  const db = await ensureDbLoaded();
  const result = await mutate(db);
  await saveDb(db);
  return result;
}

function groupByChronicleStates(db: LocalStoryDb, chronicleId: string) {
  return db.chronicleWorldStateValues.filter((entry) => entry.chronicleId === chronicleId);
}

function groupByPerspectiveState(db: LocalStoryDb, runId: string) {
  return db.perspectiveStateValues.filter((entry) => entry.perspectiveRunId === runId);
}

function groupByPerspectiveKnowledge(db: LocalStoryDb, runId: string) {
  return db.perspectiveKnowledgeFlags.filter((entry) => entry.perspectiveRunId === runId);
}

function toStateMap(entries: Array<{ stateKey: string; stateValue: JsonValue }>) {
  return new Map(entries.map((entry) => [entry.stateKey, entry.stateValue]));
}

function toKnowledgeMap(entries: PerspectiveKnowledgeRecord[]) {
  return new Map(entries.map((entry) => [entry.flagKey, entry.status]));
}

function findPublishedVersionForWorld(db: LocalStoryDb, worldId: string) {
  const worldVersions = db.storyVersions
    .filter((version) => version.worldId === worldId && version.status === "published")
    .sort((a, b) => {
      if (a.isDefaultPublished && !b.isDefaultPublished) return -1;
      if (!a.isDefaultPublished && b.isDefaultPublished) return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  return worldVersions[0] ?? null;
}

function choiceIsAvailable(
  choice: BeatChoiceRecord,
  globalState: Map<string, JsonValue>,
  perspectiveState: Map<string, JsonValue>,
  knowledgeState: Map<string, PerspectiveKnowledgeRecord["status"]>,
) {
  if (!choice.gatingRules.length) {
    return true;
  }

  return choice.gatingRules.every((rule) => {
    let value: JsonValue | PerspectiveKnowledgeRecord["status"] | undefined;
    if (rule.scope === "global") {
      value = globalState.get(rule.key);
    } else if (rule.scope === "perspective") {
      value = perspectiveState.get(rule.key);
    } else {
      value = knowledgeState.get(rule.key);
    }

    if (rule.knowledgeStatus && rule.scope === "knowledge" && value !== rule.knowledgeStatus) {
      return false;
    }
    if (Object.hasOwn(rule, "equals") && value !== rule.equals) {
      return false;
    }
    if (Object.hasOwn(rule, "notEquals") && value === rule.notEquals) {
      return false;
    }

    return true;
  });
}

function upsertChronicleState(
  db: LocalStoryDb,
  chronicleId: string,
  key: string,
  value: JsonValue,
) {
  const existing = db.chronicleWorldStateValues.find(
    (entry) => entry.chronicleId === chronicleId && entry.stateKey === key,
  );

  if (existing) {
    existing.stateValue = value;
    existing.updatedAt = nowIso();
    return;
  }

  db.chronicleWorldStateValues.push({
    id: createId("chronicle_state"),
    chronicleId,
    stateKey: key,
    stateValue: value,
    updatedAt: nowIso(),
  });
}

function upsertPerspectiveState(
  db: LocalStoryDb,
  perspectiveRunId: string,
  key: string,
  value: JsonValue,
) {
  const existing = db.perspectiveStateValues.find(
    (entry) => entry.perspectiveRunId === perspectiveRunId && entry.stateKey === key,
  );

  if (existing) {
    existing.stateValue = value;
    existing.updatedAt = nowIso();
    return;
  }

  const record: PerspectiveStateRecord = {
    id: createId("perspective_state"),
    perspectiveRunId,
    stateKey: key,
    stateValue: value,
    updatedAt: nowIso(),
  };
  db.perspectiveStateValues.push(record);
}

function upsertKnowledge(
  db: LocalStoryDb,
  perspectiveRunId: string,
  key: string,
  value: JsonValue,
) {
  const status =
    value === "known" || value === "suspected" || value === "unknown" ? value : "known";

  const existing = db.perspectiveKnowledgeFlags.find(
    (entry) => entry.perspectiveRunId === perspectiveRunId && entry.flagKey === key,
  );

  if (existing) {
    existing.status = status;
    existing.details = typeof value === "string" ? value : null;
    existing.updatedAt = nowIso();
    return;
  }

  db.perspectiveKnowledgeFlags.push({
    id: createId("knowledge_flag"),
    perspectiveRunId,
    flagKey: key,
    status,
    details: typeof value === "string" ? value : null,
    updatedAt: nowIso(),
  });
}

function addCanonicalEvent(
  db: LocalStoryDb,
  input: {
    chronicleId: string;
    perspectiveRunId?: string | null;
    beatId?: string | null;
    choiceId?: string | null;
    eventType: "world_change" | "route_change" | "knowledge_reveal" | "system";
    summary: string;
    payload?: Record<string, JsonValue>;
  },
) {
  db.canonicalEventLog.push({
    id: createId("event"),
    chronicleId: input.chronicleId,
    perspectiveRunId: input.perspectiveRunId ?? null,
    beatId: input.beatId ?? null,
    choiceId: input.choiceId ?? null,
    eventType: input.eventType,
    summary: input.summary,
    payload: input.payload ?? {},
    createdAt: nowIso(),
  });
}

function addGeneratedScene(
  db: LocalStoryDb,
  input: {
    chronicleId: string;
    runId: string;
    beat: StoryBeatRecord;
    viewpointLabel: string;
  },
) {
  const sceneText = `${input.beat.narration}\n\nPerspective: ${input.viewpointLabel}.`;

  db.generatedScenes.push({
    id: createId("scene"),
    chronicleId: input.chronicleId,
    perspectiveRunId: input.runId,
    beatId: input.beat.id,
    sceneText,
    sourceLabel: "seeded",
    metadata: {},
    createdAt: nowIso(),
  });
}

function assertWorldExists(db: LocalStoryDb, worldId: string) {
  const world = db.storyWorlds.find((item) => item.id === worldId);
  if (!world) {
    throw new Error("Story world not found.");
  }

  return world;
}

function assertVersionExists(db: LocalStoryDb, versionId: string) {
  const version = db.storyVersions.find((item) => item.id === versionId);
  if (!version) {
    throw new Error("Story version not found.");
  }

  return version;
}

function assertBeatExists(db: LocalStoryDb, beatId: string) {
  const beat = db.storyBeats.find((item) => item.id === beatId);
  if (!beat) {
    throw new Error("Story beat not found.");
  }

  return beat;
}

function assertViewpointExists(db: LocalStoryDb, viewpointId: string) {
  const viewpoint = db.playableViewpoints.find((item) => item.id === viewpointId);
  if (!viewpoint) {
    throw new Error("Viewpoint not found.");
  }

  return viewpoint;
}

function assertChronicleForUser(db: LocalStoryDb, chronicleId: string, userId: string) {
  const chronicle = db.chronicles.find((entry) => entry.id === chronicleId);
  if (!chronicle) {
    throw new Error("Chronicle not found.");
  }
  if (chronicle.userId !== userId) {
    throw new Error("Chronicle access denied.");
  }

  return chronicle;
}

function assertPerspectiveRunForUser(
  db: LocalStoryDb,
  input: { chronicleId: string; runId: string; userId: string },
) {
  const chronicle = assertChronicleForUser(db, input.chronicleId, input.userId);
  const run = db.perspectiveRuns.find((entry) => entry.id === input.runId);
  if (!run || run.chronicleId !== chronicle.id) {
    throw new Error("Perspective run not found.");
  }

  return { chronicle, run };
}

export async function ensureLocalStoryDb() {
  await ensureDbLoaded();
}

export async function listReaderWorldCards(): Promise<ReaderWorldCard[]> {
  const db = await ensureDbLoaded();

  return db.storyWorlds
    .map((world) => {
      const version = findPublishedVersionForWorld(db, world.id);
      if (!version) return null;

      const playablePerspectiveCount = db.playableViewpoints.filter(
        (viewpoint) => viewpoint.versionId === version.id && viewpoint.isPlayable,
      ).length;

      return {
        world,
        version,
        playablePerspectiveCount,
      };
    })
    .filter((item): item is ReaderWorldCard => Boolean(item))
    .sort((a, b) => {
      if (a.world.isFeatured && !b.world.isFeatured) return -1;
      if (!a.world.isFeatured && b.world.isFeatured) return 1;
      return a.world.title.localeCompare(b.world.title);
    });
}

export async function getReaderStoryDetailBySlug(
  worldSlug: string,
): Promise<ReaderStoryDetail | null> {
  const db = await ensureDbLoaded();
  const world = db.storyWorlds.find((entry) => entry.slug === worldSlug);
  if (!world) return null;

  const version = findPublishedVersionForWorld(db, world.id);
  if (!version) return null;

  const viewpoints = db.playableViewpoints
    .filter((viewpoint) => viewpoint.versionId === version.id && viewpoint.isPlayable)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((viewpoint) => {
      const character = db.storyCharacters.find(
        (entry) => entry.id === viewpoint.characterId,
      );
      if (!character) return null;

      return { ...viewpoint, character };
    })
    .filter(
      (
        item,
      ): item is NonNullable<ReaderStoryDetail["viewpoints"][number]> => Boolean(item),
    );

  return { world, version, viewpoints };
}

export async function createChronicleForUser(input: {
  userId: string;
  versionId: string;
}) {
  return withDbMutation((db) => {
    const version = assertVersionExists(db, input.versionId);
    const world = assertWorldExists(db, version.worldId);
    if (version.status !== "published") {
      throw new Error("Chronicles can only start from published story versions.");
    }

    const chronicle: ChronicleRecord = {
      id: createId("chronicle"),
      userId: input.userId,
      worldId: world.id,
      versionId: version.id,
      status: "active",
      startedAt: nowIso(),
      lastActiveAt: nowIso(),
      completedAt: null,
    };
    db.chronicles.push(chronicle);

    addCanonicalEvent(db, {
      chronicleId: chronicle.id,
      eventType: "system",
      summary: "Chronicle created.",
      payload: {
        worldId: world.id,
        versionId: version.id,
      },
    });

    return chronicle;
  });
}

export async function listChronicleSummariesForUser(
  userId: string,
): Promise<ReaderChronicleSummary[]> {
  const db = await ensureDbLoaded();

  return db.chronicles
    .filter((chronicle) => chronicle.userId === userId)
    .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt))
    .map((chronicle) => {
      const world = db.storyWorlds.find((entry) => entry.id === chronicle.worldId);
      const version = db.storyVersions.find((entry) => entry.id === chronicle.versionId);
      if (!world || !version) return null;

      const runs = db.perspectiveRuns
        .filter((run) => run.chronicleId === chronicle.id)
        .map((run) => {
          const viewpoint = db.playableViewpoints.find(
            (entry) => entry.id === run.viewpointId,
          );
          const character = viewpoint
            ? db.storyCharacters.find((entry) => entry.id === viewpoint.characterId)
            : null;
          const beat = db.storyBeats.find((entry) => entry.id === run.currentBeatId);
          if (!viewpoint || !character || !beat) return null;

          return { run, viewpoint, character, beat };
        })
        .filter(
          (
            item,
          ): item is NonNullable<ReaderChronicleSummary["runs"][number]> => Boolean(item),
        )
        .sort((a, b) => b.run.lastActiveAt.localeCompare(a.run.lastActiveAt));

      return { chronicle, world, version, runs };
    })
    .filter((entry): entry is ReaderChronicleSummary => Boolean(entry));
}

export async function getChronicleByIdForUser(input: {
  chronicleId: string;
  userId: string;
}) {
  const db = await ensureDbLoaded();
  const chronicle = assertChronicleForUser(db, input.chronicleId, input.userId);
  const world = assertWorldExists(db, chronicle.worldId);
  const version = assertVersionExists(db, chronicle.versionId);

  const worldState = groupByChronicleStates(db, chronicle.id);
  const runs = db.perspectiveRuns.filter((run) => run.chronicleId === chronicle.id);

  return { chronicle, world, version, worldState, runs };
}

export async function createPerspectiveRunForUser(input: {
  userId: string;
  chronicleId: string;
  viewpointId: string;
}) {
  return withDbMutation((db) => {
    const chronicle = assertChronicleForUser(db, input.chronicleId, input.userId);
    const viewpoint = assertViewpointExists(db, input.viewpointId);
    if (viewpoint.versionId !== chronicle.versionId) {
      throw new Error("Selected viewpoint does not belong to this Chronicle version.");
    }

    const existing = db.perspectiveRuns.find(
      (run) => run.chronicleId === chronicle.id && run.viewpointId === viewpoint.id,
    );
    if (existing) {
      return existing;
    }

    const startBeat =
      (viewpoint.startBeatId
        ? db.storyBeats.find((beat) => beat.id === viewpoint.startBeatId)
        : null) ??
      db.storyBeats
        .filter((beat) => beat.versionId === chronicle.versionId)
        .sort((a, b) => a.orderIndex - b.orderIndex)[0];

    if (!startBeat) {
      throw new Error("No starting beat exists for this viewpoint.");
    }

    const run: PerspectiveRunRecord = {
      id: createId("run"),
      chronicleId: chronicle.id,
      viewpointId: viewpoint.id,
      currentBeatId: startBeat.id,
      status: "active",
      summary: null,
      startedAt: nowIso(),
      lastActiveAt: nowIso(),
      completedAt: null,
    };
    db.perspectiveRuns.push(run);

    upsertPerspectiveState(db, run.id, "viewpoint_label", viewpoint.label);

    addGeneratedScene(db, {
      chronicleId: chronicle.id,
      runId: run.id,
      beat: startBeat,
      viewpointLabel: viewpoint.label,
    });

    addCanonicalEvent(db, {
      chronicleId: chronicle.id,
      perspectiveRunId: run.id,
      beatId: startBeat.id,
      eventType: "route_change",
      summary: `Perspective run started: ${viewpoint.label}.`,
      payload: { viewpointId: viewpoint.id },
    });

    chronicle.lastActiveAt = nowIso();
    return run;
  });
}

export async function getPerspectiveRunContextForUser(input: {
  userId: string;
  chronicleId: string;
  runId: string;
}) {
  const db = await ensureDbLoaded();
  const { chronicle, run } = assertPerspectiveRunForUser(db, input);
  const world = assertWorldExists(db, chronicle.worldId);
  const version = assertVersionExists(db, chronicle.versionId);
  const viewpoint = assertViewpointExists(db, run.viewpointId);
  const character = db.storyCharacters.find((entry) => entry.id === viewpoint.characterId);
  if (!character) {
    throw new Error("Perspective character not found.");
  }

  const beat = assertBeatExists(db, run.currentBeatId);
  const globalStateEntries = groupByChronicleStates(db, chronicle.id);
  const perspectiveStateEntries = groupByPerspectiveState(db, run.id);
  const knowledgeEntries = groupByPerspectiveKnowledge(db, run.id);

  const globalState = toStateMap(globalStateEntries);
  const perspectiveState = toStateMap(perspectiveStateEntries);
  const knowledgeState = toKnowledgeMap(knowledgeEntries);

  const availableChoices = db.beatChoices
    .filter((choice) => choice.beatId === beat.id)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .filter((choice) =>
      choiceIsAvailable(choice, globalState, perspectiveState, knowledgeState),
    );

  const sceneHistory = db.generatedScenes
    .filter((scene) => scene.perspectiveRunId === run.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    chronicle,
    world,
    version,
    run,
    viewpoint,
    character,
    beat,
    choices: availableChoices,
    globalStateEntries,
    perspectiveStateEntries,
    knowledgeEntries,
    sceneHistory,
  };
}

export async function applyChoiceForUser(input: {
  userId: string;
  chronicleId: string;
  runId: string;
  choiceId: string;
}) {
  return withDbMutation((db) => {
    const { chronicle, run } = assertPerspectiveRunForUser(db, input);
    const viewpoint = assertViewpointExists(db, run.viewpointId);
    const currentBeat = assertBeatExists(db, run.currentBeatId);
    const version = assertVersionExists(db, chronicle.versionId);

    const choice = db.beatChoices.find(
      (entry) => entry.id === input.choiceId && entry.beatId === currentBeat.id,
    );
    if (!choice) {
      throw new Error("Choice is not valid for the current beat.");
    }

    const globalState = toStateMap(groupByChronicleStates(db, chronicle.id));
    const perspectiveState = toStateMap(groupByPerspectiveState(db, run.id));
    const knowledgeState = toKnowledgeMap(groupByPerspectiveKnowledge(db, run.id));
    if (!choiceIsAvailable(choice, globalState, perspectiveState, knowledgeState)) {
      throw new Error("Choice is currently gated by story state.");
    }

    for (const consequence of choice.consequences) {
      if (consequence.scope === "global") {
        upsertChronicleState(db, chronicle.id, consequence.key, consequence.value);
      } else if (consequence.scope === "perspective") {
        upsertPerspectiveState(db, run.id, consequence.key, consequence.value);
      } else {
        upsertKnowledge(db, run.id, consequence.key, consequence.value);
      }
    }

    const nextBeat = choice.nextBeatId
      ? db.storyBeats.find(
          (beat) => beat.id === choice.nextBeatId && beat.versionId === version.id,
        )
      : null;

    if (!nextBeat) {
      throw new Error("Choice is missing a valid next beat.");
    }

    run.currentBeatId = nextBeat.id;
    run.lastActiveAt = nowIso();
    if (nextBeat.isTerminal) {
      run.status = "completed";
      run.completedAt = nowIso();
      run.summary = `Completed at beat "${nextBeat.title}".`;
    }
    chronicle.lastActiveAt = nowIso();

    addCanonicalEvent(db, {
      chronicleId: chronicle.id,
      perspectiveRunId: run.id,
      beatId: currentBeat.id,
      choiceId: choice.id,
      eventType:
        choice.consequenceScope === "global"
          ? "world_change"
          : choice.consequenceScope === "knowledge"
            ? "knowledge_reveal"
            : "route_change",
      summary: `Choice resolved: ${choice.label}`,
      payload: {
        fromBeatId: currentBeat.id,
        toBeatId: nextBeat.id,
      },
    });

    addGeneratedScene(db, {
      chronicleId: chronicle.id,
      runId: run.id,
      beat: nextBeat,
      viewpointLabel: viewpoint.label,
    });

    return {
      runId: run.id,
      chronicleId: chronicle.id,
      nextBeatId: nextBeat.id,
      runCompleted: run.status === "completed",
    };
  });
}

export async function listViewpointsForChronicle(input: {
  userId: string;
  chronicleId: string;
}) {
  const db = await ensureDbLoaded();
  const chronicle = assertChronicleForUser(db, input.chronicleId, input.userId);

  return db.playableViewpoints
    .filter((viewpoint) => viewpoint.versionId === chronicle.versionId && viewpoint.isPlayable)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((viewpoint) => {
      const character = db.storyCharacters.find((entry) => entry.id === viewpoint.characterId);
      if (!character) return null;

      const existingRun = db.perspectiveRuns.find(
        (run) => run.chronicleId === chronicle.id && run.viewpointId === viewpoint.id,
      );

      return { viewpoint, character, existingRun };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

export async function listAdminStoryData() {
  const db = await ensureDbLoaded();
  return {
    storyWorlds: db.storyWorlds.slice().sort((a, b) => a.title.localeCompare(b.title)),
    storyVersions: db.storyVersions
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    storyCharacters: db.storyCharacters
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name)),
    playableViewpoints: db.playableViewpoints
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex),
    storyCanonEntries: db.storyCanonEntries
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title)),
    storyBeats: db.storyBeats.slice().sort((a, b) => a.orderIndex - b.orderIndex),
    beatChoices: db.beatChoices.slice().sort((a, b) => a.orderIndex - b.orderIndex),
  };
}

export async function createStoryWorld(input: {
  slug: string;
  title: string;
  synopsis: string;
  tone: string;
  isFeatured?: boolean;
}) {
  return withDbMutation((db) => {
    if (db.storyWorlds.some((world) => world.slug === input.slug.trim())) {
      throw new Error("World slug already exists.");
    }

    const world = {
      id: createId("world"),
      slug: input.slug.trim(),
      title: input.title.trim(),
      synopsis: input.synopsis.trim(),
      tone: input.tone.trim(),
      isFeatured: input.isFeatured ?? false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.storyWorlds.push(world);
    return world;
  });
}

export async function updateStoryWorld(input: {
  id: string;
  title: string;
  synopsis: string;
  tone: string;
  isFeatured: boolean;
}) {
  return withDbMutation((db) => {
    const world = assertWorldExists(db, input.id);
    world.title = input.title.trim();
    world.synopsis = input.synopsis.trim();
    world.tone = input.tone.trim();
    world.isFeatured = input.isFeatured;
    world.updatedAt = nowIso();
    return world;
  });
}

export async function createStoryVersion(input: {
  worldId: string;
  versionLabel: string;
  description: string;
  status: "draft" | "published" | "archived";
  isDefaultPublished: boolean;
}) {
  return withDbMutation((db) => {
    const world = assertWorldExists(db, input.worldId);
    if (input.isDefaultPublished) {
      for (const version of db.storyVersions) {
        if (version.worldId === world.id) {
          version.isDefaultPublished = false;
        }
      }
    }

    const version = {
      id: createId("version"),
      worldId: world.id,
      versionLabel: input.versionLabel.trim(),
      description: input.description.trim(),
      status: input.status,
      isDefaultPublished: input.isDefaultPublished,
      publishedAt: input.status === "published" ? nowIso() : null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    db.storyVersions.push(version);
    return version;
  });
}

export async function updateStoryVersion(input: {
  id: string;
  status: "draft" | "published" | "archived";
  isDefaultPublished: boolean;
  description: string;
}) {
  return withDbMutation((db) => {
    const version = assertVersionExists(db, input.id);
    if (input.isDefaultPublished) {
      for (const item of db.storyVersions) {
        if (item.worldId === version.worldId) {
          item.isDefaultPublished = false;
        }
      }
    }

    version.status = input.status;
    version.isDefaultPublished = input.isDefaultPublished;
    version.description = input.description.trim();
    version.publishedAt = input.status === "published" ? nowIso() : null;
    version.updatedAt = nowIso();
    return version;
  });
}

export async function createStoryCharacter(input: {
  worldId: string;
  slug: string;
  name: string;
  summary: string;
}) {
  return withDbMutation((db) => {
    assertWorldExists(db, input.worldId);
    if (
      db.storyCharacters.some(
        (character) => character.worldId === input.worldId && character.slug === input.slug,
      )
    ) {
      throw new Error("Character slug already exists for this world.");
    }

    const character = {
      id: createId("character"),
      worldId: input.worldId,
      slug: input.slug.trim(),
      name: input.name.trim(),
      summary: input.summary.trim(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.storyCharacters.push(character);
    return character;
  });
}

export async function createPlayableViewpoint(input: {
  versionId: string;
  characterId: string;
  label: string;
  description: string;
  startBeatId?: string;
  orderIndex?: number;
}) {
  return withDbMutation((db) => {
    const version = assertVersionExists(db, input.versionId);
    const character = db.storyCharacters.find((entry) => entry.id === input.characterId);
    if (!character) {
      throw new Error("Character not found.");
    }
    if (character.worldId !== version.worldId) {
      throw new Error("Character world does not match the selected version.");
    }

    if (input.startBeatId) {
      const beat = assertBeatExists(db, input.startBeatId);
      if (beat.versionId !== version.id) {
        throw new Error("Start beat does not belong to this version.");
      }
    }

    const viewpoint = {
      id: createId("viewpoint"),
      versionId: version.id,
      characterId: character.id,
      label: input.label.trim(),
      description: input.description.trim(),
      startBeatId: input.startBeatId ?? null,
      isPlayable: true,
      orderIndex: input.orderIndex ?? 100,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.playableViewpoints.push(viewpoint);
    return viewpoint;
  });
}

export async function createCanonEntry(input: {
  versionId: string;
  entryType: "world_truth" | "character_truth" | "item_truth" | "place_truth" | "rule";
  canonKey: string;
  title: string;
  body: string;
}) {
  return withDbMutation((db) => {
    assertVersionExists(db, input.versionId);
    if (
      db.storyCanonEntries.some(
        (entry) => entry.versionId === input.versionId && entry.canonKey === input.canonKey,
      )
    ) {
      throw new Error("Canon key already exists for this version.");
    }

    const entry = {
      id: createId("canon"),
      versionId: input.versionId,
      entryType: input.entryType,
      canonKey: input.canonKey.trim(),
      title: input.title.trim(),
      body: input.body.trim(),
      isContradictionSensitive: true,
      metadata: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    db.storyCanonEntries.push(entry);
    return entry;
  });
}

export async function createStoryBeat(input: {
  versionId: string;
  slug: string;
  title: string;
  summary: string;
  narration: string;
  beatType: "world" | "perspective" | "interlock";
  orderIndex: number;
  isTerminal: boolean;
}) {
  return withDbMutation((db) => {
    assertVersionExists(db, input.versionId);
    if (
      db.storyBeats.some(
        (beat) => beat.versionId === input.versionId && beat.slug === input.slug.trim(),
      )
    ) {
      throw new Error("Beat slug already exists for this version.");
    }

    const beat = {
      id: createId("beat"),
      versionId: input.versionId,
      slug: input.slug.trim(),
      title: input.title.trim(),
      summary: input.summary.trim(),
      narration: input.narration.trim(),
      beatType: input.beatType,
      orderIndex: input.orderIndex,
      isTerminal: input.isTerminal,
      metadata: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.storyBeats.push(beat);
    return beat;
  });
}

export async function updateStoryBeat(input: {
  beatId: string;
  title: string;
  summary: string;
  narration: string;
  orderIndex: number;
  isTerminal: boolean;
}) {
  return withDbMutation((db) => {
    const beat = assertBeatExists(db, input.beatId);
    beat.title = input.title.trim();
    beat.summary = input.summary.trim();
    beat.narration = input.narration.trim();
    beat.orderIndex = input.orderIndex;
    beat.isTerminal = input.isTerminal;
    beat.updatedAt = nowIso();
    return beat;
  });
}

export async function createBeatChoice(input: {
  beatId: string;
  label: string;
  description?: string;
  orderIndex: number;
  nextBeatId: string;
  consequenceScope: "global" | "perspective" | "knowledge";
  gatingRules?: ChoiceCondition[];
  consequences: ChoiceConsequence[];
}) {
  return withDbMutation((db) => {
    const beat = assertBeatExists(db, input.beatId);
    const nextBeat = assertBeatExists(db, input.nextBeatId);
    if (nextBeat.versionId !== beat.versionId) {
      throw new Error("Next beat must belong to the same story version.");
    }

    const choice = {
      id: createId("choice"),
      beatId: beat.id,
      label: input.label.trim(),
      internalKey: null,
      description: input.description?.trim() ?? null,
      orderIndex: input.orderIndex,
      nextBeatId: nextBeat.id,
      consequenceScope: input.consequenceScope,
      gatingRules: input.gatingRules ?? [],
      consequences: input.consequences,
      metadata: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    db.beatChoices.push(choice);
    return choice;
  });
}

export async function updateBeatChoice(input: {
  choiceId: string;
  label: string;
  description?: string;
  orderIndex: number;
  nextBeatId: string;
}) {
  return withDbMutation((db) => {
    const choice = db.beatChoices.find((entry) => entry.id === input.choiceId);
    if (!choice) {
      throw new Error("Choice not found.");
    }

    const beat = assertBeatExists(db, choice.beatId);
    const nextBeat = assertBeatExists(db, input.nextBeatId);
    if (nextBeat.versionId !== beat.versionId) {
      throw new Error("Next beat must belong to the same version as the source beat.");
    }

    choice.label = input.label.trim();
    choice.description = input.description?.trim() ?? null;
    choice.orderIndex = input.orderIndex;
    choice.nextBeatId = nextBeat.id;
    choice.updatedAt = nowIso();
    return choice;
  });
}
