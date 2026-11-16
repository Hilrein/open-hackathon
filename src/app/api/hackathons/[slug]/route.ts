import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { hackathons } from "@/db/schema";
import {
  HackathonUpdateError,
  HackathonUpdateForbiddenError,
  HackathonUpdateNotFoundError,
  HackathonUpdateValidationError,
  updateHackathonForUser,
} from "@/lib/hackathon-update";
import { getSession } from "@/lib/session";

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Войдите, чтобы редактировать хакатон." },
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
    const result = await updateHackathonForUser({
      slug: trimmedSlug,
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      input: body,
    });

    revalidatePath("/");
    revalidatePath("/hackathons");
    revalidatePath("/my-hackathons");
    revalidatePath(`/hackathons/${result.slug}`);

    return NextResponse.json({ slug: result.slug }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof HackathonUpdateNotFoundError) {
      return NextResponse.json(
        { error: "Хакатон не найден." },
        { status: 404 }
      );
    }

    if (error instanceof HackathonUpdateForbiddenError) {
      return NextResponse.json(
        { error: "Вы можете редактировать только свои хакатоны." },
        { status: 403 }
      );
    }

    if (error instanceof HackathonUpdateValidationError) {
      return NextResponse.json(
        {
          error: "Проверьте поля формы.",
          fieldErrors: error.fieldErrors,
        },
        { status: 400 }
      );
    }

    if (error instanceof HackathonUpdateError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Непредвиденная ошибка в PUT /api/hackathons/[slug] (${errorName}).`);

    return NextResponse.json(
      { error: "Не удалось сохранить изменения. Попробуйте позже." },
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
      { error: "Нужно войти в аккаунт." },
      { status: 401 }
    );
  }

  const { slug } = await context.params;
  const trimmedSlug = slug?.trim();
  if (!trimmedSlug) {
    return NextResponse.json(
      { error: "Некорректный адрес хакатона." },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        id: hackathons.id,
        organizerId: hackathons.organizerId,
      })
      .from(hackathons)
      .where(eq(hackathons.slug, trimmedSlug))
      .limit(1);

    const existing = rows[0];
    if (!existing) {
      return NextResponse.json(
        { error: "Хакатон не найден." },
        { status: 404 }
      );
    }

    if (existing.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: "Можно удалять только свои хакатоны." },
        { status: 403 }
      );
    }

    await db
      .delete(hackathons)
      .where(
        and(
          eq(hackathons.id, existing.id),
          eq(hackathons.organizerId, session.user.id)
        )
      );

    revalidatePath("/");
    revalidatePath("/hackathons");
    revalidatePath("/my-hackathons");

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Не удалось удалить хакатон. Попробуйте позже." },
      { status: 500 }
    );
  }
}
