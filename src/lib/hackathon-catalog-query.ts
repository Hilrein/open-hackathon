import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb } from "@/db";
import { mapHackathonRowToHackathon } from "@/db/queries";
import { hackathons } from "@/db/schema";
import {
  CATALOG_PAGE_SIZE,
  type HackathonCatalogParams,
  type HackathonCatalogSort,
} from "@/lib/hackathon-catalog";
import type { Hackathon } from "@/types/hackathon";

export type HackathonCatalogPage = {
  items: Hackathon[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function buildOrderByClauses(sort: HackathonCatalogSort, now: Date): SQL[] {
  if (sort === "date-asc") {
    return [asc(hackathons.startDate), asc(hackathons.slug)];
  }

  if (sort === "date-desc") {
    return [desc(hackathons.startDate), asc(hackathons.slug)];
  }

  if (sort === "participants") {
    return [
      desc(hackathons.participantsCount),
      asc(hackathons.startDate),
      asc(hackathons.slug),
    ];
  }

  const statusPriority = sql<number>`CASE
    WHEN ${hackathons.endDate} <= ${now} THEN 2
    WHEN ${hackathons.startDate} <= ${now} THEN 0
    ELSE 1
  END`;

  return [asc(statusPriority), asc(hackathons.startDate), asc(hackathons.slug)];
}

export async function getTotalHackathonsCount(): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hackathons);

  return Number(rows[0]?.count ?? 0);
}

export async function getHackathonsCatalogPage(
  params: HackathonCatalogParams,
  requestedPage: number
): Promise<HackathonCatalogPage> {
  const db = getDb();
  const now = new Date();
  const conditions: SQL[] = [];

  const trimmedQuery = params.q.trim();
  if (trimmedQuery.length > 0) {
    const pattern = `%${escapeLikePattern(trimmedQuery)}%`;
    const searchCondition = or(
      ilike(hackathons.title, pattern),
      ilike(hackathons.description, pattern),
      ilike(hackathons.location, pattern),
      ilike(hackathons.organizerName, pattern),
      sql`array_to_string(${hackathons.tags}, ' ') ILIKE ${pattern}`
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (params.status === "upcoming") {
    conditions.push(gt(hackathons.startDate, now));
  } else if (params.status === "active") {
    const activeCondition = and(
      lte(hackathons.startDate, now),
      gt(hackathons.endDate, now)
    );
    if (activeCondition) {
      conditions.push(activeCondition);
    }
  } else if (params.status === "finished") {
    conditions.push(lte(hackathons.endDate, now));
  }

  if (params.format !== "all") {
    conditions.push(eq(hackathons.format, params.format));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hackathons)
    .where(whereClause);

  const total = Number(countRows[0]?.count ?? 0);
  const pageSize = CATALOG_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage =
    Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;
  const page = Math.min(safePage, totalPages);

  if (total === 0) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
    };
  }

  const offset = (page - 1) * pageSize;
  const orderByClauses = buildOrderByClauses(params.sort, now);

  const rows = await db
    .select()
    .from(hackathons)
    .where(whereClause)
    .orderBy(...orderByClauses)
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map(mapHackathonRowToHackathon),
    total,
    page,
    pageSize,
    totalPages,
  };
}
