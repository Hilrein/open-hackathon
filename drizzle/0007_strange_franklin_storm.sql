CREATE TABLE "hackathon_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hackathon_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hackathon_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hackathon_id" uuid NOT NULL,
	"name" text NOT NULL,
	"captain_id" text NOT NULL,
	"invite_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hackathon_teams_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
ALTER TABLE "hackathon_team_members" ADD CONSTRAINT "hackathon_team_members_hackathon_id_hackathons_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_team_members" ADD CONSTRAINT "hackathon_team_members_team_id_hackathon_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."hackathon_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_team_members" ADD CONSTRAINT "hackathon_team_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_teams" ADD CONSTRAINT "hackathon_teams_hackathon_id_hackathons_id_fk" FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_teams" ADD CONSTRAINT "hackathon_teams_captain_id_user_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hackathon_team_members_hackathon_user_uidx" ON "hackathon_team_members" USING btree ("hackathon_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hackathon_team_members_team_user_uidx" ON "hackathon_team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "hackathon_team_members_team_id_idx" ON "hackathon_team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "hackathon_team_members_user_id_idx" ON "hackathon_team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "hackathon_team_members_hackathon_id_idx" ON "hackathon_team_members" USING btree ("hackathon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hackathon_teams_hackathon_name_lower_uidx" ON "hackathon_teams" USING btree ("hackathon_id",lower("name"));--> statement-breakpoint
CREATE INDEX "hackathon_teams_hackathon_id_idx" ON "hackathon_teams" USING btree ("hackathon_id");--> statement-breakpoint
CREATE INDEX "hackathon_teams_captain_id_idx" ON "hackathon_teams" USING btree ("captain_id");