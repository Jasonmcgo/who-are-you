CREATE TYPE "public"."field_state" AS ENUM('specified', 'prefer_not_to_say', 'not_answered');--> statement-breakpoint
CREATE TABLE "demographics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name_value" text,
	"name_state" "field_state" DEFAULT 'not_answered' NOT NULL,
	"gender_value" text,
	"gender_state" "field_state" DEFAULT 'not_answered' NOT NULL,
	"age_decade" text,
	"age_state" "field_state" DEFAULT 'not_answered' NOT NULL,
	"location_country" text,
	"location_region" text,
	"location_state" "field_state" DEFAULT 'not_answered' NOT NULL,
	"marital_status_value" text,
	"marital_status_state" "field_state" DEFAULT 'not_answered' NOT NULL,
	"education_value" text,
	"education_state" "field_state" DEFAULT 'not_answered' NOT NULL,
	"political_value" text,
	"political_state" "field_state" DEFAULT 'not_answered' NOT NULL,
	"religious_value" text,
	"religious_state" "field_state" DEFAULT 'not_answered' NOT NULL,
	"profession_value" text,
	"profession_state" "field_state" DEFAULT 'not_answered' NOT NULL,
	CONSTRAINT "demographics_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"answers" jsonb NOT NULL,
	"inner_constitution" jsonb NOT NULL,
	"skipped_question_ids" jsonb NOT NULL,
	"meta_signals" jsonb NOT NULL,
	"allocation_overlays" jsonb,
	"belief_under_tension" jsonb
);
--> statement-breakpoint
ALTER TABLE "demographics" ADD CONSTRAINT "demographics_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;