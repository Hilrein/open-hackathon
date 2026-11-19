import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  hackathonParticipants,
  hackathons,
  hackathonSubmissions,
  hackathonTeamMembers,
  hackathonTeams,
  submissionReviews,
  user,
} from "@/db/schema";
import type { SubmissionReviewDTO } from "@/lib/hackathon-reviews";
import { getHackathonEffectiveStatus } from "@/lib/hackathon-status";
import { submissionSchema } from "@/lib/submission-schema";
import type { HackathonStatus } from "@/types/hackathon";

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
  teamId: string | null;
  teamName: string | null;
  isTeamSubmission: boolean;
  canEdit: boolean;
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
  teamId: string | null;
  teamName: string | null;
  isTeamSubmission: boolean;
}

interface UserTeamContext {
  id: string;
  name: string;
  captainId: string;
}

interface SubmissionAccessContext {
  hackathonId: string;
  hackathonSlug: string;
  status: HackathonStatus;
  isParticipant: boolean;
  team: UserTeamContext | null;
  isCaptain: boolean;
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

function computeCanEdit(
  status: HackathonStatus,
  team: UserTeamContext | null,
  isCaptain: boolean
): boolean {
  if (status !== "active") {
    return false;
  }
  if (team) {
    return isCaptain;
  }
  return true;
}

async function getSubmissionAccessContext(
  slug: string,
  userId: string
): Promise<SubmissionAccessContext> {
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

  const [participantRows, teamRows] = await Promise.all([
    db
      .select({ id: hackathonParticipants.id })
      .from(hackathonParticipants)
      .where(
        and(
          eq(hackathonParticipants.hackathonId, hackathon.id),
          eq(hackathonParticipants.userId, userId)
        )
      )
      .limit(1),
    db
      .select({
        id: hackathonTeams.id,
        name: hackathonTeams.name,
        captainId: hackathonTeams.captainId,
      })
      .from(hackathonTeamMembers)
      .innerJoin(
        hackathonTeams,
        eq(hackathonTeamMembers.teamId, hackathonTeams.id)
      )
      .where(
        and(
          eq(hackathonTeamMembers.hackathonId, hackathon.id),
          eq(hackathonTeamMembers.userId, userId)
        )
      )
      .limit(1),
  ]);

  const team = teamRows[0] ?? null;

  return {
    hackathonId: hackathon.id,
    hackathonSlug: hackathon.slug,
    status,
    isParticipant: participantRows.length > 0,
    team,
    isCaptain: team ? team.captainId === userId : false,
  };
}

export async function submitHackathonProject(
  slug: string,
  userId: string,
  input: unknown
): Promise<SubmissionDTO> {
  try {
    const context = await getSubmissionAccessContext(slug, userId);

    if (context.status === "upcoming") {
      throw new SubmissionNotStartedError("Хакатон ещё не начался.");
    }
    if (context.status === "finished") {
      throw new SubmissionFinishedError("Хакатон уже завершён.");
    }

    if (!context.isParticipant) {
      throw new SubmissionForbiddenError("Сначала присоединитесь к хакатону.");
    }

    if (context.team && !context.isCaptain) {
      throw new SubmissionForbiddenError("Работу команды сдаёт капитан.");
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
    const db = getDb();
    let saved: typeof hackathonSubmissions.$inferSelect | undefined;

    if (context.team) {
      const existingTeamRows = await db
        .select({ id: hackathonSubmissions.id })
        .from(hackathonSubmissions)
        .where(
          and(
            eq(hackathonSubmissions.hackathonId, context.hackathonId),
            eq(hackathonSubmissions.teamId, context.team.id)
          )
        )
        .limit(1);

      if (existingTeamRows[0]) {
        const [updated] = await db
          .update(hackathonSubmissions)
          .set({
            title: data.title,
            description: data.description,
            repoUrl,
            demoUrl,
            updatedAt: new Date(),
          })
          .where(eq(hackathonSubmissions.id, existingTeamRows[0].id))
          .returning();
        saved = updated;
      } else {
        const legacySoloRows = await db
          .select({ id: hackathonSubmissions.id })
          .from(hackathonSubmissions)
          .where(
            and(
              eq(hackathonSubmissions.hackathonId, context.hackathonId),
              eq(hackathonSubmissions.userId, userId),
              isNull(hackathonSubmissions.teamId)
            )
          )
          .limit(1);

        if (legacySoloRows[0]) {
          const [migrated] = await db
            .update(hackathonSubmissions)
            .set({
              teamId: context.team.id,
              title: data.title,
              description: data.description,
              repoUrl,
              demoUrl,
              updatedAt: new Date(),
            })
            .where(eq(hackathonSubmissions.id, legacySoloRows[0].id))
            .returning();
          saved = migrated;
        } else {
          const [inserted] = await db
            .insert(hackathonSubmissions)
            .values({
              hackathonId: context.hackathonId,
              userId,
              teamId: context.team.id,
              title: data.title,
              description: data.description,
              repoUrl,
              demoUrl,
            })
            .returning();
          saved = inserted;
        }
      }
    } else {
      const existingSoloRows = await db
        .select({ id: hackathonSubmissions.id })
        .from(hackathonSubmissions)
        .where(
          and(
            eq(hackathonSubmissions.hackathonId, context.hackathonId),
            eq(hackathonSubmissions.userId, userId),
            isNull(hackathonSubmissions.teamId)
          )
        )
        .limit(1);

      if (existingSoloRows[0]) {
        const [updated] = await db
          .update(hackathonSubmissions)
          .set({
            title: data.title,
            description: data.description,
            repoUrl,
            demoUrl,
            updatedAt: new Date(),
          })
          .where(eq(hackathonSubmissions.id, existingSoloRows[0].id))
          .returning();
        saved = updated;
      } else {
        const [inserted] = await db
          .insert(hackathonSubmissions)
          .values({
            hackathonId: context.hackathonId,
            userId,
            teamId: null,
            title: data.title,
            description: data.description,
            repoUrl,
            demoUrl,
          })
          .returning();
        saved = inserted;
      }
    }

    if (!saved) {
      throw new SubmissionError("Не удалось сохранить работу. Попробуйте позже.");
    }

    const reviewRows = await db
      .select()
      .from(submissionReviews)
      .where(eq(submissionReviews.submissionId, saved.id))
      .limit(1);

    const isTeamSubmission = Boolean(saved.teamId);

    return {
      id: saved.id,
      hackathonSlug: context.hackathonSlug,
      title: saved.title,
      description: saved.description,
      repoUrl: saved.repoUrl,
      demoUrl: saved.demoUrl,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
      review: reviewRows[0] ? mapReviewRowToDTO(reviewRows[0]) : null,
      teamId: saved.teamId,
      teamName: isTeamSubmission ? (context.team?.name ?? null) : null,
      isTeamSubmission,
      canEdit: computeCanEdit(context.status, context.team, context.isCaptain),
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
    const context = await getSubmissionAccessContext(slug, userId);
    const db = getDb();

    const rows = context.team
      ? await db
          .select()
          .from(hackathonSubmissions)
          .where(
            and(
              eq(hackathonSubmissions.hackathonId, context.hackathonId),
              eq(hackathonSubmissions.teamId, context.team.id)
            )
          )
          .limit(1)
      : await db
          .select()
          .from(hackathonSubmissions)
          .where(
            and(
              eq(hackathonSubmissions.hackathonId, context.hackathonId),
              eq(hackathonSubmissions.userId, userId),
              isNull(hackathonSubmissions.teamId)
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

    const isTeamSubmission = Boolean(row.teamId);

    return {
      id: row.id,
      hackathonSlug: context.hackathonSlug,
      title: row.title,
      description: row.description,
      repoUrl: row.repoUrl,
      demoUrl: row.demoUrl,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      review: reviewRows[0] ? mapReviewRowToDTO(reviewRows[0]) : null,
      teamId: row.teamId,
      teamName: isTeamSubmission ? (context.team?.name ?? null) : null,
      isTeamSubmission,
      canEdit: computeCanEdit(context.status, context.team, context.isCaptain),
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
    const context = await getSubmissionAccessContext(slug, userId);

    if (context.status === "finished") {
      throw new SubmissionFinishedError(
        "Хакатон уже завершён. Отозвать работу нельзя."
      );
    }

    const db = getDb();

    if (context.team) {
      if (!context.isCaptain) {
        throw new SubmissionForbiddenError(
          "Отозвать работу команды может только капитан."
        );
      }

      const deleted = await db
        .delete(hackathonSubmissions)
        .where(
          and(
            eq(hackathonSubmissions.hackathonId, context.hackathonId),
            eq(hackathonSubmissions.teamId, context.team.id)
          )
        )
        .returning({ id: hackathonSubmissions.id });

      if (!deleted[0]) {
        throw new SubmissionRecordNotFoundError("Работа не найдена.");
      }

      return { ok: true };
    }

    const deleted = await db
      .delete(hackathonSubmissions)
      .where(
        and(
          eq(hackathonSubmissions.hackathonId, context.hackathonId),
          eq(hackathonSubmissions.userId, userId),
          isNull(hackathonSubmissions.teamId)
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
      error instanceof SubmissionForbiddenError ||
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
        teamId: hackathonSubmissions.teamId,
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
    const teamIds = [
      ...new Set(
        rows
          .map((row) => row.teamId)
          .filter((id): id is string => typeof id === "string")
      ),
    ];

    const reviewBySubmissionId = new Map<string, SubmissionReviewDTO>();
    const teamNameById = new Map<string, string>();

    const [reviewRows, teamRows] = await Promise.all([
      submissionIds.length > 0
        ? db
            .select()
            .from(submissionReviews)
            .where(inArray(submissionReviews.submissionId, submissionIds))
        : Promise.resolve([]),
      teamIds.length > 0
        ? db
            .select({ id: hackathonTeams.id, name: hackathonTeams.name })
            .from(hackathonTeams)
            .where(inArray(hackathonTeams.id, teamIds))
        : Promise.resolve([]),
    ]);

    for (const reviewRow of reviewRows) {
      reviewBySubmissionId.set(
        reviewRow.submissionId,
        mapReviewRowToDTO(reviewRow)
      );
    }

    for (const teamRow of teamRows) {
      teamNameById.set(teamRow.id, teamRow.name);
    }

    return rows.map((row) => {
      const teamName = row.teamId ? (teamNameById.get(row.teamId) ?? null) : null;
      return {
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
        teamId: row.teamId,
        teamName,
        isTeamSubmission: Boolean(row.teamId),
      };
    });
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
