CREATE TYPE "public"."hackathon_format" AS ENUM('online', 'offline', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."hackathon_status" AS ENUM('upcoming', 'active', 'finished');--> statement-breakpoint
CREATE TABLE "hackathons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"location" text NOT NULL,
	"format" "hackathon_format" NOT NULL,
	"status" "hackathon_status" NOT NULL,
	"participants_count" integer DEFAULT 0 NOT NULL,
	"max_participants" integer,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"prize_pool" text,
	"image_url" text,
	"organizer_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
