import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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

export const hackathonParticipants = pgTable(
  "hackathon_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hackathonId: uuid("hackathon_id")
      .notNull()
      .references(() => hackathons.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("hackathon_participants_hackathon_user_uidx").on(
      table.hackathonId,
      table.userId
    ),
    index("hackathon_participants_hackathon_id_idx").on(table.hackathonId),
    index("hackathon_participants_user_id_idx").on(table.userId),
  ]
);

export const hackathonSubmissions = pgTable(
  "hackathon_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hackathonId: uuid("hackathon_id")
      .notNull()
      .references(() => hackathons.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => hackathonTeams.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    repoUrl: text("repo_url"),
    demoUrl: text("demo_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("hackathon_submissions_hackathon_user_solo_uidx")
      .on(table.hackathonId, table.userId)
      .where(sql`${table.teamId} IS NULL`),
    uniqueIndex("hackathon_submissions_hackathon_team_uidx")
      .on(table.hackathonId, table.teamId)
      .where(sql`${table.teamId} IS NOT NULL`),
    index("hackathon_submissions_team_id_idx").on(table.teamId),
    index("hackathon_submissions_hackathon_id_idx").on(table.hackathonId),
    index("hackathon_submissions_user_id_idx").on(table.userId),
  ]
);

export const submissionReviews = pgTable(
  "submission_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => hackathonSubmissions.id, { onDelete: "cascade" }),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    feedback: text("feedback"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("submission_reviews_submission_id_uidx").on(
      table.submissionId
    ),
    index("submission_reviews_reviewer_id_idx").on(table.reviewerId),
    check(
      "submission_reviews_score_range",
      sql`${table.score} >= 1 AND ${table.score} <= 10`
    ),
  ]
);

export const hackathonTeams = pgTable(
  "hackathon_teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hackathonId: uuid("hackathon_id")
      .notNull()
      .references(() => hackathons.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    captainId: text("captain_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    inviteCode: text("invite_code").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("hackathon_teams_hackathon_name_lower_uidx").on(
      table.hackathonId,
      sql`lower(${table.name})`
    ),
    index("hackathon_teams_hackathon_id_idx").on(table.hackathonId),
    index("hackathon_teams_captain_id_idx").on(table.captainId),
  ]
);

export const hackathonTeamMembers = pgTable(
  "hackathon_team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hackathonId: uuid("hackathon_id")
      .notNull()
      .references(() => hackathons.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => hackathonTeams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("hackathon_team_members_hackathon_user_uidx").on(
      table.hackathonId,
      table.userId
    ),
    uniqueIndex("hackathon_team_members_team_user_uidx").on(
      table.teamId,
      table.userId
    ),
    index("hackathon_team_members_team_id_idx").on(table.teamId),
    index("hackathon_team_members_user_id_idx").on(table.userId),
    index("hackathon_team_members_hackathon_id_idx").on(table.hackathonId),
  ]
);

export * from "./auth-schema";
