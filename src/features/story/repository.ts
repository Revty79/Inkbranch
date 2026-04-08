import "server-only";

import { generateNarrativeScene } from "@/features/story/scene-generator";
import { storyRuntimeState } from "@/db/schema";
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
} from "@/types/story";
import { eq } from "drizzle-orm";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIRECTORY, "inkbranch.local.json");
const STORY_RUNTIME_KEY = "primary";
const GUIDED_ACTION_TEXT_LIMIT = 180;
const MAX_EMERGENT_CANON_PER_SCENE = 3;
const MIN_EMERGENT_CANON_BODY_LENGTH = 32;

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

function normalizeDbShape(db: LocalStoryDb): LocalStoryDb {
  return {
    ...db,
    storyBeats: db.storyBeats.map((beat) => normalizeStoryBeatRecord(beat)),
    beatChoices: db.beatChoices.map((choice) => normalizeBeatChoiceRecord(choice)),
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
  if (env.inkbranchStorageMode === "postgres") {
    await writeRuntimeStateToPostgres(dbCache);
    return;
  }

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
  const canonEntries = db.storyCanonEntries
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
  const globalState = groupByChronicleStates(db, input.chronicle.id).map((entry) => ({
    key: entry.stateKey,
    value: entry.stateValue,
  }));
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

  return db.beatChoices
    .filter((choice) => choice.beatId === input.beatId)
    .sort((a, b) => a.orderIndex - b.orderIndex)
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

      const viewpointCount = db.playableViewpoints.filter(
        (viewpoint) => viewpoint.versionId === version.id && viewpoint.isPlayable,
      ).length;

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

      const completedRunCount = runs.filter(
        (entry) => entry.run.status === "completed",
      ).length;
      const worldStateCount = groupByChronicleStates(db, chronicle.id).length;
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

  const worldState = groupByChronicleStates(db, chronicle.id);
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
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => b.run.lastActiveAt.localeCompare(a.run.lastActiveAt));

  const viewpointProgress = db.playableViewpoints
    .filter((viewpoint) => viewpoint.versionId === chronicle.versionId && viewpoint.isPlayable)
    .sort((a, b) => a.orderIndex - b.orderIndex)
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

  return {
    chronicle,
    world,
    version,
    worldState,
    runs,
    viewpointProgress,
    recentEvents,
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

    await addGeneratedScene(db, {
      chronicle,
      run,
      worldTitle: world.title,
      worldTone: world.tone,
      worldSynopsis: world.synopsis,
      versionLabel: version.versionLabel,
      characterName: character.name,
      characterSummary: character.summary,
      beat: startBeat,
      viewpointLabel: viewpoint.label,
      resolutionSource: "run_start",
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

  const availableChoices = listAvailableChoicesForBeat(db, {
    beatId: beat.id,
    chronicleId: chronicle.id,
    runId: run.id,
  });

  const sceneHistory = db.generatedScenes
    .filter((scene) => scene.perspectiveRunId === run.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const otherRuns = db.perspectiveRuns
    .filter((otherRun) => otherRun.chronicleId === chronicle.id && otherRun.id !== run.id)
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
    otherRuns,
    recentChronicleEvents,
  };
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

  return db.playableViewpoints
    .filter((viewpoint) => viewpoint.versionId === chronicle.versionId && viewpoint.isPlayable)
    .sort((a, b) => a.orderIndex - b.orderIndex)
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

      return { viewpoint, character, existingRun, impactSummary, routeEventCount };
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
  label: string;
  description?: string;
  intentTags?: string[];
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
    choice.intentTags = normalizeTagList(input.intentTags ?? []);
    choice.orderIndex = input.orderIndex;
    choice.nextBeatId = nextBeat.id;
    choice.updatedAt = nowIso();
    return choice;
  });
}
