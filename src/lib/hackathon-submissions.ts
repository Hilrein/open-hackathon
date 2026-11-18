import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  hackathonParticipants,
  hackathons,
  hackathonSubmissions,
  submissionReviews,
  user,
} from "@/db/schema";
import type { SubmissionReviewDTO } from "@/lib/hackathon-reviews";
import { getHackathonEffectiveStatus } from "@/lib/hackathon-status";
import { submissionSchema } from "@/lib/submission-schema";

export class SubmissionNotFoundError extends Error {
  constructor(message = "Хакатон не найден.") {
    super(message);
    this.name = "SubmissionNotFoundError";
  }
}

export class SubmissionRecordNotFoundError extends Error {
  constructor(message = "Работа не найдена.") {
    super(message);
    this.name = "SubmissionRecordNotFoundError";
  }
}

export class SubmissionForbiddenError extends Error {
  constructor(message = "Нет доступа к этому действию.") {
    super(message);
    this.name = "SubmissionForbiddenError";
  }
}

export class SubmissionNotStartedError extends Error {
  constructor(message = "Хакатон ещё не начался.") {
    super(message);
    this.name = "SubmissionNotStartedError";
  }
}

export class SubmissionFinishedError extends Error {
  constructor(message = "Хакатон уже завершён.") {
    super(message);
    this.name = "SubmissionFinishedError";
  }
}

export class SubmissionValidationError extends Error {
  readonly fieldErrors: Record<string, string[] | undefined>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[] | undefined>
  ) {
    super(message);
    this.name = "SubmissionValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class SubmissionError extends Error {
  constructor(message = "Не удалось выполнить операцию. Попробуйте позже.") {
    super(message);
    this.name = "SubmissionError";
  }
}

export interface SubmissionDTO {
  id: string;
  hackathonSlug: string;
  title: string;
  description: string;
  repoUrl: string | null;
  demoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  review: SubmissionReviewDTO | null;
}

export interface OrganizerSubmissionDTO {
  id: string;
  title: string;
  description: string;
  repoUrl: string | null;
  demoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorEmail: string;
  review: SubmissionReviewDTO | null;
}

