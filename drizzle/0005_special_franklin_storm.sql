CREATE TABLE "hackathon_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hackathon_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"repo_url" text,
	"demo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hackathon_submissions" ADD CONSTRAINT "hackathon_submissions_hackathon_id_hackathons_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_submissions" ADD CONSTRAINT "hackathon_submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hackathon_submissions_hackathon_user_uidx" ON "hackathon_submissions" USING btree ("hackathon_id","user_id");--> statement-breakpoint
CREATE INDEX "hackathon_submissions_hackathon_id_idx" ON "hackathon_submissions" USING btree ("hackathon_id");--> statement-breakpoint
CREATE INDEX "hackathon_submissions_user_id_idx" ON "hackathon_submissions" USING btree ("user_id");