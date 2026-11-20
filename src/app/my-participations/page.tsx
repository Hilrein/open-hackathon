import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ParticipationItem } from "@/components/participation-item";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getParticipationsByUser,
  getUserSubmittedHackathonSlugs,
} from "@/db/queries";
import { getSession } from "@/lib/session";
import type { Hackathon } from "@/types/hackathon";

export const metadata: Metadata = {
  title: "Мои участия — Платформа хакатонов",
  description: "Хакатоны, в которых вы участвуете.",
};

function MyParticipationsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="h-36 animate-pulse rounded-xl border border-border bg-muted/40"
        />
      ))}
    </div>
  );
}

async function MyParticipationsContent() {
  await connection();

  const session = await getSession();
  if (!session) {
    redirect("/sign-in?redirect=/my-participations");
  }

  let participations: { hackathon: Hackathon; joinedAt: string }[] = [];
  let submittedSlugs: string[] = [];
  let hasError = false;

  try {
    [participations, submittedSlugs] = await Promise.all([
      getParticipationsByUser(session.user.id),
      getUserSubmittedHackathonSlugs(session.user.id),
    ]);
  } catch {
    hasError = true;
  }

  if (hasError) {
    return (
      <Card className="border-destructive/30 bg-destructive-bg/60">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-destructive">
            Не удалось загрузить ваши участия
          </h2>
          <p className="mx-auto max-w-md text-base text-foreground/85">
            Попробуйте обновить страницу позже.
          </p>
          <div>
            <Link
              href="/my-participations"
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

  if (participations.length === 0) {
    return (
      <Card className="border-border bg-muted/45">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Вы пока не участвуете в хакатонах
          </h2>
          <p className="mx-auto max-w-md text-base text-muted-foreground">
            Найдите интересный хакатон и присоединяйтесь.
          </p>
          <div>
            <Link
              href="/hackathons"
              className={buttonVariants({
                className: "min-h-11 px-5 text-base",
              })}
            >
              Смотреть хакатоны
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const submittedSet = new Set(submittedSlugs);

  return (
    <div className="space-y-4">
      {participations.map((item) => (
        <ParticipationItem
          key={item.hackathon.id}
          hackathon={item.hackathon}
          joinedAt={item.joinedAt}
          hasSubmission={submittedSet.has(item.hackathon.id)}
        />
      ))}
    </div>
  );
}

export default function MyParticipationsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8 space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Мои участия
        </h1>
        <p className="text-base text-muted-foreground">
          Хакатоны, в которых вы участвуете.
        </p>
      </div>

      <Suspense fallback={<MyParticipationsSkeleton />}>
        <MyParticipationsContent />
      </Suspense>
    </div>
  );
}
