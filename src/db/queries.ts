import { asc, desc, eq } from "drizzle-orm";
import type { Hackathon } from "@/types/hackathon";
import { getDb } from "./index";
import { hackathons } from "./schema";

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
    status: row.status,
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
