CREATE TABLE "submission_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"reviewer_id" text NOT NULL,
	"score" integer NOT NULL,
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_reviews_score_range" CHECK ("submission_reviews"."score" >= 1 AND "submission_reviews"."score" <= 10)
);
--> statement-breakpoint
ALTER TABLE "submission_reviews" ADD CONSTRAINT "submission_reviews_submission_id_hackathon_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."hackathon_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_reviews" ADD CONSTRAINT "submission_reviews_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "submission_reviews_submission_id_uidx" ON "submission_reviews" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "submission_reviews_reviewer_id_idx" ON "submission_reviews" USING btree ("reviewer_id");