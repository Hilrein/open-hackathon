import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  SubmissionFinishedError,
  SubmissionForbiddenError,
  SubmissionNotFoundError,
  SubmissionNotStartedError,
  SubmissionRecordNotFoundError,
  SubmissionValidationError,
  getOwnSubmission,
  submitHackathonProject,
  withdrawOwnSubmission,
} from "@/lib/hackathon-submissions";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Войдите, чтобы посмотреть свою работу." },
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
    const submission = await getOwnSubmission(trimmedSlug, session.user.id);
    return NextResponse.json({ submission }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof SubmissionNotFoundError) {
      return NextResponse.json(
        { error: "Хакатон не найден." },
        { status: 404 }
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Ошибка в GET /api/hackathons/[slug]/submission (${errorName}).`
    );
    return NextResponse.json(
      { error: "Не удалось загрузить работу. Попробуйте позже." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Войдите, чтобы сдать проект." },
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
    const submission = await submitHackathonProject(
      trimmedSlug,
      session.user.id,
      body
    );

    revalidatePath(`/hackathons/${trimmedSlug}`);
    revalidatePath("/my-participations");

    return NextResponse.json({ submission }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof SubmissionNotFoundError) {
      return NextResponse.json(
        { error: "Хакатон не найден." },
        { status: 404 }
      );
    }

    if (error instanceof SubmissionForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    if (error instanceof SubmissionNotStartedError) {
      return NextResponse.json(
        { error: "Хакатон ещё не начался." },
        { status: 400 }
      );
    }

    if (error instanceof SubmissionFinishedError) {
      return NextResponse.json(
        { error: "Хакатон уже завершён." },
        { status: 400 }
      );
    }

    if (error instanceof SubmissionValidationError) {
      return NextResponse.json(
        {
          error: "Проверьте поля формы.",
          fieldErrors: error.fieldErrors,
        },
        { status: 400 }
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Ошибка в PUT /api/hackathons/[slug]/submission (${errorName}).`
    );
    return NextResponse.json(
      { error: "Не удалось сохранить работу. Попробуйте позже." },
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
      { error: "Войдите, чтобы отозвать работу." },
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
    await withdrawOwnSubmission(trimmedSlug, session.user.id);

    revalidatePath(`/hackathons/${trimmedSlug}`);
    revalidatePath("/my-participations");

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof SubmissionNotFoundError) {
      return NextResponse.json(
        { error: "Хакатон не найден." },
        { status: 404 }
      );
    }

    if (error instanceof SubmissionRecordNotFoundError) {
      return NextResponse.json(
        { error: "Работа не найдена." },
        { status: 404 }
      );
    }

    if (error instanceof SubmissionFinishedError) {
      return NextResponse.json(
        { error: "Хакатон уже завершён. Отозвать работу нельзя." },
        { status: 400 }
      );
    }

    if (error instanceof SubmissionForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Ошибка в DELETE /api/hackathons/[slug]/submission (${errorName}).`
    );
    return NextResponse.json(
      { error: "Не удалось отозвать работу. Попробуйте позже." },
      { status: 500 }
    );
  }
}
