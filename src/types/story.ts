export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type PublishState = "draft" | "published" | "archived";
export type BeatType = "world" | "perspective" | "interlock";
export type ConsequenceScope = "global" | "perspective" | "knowledge";
export type ChronicleStatus = "active" | "paused" | "completed";
export type PerspectiveRunStatus = "active" | "paused" | "completed";
export type KnowledgeStatus = "unknown" | "suspected" | "known";
export type CanonEntryType =
  | "world_truth"
  | "character_truth"
  | "item_truth"
  | "place_truth"
  | "rule";
export type CanonicalEventType =
  | "world_change"
  | "route_change"
  | "knowledge_reveal"
  | "system";

export interface StoryWorldRecord {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  tone: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoryVersionRecord {
  id: string;
  worldId: string;
  versionLabel: string;
  description: string;
  status: PublishState;
  isDefaultPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoryCharacterRecord {
  id: string;
  worldId: string;
  slug: string;
  name: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayableViewpointRecord {
  id: string;
  versionId: string;
  characterId: string;
  label: string;
  description: string;
  startBeatId: string | null;
  isPlayable: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoryCanonEntryRecord {
  id: string;
  versionId: string;
  entryType: CanonEntryType;
  canonKey: string;
  title: string;
  body: string;
  isContradictionSensitive: boolean;
  metadata: Record<string, JsonValue>;
  createdAt: string;
  updatedAt: string;
}

export interface StoryBeatRecord {
  id: string;
  versionId: string;
  slug: string;
  title: string;
  sceneSubtitle: string | null;
  chapterLabel: string | null;
  summary: string;
  narration: string;
  atmosphere: string | null;
  allowsGuidedAction: boolean;
  guidedActionPrompt: string | null;
  allowedActionTags: string[];
  fallbackChoiceId: string | null;
  beatType: BeatType;
  orderIndex: number;
  isTerminal: boolean;
  metadata: Record<string, JsonValue>;
  createdAt: string;
  updatedAt: string;
}

export interface ChoiceCondition {
  scope: ConsequenceScope;
  key: string;
  equals?: JsonValue;
  notEquals?: JsonValue;
  knowledgeStatus?: KnowledgeStatus;
}

export interface ChoiceConsequence {
  scope: ConsequenceScope;
  key: string;
  value: JsonValue;
}

export interface BeatChoiceRecord {
  id: string;
  beatId: string;
  label: string;
  internalKey: string | null;
  description: string | null;
  orderIndex: number;
  nextBeatId: string | null;
  intentTags: string[];
  consequenceScope: ConsequenceScope;
  gatingRules: ChoiceCondition[];
  consequences: ChoiceConsequence[];
  metadata: Record<string, JsonValue>;
  createdAt: string;
  updatedAt: string;
}

export interface ChronicleRecord {
  id: string;
  userId: string;
  worldId: string;
  versionId: string;
  status: ChronicleStatus;
  startedAt: string;
  lastActiveAt: string;
  completedAt: string | null;
}

export interface ChronicleWorldStateRecord {
  id: string;
  chronicleId: string;
  stateKey: string;
  stateValue: JsonValue;
  updatedAt: string;
}

export interface PerspectiveRunRecord {
  id: string;
  chronicleId: string;
  viewpointId: string;
  currentBeatId: string;
  status: PerspectiveRunStatus;
  summary: string | null;
  startedAt: string;
  lastActiveAt: string;
  completedAt: string | null;
}

export interface PerspectiveStateRecord {
  id: string;
  perspectiveRunId: string;
  stateKey: string;
  stateValue: JsonValue;
  updatedAt: string;
}

export interface PerspectiveKnowledgeRecord {
  id: string;
  perspectiveRunId: string;
  flagKey: string;
  status: KnowledgeStatus;
  details: string | null;
  updatedAt: string;
}

export interface GeneratedSceneRecord {
  id: string;
  chronicleId: string;
  perspectiveRunId: string;
  beatId: string;
  sceneText: string;
  sourceLabel: string;
  metadata: Record<string, JsonValue>;
  createdAt: string;
}

export interface StoryChapterRecord {
  id: string;
  chronicleId: string;
  perspectiveRunId: string;
  chapterNumber: number;
  chapterLabel: string;
  chapterTitle: string;
  chapterSummary: string;
  chapterText: string;
  sceneCount: number;
  wordCount: number;
  sourceLabel: string;
  isReady: boolean;
  metadata: Record<string, JsonValue>;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalEventRecord {
  id: string;
  chronicleId: string;
  perspectiveRunId: string | null;
  beatId: string | null;
  choiceId: string | null;
  eventType: CanonicalEventType;
  summary: string;
  payload: Record<string, JsonValue>;
  createdAt: string;
}

export interface LocalStoryDb {
  storyWorlds: StoryWorldRecord[];
  storyVersions: StoryVersionRecord[];
  storyCharacters: StoryCharacterRecord[];
  playableViewpoints: PlayableViewpointRecord[];
  storyCanonEntries: StoryCanonEntryRecord[];
  storyBeats: StoryBeatRecord[];
  beatChoices: BeatChoiceRecord[];
  chronicles: ChronicleRecord[];
  chronicleWorldStateValues: ChronicleWorldStateRecord[];
  perspectiveRuns: PerspectiveRunRecord[];
  perspectiveStateValues: PerspectiveStateRecord[];
  perspectiveKnowledgeFlags: PerspectiveKnowledgeRecord[];
  generatedScenes: GeneratedSceneRecord[];
  storyChapters: StoryChapterRecord[];
  canonicalEventLog: CanonicalEventRecord[];
}

export interface ReaderWorldCard {
  world: StoryWorldRecord;
  version: StoryVersionRecord;
  playablePerspectiveCount: number;
}

export interface ReaderStoryDetail {
  world: StoryWorldRecord;
  version: StoryVersionRecord;
  viewpoints: Array<PlayableViewpointRecord & { character: StoryCharacterRecord }>;
}

export interface ReaderChronicleSummary {
  chronicle: ChronicleRecord;
  world: StoryWorldRecord;
  version: StoryVersionRecord;
  viewpointCount: number;
  completedRunCount: number;
  worldStateCount: number;
  recentEvents: CanonicalEventRecord[];
  runs: Array<{
    run: PerspectiveRunRecord;
    viewpoint: PlayableViewpointRecord;
    character: StoryCharacterRecord;
    beat: StoryBeatRecord;
  }>;
}
