"use server";

import {
  createBeatChoice,
  createCanonEntry,
  createPlayableViewpoint,
  createStoryBeat,
  createStoryCharacter,
  createStoryVersion,
  createStoryWorld,
  updateBeatChoice,
  updateStoryBeat,
  updateStoryVersion,
  updateStoryWorld,
} from "@/features/story/repository";
import { requireRole } from "@/lib/auth/server";
import type { ChoiceCondition, ChoiceConsequence, JsonValue } from "@/types/story";
import { revalidatePath } from "next/cache";

function readRequired(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function readNumber(formData: FormData, key: string, fallback = 0) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${key} must be a number.`);
  }

  return parsed;
}

function parseJsonValue(raw: string): JsonValue {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    return JSON.parse(trimmed) as JsonValue;
  } catch {
    return trimmed;
  }
}

function parseCommaList(formData: FormData, key: string) {
  const raw = formData.get(key);
  if (typeof raw !== "string" || !raw.trim()) {
    return [] as string[];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function parseOptionalConsequence(formData: FormData): ChoiceConsequence[] {
  const scope = formData.get("consequenceScope");
  const key = formData.get("consequenceKey");
  const value = formData.get("consequenceValue");

  if (typeof scope !== "string" || typeof key !== "string" || typeof value !== "string") {
    return [];
  }
  if (!scope.trim() || !key.trim() || !value.trim()) {
    return [];
  }

  if (scope !== "global" && scope !== "perspective" && scope !== "knowledge") {
    throw new Error("consequenceScope must be global, perspective, or knowledge.");
  }

  return [
    {
      scope,
      key: key.trim(),
      value: parseJsonValue(value),
    },
  ];
}

function parseOptionalGate(formData: FormData): ChoiceCondition[] {
  const scope = formData.get("gateScope");
  const key = formData.get("gateKey");
  const equals = formData.get("gateEquals");
  const notEquals = formData.get("gateNotEquals");

  if (typeof scope !== "string" || typeof key !== "string") {
    return [];
  }
  if (!scope.trim() || !key.trim()) {
    return [];
  }

  if (scope !== "global" && scope !== "perspective" && scope !== "knowledge") {
    throw new Error("gateScope must be global, perspective, or knowledge.");
  }

  const condition: ChoiceCondition = {
    scope,
    key: key.trim(),
  };

  if (typeof equals === "string" && equals.trim()) {
    condition.equals = parseJsonValue(equals);
  }
  if (typeof notEquals === "string" && notEquals.trim()) {
    condition.notEquals = parseJsonValue(notEquals);
  }

  return [condition];
}

function revalidateAdminSurface() {
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/worlds");
  revalidatePath("/app/admin/versions");
  revalidatePath("/app/admin/cast");
  revalidatePath("/app/admin/canon");
  revalidatePath("/app/admin/scenes");
  revalidatePath("/app/admin/choices");
  revalidatePath("/app/library");
}

export async function createWorldAction(formData: FormData) {
  await requireRole("admin");
  await createStoryWorld({
    slug: readRequired(formData, "slug"),
    title: readRequired(formData, "title"),
    synopsis: readRequired(formData, "synopsis"),
    tone: readRequired(formData, "tone"),
    isFeatured: readBoolean(formData, "isFeatured"),
  });

  revalidateAdminSurface();
}

export async function updateWorldAction(formData: FormData) {
  await requireRole("admin");
  await updateStoryWorld({
    id: readRequired(formData, "worldId"),
    title: readRequired(formData, "title"),
    synopsis: readRequired(formData, "synopsis"),
    tone: readRequired(formData, "tone"),
    isFeatured: readBoolean(formData, "isFeatured"),
  });

  revalidateAdminSurface();
}

export async function createVersionAction(formData: FormData) {
  await requireRole("admin");
  const status = readRequired(formData, "status");
  if (status !== "draft" && status !== "published" && status !== "archived") {
    throw new Error("status must be draft, published, or archived.");
  }

  await createStoryVersion({
    worldId: readRequired(formData, "worldId"),
    versionLabel: readRequired(formData, "versionLabel"),
    description: readRequired(formData, "description"),
    status,
    isDefaultPublished: readBoolean(formData, "isDefaultPublished"),
  });

  revalidateAdminSurface();
}

export async function updateVersionAction(formData: FormData) {
  await requireRole("admin");
  const status = readRequired(formData, "status");
  if (status !== "draft" && status !== "published" && status !== "archived") {
    throw new Error("status must be draft, published, or archived.");
  }

  await updateStoryVersion({
    id: readRequired(formData, "versionId"),
    status,
    isDefaultPublished: readBoolean(formData, "isDefaultPublished"),
    description: readRequired(formData, "description"),
  });

  revalidateAdminSurface();
}

export async function createCharacterAction(formData: FormData) {
  await requireRole("admin");
  await createStoryCharacter({
    worldId: readRequired(formData, "worldId"),
    slug: readRequired(formData, "slug"),
    name: readRequired(formData, "name"),
    summary: readRequired(formData, "summary"),
  });

  revalidateAdminSurface();
}

export async function createViewpointAction(formData: FormData) {
  await requireRole("admin");
  await createPlayableViewpoint({
    versionId: readRequired(formData, "versionId"),
    characterId: readRequired(formData, "characterId"),
    label: readRequired(formData, "label"),
    description: readRequired(formData, "description"),
    startBeatId: String(formData.get("startBeatId") ?? "").trim() || undefined,
    orderIndex: readNumber(formData, "orderIndex", 100),
  });

  revalidateAdminSurface();
}

export async function createCanonEntryAction(formData: FormData) {
  await requireRole("admin");
  const entryType = readRequired(formData, "entryType");
  if (
    entryType !== "world_truth" &&
    entryType !== "character_truth" &&
    entryType !== "item_truth" &&
    entryType !== "place_truth" &&
    entryType !== "rule"
  ) {
    throw new Error("Invalid canon entry type.");
  }

  await createCanonEntry({
    versionId: readRequired(formData, "versionId"),
    entryType,
    canonKey: readRequired(formData, "canonKey"),
    title: readRequired(formData, "title"),
    body: readRequired(formData, "body"),
  });

  revalidateAdminSurface();
}

export async function createBeatAction(formData: FormData) {
  await requireRole("admin");
  const beatType = readRequired(formData, "beatType");
  if (beatType !== "world" && beatType !== "perspective" && beatType !== "interlock") {
    throw new Error("Invalid beat type.");
  }

  await createStoryBeat({
    versionId: readRequired(formData, "versionId"),
    slug: readRequired(formData, "slug"),
    title: readRequired(formData, "title"),
    sceneSubtitle: String(formData.get("sceneSubtitle") ?? "").trim() || undefined,
    chapterLabel: String(formData.get("chapterLabel") ?? "").trim() || undefined,
    summary: readRequired(formData, "summary"),
    narration: readRequired(formData, "narration"),
    atmosphere: String(formData.get("atmosphere") ?? "").trim() || undefined,
    allowsGuidedAction: readBoolean(formData, "allowsGuidedAction"),
    guidedActionPrompt:
      String(formData.get("guidedActionPrompt") ?? "").trim() || undefined,
    allowedActionTags: parseCommaList(formData, "allowedActionTags"),
    fallbackChoiceId:
      String(formData.get("fallbackChoiceId") ?? "").trim() || undefined,
    beatType,
    orderIndex: readNumber(formData, "orderIndex", 100),
    isTerminal: readBoolean(formData, "isTerminal"),
  });

  revalidateAdminSurface();
}

export async function updateBeatAction(formData: FormData) {
  await requireRole("admin");
  await updateStoryBeat({
    beatId: readRequired(formData, "beatId"),
    title: readRequired(formData, "title"),
    sceneSubtitle: String(formData.get("sceneSubtitle") ?? "").trim() || undefined,
    chapterLabel: String(formData.get("chapterLabel") ?? "").trim() || undefined,
    summary: readRequired(formData, "summary"),
    narration: readRequired(formData, "narration"),
    atmosphere: String(formData.get("atmosphere") ?? "").trim() || undefined,
    allowsGuidedAction: readBoolean(formData, "allowsGuidedAction"),
    guidedActionPrompt:
      String(formData.get("guidedActionPrompt") ?? "").trim() || undefined,
    allowedActionTags: parseCommaList(formData, "allowedActionTags"),
    fallbackChoiceId:
      String(formData.get("fallbackChoiceId") ?? "").trim() || undefined,
    orderIndex: readNumber(formData, "orderIndex", 100),
    isTerminal: readBoolean(formData, "isTerminal"),
  });

  revalidateAdminSurface();
}

export async function createChoiceAction(formData: FormData) {
  await requireRole("admin");
  const consequenceScope = readRequired(formData, "consequenceScope");
  if (
    consequenceScope !== "global" &&
    consequenceScope !== "perspective" &&
    consequenceScope !== "knowledge"
  ) {
    throw new Error("Invalid consequence scope.");
  }

  await createBeatChoice({
    beatId: readRequired(formData, "beatId"),
    label: readRequired(formData, "label"),
    description: String(formData.get("description") ?? "").trim() || undefined,
    intentTags: parseCommaList(formData, "intentTags"),
    orderIndex: readNumber(formData, "orderIndex", 100),
    nextBeatId: readRequired(formData, "nextBeatId"),
    consequenceScope,
    gatingRules: parseOptionalGate(formData),
    consequences: parseOptionalConsequence(formData),
  });

  revalidateAdminSurface();
}

export async function updateChoiceAction(formData: FormData) {
  await requireRole("admin");
  await updateBeatChoice({
    choiceId: readRequired(formData, "choiceId"),
    label: readRequired(formData, "label"),
    description: String(formData.get("description") ?? "").trim() || undefined,
    intentTags: parseCommaList(formData, "intentTags"),
    orderIndex: readNumber(formData, "orderIndex", 100),
    nextBeatId: readRequired(formData, "nextBeatId"),
  });

  revalidateAdminSurface();
}
