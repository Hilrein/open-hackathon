import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  ReviewForbiddenError,
  ReviewNotFinishedError,
  ReviewNotFoundError,
  ReviewRecordNotFoundError,
  ReviewSubmissionNotFoundError,
  ReviewValidationError,
  removeSubmissionReview,
  reviewSubmission,
} from "@/lib/hackathon-reviews";
import { getSession } from "@/lib/session";

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string; submissionId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Войдите, чтобы оценить работу." },
      { status: 401 }
    );
  }

  const { slug, submissionId } = await context.params;
  const trimmedSlug = slug?.trim();
  const trimmedSubmissionId = submissionId?.trim();

  if (!trimmedSlug) {
    return NextResponse.json(
      { error: "Хакатон не найден." },
      { status: 404 }
    );
  }

  if (!trimmedSubmissionId) {
    return NextResponse.json(
      { error: "Работа не найдена." },
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
    const review = await reviewSubmission(
      trimmedSlug,
      trimmedSubmissionId,
      session.user.id,
      body
    );

    revalidatePath(`/hackathons/${trimmedSlug}`);
    revalidatePath("/my-participations");
    revalidatePath(`/my-hackathons/${trimmedSlug}/submissions`);

    return NextResponse.json({ review }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ReviewNotFoundError) {
      return NextResponse.json(
        { error: "Хакатон не найден." },
        { status: 404 }
      );
    }

    if (error instanceof ReviewForbiddenError) {
      return NextResponse.json(
        { error: "Вы можете оценивать работы только своих хакатонов." },
        { status: 403 }
      );
    }

    if (error instanceof ReviewSubmissionNotFoundError) {
      return NextResponse.json(
        { error: "Работа не найдена." },
        { status: 404 }
      );
    }

    if (error instanceof ReviewNotFinishedError) {
      return NextResponse.json(
        { error: "Оценивание доступно после завершения хакатона." },
        { status: 400 }
      );
    }

    if (error instanceof ReviewValidationError) {
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
      `Ошибка в PUT /api/hackathons/[slug]/submissions/[submissionId]/review (${errorName}).`
    );
    return NextResponse.json(
      { error: "Не удалось сохранить оценку. Попробуйте позже." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string; submissionId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Войдите, чтобы снять оценку." },
      { status: 401 }
    );
  }

  const { slug, submissionId } = await context.params;
  const trimmedSlug = slug?.trim();
  const trimmedSubmissionId = submissionId?.trim();

  if (!trimmedSlug) {
    return NextResponse.json(
      { error: "Хакатон не найден." },
      { status: 404 }
    );
  }

  if (!trimmedSubmissionId) {
    return NextResponse.json(
      { error: "Работа не найдена." },
      { status: 404 }
    );
  }

  try {
    await removeSubmissionReview(
      trimmedSlug,
      trimmedSubmissionId,
      session.user.id
    );

    revalidatePath(`/hackathons/${trimmedSlug}`);
    revalidatePath("/my-participations");
    revalidatePath(`/my-hackathons/${trimmedSlug}/submissions`);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ReviewNotFoundError) {
      return NextResponse.json(
        { error: "Хакатон не найден." },
        { status: 404 }
      );
    }

    if (error instanceof ReviewForbiddenError) {
      return NextResponse.json(
        { error: "Вы можете оценивать работы только своих хакатонов." },
        { status: 403 }
      );
    }

    if (error instanceof ReviewSubmissionNotFoundError) {
      return NextResponse.json(
        { error: "Работа не найдена." },
        { status: 404 }
      );
    }

    if (error instanceof ReviewRecordNotFoundError) {
      return NextResponse.json(
        { error: "Оценка не найдена." },
        { status: 404 }
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Ошибка в DELETE /api/hackathons/[slug]/submissions/[submissionId]/review (${errorName}).`
    );
    return NextResponse.json(
      { error: "Не удалось снять оценку. Попробуйте позже." },
      { status: 500 }
    );
  }
}
