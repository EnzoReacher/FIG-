CREATE TABLE IF NOT EXISTS "daily_steps" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"steps" integer NOT NULL,
	"source" varchar(16) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_steps" ADD CONSTRAINT "daily_steps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
