import "server-only";

import { chatJsonWithOllama } from "@/lib/ai/ollama";
import {
  type BranchChapterDirective,
  coerceGeneratedBranchPayload,
  coerceGeneratedScenePayload,
  type GeneratedBranchPayload,
  type GeneratedBranchChoicePayload,
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

type SceneProseExcerpt = {
  sceneTitle: string | null;
  shortSummary: string | null;
  chapterLabel: string | null;
  excerpt: string;
  createdAt: string;
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
  recentSceneProse: SceneProseExcerpt[];
  chapterSceneIndex: number;
  routeSceneIndex: number;
};

type SceneGenerationResult = {
  payload: GeneratedScenePayload;
  sourceLabel: string;
  mode: "ollama" | "seeded";
  fallbackReason?: string;
  model?: string;
};

export type BranchGenerationContext = {
  worldTitle: string;
  worldTone: string;
  worldSynopsis: string;
  versionLabel: string;
  viewpointLabel: string;
  characterName: string;
  characterSummary: string;
  beatTitle: string;
  beatSummary: string;
  beatNarration: string;
  beatType: string;
  chapterLabel: string | null;
  chapterNumber: number;
  totalChapterCount: number;
  chapterSceneCount: number;
  chapterWordCount: number;
  minChapterSceneCount: number;
  minChapterWordCount: number;
  routeSceneIndex: number;
  canonEntries: SceneCanonEntry[];
  globalState: SceneStateEntry[];
  perspectiveState: SceneStateEntry[];
  knowledgeState: SceneKnowledgeEntry[];
  recentEvents: SceneEventEntry[];
  recentSceneProse: SceneProseExcerpt[];
};

type BranchGenerationResult = {
  payload: GeneratedBranchPayload;
  sourceLabel: string;
  mode: "ollama" | "seeded";
  fallbackReason?: string;
  model?: string;
};

const QUALITY_MIN_SCENE_WORDS = 320;
const SPEED_MIN_SCENE_WORDS = 160;
const QUALITY_MIN_SCENE_PARAGRAPHS = 4;
const SPEED_MIN_SCENE_PARAGRAPHS = 2;
const QUALITY_MIN_SCENE_TIMEOUT_MS = 120000;
const SPEED_MIN_SCENE_TIMEOUT_MS = 45000;
const QUALITY_MIN_BRANCH_TIMEOUT_MS = 120000;
const SPEED_MIN_BRANCH_TIMEOUT_MS = 45000;
const QUALITY_MAX_SCENE_EXPANSION_PASSES = 2;
const SPEED_MAX_SCENE_EXPANSION_PASSES = 0;
const BRANCH_MIN_CHOICES = 2;
const BRANCH_MAX_CHOICES = 4;
const COMMON_BRANCH_TAGS = [
  "investigate",
  "observe",
  "protect",
  "secure",
  "signal",
  "travel",
  "sneak",
  "wait",
  "shadow",
  "deliver",
];

type GenerationPolicy = {
  minSceneWords: number;
  minSceneParagraphs: number;
  minSceneTimeoutMs: number;
  minBranchTimeoutMs: number;
  maxSceneExpansionPasses: number;
  compactContext: boolean;
};

function getGenerationPolicy(): GenerationPolicy {
  if (env.inkbranchRuntimeProfile === "speed") {
    return {
      minSceneWords: SPEED_MIN_SCENE_WORDS,
      minSceneParagraphs: SPEED_MIN_SCENE_PARAGRAPHS,
      minSceneTimeoutMs: SPEED_MIN_SCENE_TIMEOUT_MS,
      minBranchTimeoutMs: SPEED_MIN_BRANCH_TIMEOUT_MS,
      maxSceneExpansionPasses: SPEED_MAX_SCENE_EXPANSION_PASSES,
      compactContext: true,
    };
  }

  return {
    minSceneWords: QUALITY_MIN_SCENE_WORDS,
    minSceneParagraphs: QUALITY_MIN_SCENE_PARAGRAPHS,
    minSceneTimeoutMs: QUALITY_MIN_SCENE_TIMEOUT_MS,
    minBranchTimeoutMs: QUALITY_MIN_BRANCH_TIMEOUT_MS,
    maxSceneExpansionPasses: QUALITY_MAX_SCENE_EXPANSION_PASSES,
    compactContext: false,
  };
}

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

function summarizeSceneContinuityEntries(entries: SceneProseExcerpt[], limit = 4) {
  return entries.slice(-limit).map((entry) => ({
    chapterLabel: entry.chapterLabel,
    sceneTitle: entry.sceneTitle,
    shortSummary: entry.shortSummary,
    excerpt: entry.excerpt,
    createdAt: entry.createdAt,
  }));
}

function summarizeCanonTitles(entries: SceneCanonEntry[], limit = 5) {
  return entries
    .slice(0, limit)
    .map((entry) => `${entry.title} (${entry.entryType.replace("_", " ")})`);
}

function padSeededSceneText(
  sceneText: string,
  context: SceneGenerationContext,
  minSceneWords: number,
) {
  if (wordCount(sceneText) >= minSceneWords) {
    return sceneText;
  }

  const canonNames = summarizeCanonTitles(context.canonEntries, 5);
  const continuitySignal = context.recentEvents
    .slice(0, 4)
    .map((event) => event.summary)
    .join("; ");
  const narrativePadding = [
    `Continuity remains anchored to committed truths: ${
      canonNames.length
        ? canonNames.join(", ")
        : "the established world canon and route memory"
    }. ${context.characterName} cannot step outside what is known in this viewpoint, so every observation stays grounded in the visible stakes and prior events.`,
    `${context.characterName} feels the chapter tightening around scene ${
      context.chapterSceneIndex
    } of this arc and scene ${context.routeSceneIndex} of the route. The prose should linger on sensory detail, uncertainty, and motive so the next decision reads as a consequence of lived momentum rather than menu navigation.`,
    continuitySignal
      ? `Recent Chronicle pressure points continue to shape this moment: ${continuitySignal}. The next choice must feel earned by this chain of cause and effect, with the viewpoint voice carrying emotional continuity from the scenes that came before.`
      : `Even without a dense event ledger yet, the narration should preserve route continuity by naming intentions, consequences, and emotional residue from prior moments before handing control back to the reader.`,
  ];

  let output = sceneText;
  for (const paragraph of narrativePadding) {
    if (wordCount(output) >= minSceneWords) {
      break;
    }
    output = `${output}\n\n${paragraph}`;
  }

  return output;
}

function createSeededScenePayload(
  context: SceneGenerationContext,
  minSceneWords: number,
): GeneratedScenePayload {
  const visibleStateHints = summarizeStateEntries(context.globalState, 3);
  const continuityNotes = context.recentEvents.slice(0, 3).map((event) => event.summary);
  const recentSceneContinuity = summarizeSceneContinuityEntries(context.recentSceneProse, 2)
    .map((entry) => {
      const prefix = entry.sceneTitle ?? "Earlier committed scene";
      return `${prefix}: ${entry.excerpt}`;
    })
    .join(" ");

  const choiceLine = context.selectedChoiceLabel
    ? `Action taken: ${context.selectedChoiceLabel}. This action has already advanced deterministic story state and should read as committed history.`
    : "No explicit route action was chosen yet, so this chapter opening should establish tension while preserving deterministic rails.";
  const flavorLine = context.actionNote
    ? `Narrative flavor note: ${context.actionNote}. Use this as tone guidance only, never as a state mutation command.`
    : null;
  const stateLine = visibleStateHints.length
    ? `Visible state pressure currently shaping the chapter: ${visibleStateHints.join("; ")}.`
    : null;
  const continuityLine = continuityNotes.length
    ? `Recent continuity signals: ${continuityNotes.join(" | ")}.`
    : null;
  const priorSceneLine = recentSceneContinuity
    ? `Previously committed manuscript continuity: ${recentSceneContinuity}`
    : null;
  const availableChoiceLine = context.availableChoices.length
    ? `Available forward routes include: ${context.availableChoices
        .slice(0, 4)
        .map((choice) => choice.label)
        .join(", ")}.`
    : "No explicit route options are currently open, so the prose should focus on aftermath and unresolved pressure.";
  const sceneText = [
    context.beatNarration,
    `From ${context.viewpointLabel}, ${context.characterName} carries this moment with ${context.beatSummary.toLowerCase()} The tone must remain ${context.worldTone.toLowerCase()}, and the prose should read like a chapter section with interiority, atmosphere, and momentum.`,
    `Chapter progress marker: section ${context.chapterSceneIndex} in this chapter and section ${context.routeSceneIndex} in this route manuscript. Write with a sense of accumulation, not reset.`,
    choiceLine,
    flavorLine,
    stateLine,
    continuityLine,
    priorSceneLine,
    availableChoiceLine,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");

  return {
    sceneTitle: context.beatTitle,
    sceneText: padSeededSceneText(sceneText, context, minSceneWords),
    shortSummary: context.beatSummary,
    visibleStateHints,
    suggestedChoiceMood: null,
    continuityNotes,
    emergentCanonCandidates: [],
  };
}

function buildScenePrompt(context: SceneGenerationContext, policy: GenerationPolicy) {
  const canonGuidelineLimit = policy.compactContext ? 6 : 10;
  const canonFactLimit = policy.compactContext ? 6 : 10;
  const stateLimit = policy.compactContext ? 6 : 10;
  const continuityLimit = policy.compactContext ? 2 : 4;
  const eventLimit = policy.compactContext ? 5 : 8;
  const choiceLimit = policy.compactContext ? 4 : 6;
  const canonGuidelines = context.canonEntries
    .filter((entry) => entry.entryType === "rule")
    .slice(0, canonGuidelineLimit);
  const canonFacts = context.canonEntries
    .filter((entry) => entry.entryType !== "rule")
    .slice(0, canonFactLimit);

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
    chronicleState: summarizeStateEntries(context.globalState, stateLimit),
    perspectiveState: summarizeStateEntries(context.perspectiveState, stateLimit),
    knowledgeState: summarizeKnowledgeEntries(context.knowledgeState, stateLimit),
    progression: {
      chapterSceneIndex: context.chapterSceneIndex,
      routeSceneIndex: context.routeSceneIndex,
    },
    chapterContinuity: summarizeSceneContinuityEntries(
      context.recentSceneProse,
      continuityLimit,
    ),
    recentEvents: context.recentEvents.slice(0, eventLimit),
    availableChoices: context.availableChoices.slice(0, choiceLimit),
  };

  const systemPrompt = [
    "You are Inkbranch narrative renderer.",
    "Return strict JSON only.",
    "Do not change progression, state, or canon facts.",
    "Write scene prose for the current beat from the active viewpoint.",
    "Respect knowledge boundaries and current Chronicle state.",
    "Continue continuity from chapterContinuity when present.",
    "Use actionNote only as flavor, never as a state-changing command.",
    "Write immersive narrative prose, not bullet points or menu text.",
    `sceneText must read like an interactive novel chapter section with at least ${policy.minSceneParagraphs} paragraphs and at least ${policy.minSceneWords} words.`,
    "Each paragraph should advance atmosphere, character intent, and continuity pressure.",
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

function paragraphCount(text: string) {
  return text
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean).length;
}

function sceneTextTooShort(sceneText: string, policy: GenerationPolicy) {
  return (
    wordCount(sceneText) < policy.minSceneWords ||
    paragraphCount(sceneText) < policy.minSceneParagraphs
  );
}

function readOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function safeParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractFirstJsonObject(text: string) {
  const start = text.indexOf("{");
  if (start < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

function parseOllamaJsonContent(content: string): unknown | null {
  const direct = safeParseJson(content);
  if (direct !== null) {
    return direct;
  }

  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    const fencedParsed = safeParseJson(fencedMatch[1].trim());
    if (fencedParsed !== null) {
      return fencedParsed;
    }
  }

  const firstObject = extractFirstJsonObject(content);
  if (firstObject) {
    const extractedParsed = safeParseJson(firstObject);
    if (extractedParsed !== null) {
      return extractedParsed;
    }
  }

  return null;
}

function summarizeSceneText(sceneText: string, fallback: string) {
  const clean = sceneText.replace(/\s+/g, " ").trim();
  if (!clean) {
    return fallback;
  }

  const firstSentenceMatch = clean.match(/(.+?[.!?])(?:\s|$)/);
  const firstSentence = firstSentenceMatch?.[1]?.trim() ?? "";
  if (firstSentence.length >= 24) {
    return firstSentence.slice(0, 220);
  }

  return clean.split(" ").slice(0, 28).join(" ").slice(0, 220);
}

function coerceLooseScenePayload(
  input: unknown,
  context: SceneGenerationContext,
): GeneratedScenePayload | null {
  if (typeof input === "string") {
    const sceneText = readOptionalText(input);
    if (!sceneText) {
      return null;
    }

    return {
      sceneTitle: context.beatTitle,
      sceneText,
      shortSummary: summarizeSceneText(sceneText, context.beatSummary),
      visibleStateHints: [],
      suggestedChoiceMood: null,
      continuityNotes: [],
      emergentCanonCandidates: [],
    };
  }

  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  const sceneText =
    readOptionalText(candidate.sceneText) ??
    readOptionalText(candidate.text) ??
    readOptionalText(candidate.response) ??
    readOptionalText(candidate.content) ??
    readOptionalText(candidate.scene) ??
    null;
  if (!sceneText) {
    return null;
  }

  const summary =
    readOptionalText(candidate.shortSummary) ??
    readOptionalText(candidate.summary) ??
    summarizeSceneText(sceneText, context.beatSummary);

  return {
    sceneTitle: readOptionalText(candidate.sceneTitle) ?? context.beatTitle,
    sceneText,
    shortSummary: summary,
    visibleStateHints: [],
    suggestedChoiceMood: null,
    continuityNotes: [],
    emergentCanonCandidates: [],
  };
}

function coerceSceneContinuationText(input: unknown) {
  if (typeof input === "string") {
    return readOptionalText(input);
  }

  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  return (
    readOptionalText(candidate.continuationText) ??
    readOptionalText(candidate.continuedText) ??
    readOptionalText(candidate.sceneContinuation) ??
    readOptionalText(candidate.sceneText)
  );
}

async function expandSceneTextToMinimum(
  payload: GeneratedScenePayload,
  context: SceneGenerationContext,
  timeoutMs: number,
  policy: GenerationPolicy,
) {
  let sceneText = payload.sceneText.trim();
  let modelUsed: string | undefined;

  for (
    let attempt = 0;
    attempt < policy.maxSceneExpansionPasses && sceneTextTooShort(sceneText, policy);
    attempt += 1
  ) {
    const remainingWords = Math.max(80, policy.minSceneWords - wordCount(sceneText) + 60);
    const continuationResponse = await chatJsonWithOllama({
      model: env.ollamaModel,
      timeoutMs,
      messages: [
        {
          role: "system",
          content:
            "You continue Inkbranch chapter prose. Return strict JSON only with key continuationText.",
        },
        {
          role: "user",
          content: [
            "Continue this scene without repeating prior lines.",
            `Write at least ${remainingWords} additional words in 2-4 new paragraphs.`,
            "Maintain viewpoint continuity and immediate stakes.",
            "",
            JSON.stringify(
              {
                viewpointLabel: context.viewpointLabel,
                characterName: context.characterName,
                chapterLabel: context.chapterLabel,
                beatTitle: context.beatTitle,
                selectedChoiceLabel: context.selectedChoiceLabel,
                actionNote: context.actionNote,
                existingSceneText: sceneText,
              },
              null,
              2,
            ),
          ].join("\n"),
        },
      ],
    });
    const parsed = parseOllamaJsonContent(continuationResponse.content);
    const continuation = coerceSceneContinuationText(parsed);
    if (!continuation) {
      break;
    }

    sceneText = `${sceneText}\n\n${continuation}`.trim();
    modelUsed = continuationResponse.model;
  }

  if (sceneTextTooShort(sceneText, policy)) {
    sceneText = padSeededSceneText(sceneText, context, policy.minSceneWords);
  }

  if (sceneTextTooShort(sceneText, policy)) {
    const reserveParagraphs = [
      `${context.characterName} measures every gesture against what is already known in this Chronicle, refusing to treat uncertainty as an excuse for contradiction.`,
      `The moment carries forward with deliberate continuity, where each observation leaves residue that tightens motive, risk, and obligation for the next decision.`,
      `Nothing resolves cleanly yet; the chapter pressure keeps building through atmosphere, consequence, and the slow accumulation of committed truths.`,
      `${context.viewpointLabel} remains bounded by present knowledge, so the narration stays intimate, specific, and accountable to prior events.`,
    ];
    let reserveIndex = 0;
    while (
      sceneTextTooShort(sceneText, policy) &&
      reserveIndex < reserveParagraphs.length
    ) {
      sceneText = `${sceneText}\n\n${reserveParagraphs[reserveIndex]}`.trim();
      reserveIndex += 1;
    }
  }

  return {
    payload: {
      ...payload,
      sceneText,
    } satisfies GeneratedScenePayload,
    model: modelUsed,
  };
}

function inferIntentTagsFromText(text: string) {
  const normalized = text.toLowerCase();
  const inferred = COMMON_BRANCH_TAGS.filter((tag) => normalized.includes(tag));
  if (inferred.length) {
    return inferred.slice(0, 4);
  }

  return ["investigate", "observe"];
}

function normalizeBranchChoice(
  choice: GeneratedBranchChoicePayload,
  index: number,
): GeneratedBranchChoicePayload {
  const label = choice.label.trim().slice(0, 110) || `Option ${index + 1}`;
  const description =
    choice.description.trim().slice(0, 220) ||
    "Advance this route while preserving Chronicle continuity.";
  const nextBeatTitle = choice.nextBeatTitle.trim().slice(0, 110) || `${label} Outcome`;
  const nextBeatSummary =
    choice.nextBeatSummary.trim().slice(0, 300) ||
    `The consequences of "${label}" reshape the immediate route pressure.`;
  const nextBeatAtmosphere = choice.nextBeatAtmosphere?.trim().slice(0, 140) ?? null;
  const intentTags = Array.from(
    new Set(
      choice.intentTags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 5);
  const normalizedTags = intentTags.length
    ? intentTags
    : inferIntentTagsFromText(`${label} ${description}`);

  return {
    label,
    description,
    intentTags: normalizedTags,
    nextBeatTitle,
    nextBeatSummary,
    nextBeatAtmosphere,
    chapterDirective: choice.chapterDirective ?? "stay",
  };
}

function enforceChapterDirectiveSafety(
  choices: GeneratedBranchChoicePayload[],
  context: BranchGenerationContext,
): GeneratedBranchChoicePayload[] {
  const chapterReadyForAdvance =
    context.chapterSceneCount >= context.minChapterSceneCount &&
    context.chapterWordCount >= context.minChapterWordCount;
  const atFinalChapter = context.chapterNumber >= context.totalChapterCount;
  const normalized: GeneratedBranchChoicePayload[] = choices.map((choice) => ({
    ...choice,
  }));
  if (!normalized.length) {
    return normalized;
  }

  if (!chapterReadyForAdvance) {
    return normalized.map((choice) => ({
      ...choice,
      chapterDirective: "stay" as BranchChapterDirective,
    }));
  }

  if (atFinalChapter) {
    return normalized.map((choice) => ({
      ...choice,
      chapterDirective: "finale" as BranchChapterDirective,
    }));
  }

  const hasProgressingChoice = normalized.some(
    (choice) =>
      choice.chapterDirective === "advance" || choice.chapterDirective === "finale",
  );
  if (!hasProgressingChoice) {
    normalized[0].chapterDirective = "advance";
  }

  return normalized;
}

function normalizeBranchPayload(
  payload: GeneratedBranchPayload,
  context: BranchGenerationContext,
) {
  const normalizedChoices = payload.choices
    .slice(0, BRANCH_MAX_CHOICES)
    .map((choice, index) => normalizeBranchChoice(choice, index));
  const chapterSafeChoices = enforceChapterDirectiveSafety(normalizedChoices, context);

  return {
    chapterTitle:
      payload.chapterTitle?.trim().slice(0, 100) ??
      `Chapter ${Math.max(1, context.chapterNumber)}`,
    continuityNotes: payload.continuityNotes?.slice(0, 6) ?? [],
    choices: chapterSafeChoices,
  } satisfies GeneratedBranchPayload;
}

function createSeededBranchPayload(
  context: BranchGenerationContext,
): GeneratedBranchPayload {
  const atFinalChapter = context.chapterNumber >= context.totalChapterCount;
  if (atFinalChapter) {
    const finaleChoices: GeneratedBranchChoicePayload[] = [
      {
        label: "Drive the arc to its final confrontation",
        description:
          "Commit to the decisive route that resolves this perspective's immediate arc.",
        intentTags: ["investigate", "signal", "protect"],
        nextBeatTitle: "Final Reckoning",
        nextBeatSummary:
          "The route converges on a final confrontation that locks this run's major truths into canon.",
        nextBeatAtmosphere: "High tension and irreversible consequence",
        chapterDirective: "finale",
      },
      {
        label: "Choose a quiet ending with hard costs",
        description:
          "Resolve the chapter through sacrifice, restraint, and lingering ambiguity.",
        intentTags: ["wait", "secure", "observe"],
        nextBeatTitle: "Quiet Aftermath",
        nextBeatSummary:
          "The run closes with difficult tradeoffs that still lock the route into committed Chronicle canon.",
        nextBeatAtmosphere: "Somber resolution under pressure",
        chapterDirective: "finale",
      },
    ];

    return {
      chapterTitle: `Chapter ${context.totalChapterCount}`,
      continuityNotes: context.recentEvents.slice(0, 3).map((event) => event.summary),
      choices: finaleChoices,
    };
  }

  const shouldAdvance = context.routeSceneIndex % 2 === 0;
  const firstDirective: BranchChapterDirective = shouldAdvance ? "advance" : "stay";
  const proceduralChoices: GeneratedBranchChoicePayload[] = [
    {
      label: "Press deeper into the strongest lead",
      description:
        "Follow the thread that seems most likely to expose hidden pressure in this chapter.",
      intentTags: ["investigate", "observe", "shadow"],
      nextBeatTitle: "Lead Under Pressure",
      nextBeatSummary:
        "Following this lead reveals fresh complications and escalates commitment to the route.",
      nextBeatAtmosphere: "Focused tension and tightening risk",
      chapterDirective: firstDirective,
    },
    {
      label: "Stabilize allies before the next move",
      description:
        "Consolidate trust and prepare resources before advancing into uncertain ground.",
      intentTags: ["protect", "secure", "calm"],
      nextBeatTitle: "Fragile Alliance",
      nextBeatSummary:
        "The route slows briefly to fortify relationships and expose quieter but consequential truths.",
      nextBeatAtmosphere: "Measured calm over hidden fault lines",
      chapterDirective: "stay",
    },
    {
      label: "Take a risky shortcut to force momentum",
      description:
        "Trade safety for speed and push events toward a sharper turning point.",
      intentTags: ["travel", "sneak", "signal"],
      nextBeatTitle: "Forced Turn",
      nextBeatSummary:
        "A bold shortcut forces the chapter into a higher-stakes turn that can reshape the route's direction.",
      nextBeatAtmosphere: "Urgent motion and volatile stakes",
      chapterDirective: "advance",
    },
  ];

  return {
    chapterTitle: `Chapter ${Math.max(1, context.chapterNumber)}`,
    continuityNotes: context.recentEvents.slice(0, 3).map((event) => event.summary),
    choices: proceduralChoices,
  };
}

function buildBranchPrompt(context: BranchGenerationContext) {
  const policy = getGenerationPolicy();
  const canonGuidelineLimit = policy.compactContext ? 4 : 6;
  const canonFactLimit = policy.compactContext ? 5 : 8;
  const stateLimit = policy.compactContext ? 4 : 6;
  const eventLimit = policy.compactContext ? 3 : 5;
  const sceneProseLimit = policy.compactContext ? 1 : 2;
  const canonGuidelines = context.canonEntries
    .filter((entry) => entry.entryType === "rule")
    .slice(0, canonGuidelineLimit);
  const canonFacts = context.canonEntries
    .filter((entry) => entry.entryType !== "rule")
    .slice(0, canonFactLimit);

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
    progression: {
      chapterLabel: context.chapterLabel,
      chapterNumber: context.chapterNumber,
      totalChapterCount: context.totalChapterCount,
      chapterSceneCount: context.chapterSceneCount,
      chapterWordCount: context.chapterWordCount,
      minChapterSceneCount: context.minChapterSceneCount,
      minChapterWordCount: context.minChapterWordCount,
      routeSceneIndex: context.routeSceneIndex,
    },
    currentBeat: {
      title: context.beatTitle,
      summary: context.beatSummary,
      baselineNarration: context.beatNarration,
      beatType: context.beatType,
    },
    canonGuidelines,
    canonFacts,
    chronicleState: summarizeStateEntries(context.globalState, stateLimit),
    perspectiveState: summarizeStateEntries(context.perspectiveState, stateLimit),
    knowledgeState: summarizeKnowledgeEntries(context.knowledgeState, stateLimit),
    recentEvents: context.recentEvents.slice(0, eventLimit),
    recentSceneProse: summarizeSceneContinuityEntries(context.recentSceneProse, sceneProseLimit),
  };

  const systemPrompt = [
    "You design the next deterministic branch package for Inkbranch.",
    "Return strict JSON only.",
    "Do not rewrite prior canon, state, or events.",
    "Generate 2 to 4 choices for the current beat.",
    "Each choice must include: label, description, intentTags, nextBeatTitle, nextBeatSummary, nextBeatAtmosphere, chapterDirective.",
    "chapterDirective must be one of stay, advance, finale.",
    "If chapterSceneCount < minChapterSceneCount or chapterWordCount < minChapterWordCount, use only stay directives.",
    "If chapterNumber >= totalChapterCount, all chapterDirective values should be finale.",
    "Choice labels should be concise and player-facing.",
    "nextBeatSummary should describe immediate consequence momentum for scene generation.",
    "Keep continuity with recentSceneProse and recentEvents.",
    "Output keys: chapterTitle, continuityNotes, choices.",
  ].join(" ");

  const userPrompt = [
    "Create the next branch package from this context JSON.",
    "Stay grounded in canon and viewpoint knowledge boundaries.",
    "",
    JSON.stringify(promptContext, null, 2),
  ].join("\n");

  return { systemPrompt, userPrompt };
}

function branchChoicesInvalid(payload: GeneratedBranchPayload) {
  return payload.choices.length < BRANCH_MIN_CHOICES;
}

export async function generateNarrativeScene(
  context: SceneGenerationContext,
): Promise<SceneGenerationResult> {
  const policy = getGenerationPolicy();
  const timeoutMs = Math.max(env.ollamaTimeoutMs, policy.minSceneTimeoutMs);
  if (env.inkbranchAiMode !== "ollama") {
    return {
      payload: createSeededScenePayload(context, policy.minSceneWords),
      sourceLabel: "seeded",
      mode: "seeded",
    };
  }

  try {
    const { systemPrompt, userPrompt } = buildScenePrompt(context, policy);
    const response = await chatJsonWithOllama({
      model: env.ollamaModel,
      timeoutMs,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const parsed = parseOllamaJsonContent(response.content);
    let payload =
      coerceGeneratedScenePayload(parsed) ??
      coerceLooseScenePayload(parsed ?? response.content, context);
    if (!payload) {
      throw new Error("Ollama returned JSON that did not match scene payload shape.");
    }
    if (
      env.inkbranchRuntimeProfile !== "speed" &&
      sceneTextTooShort(payload.sceneText, policy)
    ) {
      const retryResponse = await chatJsonWithOllama({
        model: env.ollamaModel,
        timeoutMs,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
          { role: "assistant", content: response.content },
          {
            role: "user",
            content:
              `sceneText is too short. Rewrite with richer chapter prose using at least ${policy.minSceneParagraphs} paragraphs and at least ${policy.minSceneWords} words. Return the full JSON object only.`,
          },
        ],
      });
      const retryParsed = parseOllamaJsonContent(retryResponse.content);
      const retryPayload =
        coerceGeneratedScenePayload(retryParsed) ??
        coerceLooseScenePayload(retryParsed ?? retryResponse.content, context);
      if (retryPayload) {
        payload = retryPayload;
      }
    }

    let model = response.model;
    if (
      env.inkbranchRuntimeProfile !== "speed" &&
      sceneTextTooShort(payload.sceneText, policy)
    ) {
      const expanded = await expandSceneTextToMinimum(
        payload,
        context,
        timeoutMs,
        policy,
      );
      payload = expanded.payload;
      model = expanded.model ?? model;
    }

    return {
      payload: {
        ...payload,
        sceneText: sceneTextTooShort(payload.sceneText, policy)
          ? padSeededSceneText(payload.sceneText, context, policy.minSceneWords)
          : payload.sceneText,
      },
      sourceLabel: "ollama",
      mode: "ollama",
      model,
    };
  } catch (error) {
    const fallbackReason =
      error instanceof Error ? error.message : "unknown scene generation error";
    console.warn("[Inkbranch AI] Falling back to seeded scene generation:", fallbackReason);

    return {
      payload: createSeededScenePayload(context, policy.minSceneWords),
      sourceLabel: "seeded",
      mode: "seeded",
      fallbackReason,
    };
  }
}

export async function generateNarrativeBranch(
  context: BranchGenerationContext,
): Promise<BranchGenerationResult> {
  const policy = getGenerationPolicy();
  const timeoutMs = Math.max(env.ollamaTimeoutMs, policy.minBranchTimeoutMs);
  const seededPayload = normalizeBranchPayload(createSeededBranchPayload(context), context);
  if (env.inkbranchAiMode !== "ollama") {
    return {
      payload: seededPayload,
      sourceLabel: "seeded",
      mode: "seeded",
    };
  }

  try {
    const { systemPrompt, userPrompt } = buildBranchPrompt(context);
    const response = await chatJsonWithOllama({
      model: env.ollamaModel,
      timeoutMs,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const parsed = parseOllamaJsonContent(response.content);
    let payload = coerceGeneratedBranchPayload(parsed);
    if (!payload) {
      throw new Error("Ollama branch output did not match branch payload shape.");
    }
    if (branchChoicesInvalid(payload)) {
      throw new Error("Ollama branch output was missing required branch choices.");
    }

    payload = normalizeBranchPayload(payload, context);
    if (branchChoicesInvalid(payload)) {
      const retryResponse = await chatJsonWithOllama({
        model: env.ollamaModel,
        timeoutMs,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
          { role: "assistant", content: response.content },
          {
            role: "user",
            content:
              "The branch package is invalid or too small. Return strict JSON with 2-4 valid choices using the required keys only.",
          },
        ],
      });
      const retryParsed = parseOllamaJsonContent(retryResponse.content);
      const retryPayload = coerceGeneratedBranchPayload(retryParsed);
      if (!retryPayload) {
        throw new Error(
          "Ollama branch output remained invalid after retry; falling back to seeded branch package.",
        );
      }
      if (branchChoicesInvalid(retryPayload)) {
        throw new Error(
          "Ollama branch output remained invalid after retry; falling back to seeded branch package.",
        );
      }

      return {
        payload: normalizeBranchPayload(retryPayload, context),
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
      error instanceof Error ? error.message : "unknown branch generation error";
    console.warn("[Inkbranch AI] Falling back to seeded branch generation:", fallbackReason);

    return {
      payload: seededPayload,
      sourceLabel: "seeded",
      mode: "seeded",
      fallbackReason,
    };
  }
}
