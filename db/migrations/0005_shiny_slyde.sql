CREATE TABLE "ghost_mapping_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"admin_label" text NOT NULL,
	"note" text,
	"before_snapshot" jsonb,
	"after_snapshot" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ghost_mapping_audit" ADD CONSTRAINT "ghost_mapping_audit_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;