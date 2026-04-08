ALTER TABLE "beat_choices" ADD COLUMN "intent_tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "story_beats" ADD COLUMN "scene_subtitle" text;--> statement-breakpoint
ALTER TABLE "story_beats" ADD COLUMN "chapter_label" text;--> statement-breakpoint
ALTER TABLE "story_beats" ADD COLUMN "atmosphere" text;--> statement-breakpoint
ALTER TABLE "story_beats" ADD COLUMN "allows_guided_action" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "story_beats" ADD COLUMN "guided_action_prompt" text;--> statement-breakpoint
ALTER TABLE "story_beats" ADD COLUMN "allowed_action_tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "story_beats" ADD COLUMN "fallback_choice_id" text;