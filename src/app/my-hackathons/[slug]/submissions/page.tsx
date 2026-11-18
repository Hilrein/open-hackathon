import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Calendar, ExternalLink, FileCode2, Users } from "lucide-react";
import { SubmissionItem } from "@/components/submission-item";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getHackathonWithOwnerBySlug } from "@/db/queries";
import {
  HACKATHON_STATUS_CONFIG,
  formatHackathonDateRange,
  formatParticipantsCount,
} from "@/lib/hackathon-formatters";
import {
  SubmissionForbiddenError,
  SubmissionNotFoundError,
  getSubmissionsForOrganizer,
  type OrganizerSubmissionDTO,
} from "@/lib/hackathon-submissions";
import { getSession } from "@/lib/session";
import type { Hackathon } from "@/types/hackathon";

export const metadata: Metadata = {
  title: "Работы хакатона — Платформа хакатонов",
  description: "Сданные работы участников вашего хакатона.",
};

function getSubmissionsWord(count: number): string {
  const abs = Math.abs(count) % 100;
  const lastDigit = abs % 10;

  if (abs > 10 && abs < 20) {
    return "работ";
  }
  if (lastDigit === 1) {
    return "работа";
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return "работы";
  }
  return "работ";
}

function SubmissionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted/50" />
      <div className="h-48 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}

interface HackathonSubmissionsContentProps {
  params: Promise<{ slug: string }>;
}

async function HackathonSubmissionsContent({
  params,
}: HackathonSubmissionsContentProps) {
  await connection();

  const { slug } = await params;
  const session = await getSession();

  if (!session) {
    redirect(
      `/sign-in?redirect=${encodeURIComponent(
        `/my-hackathons/${slug}/submissions`
      )}`
    );
  }

  let hackathon: Hackathon | null = null;
  let submissions: OrganizerSubmissionDTO[] = [];
  let state: "ok" | "not-found" | "forbidden" | "error" = "ok";

  try {
    const record = await getHackathonWithOwnerBySlug(slug);
    if (!record) {
      state = "not-found";
    } else if (record.organizerId !== session.user.id) {
      state = "forbidden";
    } else {
      hackathon = record.hackathon;
      submissions = await getSubmissionsForOrganizer(slug, session.user.id);
    }
  } catch (error: unknown) {
    if (error instanceof SubmissionNotFoundError) {
      state = "not-found";
    } else if (error instanceof SubmissionForbiddenError) {
      state = "forbidden";
    } else {
      state = "error";
    }
  }

  if (state === "not-found") {
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

  if (state === "forbidden") {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">
            Нельзя посмотреть работы
          </h1>
          <p className="text-base text-muted-foreground">
            Вы можете смотреть работы только своих хакатонов.
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

  if (state === "error" || !hackathon) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">
            Не удалось загрузить работы
          </h1>
          <p className="text-base text-muted-foreground">
            Попробуйте обновить страницу позже.
          </p>
          <div>
            <Link
              href={`/my-hackathons/${encodeURIComponent(slug)}/submissions`}
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

  const statusConfig = HACKATHON_STATUS_CONFIG[hackathon.status];
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

        <div className="flex flex-wrap items-center gap-2.5">
          {hackathon.status === "finished" ? (
            <Link
              href={`/hackathons/${hackathon.id}/results`}
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11 px-4 text-base",
              })}
            >
              Публичные результаты
            </Link>
          ) : null}
          <Link
            href={`/my-hackathons/${hackathon.id}/participants`}
            className={buttonVariants({
              variant: "outline",
              className: "min-h-11 px-4 text-base",
            })}
          >
            <Users className="size-4" aria-hidden="true" />
            Участники
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
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.detailLabel}
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-4 shrink-0" aria-hidden="true" />
            {formatHackathonDateRange(hackathon.startDate, hackathon.endDate)}
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Работы хакатона
        </h1>

        <p className="text-base text-muted-foreground">
          <Link
            href={hackathonUrl}
            className="font-medium text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {hackathon.title}
          </Link>
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
            <FileCode2 className="size-3.5" aria-hidden="true" />
            Сдано: {submissions.length} {getSubmissionsWord(submissions.length)}
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-sm">
            <Users className="size-3.5" aria-hidden="true" />
            {formatParticipantsCount(hackathon.participantsCount)}
          </Badge>
        </div>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 p-6 text-center sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">
              Пока никто не сдал работу
            </h2>
            <p className="mx-auto max-w-md text-base text-muted-foreground">
              Участники смогут сдать работу, пока хакатон идёт.
            </p>
            {hackathon.status === "upcoming" ? (
              <p className="text-sm text-muted-foreground">
                Хакатон ещё не начался.
              </p>
            ) : hackathon.status === "finished" ? (
              <p className="text-sm text-muted-foreground">
                Хакатон завершён, работы больше не принимаются.
              </p>
            ) : null}
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
        <div className="space-y-4">
          {submissions.map((submission) => (
            <SubmissionItem
              key={submission.id}
              slug={hackathon.id}
              hackathonStatus={hackathon.status}
              submission={submission}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HackathonSubmissionsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <Suspense fallback={<SubmissionsSkeleton />}>
        <HackathonSubmissionsContent params={props.params} />
      </Suspense>
    </div>
  );
}
