import { relations } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["reader", "admin", "creator"]);
export const publishStateEnum = pgEnum("publish_state", [
  "draft",
  "published",
  "archived",
]);
export const beatTypeEnum = pgEnum("beat_type", [
  "world",
  "perspective",
  "interlock",
]);
export const consequenceScopeEnum = pgEnum("consequence_scope", [
  "global",
  "perspective",
  "knowledge",
]);
export const canonEntryTypeEnum = pgEnum("canon_entry_type", [
  "world_truth",
  "character_truth",
  "item_truth",
  "place_truth",
  "rule",
]);
export const chronicleStatusEnum = pgEnum("chronicle_status", [
  "active",
  "paused",
  "completed",
]);
export const perspectiveRunStatusEnum = pgEnum("perspective_run_status", [
  "active",
  "paused",
  "completed",
]);
export const knowledgeStatusEnum = pgEnum("knowledge_status", [
  "unknown",
  "suspected",
  "known",
]);
export const canonicalEventTypeEnum = pgEnum("canonical_event_type", [
  "world_change",
  "route_change",
  "knowledge_reveal",
  "system",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("reader"),
  passwordHash: text("password_hash").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const storyWorlds = pgTable(
  "story_worlds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    synopsis: text("synopsis").notNull(),
    tone: text("tone").notNull(),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("story_worlds_slug_idx").on(table.slug)],
);

export const storyVersions = pgTable(
  "story_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    worldId: uuid("world_id")
      .notNull()
      .references(() => storyWorlds.id, { onDelete: "cascade" }),
    versionLabel: text("version_label").notNull(),
    description: text("description").notNull(),
    status: publishStateEnum("status").notNull().default("draft"),
    isDefaultPublished: boolean("is_default_published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("story_versions_world_idx").on(table.worldId),
    index("story_versions_status_idx").on(table.status),
  ],
);

export const storyCharacters = pgTable(
  "story_characters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    worldId: uuid("world_id")
      .notNull()
      .references(() => storyWorlds.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("story_characters_world_slug_idx").on(table.worldId, table.slug),
  ],
);

export const playableViewpoints = pgTable(
  "playable_viewpoints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => storyVersions.id, { onDelete: "cascade" }),
    characterId: uuid("character_id")
      .notNull()
      .references(() => storyCharacters.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    description: text("description").notNull(),
    startBeatId: uuid("start_beat_id"),
    isPlayable: boolean("is_playable").notNull().default(true),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("playable_viewpoints_version_idx").on(table.versionId)],
);

export const storyCanonEntries = pgTable(
  "story_canon_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => storyVersions.id, { onDelete: "cascade" }),
    entryType: canonEntryTypeEnum("entry_type").notNull().default("world_truth"),
    canonKey: text("canon_key").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    isContradictionSensitive: boolean("is_contradiction_sensitive")
      .notNull()
      .default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("story_canon_entries_version_key_idx").on(
      table.versionId,
      table.canonKey,
    ),
  ],
);

export const storyBeats = pgTable(
  "story_beats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => storyVersions.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    sceneSubtitle: text("scene_subtitle"),
    chapterLabel: text("chapter_label"),
    summary: text("summary").notNull(),
    narration: text("narration").notNull(),
    atmosphere: text("atmosphere"),
    allowsGuidedAction: boolean("allows_guided_action").notNull().default(false),
    guidedActionPrompt: text("guided_action_prompt"),
    allowedActionTags: jsonb("allowed_action_tags").$type<string[]>().notNull().default([]),
    fallbackChoiceId: text("fallback_choice_id"),
    beatType: beatTypeEnum("beat_type").notNull().default("perspective"),
    orderIndex: integer("order_index").notNull().default(0),
    isTerminal: boolean("is_terminal").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("story_beats_version_slug_idx").on(table.versionId, table.slug)],
);

export const beatChoices = pgTable(
  "beat_choices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    beatId: uuid("beat_id")
      .notNull()
      .references(() => storyBeats.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    internalKey: text("internal_key"),
    description: text("description"),
    orderIndex: integer("order_index").notNull().default(0),
    nextBeatId: uuid("next_beat_id"),
    intentTags: jsonb("intent_tags").$type<string[]>().notNull().default([]),
    consequenceScope: consequenceScopeEnum("consequence_scope")
      .notNull()
      .default("perspective"),
    gatingRules: jsonb("gating_rules").$type<Record<string, unknown>[]>().notNull().default([]),
    consequences: jsonb("consequences").$type<Record<string, unknown>[]>().notNull().default([]),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("beat_choices_beat_idx").on(table.beatId)],
);

