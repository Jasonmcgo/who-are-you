ALTER TABLE "sessions" ADD COLUMN "llm_rewrites" jsonb;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "llm_rewrites_engine_hash" text;