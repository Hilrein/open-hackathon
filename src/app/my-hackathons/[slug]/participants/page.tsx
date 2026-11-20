import { Fragment, Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, ExternalLink, Mail, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getHackathonParticipantsForOrganizer } from "@/db/queries";
import { formatParticipantsCount } from "@/lib/hackathon-formatters";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Участники хакатона — Платформа хакатонов",
  description: "Список участников вашего хакатона.",
};

function formatJoinedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function ParticipantsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted/50" />
      <div className="h-48 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}

interface HackathonParticipantsContentProps {
  params: Promise<{ slug: string }>;
}

async function HackathonParticipantsContent({
  params,
}: HackathonParticipantsContentProps) {
  await connection();

  const { slug } = await params;
  const session = await getSession();

  if (!session) {
    redirect(
      `/sign-in?redirect=${encodeURIComponent(
        `/my-hackathons/${slug}/participants`
      )}`
    );
  }

  let result: Awaited<
    ReturnType<typeof getHackathonParticipantsForOrganizer>
  > | null = null;
  let hasError = false;

  try {
    result = await getHackathonParticipantsForOrganizer(slug, session.user.id);
  } catch {
    hasError = true;
  }

  if (hasError || !result) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">
            Не удалось загрузить участников
          </h1>
          <p className="text-base text-muted-foreground">
            Попробуйте обновить страницу позже.
          </p>
          <div>
            <Link
              href={`/my-hackathons/${encodeURIComponent(slug)}/participants`}
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

  if (result.kind === "not-found") {
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

  if (result.kind === "forbidden") {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">
            Нельзя посмотреть участников
          </h1>
          <p className="text-base text-muted-foreground">
            Вы можете смотреть участников только своих хакатонов.
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

  const { hackathon, participants } = result;
  const hackathonUrl = `/hackathons/${hackathon.id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/my-hackathons"
          className={buttonVariants({
            variant: "ghost",
            className: "min-h-11 px-3 text-base",
          })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Назад в мои хакатоны
        </Link>
        <Link
          href={hackathonUrl}
          className={buttonVariants({
            variant: "outline",
            className: "min-h-11 px-4 text-base",
          })}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Открыть хакатон
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Участники хакатона
          </h1>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
            <Users className="size-3.5" aria-hidden="true" />
            {formatParticipantsCount(participants.length)}
          </Badge>
        </div>
        <p className="text-base text-muted-foreground">
          <Link
            href={hackathonUrl}
            className="rounded-sm font-medium text-foreground hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {hackathon.title}
          </Link>
        </p>
      </div>

      {participants.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 p-6 text-center sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">
              Пока никто не присоединился
            </h2>
            <p className="mx-auto max-w-md text-base text-muted-foreground">
              Поделитесь ссылкой на хакатон, чтобы участники могли
              присоединиться.
            </p>
            <div>
              <Link
                href={hackathonUrl}
                className={buttonVariants({
                  className: "min-h-11 px-5 text-base",
                })}
              >
                Открыть страницу хакатона
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {participants.map((participant, index) => {
                const joinedLabel = formatJoinedDate(participant.joinedAt);
                const showEmail = participant.name !== participant.email;

                return (
                  <Fragment key={participant.userId}>
                    {index > 0 ? <Separator className="sr-only" /> : null}
                    <li className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-base font-semibold text-foreground">
                          {participant.name}
                        </p>
                        {showEmail ? (
                          <p className="inline-flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                            <Mail
                              className="size-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">{participant.email}</span>
                          </p>
                        ) : null}
                      </div>

                      {joinedLabel ? (
                        <p className="shrink-0 text-sm text-muted-foreground">
                          Присоединился {joinedLabel}
                        </p>
                      ) : null}
                    </li>
                  </Fragment>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function HackathonParticipantsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <Suspense fallback={<ParticipantsSkeleton />}>
        <HackathonParticipantsContent params={props.params} />
      </Suspense>
    </div>
  );
}
