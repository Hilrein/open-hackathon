import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { mapHackathonRowToHackathon } from "@/db/queries";
import {
  hackathons,
  hackathonSubmissions,
  submissionReviews,
  user,
} from "@/db/schema";
import type { Hackathon } from "@/types/hackathon";

export type PublicResultItem = {
  place: number;
  submissionId: string;
  title: string;
  authorName: string;
  repoUrl: string | null;
  demoUrl: string | null;
  score: number;
  submittedAt: string;
  reviewedAt: string;
};

export type HackathonPublicResults =
  | { kind: "not-found" }
  | { kind: "ok"; hackathon: Hackathon; results: PublicResultItem[] };

export async function getHackathonPublicResults(
  slug: string
): Promise<HackathonPublicResults> {
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

  const hackathon = mapHackathonRowToHackathon(hackathonRow);
  if (hackathon.status !== "finished") {
    return { kind: "ok", hackathon, results: [] };
  }

  const rows = await db
    .select({
      submissionId: hackathonSubmissions.id,
      title: hackathonSubmissions.title,
      repoUrl: hackathonSubmissions.repoUrl,
      demoUrl: hackathonSubmissions.demoUrl,
      submittedAt: hackathonSubmissions.createdAt,
      score: submissionReviews.score,
      reviewedAt: submissionReviews.updatedAt,
      authorName: user.name,
    })
    .from(hackathonSubmissions)
    .innerJoin(
      submissionReviews,
      eq(submissionReviews.submissionId, hackathonSubmissions.id)
    )
    .innerJoin(user, eq(hackathonSubmissions.userId, user.id))
    .where(eq(hackathonSubmissions.hackathonId, hackathonRow.id))
    .orderBy(desc(submissionReviews.score), asc(hackathonSubmissions.createdAt));

  let currentPlace = 0;
  let previousScore: number | null = null;

  const results: PublicResultItem[] = rows.map((row, index) => {
    if (previousScore === null || row.score !== previousScore) {
      currentPlace = index + 1;
      previousScore = row.score;
    }

    const cleanName = row.authorName?.trim();
    return {
      place: currentPlace,
      submissionId: row.submissionId,
      title: row.title,
      authorName: cleanName && cleanName.length > 0 ? cleanName : "Участник",
      repoUrl: row.repoUrl,
      demoUrl: row.demoUrl,
      score: row.score,
      submittedAt: row.submittedAt.toISOString(),
      reviewedAt: row.reviewedAt.toISOString(),
    };
  });

  return {
    kind: "ok",
    hackathon,
    results,
  };
}
