import "server-only";

import { chatJsonWithOllama } from "@/lib/ai/ollama";
import {
  coerceGeneratedScenePayload,
  type GeneratedScenePayload,
} from "@/lib/ai/types";
import { env } from "@/lib/env";
import type { JsonValue } from "@/types/story";

type SceneStateEntry = {
  key: string;
  value: JsonValue;
};

type SceneKnowledgeEntry = {
  key: string;
  status: string;
};

type SceneChoicePreview = {
  label: string;
  description: string | null;
};

type SceneCanonEntry = {
  canonKey: string;
  entryType: string;
  title: string;
  body: string;
};

type SceneEventEntry = {
  eventType: string;
  summary: string;
};

export type SceneGenerationContext = {
  worldTitle: string;
  worldTone: string;
  worldSynopsis: string;
  versionLabel: string;
  viewpointLabel: string;
  characterName: string;
  characterSummary: string;
  beatTitle: string;
  beatSubtitle: string | null;
  beatSummary: string;
  beatNarration: string;
  beatAtmosphere: string | null;
  beatType: string;
  chapterLabel: string | null;
  selectedChoiceLabel: string | null;
  actionNote: string | null;
  resolutionSource: "run_start" | "explicit_choice" | "guided_action";
  canonEntries: SceneCanonEntry[];
  globalState: SceneStateEntry[];
  perspectiveState: SceneStateEntry[];
  knowledgeState: SceneKnowledgeEntry[];
  recentEvents: SceneEventEntry[];
  availableChoices: SceneChoicePreview[];
};

type SceneGenerationResult = {
  payload: GeneratedScenePayload;
  sourceLabel: string;
  mode: "ollama" | "seeded";
  fallbackReason?: string;
  model?: string;
};

const MIN_SCENE_WORDS = 110;

function stringifyValue(value: JsonValue) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function summarizeStateEntries(entries: SceneStateEntry[], limit = 8) {
  return entries.slice(0, limit).map((entry) => `${entry.key}: ${stringifyValue(entry.value)}`);
}

function summarizeKnowledgeEntries(entries: SceneKnowledgeEntry[], limit = 8) {
  return entries
    .slice(0, limit)
    .map((entry) => `${entry.key}: ${entry.status}`);
}

