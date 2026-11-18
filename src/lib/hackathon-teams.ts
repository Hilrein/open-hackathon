import { randomInt } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  hackathonParticipants,
  hackathons,
  hackathonTeamMembers,
  hackathonTeams,
  user,
} from "@/db/schema";
import { getHackathonEffectiveStatus } from "@/lib/hackathon-status";
import { createTeamSchema, joinTeamSchema } from "@/lib/team-schema";

const INVITE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const INVITE_CODE_LENGTH = 6;
const MAX_INVITE_RETRIES = 10;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class TeamNotFoundError extends Error {
  constructor(message = "Хакатон не найден.") {
    super(message);
    this.name = "TeamNotFoundError";
  }
}

export class TeamForbiddenError extends Error {
  constructor(message = "Нет доступа.") {
    super(message);
    this.name = "TeamForbiddenError";
  }
}

export class TeamFinishedError extends Error {
  constructor(message = "Хакатон уже завершён.") {
    super(message);
    this.name = "TeamFinishedError";
  }
}

export class TeamNotParticipantError extends Error {
  constructor(message = "Сначала присоединитесь к хакатону.") {
    super(message);
    this.name = "TeamNotParticipantError";
  }
}

export class TeamAlreadyMemberError extends Error {
  constructor(message = "Вы уже состоите в команде.") {
    super(message);
    this.name = "TeamAlreadyMemberError";
  }
}

export class TeamNameConflictError extends Error {
  constructor(message = "Команда с таким названием уже существует.") {
    super(message);
    this.name = "TeamNameConflictError";
  }
}

export class TeamCaptainCannotLeaveError extends Error {
  constructor(
    message = "Капитан не может покинуть команду. Распустите команду."
  ) {
    super(message);
    this.name = "TeamCaptainCannotLeaveError";
  }
}

export class TeamValidationError extends Error {
  readonly fieldErrors: Record<string, string[] | undefined>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[] | undefined>
  ) {
    super(message);
    this.name = "TeamValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class TeamError extends Error {
  constructor(message = "Не удалось выполнить операцию с командой.") {
    super(message);
    this.name = "TeamError";
  }
}

export type TeamMemberDTO = {
  id: string;
  name: string;
  isCaptain: boolean;
  joinedAt: string;
};

export type TeamDTO = {
  id: string;
  hackathonSlug: string;
  name: string;
  inviteCode: string;
  captainName: string;
  viewerIsCaptain: boolean;
  memberCount: number;
  members: TeamMemberDTO[];
  createdAt: string;
  updatedAt: string;
};

function normalizePublicName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Участник";
}

function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_ALPHABET[randomInt(0, INVITE_ALPHABET.length)];
  }
  return code;
}

async function getHackathonForTeams(slug: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: hackathons.id,
      slug: hackathons.slug,
      organizerId: hackathons.organizerId,
      startDate: hackathons.startDate,
      endDate: hackathons.endDate,
    })
    .from(hackathons)
    .where(eq(hackathons.slug, slug))
    .limit(1);

  const hackathon = rows[0];
  if (!hackathon) {
    throw new TeamNotFoundError("Хакатон не найден.");
  }
  return hackathon;
}

