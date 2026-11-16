ALTER TABLE "hackathons" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
CREATE INDEX "hackathons_status_idx" ON "hackathons" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hackathons_start_date_idx" ON "hackathons" USING btree ("start_date");--> statement-breakpoint
ALTER TABLE "hackathons" ADD CONSTRAINT "hackathons_slug_unique" UNIQUE("slug");