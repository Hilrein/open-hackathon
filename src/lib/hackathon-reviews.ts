import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  hackathons,
  hackathonSubmissions,
  submissionReviews,
} from "@/db/schema";
import { getHackathonEffectiveStatus } from "@/lib/hackathon-status";
import { reviewSchema } from "@/lib/review-schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ReviewNotFoundError extends Error {
  constructor(message = "Хакатон не найден.") {
    super(message);
    this.name = "ReviewNotFoundError";
  }
}

export class ReviewForbiddenError extends Error {
  constructor(
    message = "Вы можете оценивать работы только своих хакатонов."
  ) {
    super(message);
    this.name = "ReviewForbiddenError";
  }
}

export class ReviewSubmissionNotFoundError extends Error {
  constructor(message = "Работа не найдена.") {
    super(message);
    this.name = "ReviewSubmissionNotFoundError";
  }
}

export class ReviewRecordNotFoundError extends Error {
  constructor(message = "Оценка не найдена.") {
    super(message);
    this.name = "ReviewRecordNotFoundError";
  }
}

export class ReviewNotFinishedError extends Error {
  constructor(
    message = "Оценивание доступно после завершения хакатона."
  ) {
    super(message);
    this.name = "ReviewNotFinishedError";
  }
}

export class ReviewValidationError extends Error {
  readonly fieldErrors: Record<string, string[] | undefined>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[] | undefined>
  ) {
    super(message);
    this.name = "ReviewValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class ReviewError extends Error {
  constructor(message = "Не удалось выполнить операцию. Попробуйте позже.") {
    super(message);
    this.name = "ReviewError";
  }
}

export interface SubmissionReviewDTO {
  id: string;
  submissionId: string;
  score: number;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

async function getOwnedHackathonForReview(slug: string, organizerId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: hackathons.id,
      organizerId: hackathons.organizerId,
      startDate: hackathons.startDate,
      endDate: hackathons.endDate,
    })
    .from(hackathons)
    .where(eq(hackathons.slug, slug))
    .limit(1);

  const hackathon = rows[0];
  if (!hackathon) {
    throw new ReviewNotFoundError();
  }

  if (hackathon.organizerId !== organizerId) {
    throw new ReviewForbiddenError();
  }

  return hackathon;
}

async function assertSubmissionBelongsToHackathon(
  hackathonId: string,
  submissionId: string
) {
  if (!UUID_REGEX.test(submissionId)) {
    throw new ReviewSubmissionNotFoundError();
  }

  const db = getDb();
  const rows = await db
    .select({ id: hackathonSubmissions.id })
    .from(hackathonSubmissions)
    .where(
      and(
        eq(hackathonSubmissions.id, submissionId),
        eq(hackathonSubmissions.hackathonId, hackathonId)
      )
    )
    .limit(1);

  if (rows.length === 0) {
    throw new ReviewSubmissionNotFoundError();
  }
}

export async function reviewSubmission(
  slug: string,
  submissionId: string,
  organizerId: string,
  input: unknown
): Promise<SubmissionReviewDTO> {
  try {
    const hackathon = await getOwnedHackathonForReview(slug, organizerId);

    const status = getHackathonEffectiveStatus(
      hackathon.startDate,
      hackathon.endDate
    );
    if (status !== "finished") {
      throw new ReviewNotFinishedError();
    }

    await assertSubmissionBelongsToHackathon(hackathon.id, submissionId);

    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      throw new ReviewValidationError(
        "Проверьте поля формы.",
        flattened.fieldErrors
      );
    }

    const db = getDb();
    const feedback = parsed.data.feedback ?? null;

    const [saved] = await db
      .insert(submissionReviews)
      .values({
        submissionId,
        reviewerId: organizerId,
        score: parsed.data.score,
        feedback,
      })
      .onConflictDoUpdate({
        target: submissionReviews.submissionId,
        set: {
          score: parsed.data.score,
          feedback,
          reviewerId: organizerId,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!saved) {
      throw new ReviewError("Не удалось сохранить оценку. Попробуйте позже.");
    }

    return {
      id: saved.id,
      submissionId: saved.submissionId,
      score: saved.score,
      feedback: saved.feedback,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  } catch (error: unknown) {
    if (
      error instanceof ReviewNotFoundError ||
      error instanceof ReviewForbiddenError ||
      error instanceof ReviewNotFinishedError ||
      error instanceof ReviewSubmissionNotFoundError ||
      error instanceof ReviewValidationError ||
      error instanceof ReviewError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при сохранении оценки работы (${errorName}).`);
    throw new ReviewError("Не удалось сохранить оценку. Попробуйте позже.");
  }
}

export async function removeSubmissionReview(
  slug: string,
  submissionId: string,
  organizerId: string
): Promise<{ ok: true }> {
  try {
    const hackathon = await getOwnedHackathonForReview(slug, organizerId);
    await assertSubmissionBelongsToHackathon(hackathon.id, submissionId);

    const db = getDb();
    const deleted = await db
      .delete(submissionReviews)
      .where(eq(submissionReviews.submissionId, submissionId))
      .returning({ id: submissionReviews.id });

    if (!deleted[0]) {
      throw new ReviewRecordNotFoundError();
    }

    return { ok: true };
  } catch (error: unknown) {
    if (
      error instanceof ReviewNotFoundError ||
      error instanceof ReviewForbiddenError ||
      error instanceof ReviewSubmissionNotFoundError ||
      error instanceof ReviewRecordNotFoundError ||
      error instanceof ReviewError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при снятии оценки работы (${errorName}).`);
    throw new ReviewError("Не удалось снять оценку. Попробуйте позже.");
  }
}
