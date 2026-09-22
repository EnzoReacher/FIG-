CREATE TABLE IF NOT EXISTS "workout_session_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"exercise_id" varchar(100) NOT NULL,
	"exercise_order" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"target_muscles" text[] NOT NULL,
	"equipment" varchar(32) NOT NULL,
	"instructions" text[] NOT NULL,
	"safety_notes" text[] NOT NULL,
	"default_sets" integer NOT NULL,
	"default_reps" varchar(64) NOT NULL,
	"rest_seconds" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workout_session_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"session_exercise_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"request_key" varchar(128)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"routine_id" varchar(160) NOT NULL,
	"title" varchar(160) NOT NULL,
	"summary" text NOT NULL,
	"goal" varchar(32) NOT NULL,
	"experience" varchar(32) NOT NULL,
	"training_days" integer NOT NULL,
	"equipment" text[] NOT NULL,
	"status" varchar(16) NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_session_exercises" ADD CONSTRAINT "workout_session_exercises_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_session_exercises" ADD CONSTRAINT "workout_session_exercises_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_session_sets" ADD CONSTRAINT "workout_session_sets_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_session_sets" ADD CONSTRAINT "workout_session_sets_session_exercise_id_workout_session_exercises_id_fk" FOREIGN KEY ("session_exercise_id") REFERENCES "public"."workout_session_exercises"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_session_sets" ADD CONSTRAINT "workout_session_sets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workout_session_exercises_session_order_idx" ON "workout_session_exercises" USING btree ("session_id","exercise_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workout_session_exercises_user_session_idx" ON "workout_session_exercises" USING btree ("user_id","session_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workout_session_sets_exercise_set_idx" ON "workout_session_sets" USING btree ("session_exercise_id","set_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workout_session_sets_session_request_idx" ON "workout_session_sets" USING btree ("session_id","request_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workout_session_sets_user_session_idx" ON "workout_session_sets" USING btree ("user_id","session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workout_sessions_user_id_status_idx" ON "workout_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workout_sessions_one_active_user_idx" ON "workout_sessions" USING btree ("user_id") WHERE "workout_sessions"."status" = 'active';