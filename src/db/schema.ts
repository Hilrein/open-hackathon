import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const hackathonFormatEnum = pgEnum("hackathon_format", [
  "online",
  "offline",
  "hybrid",
]);
export const hackathonStatusEnum = pgEnum("hackathon_status", [
  "upcoming",
  "active",
  "finished",
]);

export const hackathons = pgTable(
  "hackathons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    location: text("location").notNull(),
    format: hackathonFormatEnum("format").notNull(),
    status: hackathonStatusEnum("status").notNull(),
    participantsCount: integer("participants_count").notNull().default(0),
    maxParticipants: integer("max_participants"),
    tags: text("tags").array().notNull().default([]),
    prizePool: text("prize_pool"),
    imageUrl: text("image_url"),
    organizerName: text("organizer_name").notNull(),
    organizerId: text("organizer_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("hackathons_status_idx").on(table.status),
    index("hackathons_start_date_idx").on(table.startDate),
    index("hackathons_organizer_id_idx").on(table.organizerId),
  ]
);

export * from "./auth-schema";
