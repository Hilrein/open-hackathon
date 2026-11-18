import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { hackathonParticipants, hackathons } from "@/db/schema";

export class HackathonParticipationNotFoundError extends Error {
  constructor(message = "Хакатон не найден.") {
    super(message);
    this.name = "HackathonParticipationNotFoundError";
  }
}

export class HackathonParticipationForbiddenError extends Error {
  constructor(
    message = "Организатор не может участвовать в своём хакатоне."
  ) {
    super(message);
    this.name = "HackathonParticipationForbiddenError";
  }
}

export class HackathonParticipationFinishedError extends Error {
  constructor(message = "Хакатон уже завершён.") {
    super(message);
    this.name = "HackathonParticipationFinishedError";
  }
}

export class HackathonParticipationAlreadyError extends Error {
  constructor(message = "Вы уже участвуете в этом хакатоне.") {
    super(message);
    this.name = "HackathonParticipationAlreadyError";
  }
}

export class HackathonParticipationFullError extends Error {
  constructor(message = "Свободных мест больше нет.") {
    super(message);
    this.name = "HackathonParticipationFullError";
  }
}

export class HackathonParticipationNotParticipantError extends Error {
  constructor(message = "Вы не участвуете в этом хакатоне.") {
    super(message);
    this.name = "HackathonParticipationNotParticipantError";
  }
}

export class HackathonParticipationError extends Error {
  constructor(message = "Не удалось обновить участие. Попробуйте позже.") {
    super(message);
    this.name = "HackathonParticipationError";
  }
}

export async function joinHackathonForUser(
  slug: string,
  userId: string
): Promise<{ participating: true; participantsCount: number }> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: hackathons.id,
        endDate: hackathons.endDate,
        organizerId: hackathons.organizerId,
        participantsCount: hackathons.participantsCount,
        maxParticipants: hackathons.maxParticipants,
      })
      .from(hackathons)
      .where(eq(hackathons.slug, slug))
      .limit(1);

    const hackathon = rows[0];
    if (!hackathon) {
      throw new HackathonParticipationNotFoundError();
    }

    if (hackathon.endDate.getTime() <= Date.now()) {
      throw new HackathonParticipationFinishedError();
    }

    if (hackathon.organizerId === userId) {
      throw new HackathonParticipationForbiddenError();
    }

    const existing = await db
      .select({ id: hackathonParticipants.id })
      .from(hackathonParticipants)
      .where(
        and(
          eq(hackathonParticipants.hackathonId, hackathon.id),
          eq(hackathonParticipants.userId, userId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new HackathonParticipationAlreadyError();
    }

    if (
      hackathon.maxParticipants !== null &&
      hackathon.participantsCount >= hackathon.maxParticipants
    ) {
      throw new HackathonParticipationFullError();
    }

    const inserted = await db
      .insert(hackathonParticipants)
      .values({
        hackathonId: hackathon.id,
        userId,
      })
      .onConflictDoNothing({
        target: [
          hackathonParticipants.hackathonId,
          hackathonParticipants.userId,
        ],
      })
      .returning({ id: hackathonParticipants.id });

    if (!inserted[0]) {
      throw new HackathonParticipationAlreadyError();
    }

    const updated = await db
      .update(hackathons)
      .set({
        participantsCount: sql`${hackathons.participantsCount} + 1`,
      })
      .where(eq(hackathons.id, hackathon.id))
      .returning({ participantsCount: hackathons.participantsCount });

    return {
      participating: true,
      participantsCount:
        updated[0]?.participantsCount ?? hackathon.participantsCount + 1,
    };
  } catch (error: unknown) {
    if (
      error instanceof HackathonParticipationNotFoundError ||
      error instanceof HackathonParticipationFinishedError ||
      error instanceof HackathonParticipationForbiddenError ||
      error instanceof HackathonParticipationAlreadyError ||
      error instanceof HackathonParticipationFullError ||
      error instanceof HackathonParticipationError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при записи участника в хакатон (${errorName}).`);
    throw new HackathonParticipationError(
      "Не удалось присоединиться к хакатону. Попробуйте позже."
    );
  }
}

export async function leaveHackathonForUser(
  slug: string,
  userId: string
): Promise<{ participating: false; participantsCount: number }> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: hackathons.id,
        participantsCount: hackathons.participantsCount,
      })
      .from(hackathons)
      .where(eq(hackathons.slug, slug))
      .limit(1);

    const hackathon = rows[0];
    if (!hackathon) {
      throw new HackathonParticipationNotFoundError();
    }

    const deleted = await db
      .delete(hackathonParticipants)
      .where(
        and(
          eq(hackathonParticipants.hackathonId, hackathon.id),
          eq(hackathonParticipants.userId, userId)
        )
      )
      .returning({ id: hackathonParticipants.id });

    if (!deleted[0]) {
      throw new HackathonParticipationNotParticipantError();
    }

    const updated = await db
      .update(hackathons)
      .set({
        participantsCount: sql`GREATEST(${hackathons.participantsCount} - 1, 0)`,
      })
      .where(eq(hackathons.id, hackathon.id))
      .returning({ participantsCount: hackathons.participantsCount });

    return {
      participating: false,
      participantsCount:
        updated[0]?.participantsCount ??
        Math.max(hackathon.participantsCount - 1, 0),
    };
  } catch (error: unknown) {
    if (
      error instanceof HackathonParticipationNotFoundError ||
      error instanceof HackathonParticipationNotParticipantError ||
      error instanceof HackathonParticipationError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при отмене участия в хакатоне (${errorName}).`);
    throw new HackathonParticipationError(
      "Не удалось отменить участие. Попробуйте позже."
    );
  }
}