function createSeededScenePayload(context: SceneGenerationContext): GeneratedScenePayload {
  const visibleStateHints = summarizeStateEntries(context.globalState, 3);
  const continuityNotes = context.recentEvents.slice(0, 3).map((event) => event.summary);

  const choiceLine = context.selectedChoiceLabel
    ? `Action taken: ${context.selectedChoiceLabel}.`
    : "No explicit route action was chosen yet.";
  const flavorLine = context.actionNote
    ? `Narrative flavor note: ${context.actionNote}.`
    : null;
  const stateLine = visibleStateHints.length
    ? `Visible state pressure: ${visibleStateHints.join("; ")}.`
    : null;
  const continuityLine = continuityNotes.length
    ? `Recent continuity: ${continuityNotes.join(" | ")}.`
    : null;
  const sceneText = [
    context.beatNarration,
    `From ${context.viewpointLabel}, ${context.characterName} carries this moment with ${context.beatSummary.toLowerCase()} The tone should remain ${context.worldTone.toLowerCase()}, and the next lines should feel like a living chapter rather than a menu prompt.`,
    choiceLine,
    flavorLine,
    stateLine,
    continuityLine,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");

  return {
    sceneTitle: context.beatTitle,
    sceneText,
    shortSummary: context.beatSummary,
    visibleStateHints,
    suggestedChoiceMood: null,
    continuityNotes,
    emergentCanonCandidates: [],
  };
}

function buildScenePrompt(context: SceneGenerationContext) {
  const canonGuidelines = context.canonEntries
    .filter((entry) => entry.entryType === "rule")
    .slice(0, 10);
  const canonFacts = context.canonEntries
    .filter((entry) => entry.entryType !== "rule")
    .slice(0, 10);

  const promptContext = {
    world: {
      title: context.worldTitle,
      tone: context.worldTone,
      synopsis: context.worldSynopsis,
      versionLabel: context.versionLabel,
    },
    viewpoint: {
      label: context.viewpointLabel,
      characterName: context.characterName,
      characterSummary: context.characterSummary,
    },
    scene: {
      chapterLabel: context.chapterLabel,
      beatType: context.beatType,
      title: context.beatTitle,
      subtitle: context.beatSubtitle,
      summary: context.beatSummary,
      baselineNarration: context.beatNarration,
      atmosphere: context.beatAtmosphere,
    },
    action: {
      resolutionSource: context.resolutionSource,
      selectedChoiceLabel: context.selectedChoiceLabel,
      actionNote: context.actionNote,
    },
    canonGuidelines,
    canonFacts,
    chronicleState: summarizeStateEntries(context.globalState, 10),
    perspectiveState: summarizeStateEntries(context.perspectiveState, 10),
    knowledgeState: summarizeKnowledgeEntries(context.knowledgeState, 10),
    recentEvents: context.recentEvents.slice(0, 8),
    availableChoices: context.availableChoices.slice(0, 6),
  };

  const systemPrompt = [
    "You are Inkbranch narrative renderer.",
    "Return strict JSON only.",
    "Do not change progression, state, or canon facts.",
    "Write scene prose for the current beat from the active viewpoint.",
    "Respect knowledge boundaries and current Chronicle state.",
    "Use actionNote only as flavor, never as a state-changing command.",
    "Write immersive narrative prose, not bullet points or menu text.",
    "sceneText must read like an interactive novel chapter segment, 2-4 paragraphs, at least 110 words.",
    "When new persistent truths emerge (new named people, places, objects, or rules), add up to 3 emergentCanonCandidates.",
    "Never restate existing canon entries as emergent canon.",
    "Output keys: sceneTitle, sceneText, shortSummary, visibleStateHints, suggestedChoiceMood, continuityNotes, emergentCanonCandidates.",
  ].join(" ");

  const userPrompt = [
    "Render the scene from this JSON context.",
    "Keep prose vivid but grounded.",
    "Do not claim hidden knowledge for the active character.",
    "",
    JSON.stringify(promptContext, null, 2),
  ].join("\n");

  return {
    systemPrompt,
    userPrompt,
  };
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sceneTextTooShort(sceneText: string) {
  return wordCount(sceneText) < MIN_SCENE_WORDS;
}

export async function generateNarrativeScene(
  context: SceneGenerationContext,
): Promise<SceneGenerationResult> {
  if (env.inkbranchAiMode !== "ollama") {
    return {
      payload: createSeededScenePayload(context),
      sourceLabel: "seeded",
      mode: "seeded",
    };
  }

  try {
    const { systemPrompt, userPrompt } = buildScenePrompt(context);
    const response = await chatJsonWithOllama({
      model: env.ollamaModel,
      timeoutMs: env.ollamaTimeoutMs,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const parsed = JSON.parse(response.content) as unknown;
    let payload = coerceGeneratedScenePayload(parsed);
    if (!payload) {
      throw new Error("Ollama returned JSON that did not match scene payload shape.");
    }
    if (sceneTextTooShort(payload.sceneText)) {
      const retryResponse = await chatJsonWithOllama({
        model: env.ollamaModel,
        timeoutMs: env.ollamaTimeoutMs,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
          { role: "assistant", content: response.content },
          {
            role: "user",
            content:
              "sceneText is too short. Rewrite with richer prose, at least 110 words across 2-4 paragraphs. Return the full JSON object only.",
          },
        ],
      });
      const retryParsed = JSON.parse(retryResponse.content) as unknown;
      const retryPayload = coerceGeneratedScenePayload(retryParsed);
      if (!retryPayload || sceneTextTooShort(retryPayload.sceneText)) {
        throw new Error(
          "Ollama scene output stayed too short after retry; falling back to seeded prose.",
        );
      }
      payload = retryPayload;
      return {
        payload,
        sourceLabel: "ollama",
        mode: "ollama",
        model: retryResponse.model,
      };
    }

    return {
      payload,
      sourceLabel: "ollama",
      mode: "ollama",
      model: response.model,
    };
  } catch (error) {
    const fallbackReason =
      error instanceof Error ? error.message : "unknown scene generation error";
    console.warn("[Inkbranch AI] Falling back to seeded scene generation:", fallbackReason);

    return {
      payload: createSeededScenePayload(context),
      sourceLabel: "seeded",
      mode: "seeded",
      fallbackReason,
    };
  }
}
