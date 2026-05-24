-- CC-COUPLE-1 — `couple_sessions` table for the couple module MVP.
-- Prod apply is DEFERRED behind CC-139 sign-off (the prod migration chain
-- around snapshots 0006/0007 is mid-reconcile). Dev only for now.
CREATE TABLE "couple_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invite_token" text NOT NULL,
	"partner_a_session_id" uuid NOT NULL,
	"partner_b_session_id" uuid,
	"status" text DEFAULT 'invited' NOT NULL,
	"game_results" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "couple_sessions_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
ALTER TABLE "couple_sessions" ADD CONSTRAINT "couple_sessions_partner_a_session_id_sessions_id_fk" FOREIGN KEY ("partner_a_session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_sessions" ADD CONSTRAINT "couple_sessions_partner_b_session_id_sessions_id_fk" FOREIGN KEY ("partner_b_session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;