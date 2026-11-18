CREATE TABLE "hackathon_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hackathon_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hackathon_participants" ADD CONSTRAINT "hackathon_participants_hackathon_id_hackathons_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_participants" ADD CONSTRAINT "hackathon_participants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hackathon_participants_hackathon_user_uidx" ON "hackathon_participants" USING btree ("hackathon_id","user_id");--> statement-breakpoint
CREATE INDEX "hackathon_participants_hackathon_id_idx" ON "hackathon_participants" USING btree ("hackathon_id");--> statement-breakpoint
CREATE INDEX "hackathon_participants_user_id_idx" ON "hackathon_participants" USING btree ("user_id");