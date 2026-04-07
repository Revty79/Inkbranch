CREATE TYPE "public"."beat_type" AS ENUM('world', 'perspective', 'interlock');--> statement-breakpoint
CREATE TYPE "public"."canon_entry_type" AS ENUM('world_truth', 'character_truth', 'item_truth', 'place_truth', 'rule');--> statement-breakpoint
CREATE TYPE "public"."canonical_event_type" AS ENUM('world_change', 'route_change', 'knowledge_reveal', 'system');--> statement-breakpoint
CREATE TYPE "public"."chronicle_status" AS ENUM('active', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."consequence_scope" AS ENUM('global', 'perspective', 'knowledge');--> statement-breakpoint
CREATE TYPE "public"."knowledge_status" AS ENUM('unknown', 'suspected', 'known');--> statement-breakpoint
CREATE TYPE "public"."perspective_run_status" AS ENUM('active', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."publish_state" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('reader', 'admin', 'creator');--> statement-breakpoint
CREATE TABLE "beat_choices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"beat_id" uuid NOT NULL,
	"label" text NOT NULL,
	"internal_key" text,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"next_beat_id" uuid,
	"consequence_scope" "consequence_scope" DEFAULT 'perspective' NOT NULL,
	"gating_rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"consequences" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canonical_event_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chronicle_id" uuid NOT NULL,
	"perspective_run_id" uuid,
	"beat_id" uuid,
	"choice_id" uuid,
	"event_type" "canonical_event_type" DEFAULT 'system' NOT NULL,
	"summary" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chronicle_world_state_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chronicle_id" uuid NOT NULL,
	"state_key" text NOT NULL,
	"state_value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chronicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"world_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"status" "chronicle_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "generated_scenes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chronicle_id" uuid NOT NULL,
	"perspective_run_id" uuid NOT NULL,
	"beat_id" uuid NOT NULL,
	"scene_text" text NOT NULL,
	"source_label" text DEFAULT 'seeded' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perspective_knowledge_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"perspective_run_id" uuid NOT NULL,
	"flag_key" text NOT NULL,
	"status" "knowledge_status" DEFAULT 'known' NOT NULL,
	"details" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perspective_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chronicle_id" uuid NOT NULL,
	"viewpoint_id" uuid NOT NULL,
	"current_beat_id" uuid NOT NULL,
	"status" "perspective_run_status" DEFAULT 'active' NOT NULL,
	"summary" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "perspective_state_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"perspective_run_id" uuid NOT NULL,
	"state_key" text NOT NULL,
	"state_value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playable_viewpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"start_beat_id" uuid,
	"is_playable" boolean DEFAULT true NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_beats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"narration" text NOT NULL,
	"beat_type" "beat_type" DEFAULT 'perspective' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_terminal" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_canon_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"entry_type" "canon_entry_type" DEFAULT 'world_truth' NOT NULL,
	"canon_key" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"is_contradiction_sensitive" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"version_label" text NOT NULL,
	"description" text NOT NULL,
	"status" "publish_state" DEFAULT 'draft' NOT NULL,
	"is_default_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_worlds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"synopsis" text NOT NULL,
	"tone" text NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'reader' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "beat_choices" ADD CONSTRAINT "beat_choices_beat_id_story_beats_id_fk" FOREIGN KEY ("beat_id") REFERENCES "public"."story_beats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canonical_event_log" ADD CONSTRAINT "canonical_event_log_chronicle_id_chronicles_id_fk" FOREIGN KEY ("chronicle_id") REFERENCES "public"."chronicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canonical_event_log" ADD CONSTRAINT "canonical_event_log_perspective_run_id_perspective_runs_id_fk" FOREIGN KEY ("perspective_run_id") REFERENCES "public"."perspective_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canonical_event_log" ADD CONSTRAINT "canonical_event_log_beat_id_story_beats_id_fk" FOREIGN KEY ("beat_id") REFERENCES "public"."story_beats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canonical_event_log" ADD CONSTRAINT "canonical_event_log_choice_id_beat_choices_id_fk" FOREIGN KEY ("choice_id") REFERENCES "public"."beat_choices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chronicle_world_state_values" ADD CONSTRAINT "chronicle_world_state_values_chronicle_id_chronicles_id_fk" FOREIGN KEY ("chronicle_id") REFERENCES "public"."chronicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chronicles" ADD CONSTRAINT "chronicles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chronicles" ADD CONSTRAINT "chronicles_world_id_story_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."story_worlds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chronicles" ADD CONSTRAINT "chronicles_version_id_story_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."story_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_scenes" ADD CONSTRAINT "generated_scenes_chronicle_id_chronicles_id_fk" FOREIGN KEY ("chronicle_id") REFERENCES "public"."chronicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_scenes" ADD CONSTRAINT "generated_scenes_perspective_run_id_perspective_runs_id_fk" FOREIGN KEY ("perspective_run_id") REFERENCES "public"."perspective_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_scenes" ADD CONSTRAINT "generated_scenes_beat_id_story_beats_id_fk" FOREIGN KEY ("beat_id") REFERENCES "public"."story_beats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perspective_knowledge_flags" ADD CONSTRAINT "perspective_knowledge_flags_perspective_run_id_perspective_runs_id_fk" FOREIGN KEY ("perspective_run_id") REFERENCES "public"."perspective_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perspective_runs" ADD CONSTRAINT "perspective_runs_chronicle_id_chronicles_id_fk" FOREIGN KEY ("chronicle_id") REFERENCES "public"."chronicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perspective_runs" ADD CONSTRAINT "perspective_runs_viewpoint_id_playable_viewpoints_id_fk" FOREIGN KEY ("viewpoint_id") REFERENCES "public"."playable_viewpoints"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perspective_runs" ADD CONSTRAINT "perspective_runs_current_beat_id_story_beats_id_fk" FOREIGN KEY ("current_beat_id") REFERENCES "public"."story_beats"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perspective_state_values" ADD CONSTRAINT "perspective_state_values_perspective_run_id_perspective_runs_id_fk" FOREIGN KEY ("perspective_run_id") REFERENCES "public"."perspective_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playable_viewpoints" ADD CONSTRAINT "playable_viewpoints_version_id_story_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."story_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playable_viewpoints" ADD CONSTRAINT "playable_viewpoints_character_id_story_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."story_characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_beats" ADD CONSTRAINT "story_beats_version_id_story_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."story_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_canon_entries" ADD CONSTRAINT "story_canon_entries_version_id_story_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."story_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_characters" ADD CONSTRAINT "story_characters_world_id_story_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."story_worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_versions" ADD CONSTRAINT "story_versions_world_id_story_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."story_worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "beat_choices_beat_idx" ON "beat_choices" USING btree ("beat_id");--> statement-breakpoint
CREATE INDEX "canonical_event_log_chronicle_idx" ON "canonical_event_log" USING btree ("chronicle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chronicle_world_state_key_idx" ON "chronicle_world_state_values" USING btree ("chronicle_id","state_key");--> statement-breakpoint
CREATE INDEX "chronicles_user_idx" ON "chronicles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "generated_scenes_run_idx" ON "generated_scenes" USING btree ("perspective_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "perspective_knowledge_key_idx" ON "perspective_knowledge_flags" USING btree ("perspective_run_id","flag_key");--> statement-breakpoint
CREATE INDEX "perspective_runs_chronicle_idx" ON "perspective_runs" USING btree ("chronicle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "perspective_runs_chronicle_viewpoint_idx" ON "perspective_runs" USING btree ("chronicle_id","viewpoint_id");--> statement-breakpoint
CREATE UNIQUE INDEX "perspective_state_key_idx" ON "perspective_state_values" USING btree ("perspective_run_id","state_key");--> statement-breakpoint
CREATE INDEX "playable_viewpoints_version_idx" ON "playable_viewpoints" USING btree ("version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "story_beats_version_slug_idx" ON "story_beats" USING btree ("version_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "story_canon_entries_version_key_idx" ON "story_canon_entries" USING btree ("version_id","canon_key");--> statement-breakpoint
CREATE UNIQUE INDEX "story_characters_world_slug_idx" ON "story_characters" USING btree ("world_id","slug");--> statement-breakpoint
CREATE INDEX "story_versions_world_idx" ON "story_versions" USING btree ("world_id");--> statement-breakpoint
CREATE INDEX "story_versions_status_idx" ON "story_versions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "story_worlds_slug_idx" ON "story_worlds" USING btree ("slug");