export const chronicles = pgTable(
  "chronicles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    worldId: uuid("world_id")
      .notNull()
      .references(() => storyWorlds.id, { onDelete: "restrict" }),
    versionId: uuid("version_id")
      .notNull()
      .references(() => storyVersions.id, { onDelete: "restrict" }),
    status: chronicleStatusEnum("status").notNull().default("active"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [index("chronicles_user_idx").on(table.userId)],
);

export const chronicleWorldStateValues = pgTable(
  "chronicle_world_state_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chronicleId: uuid("chronicle_id")
      .notNull()
      .references(() => chronicles.id, { onDelete: "cascade" }),
    stateKey: text("state_key").notNull(),
    stateValue: jsonb("state_value").$type<unknown>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("chronicle_world_state_key_idx").on(table.chronicleId, table.stateKey),
  ],
);

export const perspectiveRuns = pgTable(
  "perspective_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chronicleId: uuid("chronicle_id")
      .notNull()
      .references(() => chronicles.id, { onDelete: "cascade" }),
    viewpointId: uuid("viewpoint_id")
      .notNull()
      .references(() => playableViewpoints.id, { onDelete: "restrict" }),
    currentBeatId: uuid("current_beat_id")
      .notNull()
      .references(() => storyBeats.id, { onDelete: "restrict" }),
    status: perspectiveRunStatusEnum("status").notNull().default("active"),
    summary: text("summary"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("perspective_runs_chronicle_idx").on(table.chronicleId),
    uniqueIndex("perspective_runs_chronicle_viewpoint_idx").on(
      table.chronicleId,
      table.viewpointId,
    ),
  ],
);

export const perspectiveStateValues = pgTable(
  "perspective_state_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    perspectiveRunId: uuid("perspective_run_id")
      .notNull()
      .references(() => perspectiveRuns.id, { onDelete: "cascade" }),
    stateKey: text("state_key").notNull(),
    stateValue: jsonb("state_value").$type<unknown>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("perspective_state_key_idx").on(table.perspectiveRunId, table.stateKey),
  ],
);

export const perspectiveKnowledgeFlags = pgTable(
  "perspective_knowledge_flags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    perspectiveRunId: uuid("perspective_run_id")
      .notNull()
      .references(() => perspectiveRuns.id, { onDelete: "cascade" }),
    flagKey: text("flag_key").notNull(),
    status: knowledgeStatusEnum("status").notNull().default("known"),
    details: text("details"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("perspective_knowledge_key_idx").on(table.perspectiveRunId, table.flagKey),
  ],
);

export const canonicalEventLog = pgTable(
  "canonical_event_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chronicleId: uuid("chronicle_id")
      .notNull()
      .references(() => chronicles.id, { onDelete: "cascade" }),
    perspectiveRunId: uuid("perspective_run_id").references(() => perspectiveRuns.id, {
      onDelete: "set null",
    }),
    beatId: uuid("beat_id").references(() => storyBeats.id, { onDelete: "set null" }),
    choiceId: uuid("choice_id").references(() => beatChoices.id, { onDelete: "set null" }),
    eventType: canonicalEventTypeEnum("event_type").notNull().default("system"),
    summary: text("summary").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("canonical_event_log_chronicle_idx").on(table.chronicleId)],
);

export const generatedScenes = pgTable(
  "generated_scenes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chronicleId: uuid("chronicle_id")
      .notNull()
      .references(() => chronicles.id, { onDelete: "cascade" }),
    perspectiveRunId: uuid("perspective_run_id")
      .notNull()
      .references(() => perspectiveRuns.id, { onDelete: "cascade" }),
    beatId: uuid("beat_id")
      .notNull()
      .references(() => storyBeats.id, { onDelete: "cascade" }),
    sceneText: text("scene_text").notNull(),
    sourceLabel: text("source_label").notNull().default("seeded"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("generated_scenes_run_idx").on(table.perspectiveRunId)],
);

export const storyChapters = pgTable(
  "story_chapters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chronicleId: uuid("chronicle_id")
      .notNull()
      .references(() => chronicles.id, { onDelete: "cascade" }),
    perspectiveRunId: uuid("perspective_run_id")
      .notNull()
      .references(() => perspectiveRuns.id, { onDelete: "cascade" }),
    chapterNumber: integer("chapter_number").notNull(),
    chapterLabel: text("chapter_label").notNull(),
    chapterTitle: text("chapter_title").notNull(),
    chapterSummary: text("chapter_summary").notNull(),
    chapterText: text("chapter_text").notNull(),
    sceneCount: integer("scene_count").notNull().default(0),
    wordCount: integer("word_count").notNull().default(0),
    sourceLabel: text("source_label").notNull().default("seeded"),
    isReady: boolean("is_ready").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("story_chapters_chronicle_idx").on(table.chronicleId),
    uniqueIndex("story_chapters_run_chapter_idx").on(
      table.perspectiveRunId,
      table.chapterNumber,
    ),
  ],
);