function mapReviewRowToDTO(
  row: typeof submissionReviews.$inferSelect
): SubmissionReviewDTO {
  return {
    id: row.id,
    submissionId: row.submissionId,
    score: row.score,
    feedback: row.feedback,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function submitHackathonProject(
  slug: string,
  userId: string,
  input: unknown
): Promise<SubmissionDTO> {
  try {
    const db = getDb();
    const hackathonRows = await db
      .select({
        id: hackathons.id,
        slug: hackathons.slug,
        startDate: hackathons.startDate,
        endDate: hackathons.endDate,
      })
      .from(hackathons)
      .where(eq(hackathons.slug, slug))
      .limit(1);

    const hackathon = hackathonRows[0];
    if (!hackathon) {
      throw new SubmissionNotFoundError();
    }

    const status = getHackathonEffectiveStatus(
      hackathon.startDate,
      hackathon.endDate
    );
    if (status === "upcoming") {
      throw new SubmissionNotStartedError("Хакатон ещё не начался.");
    }
    if (status === "finished") {
      throw new SubmissionFinishedError("Хакатон уже завершён.");
    }

    const participantRows = await db
      .select({ id: hackathonParticipants.id })
      .from(hackathonParticipants)
      .where(
        and(
          eq(hackathonParticipants.hackathonId, hackathon.id),
          eq(hackathonParticipants.userId, userId)
        )
      )
      .limit(1);

    if (participantRows.length === 0) {
      throw new SubmissionForbiddenError("Сначала присоединитесь к хакатону.");
    }

    const parsed = submissionSchema.safeParse(input);
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      throw new SubmissionValidationError(
        "Проверьте поля формы.",
        flattened.fieldErrors
      );
    }

    const data = parsed.data;
    const repoUrl = data.repoUrl ?? null;
    const demoUrl = data.demoUrl ?? null;

    const [saved] = await db
      .insert(hackathonSubmissions)
      .values({
        hackathonId: hackathon.id,
        userId,
        title: data.title,
        description: data.description,
        repoUrl,
        demoUrl,
      })
      .onConflictDoUpdate({
        target: [
          hackathonSubmissions.hackathonId,
          hackathonSubmissions.userId,
        ],
        set: {
          title: data.title,
          description: data.description,
          repoUrl,
          demoUrl,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!saved) {
      throw new SubmissionError("Не удалось сохранить работу. Попробуйте позже.");
    }

    return {
      id: saved.id,
      hackathonSlug: hackathon.slug,
      title: saved.title,
      description: saved.description,
      repoUrl: saved.repoUrl,
      demoUrl: saved.demoUrl,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
      review: null,
    };
  } catch (error: unknown) {
    if (
      error instanceof SubmissionNotFoundError ||
      error instanceof SubmissionNotStartedError ||
      error instanceof SubmissionFinishedError ||
      error instanceof SubmissionForbiddenError ||
      error instanceof SubmissionValidationError ||
      error instanceof SubmissionError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при сохранении работы участника (${errorName}).`);
    throw new SubmissionError("Не удалось сохранить работу. Попробуйте позже.");
  }
}

export async function getOwnSubmission(
  slug: string,
  userId: string
): Promise<SubmissionDTO | null> {
  try {
    const db = getDb();
    const hackathonRows = await db
      .select({
        id: hackathons.id,
        slug: hackathons.slug,
      })
      .from(hackathons)
      .where(eq(hackathons.slug, slug))
      .limit(1);

    const hackathon = hackathonRows[0];
    if (!hackathon) {
      throw new SubmissionNotFoundError();
    }

    const rows = await db
      .select()
      .from(hackathonSubmissions)
      .where(
        and(
          eq(hackathonSubmissions.hackathonId, hackathon.id),
          eq(hackathonSubmissions.userId, userId)
        )
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    const reviewRows = await db
      .select()
      .from(submissionReviews)
      .where(eq(submissionReviews.submissionId, row.id))
      .limit(1);

    return {
      id: row.id,
      hackathonSlug: hackathon.slug,
      title: row.title,
      description: row.description,
      repoUrl: row.repoUrl,
      demoUrl: row.demoUrl,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      review: reviewRows[0] ? mapReviewRowToDTO(reviewRows[0]) : null,
    };
  } catch (error: unknown) {
    if (error instanceof SubmissionNotFoundError) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при получении работы участника (${errorName}).`);
    throw new SubmissionError("Не удалось загрузить работу. Попробуйте позже.");
  }
}

export async function withdrawOwnSubmission(
  slug: string,
  userId: string
): Promise<{ ok: true }> {
  try {
    const db = getDb();
    const hackathonRows = await db
      .select({
        id: hackathons.id,
        startDate: hackathons.startDate,
        endDate: hackathons.endDate,
      })
      .from(hackathons)
      .where(eq(hackathons.slug, slug))
      .limit(1);

    const hackathon = hackathonRows[0];
    if (!hackathon) {
      throw new SubmissionNotFoundError();
    }

    const status = getHackathonEffectiveStatus(
      hackathon.startDate,
      hackathon.endDate
    );
    if (status === "finished") {
      throw new SubmissionFinishedError(
        "Хакатон уже завершён. Отозвать работу нельзя."
      );
    }

    const deleted = await db
      .delete(hackathonSubmissions)
      .where(
        and(
          eq(hackathonSubmissions.hackathonId, hackathon.id),
          eq(hackathonSubmissions.userId, userId)
        )
      )
      .returning({ id: hackathonSubmissions.id });

    if (!deleted[0]) {
      throw new SubmissionRecordNotFoundError("Работа не найдена.");
    }

    return { ok: true };
  } catch (error: unknown) {
    if (
      error instanceof SubmissionNotFoundError ||
      error instanceof SubmissionFinishedError ||
      error instanceof SubmissionRecordNotFoundError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при отзыве работы участника (${errorName}).`);
    throw new SubmissionError("Не удалось отозвать работу. Попробуйте позже.");
  }
}

export async function getSubmissionsForOrganizer(
  slug: string,
  userId: string
): Promise<OrganizerSubmissionDTO[]> {
  try {
    const db = getDb();
    const hackathonRows = await db
      .select({
        id: hackathons.id,
        organizerId: hackathons.organizerId,
      })
      .from(hackathons)
      .where(eq(hackathons.slug, slug))
      .limit(1);

    const hackathon = hackathonRows[0];
    if (!hackathon) {
      throw new SubmissionNotFoundError();
    }

    if (hackathon.organizerId !== userId) {
      throw new SubmissionForbiddenError(
        "Вы можете смотреть работы только своих хакатонов."
      );
    }

    const rows = await db
      .select({
        id: hackathonSubmissions.id,
        title: hackathonSubmissions.title,
        description: hackathonSubmissions.description,
        repoUrl: hackathonSubmissions.repoUrl,
        demoUrl: hackathonSubmissions.demoUrl,
        createdAt: hackathonSubmissions.createdAt,
        updatedAt: hackathonSubmissions.updatedAt,
        authorName: user.name,
        authorEmail: user.email,
      })
      .from(hackathonSubmissions)
      .innerJoin(user, eq(hackathonSubmissions.userId, user.id))
      .where(eq(hackathonSubmissions.hackathonId, hackathon.id))
      .orderBy(desc(hackathonSubmissions.updatedAt));

    const submissionIds = rows.map((row) => row.id);
    const reviewBySubmissionId = new Map<string, SubmissionReviewDTO>();

    if (submissionIds.length > 0) {
      const reviewRows = await db
        .select()
        .from(submissionReviews)
        .where(inArray(submissionReviews.submissionId, submissionIds));

      for (const reviewRow of reviewRows) {
        reviewBySubmissionId.set(
          reviewRow.submissionId,
          mapReviewRowToDTO(reviewRow)
        );
      }
    }

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      repoUrl: row.repoUrl,
      demoUrl: row.demoUrl,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      authorName: row.authorName?.trim() || row.authorEmail,
      authorEmail: row.authorEmail,
      review: reviewBySubmissionId.get(row.id) ?? null,
    }));
  } catch (error: unknown) {
    if (
      error instanceof SubmissionNotFoundError ||
      error instanceof SubmissionForbiddenError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Ошибка при получении списка работ организатором (${errorName}).`
    );
    throw new SubmissionError(
      "Не удалось загрузить работы. Попробуйте позже."
    );
  }
}