async function isParticipant(
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

async function getTeamMembership(hackathonId: string, userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: hackathonTeamMembers.id,
      teamId: hackathonTeamMembers.teamId,
    })
    .from(hackathonTeamMembers)
    .where(
      and(
        eq(hackathonTeamMembers.hackathonId, hackathonId),
        eq(hackathonTeamMembers.userId, userId)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

async function buildTeamDTOById(
  hackathonSlug: string,
  teamId: string,
  viewerUserId: string
): Promise<TeamDTO | null> {
  const db = getDb();
  const teamRows = await db
    .select()
    .from(hackathonTeams)
    .where(eq(hackathonTeams.id, teamId))
    .limit(1);

  const team = teamRows[0];
  if (!team) {
    return null;
  }

  const memberRows = await db
    .select({
      id: hackathonTeamMembers.id,
      userId: hackathonTeamMembers.userId,
      name: user.name,
      joinedAt: hackathonTeamMembers.joinedAt,
    })
    .from(hackathonTeamMembers)
    .innerJoin(user, eq(hackathonTeamMembers.userId, user.id))
    .where(eq(hackathonTeamMembers.teamId, team.id))
    .orderBy(asc(hackathonTeamMembers.joinedAt));

  const members: TeamMemberDTO[] = memberRows.map((row) => ({
    id: row.id,
    name: normalizePublicName(row.name),
    isCaptain: row.userId === team.captainId,
    joinedAt: row.joinedAt.toISOString(),
  }));

  const captainMember = members.find((member) => member.isCaptain);

  return {
    id: team.id,
    hackathonSlug,
    name: team.name,
    inviteCode: team.inviteCode,
    captainName: captainMember?.name ?? "Участник",
    viewerIsCaptain: team.captainId === viewerUserId,
    memberCount: members.length,
    members,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}

export async function createTeam(
  slug: string,
  userId: string,
  input: unknown
): Promise<TeamDTO> {
  try {
    const hackathon = await getHackathonForTeams(slug);
    const status = getHackathonEffectiveStatus(
      hackathon.startDate,
      hackathon.endDate
    );
    if (status === "finished") {
      throw new TeamFinishedError();
    }

    const participating = await isParticipant(hackathon.id, userId);
    if (!participating) {
      throw new TeamNotParticipantError();
    }

    const existingMembership = await getTeamMembership(hackathon.id, userId);
    if (existingMembership) {
      throw new TeamAlreadyMemberError();
    }

    const parsed = createTeamSchema.safeParse(input);
    if (!parsed.success) {
      throw new TeamValidationError(
        "Проверьте поля формы.",
        parsed.error.flatten().fieldErrors
      );
    }

    const db = getDb();
    const trimmedName = parsed.data.name;

    const existingNameRows = await db
      .select({ id: hackathonTeams.id })
      .from(hackathonTeams)
      .where(
        and(
          eq(hackathonTeams.hackathonId, hackathon.id),
          sql`lower(${hackathonTeams.name}) = lower(${trimmedName})`
        )
      )
      .limit(1);

    if (existingNameRows.length > 0) {
      throw new TeamNameConflictError();
    }

    let createdTeamId: string | null = null;
    for (let attempt = 0; attempt < MAX_INVITE_RETRIES; attempt++) {
      const candidateCode = generateInviteCode();
      const existingCode = await db
        .select({ id: hackathonTeams.id })
        .from(hackathonTeams)
        .where(eq(hackathonTeams.inviteCode, candidateCode))
        .limit(1);

      if (existingCode.length > 0) {
        continue;
      }

      try {
        const [inserted] = await db
          .insert(hackathonTeams)
          .values({
            hackathonId: hackathon.id,
            name: trimmedName,
            captainId: userId,
            inviteCode: candidateCode,
          })
          .returning({ id: hackathonTeams.id });

        if (inserted) {
          createdTeamId = inserted.id;
          break;
        }
      } catch (insertError: unknown) {
        const errorText =
          insertError instanceof Error ? insertError.message : "";
        if (errorText.includes("hackathon_teams_hackathon_name_lower_uidx")) {
          throw new TeamNameConflictError();
        }
        if (errorText.includes("hackathon_teams_invite_code_unique")) {
          continue;
        }
        throw insertError;
      }
    }

    if (!createdTeamId) {
      throw new TeamError(
        "Не удалось сгенерировать код приглашения. Попробуйте ещё раз."
      );
    }

    const insertedMembers = await db
      .insert(hackathonTeamMembers)
      .values({
        hackathonId: hackathon.id,
        teamId: createdTeamId,
        userId,
      })
      .onConflictDoNothing({
        target: [
          hackathonTeamMembers.hackathonId,
          hackathonTeamMembers.userId,
        ],
      })
      .returning({ id: hackathonTeamMembers.id });

    if (!insertedMembers[0]) {
      await db
        .delete(hackathonTeams)
        .where(eq(hackathonTeams.id, createdTeamId));
      throw new TeamAlreadyMemberError();
    }

    const dto = await buildTeamDTOById(hackathon.slug, createdTeamId, userId);
    if (!dto) {
      throw new TeamError("Не удалось создать команду. Попробуйте позже.");
    }
    return dto;
  } catch (error: unknown) {
    if (
      error instanceof TeamNotFoundError ||
      error instanceof TeamFinishedError ||
      error instanceof TeamNotParticipantError ||
      error instanceof TeamAlreadyMemberError ||
      error instanceof TeamNameConflictError ||
      error instanceof TeamValidationError ||
      error instanceof TeamError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при создании команды (${errorName}).`);
    throw new TeamError("Не удалось создать команду. Попробуйте позже.");
  }
}

export async function listTeams(
  slug: string,
  userId: string
): Promise<TeamDTO[]> {
  try {
    const hackathon = await getHackathonForTeams(slug);
    const isOrganizer = hackathon.organizerId === userId;
    const participating = isOrganizer
      ? true
      : await isParticipant(hackathon.id, userId);

    if (!participating) {
      throw new TeamForbiddenError(
        "Просмотр команд доступен только участникам и организатору."
      );
    }

    const db = getDb();
    const teamRows = await db
      .select()
      .from(hackathonTeams)
      .where(eq(hackathonTeams.hackathonId, hackathon.id))
      .orderBy(asc(hackathonTeams.createdAt));

    if (teamRows.length === 0) {
      return [];
    }

    const memberRows = await db
      .select({
        id: hackathonTeamMembers.id,
        teamId: hackathonTeamMembers.teamId,
        userId: hackathonTeamMembers.userId,
        name: user.name,
        joinedAt: hackathonTeamMembers.joinedAt,
      })
      .from(hackathonTeamMembers)
      .innerJoin(user, eq(hackathonTeamMembers.userId, user.id))
      .where(eq(hackathonTeamMembers.hackathonId, hackathon.id))
      .orderBy(asc(hackathonTeamMembers.joinedAt));

    const captainIdByTeam = new Map<string, string>();
    for (const team of teamRows) {
      captainIdByTeam.set(team.id, team.captainId);
    }

    const membersByTeam = new Map<string, TeamMemberDTO[]>();
    for (const row of memberRows) {
      const list = membersByTeam.get(row.teamId) ?? [];
      list.push({
        id: row.id,
        name: normalizePublicName(row.name),
        isCaptain: row.userId === captainIdByTeam.get(row.teamId),
        joinedAt: row.joinedAt.toISOString(),
      });
      membersByTeam.set(row.teamId, list);
    }

    return teamRows.map((team) => {
      const members = membersByTeam.get(team.id) ?? [];
      const captain = members.find((member) => member.isCaptain);
      return {
        id: team.id,
        hackathonSlug: hackathon.slug,
        name: team.name,
        inviteCode: team.inviteCode,
        captainName: captain?.name ?? "Участник",
        viewerIsCaptain: team.captainId === userId,
        memberCount: members.length,
        members,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      };
    });
  } catch (error: unknown) {
    if (
      error instanceof TeamNotFoundError ||
      error instanceof TeamForbiddenError ||
      error instanceof TeamError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при получении списка команд (${errorName}).`);
    throw new TeamError("Не удалось загрузить команды. Попробуйте позже.");
  }
}

export async function getMyTeam(
  slug: string,
  userId: string
): Promise<TeamDTO | null> {
  try {
    const hackathon = await getHackathonForTeams(slug);
    const isOrganizer = hackathon.organizerId === userId;
    const participating = isOrganizer
      ? true
      : await isParticipant(hackathon.id, userId);

    if (!participating) {
      throw new TeamForbiddenError(
        "Команды доступны только участникам и организатору."
      );
    }

    const membership = await getTeamMembership(hackathon.id, userId);
    if (!membership) {
      return null;
    }

    return buildTeamDTOById(hackathon.slug, membership.teamId, userId);
  } catch (error: unknown) {
    if (
      error instanceof TeamNotFoundError ||
      error instanceof TeamForbiddenError ||
      error instanceof TeamError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при получении своей команды (${errorName}).`);
    throw new TeamError("Не удалось загрузить команду. Попробуйте позже.");
  }
}

export async function joinTeamByCode(
  slug: string,
  userId: string,
  input: unknown
): Promise<TeamDTO> {
  try {
    const hackathon = await getHackathonForTeams(slug);
    const status = getHackathonEffectiveStatus(
      hackathon.startDate,
      hackathon.endDate
    );
    if (status === "finished") {
      throw new TeamFinishedError();
    }

    const participating = await isParticipant(hackathon.id, userId);
    if (!participating) {
      throw new TeamNotParticipantError();
    }

    const existingMembership = await getTeamMembership(hackathon.id, userId);
    if (existingMembership) {
      throw new TeamAlreadyMemberError();
    }

    const parsed = joinTeamSchema.safeParse(input);
    if (!parsed.success) {
      throw new TeamValidationError(
        "Проверьте поля формы.",
        parsed.error.flatten().fieldErrors
      );
    }

    const db = getDb();
    const teamRows = await db
      .select({ id: hackathonTeams.id })
      .from(hackathonTeams)
      .where(
        and(
          eq(hackathonTeams.inviteCode, parsed.data.inviteCode),
          eq(hackathonTeams.hackathonId, hackathon.id)
        )
      )
      .limit(1);

    const team = teamRows[0];
    if (!team) {
      throw new TeamNotFoundError("Команда не найдена.");
    }

    const inserted = await db
      .insert(hackathonTeamMembers)
      .values({
        hackathonId: hackathon.id,
        teamId: team.id,
        userId,
      })
      .onConflictDoNothing({
        target: [
          hackathonTeamMembers.hackathonId,
          hackathonTeamMembers.userId,
        ],
      })
      .returning({ id: hackathonTeamMembers.id });

    if (!inserted[0]) {
      throw new TeamAlreadyMemberError();
    }

    const dto = await buildTeamDTOById(hackathon.slug, team.id, userId);
    if (!dto) {
      throw new TeamNotFoundError("Команда не найдена.");
    }
    return dto;
  } catch (error: unknown) {
    if (
      error instanceof TeamNotFoundError ||
      error instanceof TeamFinishedError ||
      error instanceof TeamNotParticipantError ||
      error instanceof TeamAlreadyMemberError ||
      error instanceof TeamValidationError ||
      error instanceof TeamError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при входе в команду по коду (${errorName}).`);
    throw new TeamError("Не удалось присоединиться к команде. Попробуйте позже.");
  }
}

export async function leaveMyTeam(
  slug: string,
  userId: string
): Promise<{ ok: true }> {
  try {
    const hackathon = await getHackathonForTeams(slug);
    const status = getHackathonEffectiveStatus(
      hackathon.startDate,
      hackathon.endDate
    );
    if (status === "finished") {
      throw new TeamFinishedError();
    }

    const db = getDb();
    const rows = await db
      .select({
        memberId: hackathonTeamMembers.id,
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
      .limit(1);

    const membership = rows[0];
    if (!membership) {
      throw new TeamNotFoundError("Вы не состоите в команде.");
    }

    if (membership.captainId === userId) {
      throw new TeamCaptainCannotLeaveError();
    }

    await db
      .delete(hackathonTeamMembers)
      .where(eq(hackathonTeamMembers.id, membership.memberId));

    return { ok: true };
  } catch (error: unknown) {
    if (
      error instanceof TeamNotFoundError ||
      error instanceof TeamFinishedError ||
      error instanceof TeamCaptainCannotLeaveError ||
      error instanceof TeamError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при выходе из команды (${errorName}).`);
    throw new TeamError("Не удалось покинуть команду. Попробуйте позже.");
  }
}

export async function disbandTeam(
  slug: string,
  teamId: string,
  userId: string
): Promise<{ ok: true }> {
  try {
    const hackathon = await getHackathonForTeams(slug);
    const status = getHackathonEffectiveStatus(
      hackathon.startDate,
      hackathon.endDate
    );
    if (status === "finished") {
      throw new TeamFinishedError();
    }

    if (!UUID_REGEX.test(teamId)) {
      throw new TeamNotFoundError("Команда не найдена.");
    }

    const db = getDb();
    const rows = await db
      .select({
        id: hackathonTeams.id,
        captainId: hackathonTeams.captainId,
      })
      .from(hackathonTeams)
      .where(
        and(
          eq(hackathonTeams.id, teamId),
          eq(hackathonTeams.hackathonId, hackathon.id)
        )
      )
      .limit(1);

    const team = rows[0];
    if (!team) {
      throw new TeamNotFoundError("Команда не найдена.");
    }

    if (team.captainId !== userId) {
      throw new TeamForbiddenError("Только капитан может распустить команду.");
    }

    await db
      .delete(hackathonTeams)
      .where(
        and(
          eq(hackathonTeams.id, team.id),
          eq(hackathonTeams.captainId, userId)
        )
      );

    return { ok: true };
  } catch (error: unknown) {
    if (
      error instanceof TeamNotFoundError ||
      error instanceof TeamFinishedError ||
      error instanceof TeamForbiddenError ||
      error instanceof TeamError
    ) {
      throw error;
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при роспуске команды (${errorName}).`);
    throw new TeamError("Не удалось распустить команду. Попробуйте позже.");
  }
}
