import type { CanonEntryType, JsonValue } from "@/types/story";

export type EmergentCanonConfidence = "low" | "medium" | "high";

export type EmergentCanonCandidate = {
  entryType: CanonEntryType;
  canonKey: string | null;
  title: string;
  body: string;
  confidence: EmergentCanonConfidence | null;
};

export type GeneratedScenePayload = {
  sceneTitle?: string | null;
  sceneText: string;
  shortSummary: string;
  visibleStateHints: string[];
  suggestedChoiceMood?: string | null;
  continuityNotes?: string[];
  emergentCanonCandidates?: EmergentCanonCandidate[];
};

function asOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asStringList(value: unknown, maxItems = 6) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, maxItems);
}

function asCanonEntryType(value: unknown): CanonEntryType | null {
  if (value === "world_truth") return "world_truth";
  if (value === "character_truth") return "character_truth";
  if (value === "item_truth") return "item_truth";
  if (value === "place_truth") return "place_truth";
  if (value === "rule") return "rule";
  return null;
}

function asCanonConfidence(value: unknown): EmergentCanonConfidence | null {
  if (value === "low") return "low";
  if (value === "medium") return "medium";
  if (value === "high") return "high";
  return null;
}

function asEmergentCanonCandidates(value: unknown, maxItems = 3): EmergentCanonCandidate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((candidate): EmergentCanonCandidate | null => {
      if (!candidate || typeof candidate !== "object") {
        return null;
      }

      const source = candidate as Record<string, unknown>;
      const entryType = asCanonEntryType(source.entryType);
      const title = asOptionalString(source.title);
      const body = asOptionalString(source.body);
      if (!entryType || !title || !body) {
        return null;
      }

      return {
        entryType,
        canonKey: asOptionalString(source.canonKey) ?? null,
        title,
        body,
        confidence: asCanonConfidence(source.confidence) ?? null,
      };
    })
    .filter((candidate): candidate is EmergentCanonCandidate => candidate !== null)
    .slice(0, maxItems);
}

export function coerceGeneratedScenePayload(input: unknown): GeneratedScenePayload | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  const sceneText = asOptionalString(candidate.sceneText);
  const shortSummary = asOptionalString(candidate.shortSummary);
  if (!sceneText || !shortSummary) {
    return null;
  }

  return {
    sceneTitle: asOptionalString(candidate.sceneTitle),
    sceneText,
    shortSummary,
    visibleStateHints: asStringList(candidate.visibleStateHints),
    suggestedChoiceMood: asOptionalString(candidate.suggestedChoiceMood),
    continuityNotes: asStringList(candidate.continuityNotes),
    emergentCanonCandidates: asEmergentCanonCandidates(candidate.emergentCanonCandidates),
  };
}

export function scenePayloadToMetadata(
  payload: GeneratedScenePayload,
): Record<string, JsonValue> {
  return {
    sceneTitle: payload.sceneTitle ?? null,
    shortSummary: payload.shortSummary,
    visibleStateHints: payload.visibleStateHints,
    suggestedChoiceMood: payload.suggestedChoiceMood ?? null,
    continuityNotes: payload.continuityNotes ?? [],
    emergentCanonCandidateCount: payload.emergentCanonCandidates?.length ?? 0,
  };
}
