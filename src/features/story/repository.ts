import "server-only";

import {
  generateNarrativeBranch,
  generateNarrativeScene,
} from "@/features/story/scene-generator";
import {
  beatChoices as beatChoicesTable,
  canonicalEventLog as canonicalEventLogTable,
  chronicleWorldStateValues as chronicleWorldStateValuesTable,
  chronicles as chroniclesTable,
  generatedScenes as generatedScenesTable,
  perspectiveKnowledgeFlags as perspectiveKnowledgeFlagsTable,
  perspectiveRuns as perspectiveRunsTable,
  perspectiveStateValues as perspectiveStateValuesTable,
  playableViewpoints as playableViewpointsTable,
  storyBeats as storyBeatsTable,
  storyCanonEntries as storyCanonEntriesTable,
  storyCharacters as storyCharactersTable,
  storyChapters as storyChaptersTable,
  storyRuntimeState,
  storyVersions as storyVersionsTable,
  storyWorlds as storyWorldsTable,
  users as usersTable,
} from "@/db/schema";
import {
  scenePayloadToMetadata,
  type GeneratedScenePayload,
} from "@/lib/ai/types";
import { db as postgresDb } from "@/lib/db/server";
import { env } from "@/lib/env";
import type {
  BeatChoiceRecord,
  CanonEntryType,
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
  StoryChapterRecord,
} from "@/types/story";
import { eq } from "drizzle-orm";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIRECTORY, "inkbranch.local.json");
const STORY_RUNTIME_KEY = "primary";
const GUIDED_ACTION_TEXT_LIMIT = 180;
const MAX_EMERGENT_CANON_PER_SCENE = 3;
const MIN_EMERGENT_CANON_BODY_LENGTH = 32;
const MIN_CHAPTER_WORDS = 1200;
const MIN_CHAPTER_SCENES = 3;
const INTERNAL_STATE_PREFIX = "__inkbranch_";
const CHRONICLE_RUNTIME_MODE_KEY = `${INTERNAL_STATE_PREFIX}runtime_mode`;
const CHRONICLE_TOTAL_CHAPTERS_KEY = `${INTERNAL_STATE_PREFIX}total_chapters`;
const CHRONICLE_CHAPTER_TITLES_KEY = `${INTERNAL_STATE_PREFIX}chapter_titles`;
const CHRONICLE_PRIMARY_VIEWPOINT_KEY = `${INTERNAL_STATE_PREFIX}primary_viewpoint_id`;
const CHRONICLE_FIRST_READ_COMPLETE_KEY = `${INTERNAL_STATE_PREFIX}first_read_complete`;
const CHRONICLE_FIRST_COMPLETED_RUN_KEY = `${INTERNAL_STATE_PREFIX}first_completed_run_id`;
const CHRONICLE_MODE_PROCEDURAL = "procedural_chapter_book";

const ACTION_TAG_HINTS: Record<string, string[]> = {
  investigate: ["investigate", "inspect", "search", "question", "probe", "clue"],
  calm: ["calm", "soothe", "steady", "de-escalate"],
  signal: ["signal", "ring", "alarm", "call", "warn"],
  secure: ["secure", "lock", "guard", "protect", "fortify"],
  shadow: ["shadow", "tail", "follow", "track"],
  observe: ["observe", "watch", "listen", "survey", "scan"],
  travel: ["travel", "go", "move", "cross", "route", "head"],
  sneak: ["sneak", "slip", "stealth", "quiet", "bypass"],
  wait: ["wait", "hold", "pause", "linger"],
  deliver: ["deliver", "carry", "handoff", "dispatch"],
  protect: ["protect", "shield", "cover"],
};

let dbCache: LocalStoryDb | null = null;
let mutationQueue: Promise<void> = Promise.resolve();

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

function readOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeTagList(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  const tags = value
    .map((entry) => (typeof entry === "string" ? entry.trim().toLowerCase() : ""))
    .filter((entry): entry is string => Boolean(entry));

  return Array.from(new Set(tags));
}

function normalizeStoryBeatRecord(beat: StoryBeatRecord): StoryBeatRecord {
  return {
    ...beat,
    sceneSubtitle: readOptionalString(
      beat.sceneSubtitle ?? beat.metadata?.sceneSubtitle,
    ),
    chapterLabel: readOptionalString(beat.chapterLabel ?? beat.metadata?.chapterLabel),
    atmosphere: readOptionalString(beat.atmosphere ?? beat.metadata?.atmosphere),
    allowsGuidedAction: Boolean(
      beat.allowsGuidedAction ?? beat.metadata?.allowsGuidedAction ?? false,
    ),
    guidedActionPrompt: readOptionalString(
      beat.guidedActionPrompt ?? beat.metadata?.guidedActionPrompt,
    ),
    allowedActionTags: normalizeTagList(
      beat.allowedActionTags ?? beat.metadata?.allowedActionTags,
    ),
    fallbackChoiceId: readOptionalString(
      beat.fallbackChoiceId ?? beat.metadata?.fallbackChoiceId,
    ),
  };
}

function normalizeBeatChoiceRecord(choice: BeatChoiceRecord): BeatChoiceRecord {
  return {
    ...choice,
    intentTags: normalizeTagList(choice.intentTags ?? choice.metadata?.intentTags),
  };
}

function normalizeStoryChapterRecord(chapter: StoryChapterRecord): StoryChapterRecord {
  const chapterNumber =
    Number.isFinite(chapter.chapterNumber) && chapter.chapterNumber > 0
      ? Math.floor(chapter.chapterNumber)
      : 1;
  const sceneCount =
    Number.isFinite(chapter.sceneCount) && chapter.sceneCount >= 0
      ? Math.floor(chapter.sceneCount)
      : 0;
  const wordCount =
    Number.isFinite(chapter.wordCount) && chapter.wordCount >= 0
      ? Math.floor(chapter.wordCount)
      : 0;
  const chapterLabel = readOptionalString(chapter.chapterLabel) ?? `Chapter ${chapterNumber}`;
  const chapterTitle = readOptionalString(chapter.chapterTitle) ?? chapterLabel;
  const chapterSummary =
    readOptionalString(chapter.chapterSummary) ?? "Chapter draft in progress.";
  const chapterText = typeof chapter.chapterText === "string" ? chapter.chapterText : "";

  return {
    ...chapter,
    chapterNumber,
    chapterLabel,
    chapterTitle,
    chapterSummary,
    chapterText,
    sceneCount,
    wordCount,
    sourceLabel: readOptionalString(chapter.sourceLabel) ?? "seeded",
    isReady:
      Boolean(chapter.isReady) ||
      (wordCount >= MIN_CHAPTER_WORDS && sceneCount >= MIN_CHAPTER_SCENES),
    metadata:
      chapter.metadata && typeof chapter.metadata === "object" ? chapter.metadata : {},
    createdAt: chapter.createdAt || nowIso(),
    updatedAt: chapter.updatedAt || nowIso(),
  };
}

function normalizeDbShape(db: LocalStoryDb): LocalStoryDb {
  return {
    ...db,
    storyBeats: db.storyBeats.map((beat) => normalizeStoryBeatRecord(beat)),
    beatChoices: db.beatChoices.map((choice) => normalizeBeatChoiceRecord(choice)),
    storyChapters: (db.storyChapters ?? []).map((chapter) =>
      normalizeStoryChapterRecord(chapter),
    ),
  };
}

