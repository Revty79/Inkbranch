CREATE TABLE "story_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chronicle_id" uuid NOT NULL,
	"perspective_run_id" uuid NOT NULL,
	"chapter_number" integer NOT NULL,
	"chapter_label" text NOT NULL,
	"chapter_title" text NOT NULL,
	"chapter_summary" text NOT NULL,
	"chapter_text" text NOT NULL,
	"scene_count" integer DEFAULT 0 NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"source_label" text DEFAULT 'seeded' NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "story_chapters" ADD CONSTRAINT "story_chapters_chronicle_id_chronicles_id_fk" FOREIGN KEY ("chronicle_id") REFERENCES "public"."chronicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_chapters" ADD CONSTRAINT "story_chapters_perspective_run_id_perspective_runs_id_fk" FOREIGN KEY ("perspective_run_id") REFERENCES "public"."perspective_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "story_chapters_chronicle_idx" ON "story_chapters" USING btree ("chronicle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "story_chapters_run_chapter_idx" ON "story_chapters" USING btree ("perspective_run_id","chapter_number");