import { getDb } from "@/db";
import { hackathons } from "@/db/schema";
import { hackathonCreateSchema } from "@/lib/hackathon-create-schema";
import { getHackathonEffectiveStatus } from "@/lib/hackathon-status";
import { generateUniqueHackathonSlug } from "@/lib/slug";

export class HackathonCreateValidationError extends Error {
  readonly fieldErrors: Record<string, string[] | undefined>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[] | undefined>
  ) {
    super(message);
    this.name = "HackathonCreateValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class HackathonCreateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HackathonCreateError";
  }
}

interface CreateHackathonForUserParams {
  userId: string;
  userName?: string | null;
  userEmail: string;
  input: unknown;
}

export async function createHackathonForUser({
  userId,
  userName,
  userEmail,
  input,
}: CreateHackathonForUserParams): Promise<{ slug: string }> {
  const parsed = hackathonCreateSchema.safeParse(input);

  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    throw new HackathonCreateValidationError(
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

  try {
    const slug = await generateUniqueHackathonSlug(data.title);
    const db = getDb();

    const [created] = await db
      .insert(hackathons)
      .values({
        slug,
        title: data.title,
        description: data.description,
        startDate,
        endDate,
        location: data.location,
        format: data.format,
        status,
        participantsCount: 0,
        maxParticipants: data.maxParticipants ?? null,
        tags: data.tags ?? [],
        prizePool: data.prizePool && data.prizePool.length > 0 ? data.prizePool : null,
        imageUrl: null,
        organizerName,
        organizerId: userId,
      })
      .returning({ slug: hackathons.slug });

    if (!created) {
      throw new HackathonCreateError(
        "Не удалось создать хакатон. Попробуйте позже."
      );
    }

    return { slug: created.slug };
  } catch (error: unknown) {
    if (error instanceof HackathonCreateError) {
      throw error;
    }
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при создании хакатона в базе (${errorName}).`);
    throw new HackathonCreateError(
      "Не удалось создать хакатон. Попробуйте позже."
    );
  }
}
