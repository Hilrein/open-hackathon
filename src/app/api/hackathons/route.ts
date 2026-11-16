import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  HackathonCreateError,
  HackathonCreateValidationError,
  createHackathonForUser,
} from "@/lib/hackathon-create";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Войдите, чтобы создать хакатон." },
      { status: 401 }
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
    const result = await createHackathonForUser({
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      input: body,
    });

    revalidatePath("/");
    revalidatePath("/hackathons");

    return NextResponse.json({ slug: result.slug }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof HackathonCreateValidationError) {
      return NextResponse.json(
        {
          error: error.message,
          fieldErrors: error.fieldErrors,
        },
        { status: 400 }
      );
    }

    if (error instanceof HackathonCreateError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Непредвиденная ошибка POST /api/hackathons (${errorName}).`);
    return NextResponse.json(
      { error: "Не удалось создать хакатон. Попробуйте позже." },
      { status: 500 }
    );
  }
}
