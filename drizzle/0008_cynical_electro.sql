DROP INDEX "hackathon_submissions_hackathon_user_uidx";--> statement-breakpoint
ALTER TABLE "hackathon_submissions" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "hackathon_submissions" ADD CONSTRAINT "hackathon_submissions_team_id_hackathon_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."hackathon_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hackathon_submissions_hackathon_user_solo_uidx" ON "hackathon_submissions" USING btree ("hackathon_id","user_id") WHERE "hackathon_submissions"."team_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "hackathon_submissions_hackathon_team_uidx" ON "hackathon_submissions" USING btree ("hackathon_id","team_id") WHERE "hackathon_submissions"."team_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "hackathon_submissions_team_id_idx" ON "hackathon_submissions" USING btree ("team_id");