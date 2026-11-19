import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  TeamAlreadyMemberError,
  TeamFinishedError,
  TeamForbiddenError,
  TeamHasIndividualSubmissionError,
  TeamNameConflictError,
  TeamNotFoundError,
  TeamNotParticipantError,
  TeamValidationError,
  createTeam,
  listTeams,
} from "@/lib/hackathon-teams";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Войдите, чтобы посмотреть команды." },
      { status: 401 }
    );
  }

  const { slug } = await context.params;
  const trimmedSlug = slug?.trim();
  if (!trimmedSlug) {
    return NextResponse.json(
      { error: "Хакатон не найден." },
      { status: 404 }
    );
  }

  try {
    const teams = await listTeams(trimmedSlug, session.user.id);
    return NextResponse.json({ teams }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof TeamNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof TeamForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка в GET /api/hackathons/[slug]/teams (${errorName}).`);
    return NextResponse.json(
      { error: "Не удалось загрузить команды. Попробуйте позже." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Войдите, чтобы создать команду." },
      { status: 401 }
    );
  }

  const { slug } = await context.params;
  const trimmedSlug = slug?.trim();
  if (!trimmedSlug) {
    return NextResponse.json(
      { error: "Хакатон не найден." },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Некорректные данные запроса." },
      { status: 400 }
    );
  }

  try {
    const team = await createTeam(trimmedSlug, session.user.id, body);
    revalidatePath(`/hackathons/${trimmedSlug}`);
    return NextResponse.json({ team }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof TeamNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof TeamFinishedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof TeamValidationError) {
      return NextResponse.json(
        { error: error.message, fieldErrors: error.fieldErrors },
        { status: 400 }
      );
    }
    if (error instanceof TeamNotParticipantError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (
      error instanceof TeamAlreadyMemberError ||
      error instanceof TeamNameConflictError ||
      error instanceof TeamHasIndividualSubmissionError
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка в POST /api/hackathons/[slug]/teams (${errorName}).`);
    return NextResponse.json(
      { error: "Не удалось создать команду. Попробуйте позже." },
      { status: 500 }
    );
  }
}
