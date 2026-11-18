import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  HackathonParticipationAlreadyError,
  HackathonParticipationFinishedError,
  HackathonParticipationForbiddenError,
  HackathonParticipationFullError,
  HackathonParticipationNotFoundError,
  HackathonParticipationNotParticipantError,
  joinHackathonForUser,
  leaveHackathonForUser,
} from "@/lib/hackathon-participation";
import { getSession } from "@/lib/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Войдите, чтобы участвовать в хакатоне." },
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
    const result = await joinHackathonForUser(trimmedSlug, session.user.id);

    revalidatePath("/");
    revalidatePath("/hackathons");
    revalidatePath(`/hackathons/${trimmedSlug}`);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof HackathonParticipationNotFoundError) {
      return NextResponse.json(
        { error: "Хакатон не найден." },
        { status: 404 }
      );
    }

    if (error instanceof HackathonParticipationForbiddenError) {
      return NextResponse.json(
        { error: "Организатор не может участвовать в своём хакатоне." },
        { status: 403 }
      );
    }

    if (error instanceof HackathonParticipationFinishedError) {
      return NextResponse.json(
        { error: "Хакатон уже завершён." },
        { status: 400 }
      );
    }

    if (error instanceof HackathonParticipationAlreadyError) {
      return NextResponse.json(
        { error: "Вы уже участвуете в этом хакатоне." },
        { status: 409 }
      );
    }

    if (error instanceof HackathonParticipationFullError) {
      return NextResponse.json(
        { error: "Свободных мест больше нет." },
        { status: 409 }
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Непредвиденная ошибка в POST /api/hackathons/[slug]/participate (${errorName}).`
    );

    return NextResponse.json(
      { error: "Не удалось присоединиться к хакатону. Попробуйте позже." },
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
      { error: "Войдите, чтобы отменить участие." },
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
    const result = await leaveHackathonForUser(trimmedSlug, session.user.id);

    revalidatePath("/");
    revalidatePath("/hackathons");
    revalidatePath(`/hackathons/${trimmedSlug}`);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof HackathonParticipationNotFoundError) {
      return NextResponse.json(
        { error: "Хакатон не найден." },
        { status: 404 }
      );
    }

    if (error instanceof HackathonParticipationNotParticipantError) {
      return NextResponse.json(
        { error: "Вы не участвуете в этом хакатоне." },
        { status: 404 }
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Непредвиденная ошибка в DELETE /api/hackathons/[slug]/participate (${errorName}).`
    );

    return NextResponse.json(
      { error: "Не удалось отменить участие. Попробуйте позже." },
      { status: 500 }
    );
  }
}
