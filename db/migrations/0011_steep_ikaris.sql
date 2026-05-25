CREATE TABLE "room_read_calibration_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"card_id" text NOT NULL,
	"theme" text NOT NULL,
	"engine_pick_player_id" text NOT NULL,
	"engine_confidence" text NOT NULL,
	"engine_is_split" boolean DEFAULT false NOT NULL,
	"engine_matched_tags" jsonb NOT NULL,
	"room_vote_distribution" jsonb NOT NULL,
	"room_winner_player_id" text,
	"verdict" text NOT NULL,
	"subject_self_confirm" jsonb,
	"engine_shape_version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_read_guesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"voter_player_id" text NOT NULL,
	"guessed_player_id" text,
	"guessed_special" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_read_guesses_round_voter_unique" UNIQUE("round_id","voter_player_id")
);
--> statement-breakpoint
CREATE TABLE "room_read_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"theme" text NOT NULL,
	"card_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"engine_pick_player_id" text NOT NULL,
	"engine_runner_up_player_id" text,
	"engine_confidence" text NOT NULL,
	"engine_is_split" boolean DEFAULT false NOT NULL,
	"engine_matched_tags" jsonb NOT NULL,
	"engine_reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_read_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"player_id" text NOT NULL,
	"points" integer NOT NULL,
	"breakdown" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_read_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"join_token" text NOT NULL,
	"created_by_admin" text,
	"player_session_ids" jsonb NOT NULL,
	"round_count" integer NOT NULL,
	"mode" text DEFAULT 'classic' NOT NULL,
	"scoring_mode" text DEFAULT 'engine_plus_room' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"engine_shape_version" integer,
	"generated_game" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_read_sessions_join_token_unique" UNIQUE("join_token")
);
--> statement-breakpoint
ALTER TABLE "room_read_calibration_events" ADD CONSTRAINT "room_read_calibration_events_session_id_room_read_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."room_read_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_read_calibration_events" ADD CONSTRAINT "room_read_calibration_events_round_id_room_read_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."room_read_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_read_guesses" ADD CONSTRAINT "room_read_guesses_session_id_room_read_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."room_read_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_read_guesses" ADD CONSTRAINT "room_read_guesses_round_id_room_read_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."room_read_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_read_rounds" ADD CONSTRAINT "room_read_rounds_session_id_room_read_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."room_read_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_read_scores" ADD CONSTRAINT "room_read_scores_session_id_room_read_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."room_read_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_read_scores" ADD CONSTRAINT "room_read_scores_round_id_room_read_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."room_read_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "room_read_calibration_card_id_idx" ON "room_read_calibration_events" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "room_read_calibration_engine_pick_idx" ON "room_read_calibration_events" USING btree ("engine_pick_player_id");