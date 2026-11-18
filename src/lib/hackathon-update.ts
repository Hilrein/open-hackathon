import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { hackathons } from "@/db/schema";
import { getHackathonEffectiveStatus } from "@/lib/hackathon-status";
import { hackathonUpdateSchema } from "@/lib/hackathon-update-schema";

export class HackathonUpdateValidationError extends Error {
  readonly fieldErrors: Record<string, string[] | undefined>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[] | undefined>
  ) {
    super(message);
    this.name = "HackathonUpdateValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class HackathonUpdateNotFoundError extends Error {
  constructor(message = "Хакатон не найден.") {
    super(message);
    this.name = "HackathonUpdateNotFoundError";
  }
}

export class HackathonUpdateForbiddenError extends Error {
  constructor(message = "Вы можете редактировать только свои хакатоны.") {
    super(message);
    this.name = "HackathonUpdateForbiddenError";
  }
}

export class HackathonUpdateError extends Error {
  constructor(message = "Не удалось сохранить изменения. Попробуйте позже.") {
    super(message);
    this.name = "HackathonUpdateError";
  }
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

interface UpdateHackathonForUserParams {
  slug: string;
  userId: string;
  userName?: string | null;
  userEmail: string;
  input: unknown;
}

export async function updateHackathonForUser({
  slug,
  userId,
  userName,
  userEmail,
  input,
}: UpdateHackathonForUserParams): Promise<{ slug: string }> {
  const parsed = hackathonUpdateSchema.safeParse(input);

  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    throw new HackathonUpdateValidationError(
      "Проверьте поля формы.",
      flattened.fieldErrors
    );
  }

  const data = parsed.data;
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const status = getHackathonEffectiveStatus(startDate, endDate);

  const organizerName =
    data.organizerName && data.organizerName.length > 0
      ? data.organizerName
      : userName?.trim() || userEmail;

  const maxParticipants = data.maxParticipants ?? null;
  const prizePool =
    data.prizePool && data.prizePool.length > 0 ? data.prizePool : null;
  const tags = normalizeTags(data.tags);

  try {
    const db = getDb();
    const rows = await db
      .select({
        id: hackathons.id,
        organizerId: hackathons.organizerId,
      })
      .from(hackathons)
      .where(eq(hackathons.slug, slug))
      .limit(1);

    const existing = rows[0];
    if (!existing) {
      throw new HackathonUpdateNotFoundError();
    }

    if (existing.organizerId !== userId) {
      throw new HackathonUpdateForbiddenError();
    }

    const [updated] = await db
      .update(hackathons)
      .set({
        title: data.title,
        description: data.description,
        startDate,
        endDate,
        location: data.location,
        format: data.format,
        status,
        maxParticipants,
        tags,
        prizePool,
        organizerName,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(hackathons.id, existing.id),
          eq(hackathons.organizerId, userId)
        )
      )
      .returning({ slug: hackathons.slug });

    if (!updated) {
      throw new HackathonUpdateError();
    }

    return { slug: updated.slug };
  } catch (error: unknown) {
    if (
      error instanceof HackathonUpdateNotFoundError ||
      error instanceof HackathonUpdateForbiddenError ||
      error instanceof HackathonUpdateError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при обновлении хакатона в базе (${errorName}).`);
    throw new HackathonUpdateError();
  }
}
