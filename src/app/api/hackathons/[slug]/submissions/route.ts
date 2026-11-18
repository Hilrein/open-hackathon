import { NextResponse } from "next/server";
import {
  SubmissionForbiddenError,
  SubmissionNotFoundError,
  getSubmissionsForOrganizer,
} from "@/lib/hackathon-submissions";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Войдите, чтобы посмотреть работы." },
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
    const submissions = await getSubmissionsForOrganizer(
      trimmedSlug,
      session.user.id
    );
    return NextResponse.json({ submissions }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof SubmissionNotFoundError) {
      return NextResponse.json(
        { error: "Хакатон не найден." },
        { status: 404 }
      );
    }

    if (error instanceof SubmissionForbiddenError) {
      return NextResponse.json(
        { error: "Вы можете смотреть работы только своих хакатонов." },
        { status: 403 }
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Ошибка в GET /api/hackathons/[slug]/submissions (${errorName}).`
    );
    return NextResponse.json(
      { error: "Не удалось загрузить работы. Попробуйте позже." },
      { status: 500 }
    );
  }
}
