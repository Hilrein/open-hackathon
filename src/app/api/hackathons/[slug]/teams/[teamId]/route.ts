import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  TeamFinishedError,
  TeamForbiddenError,
  TeamNotFoundError,
  disbandTeam,
} from "@/lib/hackathon-teams";
import { getSession } from "@/lib/session";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string; teamId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Войдите, чтобы распустить команду." },
      { status: 401 }
    );
  }

  const { slug, teamId } = await context.params;
  const trimmedSlug = slug?.trim();
  const trimmedTeamId = teamId?.trim();

  if (!trimmedSlug) {
    return NextResponse.json(
      { error: "Хакатон не найден." },
      { status: 404 }
    );
  }

  if (!trimmedTeamId) {
    return NextResponse.json(
      { error: "Команда не найдена." },
      { status: 404 }
    );
  }

  try {
    await disbandTeam(trimmedSlug, trimmedTeamId, session.user.id);
    revalidatePath(`/hackathons/${trimmedSlug}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof TeamNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof TeamFinishedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof TeamForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Ошибка в DELETE /api/hackathons/[slug]/teams/[teamId] (${errorName}).`
    );
    return NextResponse.json(
      { error: "Не удалось распустить команду. Попробуйте позже." },
      { status: 500 }
    );
  }
}
