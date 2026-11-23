import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CreateHackathonWizard } from "@/components/create-hackathon-wizard";
import { OrganizerHackathonNav } from "@/components/organizer-hackathon-nav";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getHackathonWithOwnerBySlug } from "@/db/queries";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Редактировать хакатон — Платформа хакатонов",
  description: "Измените данные своего хакатона.",
};

function EditHackathonSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted/50" />
      <div className="h-96 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}

interface EditHackathonContentProps {
  params: Promise<{ slug: string }>;
}

async function EditHackathonContent({ params }: EditHackathonContentProps) {
  await connection();

  const { slug } = await params;
  const session = await getSession();

  if (!session) {
    redirect(
      `/sign-in?redirect=${encodeURIComponent(`/my-hackathons/${slug}/edit`)}`
    );
  }

  let record:
    | Awaited<ReturnType<typeof getHackathonWithOwnerBySlug>>
    | undefined;
  let hasError = false;

  try {
    record = await getHackathonWithOwnerBySlug(slug);
  } catch {
    hasError = true;
  }

  if (hasError) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">
            Не удалось загрузить хакатон
          </h1>
          <p className="text-base text-muted-foreground">
            Попробуйте обновить страницу позже.
          </p>
          <div>
            <Link
              href={`/my-hackathons/${encodeURIComponent(slug)}/edit`}
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11 px-5 text-base",
              })}
            >
              Обновить страницу
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!record) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">
            Хакатон не найден
          </h1>
          <p className="text-base text-muted-foreground">
            Возможно, он был удалён или вы перешли по неверной ссылке.
          </p>
          <div>
            <Link
              href="/my-hackathons"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11 px-5 text-base",
              })}
            >
              Вернуться в мои хакатоны
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (record.organizerId !== session.user.id) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">
            Нельзя редактировать этот хакатон
          </h1>
          <p className="text-base text-muted-foreground">
            Вы можете редактировать только свои хакатоны.
          </p>
          <div>
            <Link
              href="/my-hackathons"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11 px-5 text-base",
              })}
            >
              Вернуться в мои хакатоны
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultOrganizerName =
    session.user.name?.trim() || session.user.email || "";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <OrganizerHackathonNav
        hackathon={record.hackathon}
        activeSection="edit"
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Редактирование хакатона
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Измените данные и сохраните. Ссылка на хакатон останется прежней.
        </p>
      </div>

      <CreateHackathonWizard
        mode="edit"
        initialHackathon={record.hackathon}
        defaultOrganizerName={defaultOrganizerName}
      />
    </div>
  );
}

export default function EditHackathonPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<EditHackathonSkeleton />}>
      <EditHackathonContent params={props.params} />
    </Suspense>
  );
}
