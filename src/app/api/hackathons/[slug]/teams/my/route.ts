import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  TeamCaptainCannotLeaveError,
  TeamFinishedError,
  TeamForbiddenError,
  TeamNotFoundError,
  getMyTeam,
  leaveMyTeam,
} from "@/lib/hackathon-teams";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Войдите, чтобы посмотреть свою команду." },
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
    const team = await getMyTeam(trimmedSlug, session.user.id);
    return NextResponse.json({ team }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof TeamNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof TeamForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Ошибка в GET /api/hackathons/[slug]/teams/my (${errorName}).`
    );
    return NextResponse.json(
      { error: "Не удалось загрузить команду. Попробуйте позже." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Войдите, чтобы покинуть команду." },
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
    await leaveMyTeam(trimmedSlug, session.user.id);
    revalidatePath(`/hackathons/${trimmedSlug}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof TeamNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof TeamFinishedError ||
      error instanceof TeamCaptainCannotLeaveError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Ошибка в DELETE /api/hackathons/[slug]/teams/my (${errorName}).`
    );
    return NextResponse.json(
      { error: "Не удалось покинуть команду. Попробуйте позже." },
      { status: 500 }
    );
  }
}
