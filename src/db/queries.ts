import { and, asc, desc, eq } from "drizzle-orm";
import { getHackathonEffectiveStatus } from "@/lib/hackathon-status";
import type { Hackathon } from "@/types/hackathon";
import { getDb } from "./index";
import { hackathonParticipants, hackathons, hackathonSubmissions, user } from "./schema";

type HackathonRow = typeof hackathons.$inferSelect;

function mapHackathonRowToHackathon(row: HackathonRow): Hackathon {
  return {
    id: row.slug,
    title: row.title,
    description: row.description,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    location: row.location,
    format: row.format,
    status: getHackathonEffectiveStatus(row.startDate, row.endDate),
    participantsCount: row.participantsCount,
    maxParticipants: row.maxParticipants ?? undefined,
    tags: row.tags ?? [],
    prizePool: row.prizePool ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    organizerName: row.organizerName,
  };
}

export async function getAllHackathons(): Promise<Hackathon[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hackathons)
    .orderBy(asc(hackathons.startDate));

  return rows.map(mapHackathonRowToHackathon);
}

export async function getHackathonBySlug(
  slug: string
): Promise<Hackathon | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.slug, slug))
    .limit(1);

  const row = rows[0];
  return row ? mapHackathonRowToHackathon(row) : undefined;
}

export async function getHackathonsByOrganizer(
  organizerId: string
): Promise<Hackathon[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.organizerId, organizerId))
    .orderBy(desc(hackathons.createdAt));

  return rows.map(mapHackathonRowToHackathon);
}

export async function getHackathonWithOwnerBySlug(
  slug: string
): Promise<{ hackathon: Hackathon; organizerId: string | null } | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.slug, slug))
    .limit(1);

  const row = rows[0];
  return row
    ? {
        hackathon: mapHackathonRowToHackathon(row),
        organizerId: row.organizerId,
      }
    : undefined;
}

export async function isUserParticipating(
  hackathonId: string,
  userId: string
): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: hackathonParticipants.id })
    .from(hackathonParticipants)
    .where(
      and(
        eq(hackathonParticipants.hackathonId, hackathonId),
        eq(hackathonParticipants.userId, userId)
      )
    )
    .limit(1);

  return rows.length > 0;
}

export async function getHackathonParticipationContext(
  slug: string,
  userId: string | null
): Promise<
  | { hackathonId: string; organizerId: string | null; isParticipating: boolean }
  | undefined
> {
  const db = getDb();
  const rows = await db
    .select({
      id: hackathons.id,
      organizerId: hackathons.organizerId,
    })
    .from(hackathons)
    .where(eq(hackathons.slug, slug))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return undefined;
  }

  const participating = userId
    ? await isUserParticipating(row.id, userId)
    : false;

  return {
    hackathonId: row.id,
    organizerId: row.organizerId,
    isParticipating: participating,
  };
}

export async function getParticipationsByUser(
  userId: string
): Promise<{ hackathon: Hackathon; joinedAt: string }[]> {
  const db = getDb();
  const rows = await db
    .select({
      hackathon: hackathons,
      joinedAt: hackathonParticipants.createdAt,
    })
    .from(hackathonParticipants)
    .innerJoin(
      hackathons,
      eq(hackathonParticipants.hackathonId, hackathons.id)
    )
    .where(eq(hackathonParticipants.userId, userId))
    .orderBy(desc(hackathonParticipants.createdAt));

  return rows.map((row) => ({
    hackathon: mapHackathonRowToHackathon(row.hackathon),
    joinedAt: row.joinedAt.toISOString(),
  }));
}

export type HackathonParticipantInfo = {
  userId: string;
  name: string;
  email: string;
  joinedAt: string;
};

export type HackathonParticipantsResult =
  | { kind: "not-found" }
  | { kind: "forbidden" }
  | {
      kind: "ok";
      hackathon: Hackathon;
      participants: HackathonParticipantInfo[];
    };

export async function getHackathonParticipantsForOrganizer(
  slug: string,
  userId: string
): Promise<HackathonParticipantsResult> {
  const db = getDb();
  const hackathonRows = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.slug, slug))
    .limit(1);

  const hackathonRow = hackathonRows[0];
  if (!hackathonRow) {
    return { kind: "not-found" };
  }

  if (hackathonRow.organizerId !== userId) {
    return { kind: "forbidden" };
  }

  const participantRows = await db
    .select({
      userId: user.id,
      name: user.name,
      email: user.email,
      joinedAt: hackathonParticipants.createdAt,
    })
    .from(hackathonParticipants)
    .innerJoin(user, eq(hackathonParticipants.userId, user.id))
    .where(eq(hackathonParticipants.hackathonId, hackathonRow.id))
    .orderBy(desc(hackathonParticipants.createdAt));

  return {
    kind: "ok",
    hackathon: mapHackathonRowToHackathon(hackathonRow),
    participants: participantRows.map((participant) => ({
      userId: participant.userId,
      name: participant.name?.trim() || participant.email,
      email: participant.email,
      joinedAt: participant.joinedAt.toISOString(),
    })),
  };
}

export async function getHackathonWorkContext(
  slug: string,
  userId: string
): Promise<
  | { kind: "not-found" }
  | { kind: "not-participant"; hackathon: Hackathon }
  | { kind: "ok"; hackathon: Hackathon; isOrganizer: boolean }
> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.slug, slug))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return { kind: "not-found" };
  }

  const hackathon = mapHackathonRowToHackathon(row);
  const participating = await isUserParticipating(row.id, userId);

  if (!participating) {
    return { kind: "not-participant", hackathon };
  }

  return {
    kind: "ok",
    hackathon,
    isOrganizer: row.organizerId === userId,
  };
}

export async function getUserSubmittedHackathonSlugs(
  userId: string
): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ slug: hackathons.slug })
    .from(hackathonSubmissions)
    .innerJoin(
      hackathons,
      eq(hackathonSubmissions.hackathonId, hackathons.id)
    )
    .where(eq(hackathonSubmissions.userId, userId));

  return rows.map((row) => row.slug);
}
