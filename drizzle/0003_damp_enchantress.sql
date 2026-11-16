ALTER TABLE "hackathons" ADD COLUMN "organizer_id" text;--> statement-breakpoint
ALTER TABLE "hackathons" ADD CONSTRAINT "hackathons_organizer_id_user_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hackathons_organizer_id_idx" ON "hackathons" USING btree ("organizer_id");