function createEmptyStoryDb(): LocalStoryDb {
  return {
    storyWorlds: [],
    storyVersions: [],
    storyCharacters: [],
    playableViewpoints: [],
    storyCanonEntries: [],
    storyBeats: [],
    beatChoices: [],
    chronicles: [],
    chronicleWorldStateValues: [],
    perspectiveRuns: [],
    perspectiveStateValues: [],
    perspectiveKnowledgeFlags: [],
    generatedScenes: [],
    storyChapters: [],
    canonicalEventLog: [],
  };
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

async function readRuntimeStateFromPostgres() {
  const rows = await postgresDb
    .select({ payload: storyRuntimeState.payload })
    .from(storyRuntimeState)
    .where(eq(storyRuntimeState.key, STORY_RUNTIME_KEY))
    .limit(1);
  const payload = rows[0]?.payload;

  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload as unknown as LocalStoryDb;
}

async function writeRuntimeStateToPostgres(db: LocalStoryDb) {
  await postgresDb
    .insert(storyRuntimeState)
    .values({
      key: STORY_RUNTIME_KEY,
      payload: db as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: storyRuntimeState.key,
      set: {
        payload: db as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });
}

function createUuidIdMap<T extends { id: string }>(scope: string, rows: T[]) {
  return new Map(rows.map((row) => [row.id, localIdToUuid(scope, row.id)]));
}

async function syncStructuredTablesToPostgres(db: LocalStoryDb) {
  const worldIdMap = createUuidIdMap("world", db.storyWorlds);
  const versionIdMap = createUuidIdMap("version", db.storyVersions);
  const characterIdMap = createUuidIdMap("character", db.storyCharacters);
  const beatIdMap = createUuidIdMap("beat", db.storyBeats);
  const viewpointIdMap = createUuidIdMap("viewpoint", db.playableViewpoints);
  const choiceIdMap = createUuidIdMap("choice", db.beatChoices);
  const canonIdMap = createUuidIdMap("canon", db.storyCanonEntries);
  const chronicleIdMap = createUuidIdMap("chronicle", db.chronicles);
  const chronicleStateIdMap = createUuidIdMap(
    "chronicle_state",
    db.chronicleWorldStateValues,
  );
  const runIdMap = createUuidIdMap("run", db.perspectiveRuns);
  const perspectiveStateIdMap = createUuidIdMap(
    "perspective_state",
    db.perspectiveStateValues,
  );
  const knowledgeIdMap = createUuidIdMap("knowledge", db.perspectiveKnowledgeFlags);
  const sceneIdMap = createUuidIdMap("scene", db.generatedScenes);
  const eventIdMap = createUuidIdMap("event", db.canonicalEventLog);
  const chapterIdMap = createUuidIdMap("chapter", db.storyChapters);

  const userRows = await postgresDb.select({ id: usersTable.id }).from(usersTable);
  const validUserIds = new Set(userRows.map((row) => row.id));

  const validChronicles = db.chronicles.filter((chronicle) => validUserIds.has(chronicle.userId));
  const validChronicleIds = new Set(validChronicles.map((chronicle) => chronicle.id));
  const validRuns = db.perspectiveRuns.filter(
    (run) =>
      validChronicleIds.has(run.chronicleId) &&
      viewpointIdMap.has(run.viewpointId) &&
      beatIdMap.has(run.currentBeatId),
  );
  const validRunIds = new Set(validRuns.map((run) => run.id));

  await postgresDb.transaction(async (tx) => {
    await tx.delete(generatedScenesTable);
    await tx.delete(canonicalEventLogTable);
    await tx.delete(storyChaptersTable);
    await tx.delete(perspectiveKnowledgeFlagsTable);
    await tx.delete(perspectiveStateValuesTable);
    await tx.delete(perspectiveRunsTable);
    await tx.delete(chronicleWorldStateValuesTable);
    await tx.delete(chroniclesTable);
    await tx.delete(beatChoicesTable);
    await tx.delete(playableViewpointsTable);
    await tx.delete(storyBeatsTable);
    await tx.delete(storyCanonEntriesTable);
    await tx.delete(storyCharactersTable);
    await tx.delete(storyVersionsTable);
    await tx.delete(storyWorldsTable);

    if (db.storyWorlds.length) {
      await tx.insert(storyWorldsTable).values(
        db.storyWorlds.map((world) => ({
          id: mapLocalId(worldIdMap, world.id) ?? localIdToUuid("world", world.id),
          slug: world.slug,
          title: world.title,
          synopsis: world.synopsis,
          tone: world.tone,
          isFeatured: world.isFeatured,
          createdAt: asDate(world.createdAt),
          updatedAt: asDate(world.updatedAt),
        })),
      );
    }

    if (db.storyVersions.length) {
      await tx.insert(storyVersionsTable).values(
        db.storyVersions
          .filter((version) => worldIdMap.has(version.worldId))
          .map((version) => ({
            id: mapLocalId(versionIdMap, version.id) ?? localIdToUuid("version", version.id),
            worldId:
              mapLocalId(worldIdMap, version.worldId) ??
              localIdToUuid("world", version.worldId),
            versionLabel: version.versionLabel,
            description: version.description,
            status: version.status,
            isDefaultPublished: version.isDefaultPublished,
            publishedAt: version.publishedAt ? asDate(version.publishedAt) : null,
            createdAt: asDate(version.createdAt),
            updatedAt: asDate(version.updatedAt),
          })),
      );
    }

    if (db.storyCharacters.length) {
      await tx.insert(storyCharactersTable).values(
        db.storyCharacters
          .filter((character) => worldIdMap.has(character.worldId))
          .map((character) => ({
            id:
              mapLocalId(characterIdMap, character.id) ??
              localIdToUuid("character", character.id),
            worldId:
              mapLocalId(worldIdMap, character.worldId) ??
              localIdToUuid("world", character.worldId),
            slug: character.slug,
            name: character.name,
            summary: character.summary,
            createdAt: asDate(character.createdAt),
            updatedAt: asDate(character.updatedAt),
          })),
      );
    }

    if (db.storyCanonEntries.length) {
      await tx.insert(storyCanonEntriesTable).values(
        db.storyCanonEntries
          .filter((entry) => versionIdMap.has(entry.versionId))
          .map((entry) => ({
            id: mapLocalId(canonIdMap, entry.id) ?? localIdToUuid("canon", entry.id),
            versionId:
              mapLocalId(versionIdMap, entry.versionId) ??
              localIdToUuid("version", entry.versionId),
            entryType: entry.entryType,
            canonKey: entry.canonKey,
            title: entry.title,
            body: entry.body,
            isContradictionSensitive: entry.isContradictionSensitive,
            metadata: (entry.metadata ?? {}) as unknown as Record<string, unknown>,
            createdAt: asDate(entry.createdAt),
            updatedAt: asDate(entry.updatedAt),
          })),
      );
    }

    if (db.storyBeats.length) {
      await tx.insert(storyBeatsTable).values(
        db.storyBeats
          .filter((beat) => versionIdMap.has(beat.versionId))
          .map((beat) => ({
            id: mapLocalId(beatIdMap, beat.id) ?? localIdToUuid("beat", beat.id),
            versionId:
              mapLocalId(versionIdMap, beat.versionId) ??
              localIdToUuid("version", beat.versionId),
            slug: beat.slug,
            title: beat.title,
            sceneSubtitle: beat.sceneSubtitle,
            chapterLabel: beat.chapterLabel,
            summary: beat.summary,
            narration: beat.narration,
            atmosphere: beat.atmosphere,
            allowsGuidedAction: beat.allowsGuidedAction,
            guidedActionPrompt: beat.guidedActionPrompt,
            allowedActionTags: beat.allowedActionTags,
            fallbackChoiceId: mapLocalId(choiceIdMap, beat.fallbackChoiceId) ?? beat.fallbackChoiceId,
            beatType: beat.beatType,
            orderIndex: beat.orderIndex,
            isTerminal: beat.isTerminal,
            metadata: (beat.metadata ?? {}) as unknown as Record<string, unknown>,
            createdAt: asDate(beat.createdAt),
            updatedAt: asDate(beat.updatedAt),
          })),
      );
    }

    if (db.playableViewpoints.length) {
      await tx.insert(playableViewpointsTable).values(
        db.playableViewpoints
          .filter(
            (viewpoint) =>
              versionIdMap.has(viewpoint.versionId) &&
              characterIdMap.has(viewpoint.characterId),
          )
          .map((viewpoint) => ({
            id:
              mapLocalId(viewpointIdMap, viewpoint.id) ??
              localIdToUuid("viewpoint", viewpoint.id),
            versionId:
              mapLocalId(versionIdMap, viewpoint.versionId) ??
              localIdToUuid("version", viewpoint.versionId),
            characterId:
              mapLocalId(characterIdMap, viewpoint.characterId) ??
              localIdToUuid("character", viewpoint.characterId),
            label: viewpoint.label,
            description: viewpoint.description,
            startBeatId: mapLocalId(beatIdMap, viewpoint.startBeatId),
            isPlayable: viewpoint.isPlayable,
            orderIndex: viewpoint.orderIndex,
            createdAt: asDate(viewpoint.createdAt),
            updatedAt: asDate(viewpoint.updatedAt),
          })),
      );
    }

    if (db.beatChoices.length) {
      await tx.insert(beatChoicesTable).values(
        db.beatChoices
          .filter((choice) => beatIdMap.has(choice.beatId))
          .map((choice) => ({
            id: mapLocalId(choiceIdMap, choice.id) ?? localIdToUuid("choice", choice.id),
            beatId:
              mapLocalId(beatIdMap, choice.beatId) ?? localIdToUuid("beat", choice.beatId),
            label: choice.label,
            internalKey: choice.internalKey,
            description: choice.description,
            orderIndex: choice.orderIndex,
            nextBeatId: mapLocalId(beatIdMap, choice.nextBeatId),
            intentTags: choice.intentTags,
            consequenceScope: choice.consequenceScope,
            gatingRules: choice.gatingRules as unknown as Record<string, unknown>[],
            consequences: choice.consequences as unknown as Record<string, unknown>[],
            metadata: (choice.metadata ?? {}) as unknown as Record<string, unknown>,
            createdAt: asDate(choice.createdAt),
            updatedAt: asDate(choice.updatedAt),
          })),
      );
    }

    if (validChronicles.length) {
      await tx.insert(chroniclesTable).values(
        validChronicles
          .filter(
            (chronicle) =>
              worldIdMap.has(chronicle.worldId) && versionIdMap.has(chronicle.versionId),
          )
          .map((chronicle) => ({
            id:
              mapLocalId(chronicleIdMap, chronicle.id) ??
              localIdToUuid("chronicle", chronicle.id),
            userId: chronicle.userId,
            worldId:
              mapLocalId(worldIdMap, chronicle.worldId) ??
              localIdToUuid("world", chronicle.worldId),
            versionId:
              mapLocalId(versionIdMap, chronicle.versionId) ??
              localIdToUuid("version", chronicle.versionId),
            status: chronicle.status,
            startedAt: asDate(chronicle.startedAt),
            lastActiveAt: asDate(chronicle.lastActiveAt),
            completedAt: chronicle.completedAt ? asDate(chronicle.completedAt) : null,
          })),
      );
    }

    const chronicleStates = db.chronicleWorldStateValues.filter((entry) =>
      validChronicleIds.has(entry.chronicleId),
    );
    if (chronicleStates.length) {
      await tx.insert(chronicleWorldStateValuesTable).values(
        chronicleStates.map((entry) => ({
          id:
            mapLocalId(chronicleStateIdMap, entry.id) ??
            localIdToUuid("chronicle_state", entry.id),
          chronicleId:
            mapLocalId(chronicleIdMap, entry.chronicleId) ??
            localIdToUuid("chronicle", entry.chronicleId),
          stateKey: entry.stateKey,
          stateValue: entry.stateValue as unknown,
          updatedAt: asDate(entry.updatedAt),
        })),
      );
    }

    if (validRuns.length) {
      await tx.insert(perspectiveRunsTable).values(
        validRuns.map((run) => ({
          id: mapLocalId(runIdMap, run.id) ?? localIdToUuid("run", run.id),
          chronicleId:
            mapLocalId(chronicleIdMap, run.chronicleId) ??
            localIdToUuid("chronicle", run.chronicleId),
          viewpointId:
            mapLocalId(viewpointIdMap, run.viewpointId) ??
            localIdToUuid("viewpoint", run.viewpointId),
          currentBeatId:
            mapLocalId(beatIdMap, run.currentBeatId) ??
            localIdToUuid("beat", run.currentBeatId),
          status: run.status,
          summary: run.summary,
          startedAt: asDate(run.startedAt),
          lastActiveAt: asDate(run.lastActiveAt),
          completedAt: run.completedAt ? asDate(run.completedAt) : null,
        })),
      );
    }

    const perspectiveStates = db.perspectiveStateValues.filter((entry) =>
      validRunIds.has(entry.perspectiveRunId),
    );
    if (perspectiveStates.length) {
      await tx.insert(perspectiveStateValuesTable).values(
        perspectiveStates.map((entry) => ({
          id:
            mapLocalId(perspectiveStateIdMap, entry.id) ??
            localIdToUuid("perspective_state", entry.id),
          perspectiveRunId:
            mapLocalId(runIdMap, entry.perspectiveRunId) ??
            localIdToUuid("run", entry.perspectiveRunId),
          stateKey: entry.stateKey,
          stateValue: entry.stateValue as unknown,
          updatedAt: asDate(entry.updatedAt),
        })),
      );
    }

    const knowledgeFlags = db.perspectiveKnowledgeFlags.filter((entry) =>
      validRunIds.has(entry.perspectiveRunId),
    );
    if (knowledgeFlags.length) {
      await tx.insert(perspectiveKnowledgeFlagsTable).values(
        knowledgeFlags.map((entry) => ({
          id: mapLocalId(knowledgeIdMap, entry.id) ?? localIdToUuid("knowledge", entry.id),
          perspectiveRunId:
            mapLocalId(runIdMap, entry.perspectiveRunId) ??
            localIdToUuid("run", entry.perspectiveRunId),
          flagKey: entry.flagKey,
          status: entry.status,
          details: entry.details,
          updatedAt: asDate(entry.updatedAt),
        })),
      );
    }

    const scenes = db.generatedScenes.filter(
      (scene) =>
        validChronicleIds.has(scene.chronicleId) &&
        validRunIds.has(scene.perspectiveRunId) &&
        beatIdMap.has(scene.beatId),
    );
    if (scenes.length) {
      await tx.insert(generatedScenesTable).values(
        scenes.map((scene) => ({
          id: mapLocalId(sceneIdMap, scene.id) ?? localIdToUuid("scene", scene.id),
          chronicleId:
            mapLocalId(chronicleIdMap, scene.chronicleId) ??
            localIdToUuid("chronicle", scene.chronicleId),
          perspectiveRunId:
            mapLocalId(runIdMap, scene.perspectiveRunId) ??
            localIdToUuid("run", scene.perspectiveRunId),
          beatId:
            mapLocalId(beatIdMap, scene.beatId) ?? localIdToUuid("beat", scene.beatId),
          sceneText: scene.sceneText,
          sourceLabel: scene.sourceLabel,
          metadata: (scene.metadata ?? {}) as unknown as Record<string, unknown>,
          createdAt: asDate(scene.createdAt),
        })),
      );
    }

    const events = db.canonicalEventLog.filter((event) =>
      validChronicleIds.has(event.chronicleId),
    );
    if (events.length) {
      await tx.insert(canonicalEventLogTable).values(
        events.map((event) => ({
          id: mapLocalId(eventIdMap, event.id) ?? localIdToUuid("event", event.id),
          chronicleId:
            mapLocalId(chronicleIdMap, event.chronicleId) ??
            localIdToUuid("chronicle", event.chronicleId),
          perspectiveRunId: mapLocalId(runIdMap, event.perspectiveRunId),
          beatId: mapLocalId(beatIdMap, event.beatId),
          choiceId: mapLocalId(choiceIdMap, event.choiceId),
          eventType: event.eventType,
          summary: event.summary,
          payload: (event.payload ?? {}) as unknown as Record<string, unknown>,
          createdAt: asDate(event.createdAt),
        })),
      );
    }

    const chapters = db.storyChapters.filter(
      (chapter) =>
        validChronicleIds.has(chapter.chronicleId) &&
        validRunIds.has(chapter.perspectiveRunId),
    );
    if (chapters.length) {
      await tx.insert(storyChaptersTable).values(
        chapters.map((chapter) => ({
          id: mapLocalId(chapterIdMap, chapter.id) ?? localIdToUuid("chapter", chapter.id),
          chronicleId:
            mapLocalId(chronicleIdMap, chapter.chronicleId) ??
            localIdToUuid("chronicle", chapter.chronicleId),
          perspectiveRunId:
            mapLocalId(runIdMap, chapter.perspectiveRunId) ??
            localIdToUuid("run", chapter.perspectiveRunId),
          chapterNumber: chapter.chapterNumber,
          chapterLabel: chapter.chapterLabel,
          chapterTitle: chapter.chapterTitle,
          chapterSummary: chapter.chapterSummary,
          chapterText: chapter.chapterText,
          sceneCount: chapter.sceneCount,
          wordCount: chapter.wordCount,
          sourceLabel: chapter.sourceLabel,
          isReady: chapter.isReady,
          metadata: (chapter.metadata ?? {}) as unknown as Record<string, unknown>,
          createdAt: asDate(chapter.createdAt),
          updatedAt: asDate(chapter.updatedAt),
        })),
      );
    }
  });
}

async function ensureDbLoaded() {
  if (dbCache) {
    return structuredClone(dbCache);
  }

  if (env.inkbranchStorageMode === "postgres") {
    const fromPostgres = await readRuntimeStateFromPostgres();
    if (fromPostgres) {
      const normalized = normalizeDbShape(fromPostgres);
      dbCache = normalized;
      return structuredClone(dbCache);
    }

    const empty = normalizeDbShape(createEmptyStoryDb());
    dbCache = empty;
    await writeRuntimeStateToPostgres(empty);
    return structuredClone(empty);
  }

  const fromDisk = await readDbFile();
  if (fromDisk) {
    const normalized = normalizeDbShape(fromDisk);
    dbCache = normalized;
    if (JSON.stringify(fromDisk) !== JSON.stringify(normalized)) {
      await writeDbFile(normalized);
    }
    return structuredClone(dbCache);
  }

  const empty = normalizeDbShape(createEmptyStoryDb());
  dbCache = empty;
  await writeDbFile(empty);
  return structuredClone(empty);
}

async function saveDb(db: LocalStoryDb) {
  dbCache = structuredClone(db);
  rebuildStoryChaptersFromGeneratedScenes(dbCache);
  if (env.inkbranchStorageMode === "postgres") {
    await writeRuntimeStateToPostgres(dbCache);
    await syncStructuredTablesToPostgres(dbCache);
    return;
  }

  await writeDbFile(dbCache);
}

async function withDbMutation<T>(mutate: (db: LocalStoryDb) => T | Promise<T>) {
  const runMutation = async () => {
    const db = await ensureDbLoaded();
    const result = await mutate(db);
    await saveDb(db);
    return result;
  };

  const queued = mutationQueue.then(runMutation, runMutation);
  mutationQueue = queued.then(
    () => undefined,
    () => undefined,
  );
  return queued;
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

function tokenizeGuidedAction(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function inferGuidedTag(inputText: string, allowedTags: string[]) {
  const normalizedText = inputText.toLowerCase();
  const tagsToCheck = allowedTags.length
    ? allowedTags
    : Object.keys(ACTION_TAG_HINTS);

  for (const tag of tagsToCheck) {
    if (normalizedText.includes(tag)) {
      return tag;
    }

    const hints = ACTION_TAG_HINTS[tag] ?? [tag];
    if (hints.some((hint) => normalizedText.includes(hint))) {
      return tag;
    }
  }

  return null;
}

function scoreGuidedChoice(inputTokens: string[], choice: BeatChoiceRecord, inferredTag: string | null) {
  let score = 0;
  const searchableText = `${choice.label} ${choice.description ?? ""}`.toLowerCase();

  if (inferredTag && choice.intentTags.includes(inferredTag)) {
    score += 6;
  }

  for (const token of inputTokens) {
    if (choice.intentTags.includes(token)) {
      score += 3;
    }
    if (searchableText.includes(token)) {
      score += 1;
    }
  }

  return score;
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

function normalizeActionNote(note: string | null | undefined) {
  if (typeof note !== "string") {
    return null;
  }

  const trimmed = note.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, GUIDED_ACTION_TEXT_LIMIT);
}

function isInternalStateKey(key: string) {
  return key.startsWith(INTERNAL_STATE_PREFIX);
}

function listPublicChronicleStates(db: LocalStoryDb, chronicleId: string) {
  return groupByChronicleStates(db, chronicleId).filter(
    (entry) => !isInternalStateKey(entry.stateKey),
  );
}

function readChronicleStateValue(
  db: LocalStoryDb,
  chronicleId: string,
  stateKey: string,
) {
  return db.chronicleWorldStateValues.find(
    (entry) => entry.chronicleId === chronicleId && entry.stateKey === stateKey,
  )?.stateValue;
}

function readChronicleStateString(
  db: LocalStoryDb,
  chronicleId: string,
  stateKey: string,
) {
  const value = readChronicleStateValue(db, chronicleId, stateKey);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readChronicleStateNumber(
  db: LocalStoryDb,
  chronicleId: string,
  stateKey: string,
) {
  const value = readChronicleStateValue(db, chronicleId, stateKey);
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readChronicleStateBoolean(
  db: LocalStoryDb,
  chronicleId: string,
  stateKey: string,
) {
  const value = readChronicleStateValue(db, chronicleId, stateKey);
  return typeof value === "boolean" ? value : null;
}

function readChronicleStateStringList(
  db: LocalStoryDb,
  chronicleId: string,
  stateKey: string,
) {
  const value = readChronicleStateValue(db, chronicleId, stateKey);
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => Boolean(item));
}

function upsertChronicleInternalState(
  db: LocalStoryDb,
  chronicleId: string,
  stateKey: string,
  stateValue: JsonValue,
) {
  upsertChronicleState(db, chronicleId, stateKey, stateValue);
}

function computeStableHash(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function derivePlannedChapterCount(seedInput: string) {
  const hash = computeStableHash(seedInput);
  return 4 + (hash % 4);
}

function inferChapterNumberFromLabel(chapterLabel: string | null) {
  if (!chapterLabel) {
    return null;
  }

  const match = chapterLabel.match(/(\d+)/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function readBeatChapterNumber(beat: StoryBeatRecord) {
  const metadataValue = beat.metadata["runtimeChapterNumber"];
  if (typeof metadataValue === "number" && Number.isFinite(metadataValue) && metadataValue > 0) {
    return Math.floor(metadataValue);
  }

  const fromLabel = inferChapterNumberFromLabel(beat.chapterLabel);
  return fromLabel ?? 1;
}

function readBeatSceneIndex(beat: StoryBeatRecord) {
  const metadataValue = beat.metadata["runtimeSceneIndex"];
  if (typeof metadataValue === "number" && Number.isFinite(metadataValue) && metadataValue > 0) {
    return Math.floor(metadataValue);
  }

  return 1;
}

function isProceduralChronicle(db: LocalStoryDb, chronicleId: string) {
  return (
    readChronicleStateString(db, chronicleId, CHRONICLE_RUNTIME_MODE_KEY) ===
    CHRONICLE_MODE_PROCEDURAL
  );
}

function hasCompletedRun(db: LocalStoryDb, chronicleId: string) {
  return db.perspectiveRuns.some(
    (run) => run.chronicleId === chronicleId && run.status === "completed",
  );
}

function getChroniclePerspectiveUnlockState(db: LocalStoryDb, chronicleId: string) {
  const primaryViewpointId = readChronicleStateString(
    db,
    chronicleId,
    CHRONICLE_PRIMARY_VIEWPOINT_KEY,
  );
  const firstReadCompleteState = readChronicleStateBoolean(
    db,
    chronicleId,
    CHRONICLE_FIRST_READ_COMPLETE_KEY,
  );
  const firstReadComplete =
    firstReadCompleteState === true ? true : hasCompletedRun(db, chronicleId);

  return {
    primaryViewpointId,
    firstReadComplete,
  };
}

function getChronicleTotalChapterCount(db: LocalStoryDb, chronicleId: string) {
  const raw = readChronicleStateNumber(db, chronicleId, CHRONICLE_TOTAL_CHAPTERS_KEY);
  if (!raw) {
    return null;
  }

  const normalized = Math.floor(raw);
  if (normalized < 2) {
    return 2;
  }
  if (normalized > 12) {
    return 12;
  }
  return normalized;
}

function normalizeTextKey(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function trimTextToWordCount(text: string, maxWords = 170) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return text.trim();
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
}

function countWords(text: string | null | undefined) {
  if (typeof text !== "string") {
    return 0;
  }

  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function summarizeChapterText(text: string, maxWords = 65) {
  const trimmed = text.trim();
  if (!trimmed) {
    return "Chapter draft in progress.";
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return trimmed;
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
}

function localIdToUuid(scope: string, localId: string) {
  const hash = createHash("sha1").update(`${scope}:${localId}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(
    17,
    20,
  )}-${hash.slice(20, 32)}`;
}

function mapLocalId(map: Map<string, string>, localId: string | null | undefined) {
  if (!localId) {
    return null;
  }

  return map.get(localId) ?? localIdToUuid("fallback", localId);
}

function asDate(value: string | null | undefined) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

function readMetadataString(metadata: Record<string, JsonValue>, key: string) {
  const value = metadata[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function slugifyCanonKey(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "canon_entry";
}

function canonPrefixForType(entryType: CanonEntryType) {
  if (entryType === "character_truth") return "char";
  if (entryType === "place_truth") return "place";
  if (entryType === "item_truth") return "item";
  if (entryType === "rule") return "rule";
  return "world";
}

function ensureUniqueCanonKey(
  db: LocalStoryDb,
  versionId: string,
  keyHint: string,
  entryType: CanonEntryType,
) {
  const normalizedHint = slugifyCanonKey(keyHint);
  const prefix = canonPrefixForType(entryType);
  const baseKey = normalizedHint.startsWith(`${prefix}_`)
    ? normalizedHint
    : `${prefix}_${normalizedHint}`;

  let candidate = baseKey;
  let suffix = 2;
  while (
    db.storyCanonEntries.some(
      (entry) => entry.versionId === versionId && entry.canonKey === candidate,
    )
  ) {
    candidate = `${baseKey}_${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function buildRecentSceneProseContext(
  db: LocalStoryDb,
  input: {
    perspectiveRunId: string;
    chapterLabel: string | null;
    maxScenes?: number;
    excerptWordLimit?: number;
  },
) {
  const maxScenes = input.maxScenes ?? 4;
  const excerptWordLimit = input.excerptWordLimit ?? 170;
  const runScenes = db.generatedScenes
    .filter((scene) => scene.perspectiveRunId === input.perspectiveRunId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const targetChapterKey = normalizeTextKey(input.chapterLabel);
  const chapterScenes = targetChapterKey
    ? runScenes.filter((scene) => {
        const sceneChapterLabel = readMetadataString(scene.metadata, "chapterLabel");
        return normalizeTextKey(sceneChapterLabel) === targetChapterKey;
      })
    : runScenes;

  const chapterAnchoredScenes = chapterScenes.slice(-maxScenes);
  const selectedSceneIds = new Set(chapterAnchoredScenes.map((scene) => scene.id));
  const supplementalScenes =
    chapterAnchoredScenes.length < maxScenes
      ? runScenes
          .filter((scene) => !selectedSceneIds.has(scene.id))
          .slice(-(maxScenes - chapterAnchoredScenes.length))
      : [];
  const continuityScenes = [...chapterAnchoredScenes, ...supplementalScenes].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  const recentSceneProse = continuityScenes
    .map((scene) => ({
      sceneTitle: readMetadataString(scene.metadata, "sceneTitle"),
      shortSummary: readMetadataString(scene.metadata, "shortSummary"),
      chapterLabel: readMetadataString(scene.metadata, "chapterLabel"),
      excerpt: trimTextToWordCount(scene.sceneText, excerptWordLimit),
      createdAt: scene.createdAt,
    }))
    .filter((scene) => Boolean(scene.excerpt));

  return {
    routeSceneIndex: runScenes.length + 1,
    chapterSceneIndex: chapterScenes.length + 1,
    recentSceneProse,
  };
}

function upsertChapterRecordForScene(
  db: LocalStoryDb,
  input: {
    chronicle: ChronicleRecord;
    run: PerspectiveRunRecord;
    beat: StoryBeatRecord;
    sceneId: string;
    sceneText: string;
    sourceLabel: string;
  },
) {
  const chapterNumber = Math.max(1, readBeatChapterNumber(input.beat));
  const chapterLabel = readOptionalString(input.beat.chapterLabel) ?? `Chapter ${chapterNumber}`;
  const chapterLabelKey = normalizeTextKey(chapterLabel);

  const chapterScenes = db.generatedScenes
    .filter((scene) => {
      if (scene.perspectiveRunId !== input.run.id) {
        return false;
      }

      const sceneBeat = db.storyBeats.find((beat) => beat.id === scene.beatId);
      if (sceneBeat) {
        const sceneChapterNumber = readBeatChapterNumber(sceneBeat);
        if (sceneChapterNumber === chapterNumber) {
          return true;
        }
      }

      if (!chapterLabelKey) {
        return false;
      }
      const sceneChapterLabel = readMetadataString(scene.metadata, "chapterLabel");
      return normalizeTextKey(sceneChapterLabel) === chapterLabelKey;
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const chapterText = chapterScenes
    .map((scene) => scene.sceneText.trim())
    .filter(Boolean)
    .join("\n\n");
  const sceneCount = chapterScenes.length;
  const wordCount = countWords(chapterText);
  const isReady = sceneCount >= MIN_CHAPTER_SCENES && wordCount >= MIN_CHAPTER_WORDS;
  const latestScene = chapterScenes[chapterScenes.length - 1] ?? null;
  const sceneTitle = latestScene
    ? readMetadataString(latestScene.metadata, "sceneTitle")
    : null;
  const chapterTitle = sceneTitle
    ? `${chapterLabel}: ${sceneTitle}`
    : `${chapterLabel} Chronicle Draft`;
  const chapterSummary = summarizeChapterText(chapterText, 75);
  const sourceLabels = new Set(chapterScenes.map((scene) => scene.sourceLabel));
  const chapterSourceLabel =
    sourceLabels.size === 1 ? chapterScenes[0]?.sourceLabel ?? input.sourceLabel : "mixed";

  const existing = db.storyChapters.find(
    (chapter) =>
      chapter.chronicleId === input.chronicle.id &&
      chapter.perspectiveRunId === input.run.id &&
      chapter.chapterNumber === chapterNumber,
  );

  const now = nowIso();
  if (existing) {
    existing.chapterLabel = chapterLabel;
    existing.chapterTitle = chapterTitle;
    existing.chapterSummary = chapterSummary;
    existing.chapterText = chapterText;
    existing.sceneCount = sceneCount;
    existing.wordCount = wordCount;
    existing.sourceLabel = chapterSourceLabel;
    existing.isReady = isReady;
    existing.metadata = {
      ...existing.metadata,
      latestSceneId: input.sceneId,
      latestBeatId: input.beat.id,
      minChapterWords: MIN_CHAPTER_WORDS,
      minChapterScenes: MIN_CHAPTER_SCENES,
      sourceLabels: Array.from(sourceLabels),
    };
    existing.updatedAt = now;
    return;
  }

  const chapter: StoryChapterRecord = {
    id: createId("chapter"),
    chronicleId: input.chronicle.id,
    perspectiveRunId: input.run.id,
    chapterNumber,
    chapterLabel,
    chapterTitle,
    chapterSummary,
    chapterText,
    sceneCount,
    wordCount,
    sourceLabel: chapterSourceLabel,
    isReady,
    metadata: {
      latestSceneId: input.sceneId,
      latestBeatId: input.beat.id,
      minChapterWords: MIN_CHAPTER_WORDS,
      minChapterScenes: MIN_CHAPTER_SCENES,
      sourceLabels: Array.from(sourceLabels),
    },
    createdAt: now,
    updatedAt: now,
  };
  db.storyChapters.push(chapter);
}

function rebuildStoryChaptersFromGeneratedScenes(db: LocalStoryDb) {
  db.storyChapters = [];
  const scenes = db.generatedScenes.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const scene of scenes) {
    const chronicle = db.chronicles.find((entry) => entry.id === scene.chronicleId);
    const run = db.perspectiveRuns.find((entry) => entry.id === scene.perspectiveRunId);
    const beat = db.storyBeats.find((entry) => entry.id === scene.beatId);
    if (!chronicle || !run || !beat) {
      continue;
    }

    upsertChapterRecordForScene(db, {
      chronicle,
      run,
      beat,
      sceneId: scene.id,
      sceneText: scene.sceneText,
      sourceLabel: scene.sourceLabel,
    });
  }
}

function getLatestSceneForBeat(
  db: LocalStoryDb,
  input: { perspectiveRunId: string; beatId: string },
) {
  const scene = db.generatedScenes
    .filter(
      (entry) =>
        entry.perspectiveRunId === input.perspectiveRunId && entry.beatId === input.beatId,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return scene ?? null;
}

function normalizeIntentTags(tags: string[], fallbackText: string) {
  const normalized = Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 6);

  if (normalized.length) {
    return normalized;
  }

  const fallbackTokens = fallbackText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3)
    .slice(0, 3);
  if (fallbackTokens.length) {
    return fallbackTokens;
  }

  return ["investigate", "observe"];
}

function trimForSlug(value: string, maxLength = 42) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength);
  return slug || "scene";
}

function nextOrderIndex(values: number[], startAt = 10) {
  if (!values.length) {
    return startAt;
  }

  return Math.max(...values) + 10;
}

function nextChoiceOrderIndex(
  db: LocalStoryDb,
  beatId: string,
  fallbackStart = 1,
) {
  const values = db.beatChoices
    .filter((choice) => choice.beatId === beatId)
    .map((choice) => choice.orderIndex);
  if (!values.length) {
    return fallbackStart;
  }

  return Math.max(...values) + 1;
}

function toPublicGlobalStateForGeneration(db: LocalStoryDb, chronicleId: string) {
  return listPublicChronicleStates(db, chronicleId).map((entry) => ({
    key: entry.stateKey,
    value: entry.stateValue,
  }));
}

function getChronicleCanonEntriesForGeneration(
  db: LocalStoryDb,
  input: { chronicle: ChronicleRecord },
) {
  return db.storyCanonEntries
    .filter((entry) => {
      if (entry.versionId !== input.chronicle.versionId) {
        return false;
      }

      const origin = readMetadataString(entry.metadata, "origin");
      if (origin !== "ai_emergent_locked") {
        return true;
      }

      return (
        readMetadataString(entry.metadata, "sourceChronicleId") === input.chronicle.id
      );
    })
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((entry) => ({
      canonKey: entry.canonKey,
      entryType: entry.entryType,
      title: entry.title,
      body: entry.body,
    }));
}

function ensureChronicleProceduralPlan(
  db: LocalStoryDb,
  input: {
    chronicle: ChronicleRecord;
    world: { title: string };
    version: { versionLabel: string };
  },
) {
  if (!isProceduralChronicle(db, input.chronicle.id)) {
    return;
  }

  if (getChronicleTotalChapterCount(db, input.chronicle.id)) {
    return;
  }

  const plannedChapterCount = derivePlannedChapterCount(
    `${input.chronicle.id}|${input.world.title}|${input.version.versionLabel}`,
  );
  const chapterTitles = Array.from({ length: plannedChapterCount }, (_, index) => {
    return `Chapter ${index + 1}`;
  });

  upsertChronicleInternalState(
    db,
    input.chronicle.id,
    CHRONICLE_TOTAL_CHAPTERS_KEY,
    plannedChapterCount,
  );
  upsertChronicleInternalState(
    db,
    input.chronicle.id,
    CHRONICLE_CHAPTER_TITLES_KEY,
    chapterTitles,
  );

  addCanonicalEvent(db, {
    chronicleId: input.chronicle.id,
    eventType: "system",
    summary: `Chronicle plan committed: ${plannedChapterCount} chapters.`,
    payload: {
      totalChapters: plannedChapterCount,
      planMode: "seeded_procedural",
    },
  });
}

async function ensureProceduralChoicesForBeat(
  db: LocalStoryDb,
  input: {
    chronicle: ChronicleRecord;
    run: PerspectiveRunRecord;
    world: { title: string; tone: string; synopsis: string };
    version: { versionLabel: string };
    viewpoint: { label: string };
    character: { name: string; summary: string };
    beat: StoryBeatRecord;
  },
) {
  if (!isProceduralChronicle(db, input.chronicle.id)) {
    return;
  }
  if (input.beat.isTerminal) {
    return;
  }

  const allChoicesForBeat = db.beatChoices.filter((choice) => choice.beatId === input.beat.id);
  const runtimeChoices = allChoicesForBeat.filter(
    (choice) => readMetadataString(choice.metadata, "origin") === "ai_runtime",
  );
  if (runtimeChoices.length >= 2) {
    return;
  }

  const totalChapters = getChronicleTotalChapterCount(db, input.chronicle.id) ?? 5;
  const chapterTitles = readChronicleStateStringList(
    db,
    input.chronicle.id,
    CHRONICLE_CHAPTER_TITLES_KEY,
  );
  const currentChapter = Math.min(
    Math.max(1, readBeatChapterNumber(input.beat)),
    totalChapters,
  );
  const latestScene =
    getLatestSceneForBeat(db, {
      perspectiveRunId: input.run.id,
      beatId: input.beat.id,
    }) ?? null;

  const canonEntries = getChronicleCanonEntriesForGeneration(db, {
    chronicle: input.chronicle,
  });
  const globalState = toPublicGlobalStateForGeneration(db, input.chronicle.id);
  const perspectiveState = groupByPerspectiveState(db, input.run.id).map((entry) => ({
    key: entry.stateKey,
    value: entry.stateValue,
  }));
  const knowledgeState = groupByPerspectiveKnowledge(db, input.run.id).map((entry) => ({
    key: entry.flagKey,
    status: entry.status,
  }));
  const recentEvents = db.canonicalEventLog
    .filter((event) => event.chronicleId === input.chronicle.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .map((event) => ({
      eventType: event.eventType,
      summary: event.summary,
    }));
  const continuityContext = buildRecentSceneProseContext(db, {
    perspectiveRunId: input.run.id,
    chapterLabel: input.beat.chapterLabel,
    maxScenes: 2,
    excerptWordLimit: 90,
  });
  const activeChapter =
    db.storyChapters.find(
      (chapter) =>
        chapter.perspectiveRunId === input.run.id && chapter.chapterNumber === currentChapter,
    ) ?? null;
  const chapterSceneCount = activeChapter?.sceneCount ?? 0;
  const chapterWordCount = activeChapter?.wordCount ?? 0;
  const branchGeneration = await generateNarrativeBranch({
    worldTitle: input.world.title,
    worldTone: input.world.tone,
    worldSynopsis: input.world.synopsis,
    versionLabel: input.version.versionLabel,
    viewpointLabel: input.viewpoint.label,
    characterName: input.character.name,
    characterSummary: input.character.summary,
    beatTitle: input.beat.title,
    beatSummary: input.beat.summary,
    beatNarration: latestScene?.sceneText ?? input.beat.narration,
    beatType: input.beat.beatType,
    chapterLabel: input.beat.chapterLabel,
    chapterNumber: currentChapter,
    totalChapterCount: totalChapters,
    chapterSceneCount,
    chapterWordCount,
    minChapterSceneCount: MIN_CHAPTER_SCENES,
    minChapterWordCount: MIN_CHAPTER_WORDS,
    routeSceneIndex: Math.max(1, continuityContext.routeSceneIndex),
    canonEntries,
    globalState,
    perspectiveState,
    knowledgeState,
    recentEvents,
    recentSceneProse: continuityContext.recentSceneProse,
  });

  const branchChoices = branchGeneration.payload.choices;
  if (branchChoices.length < 2) {
    return;
  }

  const maxBeatOrder = nextOrderIndex(db.storyBeats.map((beat) => beat.orderIndex));
  const chapterTitleForCurrent =
    branchGeneration.payload.chapterTitle ??
    chapterTitles[currentChapter - 1] ??
    `Chapter ${currentChapter}`;

  input.beat.chapterLabel = chapterTitleForCurrent;
  input.beat.metadata = {
    ...input.beat.metadata,
    runtimeChapterNumber: currentChapter,
    runtimeSceneIndex: readBeatSceneIndex(input.beat),
    runtimeGeneratedChoices: true,
    runtimeChapterSceneCount: chapterSceneCount,
    runtimeChapterWordCount: chapterWordCount,
    runtimeChapterReadyForAdvance:
      chapterSceneCount >= MIN_CHAPTER_SCENES && chapterWordCount >= MIN_CHAPTER_WORDS,
    runtimeBranchSource: branchGeneration.sourceLabel,
    runtimeBranchModel: branchGeneration.model ?? null,
    runtimeBranchFallbackReason: branchGeneration.fallbackReason ?? null,
  };
  input.beat.updatedAt = nowIso();

  const createdChoiceIds: string[] = [];
  let beatOrderCursor = maxBeatOrder;
  let choiceOrderCursor = nextChoiceOrderIndex(db, input.beat.id);

  for (const branchChoice of branchChoices) {
    let nextChapterNumber = currentChapter;
    const directive = branchChoice.chapterDirective ?? "stay";
    if (directive === "advance") {
      nextChapterNumber = Math.min(totalChapters, currentChapter + 1);
    } else if (directive === "finale") {
      nextChapterNumber = totalChapters;
    }
    if (currentChapter >= totalChapters) {
      nextChapterNumber = totalChapters;
    }

    const nextIsTerminal =
      currentChapter >= totalChapters || directive === "finale";
    const nextChapterLabel =
      chapterTitles[nextChapterNumber - 1] ??
      `Chapter ${nextChapterNumber}`;
    const beatId = createId("beat");
    beatOrderCursor += 10;

    const nextBeat: StoryBeatRecord = {
      id: beatId,
      versionId: input.chronicle.versionId,
      slug: `runtime-${trimForSlug(input.chronicle.id, 20)}-${trimForSlug(branchChoice.nextBeatTitle, 28)}-${beatId.slice(-6)}`,
      title: branchChoice.nextBeatTitle,
      sceneSubtitle: null,
      chapterLabel: nextChapterLabel,
      summary: branchChoice.nextBeatSummary,
      narration: branchChoice.nextBeatSummary,
      atmosphere: branchChoice.nextBeatAtmosphere ?? null,
      allowsGuidedAction: !nextIsTerminal,
      guidedActionPrompt: !nextIsTerminal
        ? "Type a short intent to flavor this route choice while staying on canon rails."
        : null,
      allowedActionTags: normalizeIntentTags(
        branchChoice.intentTags,
        `${branchChoice.label} ${branchChoice.description}`,
      ),
      fallbackChoiceId: null,
      beatType: input.beat.beatType,
      orderIndex: beatOrderCursor,
      isTerminal: nextIsTerminal,
      metadata: {
        origin: "ai_runtime",
        generatedFromBeatId: input.beat.id,
        generatedFromRunId: input.run.id,
        generatedFromChronicleId: input.chronicle.id,
        runtimeChapterNumber: nextChapterNumber,
        runtimeSceneIndex: readBeatSceneIndex(input.beat) + 1,
        branchDirective: directive,
        branchSource: branchGeneration.sourceLabel,
        branchModel: branchGeneration.model ?? null,
      },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.storyBeats.push(nextBeat);

    const choiceId = createId("choice");
    const choice: BeatChoiceRecord = {
      id: choiceId,
      beatId: input.beat.id,
      label: branchChoice.label,
      internalKey: `runtime_${trimForSlug(branchChoice.label, 32)}`,
      description: branchChoice.description,
      orderIndex: choiceOrderCursor,
      nextBeatId: nextBeat.id,
      intentTags: normalizeIntentTags(
        branchChoice.intentTags,
        `${branchChoice.label} ${branchChoice.description}`,
      ),
      consequenceScope: "perspective",
      gatingRules: [],
      consequences: [
        {
          scope: "perspective",
          key: "route_last_choice",
          value: branchChoice.label,
        },
        {
          scope: "perspective",
          key: "route_last_choice_tag",
          value:
            normalizeIntentTags(
              branchChoice.intentTags,
              `${branchChoice.label} ${branchChoice.description}`,
            )[0] ?? "observe",
        },
      ],
      metadata: {
        origin: "ai_runtime",
        branchDirective: directive,
        branchSource: branchGeneration.sourceLabel,
        branchModel: branchGeneration.model ?? null,
        branchFallbackReason: branchGeneration.fallbackReason ?? null,
      },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.beatChoices.push(choice);
    createdChoiceIds.push(choiceId);
    choiceOrderCursor += 1;
  }

  if (createdChoiceIds.length) {
    input.beat.fallbackChoiceId = createdChoiceIds[0];
    input.beat.allowedActionTags = Array.from(
      new Set(
        db.beatChoices
          .filter((choice) => createdChoiceIds.includes(choice.id))
          .flatMap((choice) => choice.intentTags),
      ),
    ).slice(0, 8);
  }

  addCanonicalEvent(db, {
    chronicleId: input.chronicle.id,
    perspectiveRunId: input.run.id,
    beatId: input.beat.id,
    eventType: "route_change",
    summary: `Runtime branch committed with ${createdChoiceIds.length} choices.`,
    payload: {
      choiceCount: createdChoiceIds.length,
      branchSource: branchGeneration.sourceLabel,
      branchModel: branchGeneration.model ?? null,
      branchFallbackReason: branchGeneration.fallbackReason ?? null,
      chapterNumber: currentChapter,
      chapterSceneCount,
      chapterWordCount,
      chapterReadyForAdvance:
        chapterSceneCount >= MIN_CHAPTER_SCENES && chapterWordCount >= MIN_CHAPTER_WORDS,
      totalChapters,
    },
  });
}

function lockEmergentCanonCandidates(
  db: LocalStoryDb,
  input: {
    chronicle: ChronicleRecord;
    run: PerspectiveRunRecord;
    beat: StoryBeatRecord;
    sceneId: string;
    resolutionSource: "run_start" | "explicit_choice" | "guided_action";
    selectedChoiceLabel?: string | null;
    payload: GeneratedScenePayload;
    sourceLabel: string;
    model?: string;
    fallbackReason?: string;
  },
) {
  const candidates = input.payload.emergentCanonCandidates ?? [];
  if (!candidates.length) {
    return 0;
  }

  const versionId = input.chronicle.versionId;
  const seenTitles = new Set(
    db.storyCanonEntries
      .filter((entry) => {
        if (entry.versionId !== versionId) {
          return false;
        }

        const origin = readMetadataString(entry.metadata, "origin");
        if (origin !== "ai_emergent_locked") {
          return true;
        }

        return (
          readMetadataString(entry.metadata, "sourceChronicleId") === input.chronicle.id
        );
      })
      .map((entry) => `${entry.entryType}|${entry.title.trim().toLowerCase()}`),
  );
  let lockedCount = 0;

  for (const candidate of candidates) {
    if (lockedCount >= MAX_EMERGENT_CANON_PER_SCENE) {
      break;
    }
    if (candidate.confidence === "low") {
      continue;
    }

    const title = candidate.title.trim().slice(0, 140);
    const body = candidate.body.trim().slice(0, 700);
    if (title.length < 3 || body.length < MIN_EMERGENT_CANON_BODY_LENGTH) {
      continue;
    }

    const dedupeKey = `${candidate.entryType}|${title.toLowerCase()}`;
    if (seenTitles.has(dedupeKey)) {
      continue;
    }

    const canonKey = ensureUniqueCanonKey(
      db,
      versionId,
      candidate.canonKey ?? title,
      candidate.entryType,
    );
    const entry = {
      id: createId("canon"),
      versionId,
      entryType: candidate.entryType,
      canonKey,
      title,
      body,
      isContradictionSensitive: true,
      metadata: {
        origin: "ai_emergent_locked",
        sourceLabel: input.sourceLabel,
        sourceSceneId: input.sceneId,
        sourceBeatId: input.beat.id,
        sourceRunId: input.run.id,
        sourceChronicleId: input.chronicle.id,
        confidence: candidate.confidence ?? "medium",
        selectedChoiceLabel: input.selectedChoiceLabel ?? null,
        resolutionSource: input.resolutionSource,
        model: input.model ?? null,
        fallbackReason: input.fallbackReason ?? null,
      },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.storyCanonEntries.push(entry);
    seenTitles.add(dedupeKey);
    lockedCount += 1;

    addCanonicalEvent(db, {
      chronicleId: input.chronicle.id,
      perspectiveRunId: input.run.id,
      beatId: input.beat.id,
      eventType: "world_change",
      summary: `Canon locked from scene: ${entry.title}.`,
      payload: {
        canonEntryId: entry.id,
        canonKey: entry.canonKey,
        entryType: entry.entryType,
        sourceSceneId: input.sceneId,
        origin: "ai_emergent_locked",
      },
    });
  }

  return lockedCount;
}

async function addGeneratedScene(
  db: LocalStoryDb,
  input: {
    chronicle: ChronicleRecord;
    run: PerspectiveRunRecord;
    worldTitle: string;
    worldTone: string;
    worldSynopsis: string;
    versionLabel: string;
    characterName: string;
    characterSummary: string;
    beat: StoryBeatRecord;
    viewpointLabel: string;
    selectedChoiceLabel?: string | null;
    actionNote?: string | null;
    resolutionSource: "run_start" | "explicit_choice" | "guided_action";
  },
) {
  const canonEntries = getChronicleCanonEntriesForGeneration(db, {
    chronicle: input.chronicle,
  });
  const globalState = toPublicGlobalStateForGeneration(db, input.chronicle.id);
  const perspectiveState = groupByPerspectiveState(db, input.run.id).map((entry) => ({
    key: entry.stateKey,
    value: entry.stateValue,
  }));
  const knowledgeState = groupByPerspectiveKnowledge(db, input.run.id).map((entry) => ({
    key: entry.flagKey,
    status: entry.status,
  }));
  const recentEvents = db.canonicalEventLog
    .filter((event) => event.chronicleId === input.chronicle.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .map((event) => ({
      eventType: event.eventType,
      summary: event.summary,
    }));
  const availableChoices = listAvailableChoicesForBeat(db, {
    beatId: input.beat.id,
    chronicleId: input.chronicle.id,
    runId: input.run.id,
  }).map((choice) => ({
    label: choice.label,
    description: choice.description,
  }));
  const continuityContext = buildRecentSceneProseContext(db, {
    perspectiveRunId: input.run.id,
    chapterLabel: input.beat.chapterLabel,
  });

  const generation = await generateNarrativeScene({
    worldTitle: input.worldTitle,
    worldTone: input.worldTone,
    worldSynopsis: input.worldSynopsis,
    versionLabel: input.versionLabel,
    viewpointLabel: input.viewpointLabel,
    characterName: input.characterName,
    characterSummary: input.characterSummary,
    beatTitle: input.beat.title,
    beatSubtitle: input.beat.sceneSubtitle,
    beatSummary: input.beat.summary,
    beatNarration: input.beat.narration,
    beatAtmosphere: input.beat.atmosphere,
    beatType: input.beat.beatType,
    chapterLabel: input.beat.chapterLabel,
    selectedChoiceLabel: input.selectedChoiceLabel ?? null,
    actionNote: normalizeActionNote(input.actionNote),
    resolutionSource: input.resolutionSource,
    canonEntries,
    globalState,
    perspectiveState,
    knowledgeState,
    recentEvents,
    availableChoices,
    recentSceneProse: continuityContext.recentSceneProse,
    chapterSceneIndex: continuityContext.chapterSceneIndex,
    routeSceneIndex: continuityContext.routeSceneIndex,
  });

  const sceneMetadata: Record<string, JsonValue> = {
    ...scenePayloadToMetadata(generation.payload),
    generationMode: generation.mode,
    model: generation.model ?? null,
    fallbackReason: generation.fallbackReason ?? null,
    selectedChoiceLabel: input.selectedChoiceLabel ?? null,
    actionNote: normalizeActionNote(input.actionNote),
    resolutionSource: input.resolutionSource,
    beatType: input.beat.beatType,
    chapterLabel: input.beat.chapterLabel,
    chapterSceneIndex: continuityContext.chapterSceneIndex,
    routeSceneIndex: continuityContext.routeSceneIndex,
    recentSceneContextCount: continuityContext.recentSceneProse.length,
  };

  const sceneRecord = {
    id: createId("scene"),
    chronicleId: input.chronicle.id,
    perspectiveRunId: input.run.id,
    beatId: input.beat.id,
    sceneText: generation.payload.sceneText,
    sourceLabel: generation.sourceLabel,
    metadata: sceneMetadata,
    createdAt: nowIso(),
  };
  db.generatedScenes.push(sceneRecord);

  upsertChapterRecordForScene(db, {
    chronicle: input.chronicle,
    run: input.run,
    beat: input.beat,
    sceneId: sceneRecord.id,
    sceneText: sceneRecord.sceneText,
    sourceLabel: sceneRecord.sourceLabel,
  });

  const lockedCanonCount = lockEmergentCanonCandidates(db, {
    chronicle: input.chronicle,
    run: input.run,
    beat: input.beat,
    sceneId: sceneRecord.id,
    resolutionSource: input.resolutionSource,
    selectedChoiceLabel: input.selectedChoiceLabel,
    payload: generation.payload,
    sourceLabel: generation.sourceLabel,
    model: generation.model,
    fallbackReason: generation.fallbackReason,
  });
  sceneMetadata.lockedCanonCount = lockedCanonCount;
}

function listAvailableChoicesForBeat(
  db: LocalStoryDb,
  input: {
    beatId: string;
    chronicleId: string;
    runId: string;
  },
) {
  const globalState = toStateMap(groupByChronicleStates(db, input.chronicleId));
  const perspectiveState = toStateMap(groupByPerspectiveState(db, input.runId));
  const knowledgeState = toKnowledgeMap(groupByPerspectiveKnowledge(db, input.runId));
  const choicesForBeat = db.beatChoices
    .filter((choice) => choice.beatId === input.beatId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const runtimeChoices = choicesForBeat.filter(
    (choice) => readMetadataString(choice.metadata, "origin") === "ai_runtime",
  );
  const sourceChoices =
    isProceduralChronicle(db, input.chronicleId) && runtimeChoices.length
      ? runtimeChoices
      : choicesForBeat;

  return sourceChoices
    .filter((choice) =>
      choiceIsAvailable(choice, globalState, perspectiveState, knowledgeState),
    );
}

async function applyChoiceTransition(
  db: LocalStoryDb,
  input: {
    chronicle: ChronicleRecord;
    run: PerspectiveRunRecord;
    viewpoint: { id: string; label: string };
    world: { title: string; tone: string; synopsis: string };
    version: { versionLabel: string };
    character: { name: string; summary: string };
    currentBeat: StoryBeatRecord;
    choice: BeatChoiceRecord;
    resolutionSource: "explicit_choice" | "guided_action";
    guidedActionText?: string;
    actionNote?: string | null;
  },
) {
  for (const consequence of input.choice.consequences) {
    if (consequence.scope === "global") {
      upsertChronicleState(
        db,
        input.chronicle.id,
        consequence.key,
        consequence.value,
      );
    } else if (consequence.scope === "perspective") {
      upsertPerspectiveState(db, input.run.id, consequence.key, consequence.value);
    } else {
      upsertKnowledge(db, input.run.id, consequence.key, consequence.value);
    }
  }

  const nextBeat = input.choice.nextBeatId
    ? db.storyBeats.find(
        (beat) =>
          beat.id === input.choice.nextBeatId &&
          beat.versionId === input.chronicle.versionId,
      )
    : null;

  if (!nextBeat) {
    throw new Error("Choice is missing a valid next beat.");
  }

  input.run.currentBeatId = nextBeat.id;
  input.run.lastActiveAt = nowIso();
  if (nextBeat.isTerminal) {
    input.run.status = "completed";
    input.run.completedAt = nowIso();
    input.run.summary = `Completed at scene "${nextBeat.title}".`;
  }
  input.chronicle.lastActiveAt = nowIso();

  addCanonicalEvent(db, {
    chronicleId: input.chronicle.id,
    perspectiveRunId: input.run.id,
    beatId: input.currentBeat.id,
    choiceId: input.choice.id,
    eventType:
      input.choice.consequenceScope === "global"
        ? "world_change"
        : input.choice.consequenceScope === "knowledge"
          ? "knowledge_reveal"
          : "route_change",
    summary:
      input.resolutionSource === "guided_action"
        ? `Guided action mapped to: ${input.choice.label}`
        : `Choice resolved: ${input.choice.label}`,
    payload: {
      fromBeatId: input.currentBeat.id,
      toBeatId: nextBeat.id,
      resolutionSource: input.resolutionSource,
      guidedActionText: input.guidedActionText ?? null,
      actionNote: normalizeActionNote(input.actionNote),
    },
  });

  await addGeneratedScene(db, {
    chronicle: input.chronicle,
    run: input.run,
    worldTitle: input.world.title,
    worldTone: input.world.tone,
    worldSynopsis: input.world.synopsis,
    versionLabel: input.version.versionLabel,
    characterName: input.character.name,
    characterSummary: input.character.summary,
    beat: nextBeat,
    viewpointLabel: input.viewpoint.label,
    selectedChoiceLabel: input.choice.label,
    actionNote: input.actionNote ?? input.guidedActionText ?? null,
    resolutionSource:
      input.resolutionSource === "guided_action" ? "guided_action" : "explicit_choice",
  });

  if (input.run.status === "completed") {
    const unlockState = getChroniclePerspectiveUnlockState(db, input.chronicle.id);
    if (!unlockState.firstReadComplete) {
      upsertChronicleInternalState(
        db,
        input.chronicle.id,
        CHRONICLE_FIRST_READ_COMPLETE_KEY,
        true,
      );
      upsertChronicleInternalState(
        db,
        input.chronicle.id,
        CHRONICLE_FIRST_COMPLETED_RUN_KEY,
        input.run.id,
      );
      addCanonicalEvent(db, {
        chronicleId: input.chronicle.id,
        perspectiveRunId: input.run.id,
        beatId: nextBeat.id,
        eventType: "system",
        summary:
          "First full perspective run completed. Additional viewpoints are now unlocked.",
      });
    }
  } else {
    await ensureProceduralChoicesForBeat(db, {
      chronicle: input.chronicle,
      run: input.run,
      world: input.world,
      version: input.version,
      viewpoint: input.viewpoint,
      character: input.character,
      beat: nextBeat,
    });
  }

  return {
    runId: input.run.id,
    chronicleId: input.chronicle.id,
    nextBeatId: nextBeat.id,
    runCompleted: input.run.status === "completed",
    nextBeat,
  };
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

export async function resyncStructuredStoryProjection() {
  return withDbMutation((db) => ({
    chronicles: db.chronicles.length,
    runs: db.perspectiveRuns.length,
    beats: db.storyBeats.length,
    choices: db.beatChoices.length,
    chapters: db.storyChapters.length,
    scenes: db.generatedScenes.length,
  }));
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

    upsertChronicleInternalState(
      db,
      chronicle.id,
      CHRONICLE_RUNTIME_MODE_KEY,
      CHRONICLE_MODE_PROCEDURAL,
    );
    upsertChronicleInternalState(
      db,
      chronicle.id,
      CHRONICLE_FIRST_READ_COMPLETE_KEY,
      false,
    );

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

      const fullViewpointCount = db.playableViewpoints.filter(
        (viewpoint) => viewpoint.versionId === version.id && viewpoint.isPlayable,
      ).length;
      const unlockState = getChroniclePerspectiveUnlockState(db, chronicle.id);
      const firstPlayableViewpointId = db.playableViewpoints
        .filter((viewpoint) => viewpoint.versionId === version.id && viewpoint.isPlayable)
        .sort((a, b) => a.orderIndex - b.orderIndex)[0]?.id;
      const visibleViewpointId =
        unlockState.primaryViewpointId ?? firstPlayableViewpointId ?? null;
      const viewpointCount = unlockState.firstReadComplete
        ? fullViewpointCount
        : Math.min(1, fullViewpointCount);

      const runs = db.perspectiveRuns
        .filter((run) => {
          if (run.chronicleId !== chronicle.id) {
            return false;
          }
          if (unlockState.firstReadComplete) {
            return true;
          }

          return run.viewpointId === visibleViewpointId;
        })
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

      const completedRunCount = runs.filter(
        (entry) => entry.run.status === "completed",
      ).length;
      const worldStateCount = listPublicChronicleStates(db, chronicle.id).length;
      const recentEvents = db.canonicalEventLog
        .filter((event) => event.chronicleId === chronicle.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3);

      return {
        chronicle,
        world,
        version,
        viewpointCount,
        completedRunCount,
        worldStateCount,
        recentEvents,
        runs,
      };
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
  const unlockState = getChroniclePerspectiveUnlockState(db, chronicle.id);
  const chronicleViewpoints = db.playableViewpoints
    .filter((viewpoint) => viewpoint.versionId === chronicle.versionId && viewpoint.isPlayable)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const defaultRevealedViewpointId = chronicleViewpoints[0]?.id ?? null;
  const revealedViewpointId =
    unlockState.primaryViewpointId ?? defaultRevealedViewpointId;

  const worldState = listPublicChronicleStates(db, chronicle.id);
  const runs = db.perspectiveRuns
    .filter((run) => {
      if (run.chronicleId !== chronicle.id) {
        return false;
      }
      if (unlockState.firstReadComplete) {
        return true;
      }

      return run.viewpointId === revealedViewpointId;
    })
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
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => b.run.lastActiveAt.localeCompare(a.run.lastActiveAt));

  const revealedViewpoints = chronicleViewpoints.filter((viewpoint) => {
    if (unlockState.firstReadComplete) {
      return true;
    }

    return viewpoint.id === revealedViewpointId;
  });

  const viewpointProgress = revealedViewpoints
    .map((viewpoint) => {
      const character = db.storyCharacters.find((entry) => entry.id === viewpoint.characterId);
      if (!character) {
        return null;
      }

      const existingRun = runs.find((entry) => entry.run.viewpointId === viewpoint.id);
      return {
        viewpoint,
        character,
        run: existingRun?.run ?? null,
        beat: existingRun?.beat ?? null,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const recentEvents = db.canonicalEventLog
    .filter((event) => event.chronicleId === chronicle.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);
  const totalChapterCount = getChronicleTotalChapterCount(db, chronicle.id);

  return {
    chronicle,
    world,
    version,
    worldState,
    runs,
    viewpointProgress,
    recentEvents,
    unlockState: {
      firstReadComplete: unlockState.firstReadComplete,
      totalChapterCount,
      primaryViewpointId: unlockState.primaryViewpointId,
    },
  };
}

export async function createPerspectiveRunForUser(input: {
  userId: string;
  chronicleId: string;
  viewpointId: string;
}) {
  return withDbMutation(async (db) => {
    const chronicle = assertChronicleForUser(db, input.chronicleId, input.userId);
    const viewpoint = assertViewpointExists(db, input.viewpointId);
    const world = assertWorldExists(db, chronicle.worldId);
    const version = assertVersionExists(db, chronicle.versionId);
    const character = db.storyCharacters.find((entry) => entry.id === viewpoint.characterId);
    if (!character) {
      throw new Error("Perspective character not found.");
    }
    if (viewpoint.versionId !== chronicle.versionId) {
      throw new Error("Selected viewpoint does not belong to this Chronicle version.");
    }

    const existing = db.perspectiveRuns.find(
      (run) => run.chronicleId === chronicle.id && run.viewpointId === viewpoint.id,
    );
    if (existing) {
      return existing;
    }

    const unlockState = getChroniclePerspectiveUnlockState(db, chronicle.id);
    const firstPlayableViewpointId = db.playableViewpoints
      .filter((entry) => entry.versionId === chronicle.versionId && entry.isPlayable)
      .sort((a, b) => a.orderIndex - b.orderIndex)[0]?.id;
    if (
      !unlockState.firstReadComplete &&
      unlockState.primaryViewpointId &&
      unlockState.primaryViewpointId !== viewpoint.id
    ) {
      throw new Error(
        "Additional viewpoints unlock after your first full perspective read-through.",
      );
    }
    if (
      !unlockState.firstReadComplete &&
      !unlockState.primaryViewpointId &&
      firstPlayableViewpointId &&
      viewpoint.id !== firstPlayableViewpointId
    ) {
      throw new Error(
        "This perspective remains hidden until the first Chronicle read-through is complete.",
      );
    }

    if (!unlockState.firstReadComplete && !unlockState.primaryViewpointId) {
      upsertChronicleInternalState(
        db,
        chronicle.id,
        CHRONICLE_PRIMARY_VIEWPOINT_KEY,
        viewpoint.id,
      );
    }

    ensureChronicleProceduralPlan(db, {
      chronicle,
      world,
      version,
    });

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

    const isProcedural = isProceduralChronicle(db, chronicle.id);
    let runStartBeat = startBeat;
    if (isProcedural) {
      const chapterTitles = readChronicleStateStringList(
        db,
        chronicle.id,
        CHRONICLE_CHAPTER_TITLES_KEY,
      );
      const openingChapterLabel = chapterTitles[0] ?? "Chapter 1";
      const runtimeBeatId = createId("beat");
      const runtimeOpeningBeat: StoryBeatRecord = {
        ...startBeat,
        id: runtimeBeatId,
        slug: `runtime-open-${trimForSlug(chronicle.id, 16)}-${runtimeBeatId.slice(-6)}`,
        chapterLabel: openingChapterLabel,
        allowsGuidedAction: true,
        guidedActionPrompt:
          startBeat.guidedActionPrompt ??
          "Type a short intent and Inkbranch will map it to a committed route choice.",
        allowedActionTags: startBeat.allowedActionTags.length
          ? startBeat.allowedActionTags
          : ["investigate", "observe", "secure"],
        fallbackChoiceId: null,
        orderIndex: nextOrderIndex(db.storyBeats.map((beat) => beat.orderIndex)),
        metadata: {
          ...startBeat.metadata,
          origin: "ai_runtime_opening",
          generatedFromBeatId: startBeat.id,
          generatedFromChronicleId: chronicle.id,
          generatedFromRunId: null,
          runtimeChapterNumber: 1,
          runtimeSceneIndex: 1,
        },
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.storyBeats.push(runtimeOpeningBeat);
      runStartBeat = runtimeOpeningBeat;
    }

    const run: PerspectiveRunRecord = {
      id: createId("run"),
      chronicleId: chronicle.id,
      viewpointId: viewpoint.id,
      currentBeatId: runStartBeat.id,
      status: "active",
      summary: null,
      startedAt: nowIso(),
      lastActiveAt: nowIso(),
      completedAt: null,
    };
    db.perspectiveRuns.push(run);

    if (isProcedural) {
      runStartBeat.metadata = {
        ...runStartBeat.metadata,
        generatedFromRunId: run.id,
      };
      runStartBeat.updatedAt = nowIso();
    }

    upsertPerspectiveState(db, run.id, "viewpoint_label", viewpoint.label);

    await addGeneratedScene(db, {
      chronicle,
      run,
      worldTitle: world.title,
      worldTone: world.tone,
      worldSynopsis: world.synopsis,
      versionLabel: version.versionLabel,
      characterName: character.name,
      characterSummary: character.summary,
      beat: runStartBeat,
      viewpointLabel: viewpoint.label,
      resolutionSource: "run_start",
    });

    await ensureProceduralChoicesForBeat(db, {
      chronicle,
      run,
      world,
      version,
      viewpoint,
      character,
      beat: runStartBeat,
    });

    addCanonicalEvent(db, {
      chronicleId: chronicle.id,
      perspectiveRunId: run.id,
      beatId: runStartBeat.id,
      eventType: "route_change",
      summary: `Perspective run started: ${viewpoint.label}.`,
      payload: { viewpointId: viewpoint.id },
    });

    chronicle.lastActiveAt = nowIso();
    return run;
  });
}

function buildPerspectiveRunContextSnapshot(
  db: LocalStoryDb,
  input: {
    userId: string;
    chronicleId: string;
    runId: string;
  },
) {
  const { chronicle, run } = assertPerspectiveRunForUser(db, input);
  const world = assertWorldExists(db, chronicle.worldId);
  const version = assertVersionExists(db, chronicle.versionId);
  const viewpoint = assertViewpointExists(db, run.viewpointId);
  const character = db.storyCharacters.find((entry) => entry.id === viewpoint.characterId);
  if (!character) {
    throw new Error("Perspective character not found.");
  }

  const beat = assertBeatExists(db, run.currentBeatId);
  const choices = listAvailableChoicesForBeat(db, {
    beatId: beat.id,
    chronicleId: chronicle.id,
    runId: run.id,
  });
  const globalStateEntries = listPublicChronicleStates(db, chronicle.id);
  const perspectiveStateEntries = groupByPerspectiveState(db, run.id);
  const knowledgeEntries = groupByPerspectiveKnowledge(db, run.id);
  const unlockState = getChroniclePerspectiveUnlockState(db, chronicle.id);

  const sceneHistory = db.generatedScenes
    .filter((scene) => scene.perspectiveRunId === run.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const otherRuns = db.perspectiveRuns
    .filter((otherRun) => {
      if (otherRun.chronicleId !== chronicle.id || otherRun.id === run.id) {
        return false;
      }

      return unlockState.firstReadComplete;
    })
    .map((otherRun) => {
      const otherViewpoint = db.playableViewpoints.find(
        (entry) => entry.id === otherRun.viewpointId,
      );
      const otherCharacter = otherViewpoint
        ? db.storyCharacters.find((entry) => entry.id === otherViewpoint.characterId)
        : null;
      const otherBeat = db.storyBeats.find((entry) => entry.id === otherRun.currentBeatId);
      if (!otherViewpoint || !otherCharacter || !otherBeat) return null;

      return {
        run: otherRun,
        viewpoint: otherViewpoint,
        character: otherCharacter,
        beat: otherBeat,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => b.run.lastActiveAt.localeCompare(a.run.lastActiveAt));

  const recentChronicleEvents = db.canonicalEventLog
    .filter((event) => event.chronicleId === chronicle.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
  const totalChapterCount = getChronicleTotalChapterCount(db, chronicle.id);
  const activeChapter = db.storyChapters.find(
    (chapter) =>
      chapter.perspectiveRunId === run.id &&
      chapter.chapterNumber === readBeatChapterNumber(beat),
  );

  return {
    chronicle,
    world,
    version,
    run,
    viewpoint,
    character,
    beat,
    choices,
    globalStateEntries,
    perspectiveStateEntries,
    knowledgeEntries,
    sceneHistory,
    otherRuns,
    recentChronicleEvents,
    bookPlan: {
      totalChapterCount,
      currentChapterNumber: readBeatChapterNumber(beat),
      currentSceneIndex: readBeatSceneIndex(beat),
      firstReadComplete: unlockState.firstReadComplete,
      chapterWordCount: activeChapter?.wordCount ?? null,
      chapterSceneCount: activeChapter?.sceneCount ?? null,
      chapterReady: activeChapter?.isReady ?? false,
    },
  };
}

export async function getPerspectiveRunContextForUser(input: {
  userId: string;
  chronicleId: string;
  runId: string;
}) {
  const initialDb = await ensureDbLoaded();
  const initialSnapshot = buildPerspectiveRunContextSnapshot(initialDb, input);
  const shouldGenerateChoices =
    isProceduralChronicle(initialDb, initialSnapshot.chronicle.id) &&
    initialSnapshot.run.status === "active" &&
    !initialSnapshot.beat.isTerminal &&
    initialSnapshot.choices.length === 0;

  if (!shouldGenerateChoices) {
    return initialSnapshot;
  }

  await withDbMutation(async (db) => {
    const { chronicle, run } = assertPerspectiveRunForUser(db, input);
    const world = assertWorldExists(db, chronicle.worldId);
    const version = assertVersionExists(db, chronicle.versionId);
    const viewpoint = assertViewpointExists(db, run.viewpointId);
    const character = db.storyCharacters.find((entry) => entry.id === viewpoint.characterId);
    if (!character) {
      throw new Error("Perspective character not found.");
    }
    const beat = assertBeatExists(db, run.currentBeatId);
    const currentChoices = listAvailableChoicesForBeat(db, {
      beatId: beat.id,
      chronicleId: chronicle.id,
      runId: run.id,
    });
    if (currentChoices.length > 0) {
      return;
    }

    await ensureProceduralChoicesForBeat(db, {
      chronicle,
      run,
      world,
      version,
      viewpoint,
      character,
      beat,
    });
  });

  const refreshedDb = await ensureDbLoaded();
  return buildPerspectiveRunContextSnapshot(refreshedDb, input);
}

export async function applyChoiceForUser(input: {
  userId: string;
  chronicleId: string;
  runId: string;
  choiceId: string;
  actionNote?: string;
}) {
  return withDbMutation(async (db) => {
    const { chronicle, run } = assertPerspectiveRunForUser(db, input);
    const viewpoint = assertViewpointExists(db, run.viewpointId);
    const world = assertWorldExists(db, chronicle.worldId);
    const version = assertVersionExists(db, chronicle.versionId);
    const character = db.storyCharacters.find((entry) => entry.id === viewpoint.characterId);
    if (!character) {
      throw new Error("Perspective character not found.");
    }
    const currentBeat = assertBeatExists(db, run.currentBeatId);

    const choice = db.beatChoices.find(
      (entry) => entry.id === input.choiceId && entry.beatId === currentBeat.id,
    );
    if (!choice) {
      throw new Error("Choice is not valid for the current beat.");
    }

    const availableChoices = listAvailableChoicesForBeat(db, {
      beatId: currentBeat.id,
      chronicleId: chronicle.id,
      runId: run.id,
    });
    if (!availableChoices.some((entry) => entry.id === choice.id)) {
      throw new Error("Choice is currently gated by story state.");
    }

    const result = await applyChoiceTransition(db, {
      chronicle,
      run,
      viewpoint,
      world,
      version,
      character,
      currentBeat,
      choice,
      resolutionSource: "explicit_choice",
      actionNote: normalizeActionNote(input.actionNote),
    });

    return {
      runId: result.runId,
      chronicleId: result.chronicleId,
      nextBeatId: result.nextBeatId,
      runCompleted: result.runCompleted,
      choiceId: choice.id,
      choiceLabel: choice.label,
    };
  });
}

export async function applyGuidedActionForUser(input: {
  userId: string;
  chronicleId: string;
  runId: string;
  actionText: string;
}) {
  return withDbMutation(async (db) => {
    const { chronicle, run } = assertPerspectiveRunForUser(db, input);
    const viewpoint = assertViewpointExists(db, run.viewpointId);
    const world = assertWorldExists(db, chronicle.worldId);
    const version = assertVersionExists(db, chronicle.versionId);
    const character = db.storyCharacters.find((entry) => entry.id === viewpoint.characterId);
    if (!character) {
      throw new Error("Perspective character not found.");
    }
    const currentBeat = assertBeatExists(db, run.currentBeatId);

    if (!currentBeat.allowsGuidedAction) {
      throw new Error("Guided actions are not enabled for this scene.");
    }

    const actionText = input.actionText.trim();
    if (!actionText) {
      throw new Error("Action text is required.");
    }
    if (actionText.length > GUIDED_ACTION_TEXT_LIMIT) {
      throw new Error(
        `Action text is too long. Keep it under ${GUIDED_ACTION_TEXT_LIMIT} characters.`,
      );
    }

    const availableChoices = listAvailableChoicesForBeat(db, {
      beatId: currentBeat.id,
      chronicleId: chronicle.id,
      runId: run.id,
    });
    if (!availableChoices.length) {
      throw new Error("No actions are available for the current scene.");
    }

    const allowedTags = currentBeat.allowedActionTags;
    const inferredTag = inferGuidedTag(actionText, allowedTags);
    const actionTokens = tokenizeGuidedAction(actionText);
    const scoredChoices = availableChoices
      .map((choice) => ({
        choice,
        score: scoreGuidedChoice(actionTokens, choice, inferredTag),
      }))
      .sort((a, b) => b.score - a.score);

    const fallbackChoice = currentBeat.fallbackChoiceId
      ? availableChoices.find((choice) => choice.id === currentBeat.fallbackChoiceId) ?? null
      : null;

    const mappedChoice =
      scoredChoices[0]?.score > 0
        ? scoredChoices[0].choice
        : fallbackChoice;

    if (!mappedChoice) {
      return {
        runId: run.id,
        chronicleId: chronicle.id,
        runCompleted: run.status === "completed",
        accepted: false,
        message:
          "That action is not currently supported in this scene. Try one of the guided action styles shown below.",
      };
    }

    const result = await applyChoiceTransition(db, {
      chronicle,
      run,
      viewpoint,
      world,
      version,
      character,
      currentBeat,
      choice: mappedChoice,
      resolutionSource: "guided_action",
      guidedActionText: actionText,
    });

    return {
      runId: result.runId,
      chronicleId: result.chronicleId,
      nextBeatId: result.nextBeatId,
      runCompleted: result.runCompleted,
      accepted: true,
      mappedChoiceId: mappedChoice.id,
      mappedChoiceLabel: mappedChoice.label,
      inferredTag,
      usedFallback: Boolean(
        fallbackChoice && mappedChoice.id === fallbackChoice.id && scoredChoices[0]?.score <= 0,
      ),
    };
  });
}

export async function listViewpointsForChronicle(input: {
  userId: string;
  chronicleId: string;
}) {
  const db = await ensureDbLoaded();
  const chronicle = assertChronicleForUser(db, input.chronicleId, input.userId);
  const chronicleStateMap = toStateMap(groupByChronicleStates(db, chronicle.id));
  const unlockState = getChroniclePerspectiveUnlockState(db, chronicle.id);

  const allViewpoints = db.playableViewpoints
    .filter((viewpoint) => viewpoint.versionId === chronicle.versionId && viewpoint.isPlayable)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const defaultRevealedViewpointId = allViewpoints[0]?.id ?? null;
  const revealedViewpointId =
    unlockState.primaryViewpointId ?? defaultRevealedViewpointId;
  const visibleViewpoints = allViewpoints.filter((viewpoint) => {
    if (unlockState.firstReadComplete) {
      return true;
    }

    return viewpoint.id === revealedViewpointId;
  });

  return visibleViewpoints
    .map((viewpoint) => {
      const character = db.storyCharacters.find((entry) => entry.id === viewpoint.characterId);
      if (!character) return null;

      const existingRun = db.perspectiveRuns.find(
        (run) => run.chronicleId === chronicle.id && run.viewpointId === viewpoint.id,
      );

      const startBeat =
        (viewpoint.startBeatId
          ? db.storyBeats.find((beat) => beat.id === viewpoint.startBeatId)
          : null) ??
        db.storyBeats
          .filter((beat) => beat.versionId === chronicle.versionId)
          .sort((a, b) => a.orderIndex - b.orderIndex)[0];

      const startingChoices = startBeat
        ? db.beatChoices.filter((choice) => choice.beatId === startBeat.id)
        : [];
      const impactedChoiceCount = startingChoices.filter((choice) => {
        const globalGateRules = choice.gatingRules.filter(
          (rule) => rule.scope === "global",
        );
        if (!globalGateRules.length) {
          return false;
        }

        return !choiceIsAvailable(
          choice,
          chronicleStateMap,
          new Map(),
          new Map(),
        );
      }).length;

      const impactSummary =
        impactedChoiceCount > 0
          ? `${impactedChoiceCount} opening option${
              impactedChoiceCount === 1 ? "" : "s"
            } changed by Chronicle events.`
          : chronicleStateMap.size > 0
            ? "This route may reflect world changes already made in this Chronicle."
            : null;

      const routeEventCount = db.canonicalEventLog.filter((event) => {
        if (event.chronicleId !== chronicle.id || !existingRun) return false;
        return event.perspectiveRunId === existingRun.id;
      }).length;

      const revealHint =
        unlockState.firstReadComplete || viewpoint.id === revealedViewpointId
          ? null
          : "Complete your first perspective run to reveal this route.";

      return {
        viewpoint,
        character,
        existingRun,
        impactSummary,
        routeEventCount,
        revealHint,
        firstReadComplete: unlockState.firstReadComplete,
      };
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
  sceneSubtitle?: string;
  chapterLabel?: string;
  summary: string;
  narration: string;
  atmosphere?: string;
  allowsGuidedAction?: boolean;
  guidedActionPrompt?: string;
  allowedActionTags?: string[];
  fallbackChoiceId?: string;
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
      sceneSubtitle: readOptionalString(input.sceneSubtitle) ?? null,
      chapterLabel: readOptionalString(input.chapterLabel) ?? null,
      summary: input.summary.trim(),
      narration: input.narration.trim(),
      atmosphere: readOptionalString(input.atmosphere) ?? null,
      allowsGuidedAction: Boolean(input.allowsGuidedAction),
      guidedActionPrompt: readOptionalString(input.guidedActionPrompt) ?? null,
      allowedActionTags: normalizeTagList(input.allowedActionTags ?? []),
      fallbackChoiceId: readOptionalString(input.fallbackChoiceId) ?? null,
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
  sceneSubtitle?: string;
  chapterLabel?: string;
  summary: string;
  narration: string;
  atmosphere?: string;
  allowsGuidedAction?: boolean;
  guidedActionPrompt?: string;
  allowedActionTags?: string[];
  fallbackChoiceId?: string;
  orderIndex: number;
  isTerminal: boolean;
}) {
  return withDbMutation((db) => {
    const beat = assertBeatExists(db, input.beatId);
    beat.title = input.title.trim();
    beat.sceneSubtitle = readOptionalString(input.sceneSubtitle) ?? null;
    beat.chapterLabel = readOptionalString(input.chapterLabel) ?? null;
    beat.summary = input.summary.trim();
    beat.narration = input.narration.trim();
    beat.atmosphere = readOptionalString(input.atmosphere) ?? null;
    beat.allowsGuidedAction = Boolean(input.allowsGuidedAction);
    beat.guidedActionPrompt = readOptionalString(input.guidedActionPrompt) ?? null;
    beat.allowedActionTags = normalizeTagList(input.allowedActionTags ?? []);
    beat.fallbackChoiceId = readOptionalString(input.fallbackChoiceId) ?? null;
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
  intentTags?: string[];
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
      intentTags: normalizeTagList(input.intentTags ?? []),
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
  beatId: string;
  label: string;
  description?: string;
  intentTags?: string[];
  orderIndex: number;
  nextBeatId: string;
  consequenceScope: "global" | "perspective" | "knowledge";
  gatingRules?: ChoiceCondition[];
  consequences: ChoiceConsequence[];
}) {
  return withDbMutation((db) => {
    const choice = db.beatChoices.find((entry) => entry.id === input.choiceId);
    if (!choice) {
      throw new Error("Choice not found.");
    }

    const beat = assertBeatExists(db, input.beatId);
    const nextBeat = assertBeatExists(db, input.nextBeatId);
    if (nextBeat.versionId !== beat.versionId) {
      throw new Error("Next beat must belong to the same version as the source beat.");
    }

    choice.beatId = beat.id;
    choice.label = input.label.trim();
    choice.description = input.description?.trim() ?? null;
    choice.intentTags = normalizeTagList(input.intentTags ?? []);
    choice.orderIndex = input.orderIndex;
    choice.nextBeatId = nextBeat.id;
    choice.consequenceScope = input.consequenceScope;
    choice.gatingRules = input.gatingRules ?? [];
    choice.consequences = input.consequences;
    choice.updatedAt = nowIso();
    return choice;
  });
}