export const storyRuntimeState = pgTable("story_runtime_state", {
  key: text("key").primaryKey(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const storyWorldRelations = relations(storyWorlds, ({ many }) => ({
  versions: many(storyVersions),
  characters: many(storyCharacters),
  chronicles: many(chronicles),
}));

export const storyVersionRelations = relations(storyVersions, ({ one, many }) => ({
  world: one(storyWorlds, {
    fields: [storyVersions.worldId],
    references: [storyWorlds.id],
  }),
  viewpoints: many(playableViewpoints),
  canonEntries: many(storyCanonEntries),
  beats: many(storyBeats),
  chronicles: many(chronicles),
}));

export const chronicleRelations = relations(chronicles, ({ one, many }) => ({
  world: one(storyWorlds, {
    fields: [chronicles.worldId],
    references: [storyWorlds.id],
  }),
  version: one(storyVersions, {
    fields: [chronicles.versionId],
    references: [storyVersions.id],
  }),
  runs: many(perspectiveRuns),
  worldStateValues: many(chronicleWorldStateValues),
  events: many(canonicalEventLog),
  scenes: many(generatedScenes),
}));

export const perspectiveRunRelations = relations(perspectiveRuns, ({ one, many }) => ({
  chronicle: one(chronicles, {
    fields: [perspectiveRuns.chronicleId],
    references: [chronicles.id],
  }),
  viewpoint: one(playableViewpoints, {
    fields: [perspectiveRuns.viewpointId],
    references: [playableViewpoints.id],
  }),
  currentBeat: one(storyBeats, {
    fields: [perspectiveRuns.currentBeatId],
    references: [storyBeats.id],
  }),
  perspectiveStateValues: many(perspectiveStateValues),
  knowledgeFlags: many(perspectiveKnowledgeFlags),
  scenes: many(generatedScenes),
}));

export type User = InferSelectModel<typeof users>;
export type StoryWorld = InferSelectModel<typeof storyWorlds>;
export type StoryVersion = InferSelectModel<typeof storyVersions>;
export type StoryCharacter = InferSelectModel<typeof storyCharacters>;
export type PlayableViewpoint = InferSelectModel<typeof playableViewpoints>;
export type StoryCanonEntry = InferSelectModel<typeof storyCanonEntries>;
export type StoryBeat = InferSelectModel<typeof storyBeats>;
export type BeatChoice = InferSelectModel<typeof beatChoices>;
export type Chronicle = InferSelectModel<typeof chronicles>;
export type PerspectiveRun = InferSelectModel<typeof perspectiveRuns>;
export type ChronicleWorldStateValue = InferSelectModel<typeof chronicleWorldStateValues>;
export type PerspectiveStateValue = InferSelectModel<typeof perspectiveStateValues>;
export type PerspectiveKnowledgeFlag = InferSelectModel<
  typeof perspectiveKnowledgeFlags
>;
export type GeneratedScene = InferSelectModel<typeof generatedScenes>;
export type StoryChapter = InferSelectModel<typeof storyChapters>;
export type CanonicalEvent = InferSelectModel<typeof canonicalEventLog>;
export type StoryRuntimeState = InferSelectModel<typeof storyRuntimeState>;

export type NewStoryWorld = InferInsertModel<typeof storyWorlds>;
export type NewStoryVersion = InferInsertModel<typeof storyVersions>;
export type NewStoryCharacter = InferInsertModel<typeof storyCharacters>;
export type NewPlayableViewpoint = InferInsertModel<typeof playableViewpoints>;
export type NewStoryCanonEntry = InferInsertModel<typeof storyCanonEntries>;
export type NewStoryBeat = InferInsertModel<typeof storyBeats>;
export type NewBeatChoice = InferInsertModel<typeof beatChoices>;
export type NewChronicle = InferInsertModel<typeof chronicles>;
export type NewPerspectiveRun = InferInsertModel<typeof perspectiveRuns>;
export type NewStoryChapter = InferInsertModel<typeof storyChapters>;
export type NewStoryRuntimeState = InferInsertModel<typeof storyRuntimeState>;
