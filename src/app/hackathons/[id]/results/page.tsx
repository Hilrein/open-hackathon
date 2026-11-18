import { Suspense, cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, Calendar, Clock, Trophy } from "lucide-react";
import { HackathonResultItem } from "@/components/hackathon-result-item";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  HACKATHON_STATUS_CONFIG,
  formatHackathonDateRange,
} from "@/lib/hackathon-formatters";
import { getHackathonPublicResults } from "@/lib/hackathon-results";
import { cn } from "cn";

interface HackathonResultsPageProps {
  params: Promise<{ id: string }>;
}

const getCachedPublicResults = cache(async (slug: string) => {
  return getHackathonPublicResults(slug);
});

function formatRussianDate(iso: string): string {
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

function formatReviewedWorksCount(count: number): string {
  const abs = Math.abs(count) % 100;
  const lastDigit = abs % 10;

  if (abs > 10 && abs < 20) {
    return `Оценено ${count} работ`;
  }
  if (lastDigit === 1) {
    return `Оценена ${count} работа`;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `Оценено ${count} работы`;
  }
  return `Оценено ${count} работ`;
}

export async function generateMetadata({
  params,
}: HackathonResultsPageProps): Promise<Metadata> {
  const { id: slug } = await params;

  try {
    const data = await getCachedPublicResults(slug);
    if (data.kind === "not-found") {
      return {
        title: "Результаты не найдены — Платформа хакатонов",
        description: "Этот хакатон не найден на платформе.",
      };
    }

    return {
      title: `Результаты — ${data.hackathon.title} — Платформа хакатонов`,
      description: "Итоги и оценённые работы хакатона.",
    };
  } catch {
    return {
      title: "Результаты хакатона — Платформа хакатонов",
      description: "Итоги и оценённые работы хакатона.",
    };
  }
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted/50" />
      <div className="h-44 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}

async function HackathonResultsContent({ params }: HackathonResultsPageProps) {
  await connection();
  const { id: slug } = await params;

  let data: Awaited<ReturnType<typeof getHackathonPublicResults>> | null = null;
  let hasError = false;

  try {
    data = await getCachedPublicResults(slug);
  } catch {
    hasError = true;
  }

  if (hasError || !data) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">
            Не удалось загрузить результаты
          </h1>
          <p className="text-base text-muted-foreground">
            Попробуйте обновить страницу позже.
          </p>
          <div>
            <Link
              href={`/hackathons/${encodeURIComponent(slug)}/results`}
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

  if (data.kind === "not-found") {
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

  const { hackathon, results } = data;
  const hackathonUrl = `/hackathons/${hackathon.id}`;

  if (hackathon.status !== "finished") {
    const endDateLabel = formatRussianDate(hackathon.endDate);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={hackathonUrl}
            className={buttonVariants({
              variant: "ghost",
              className: "min-h-11 px-3 text-base",
            })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Назад к хакатону
          </Link>
          <Link
            href="/hackathons"
            className={buttonVariants({
              variant: "outline",
              className: "min-h-11 px-4 text-base",
            })}
          >
            Все хакатоны
          </Link>
        </div>

        <Card className="mx-auto w-full max-w-xl">
          <CardContent className="space-y-4 p-6 text-center sm:p-8">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Clock className="size-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Результаты появятся позже
            </h1>
            <p className="text-base text-muted-foreground">
              Результаты будут опубликованы после завершения хакатона.
            </p>
            <p className="text-base">
              <Link
                href={hackathonUrl}
                className="font-medium text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {hackathon.title}
              </Link>
            </p>
            {endDateLabel ? (
              <p className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="size-4 shrink-0" aria-hidden="true" />
                Окончание: {endDateLabel}
              </p>
            ) : null}
            <div>
              <Link
                href={hackathonUrl}
                className={buttonVariants({
                  className: "min-h-11 px-5 text-base",
                })}
              >
                Открыть хакатон
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const finishedStatus = HACKATHON_STATUS_CONFIG.finished;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={hackathonUrl}
          className={buttonVariants({
            variant: "ghost",
            className: "min-h-11 px-3 text-base",
          })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Назад к хакатону
        </Link>
        <Link
          href="/hackathons"
          className={buttonVariants({
            variant: "outline",
            className: "min-h-11 px-4 text-base",
          })}
        >
          Все хакатоны
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1 text-sm font-medium",
              finishedStatus.className
            )}
          >
            {finishedStatus.detailLabel}
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-4 shrink-0" aria-hidden="true" />
            {formatHackathonDateRange(hackathon.startDate, hackathon.endDate)}
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Результаты хакатона
        </h1>

        <p className="text-base text-muted-foreground">
          <Link
            href={hackathonUrl}
            className="font-medium text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {hackathon.title}
          </Link>
        </p>

        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
          <Trophy className="size-3.5" aria-hidden="true" />
          {formatReviewedWorksCount(results.length)}
        </Badge>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 p-6 text-center sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">
              Пока нет оценённых работ
            </h2>
            <p className="mx-auto max-w-md text-base text-muted-foreground">
              Организатор ещё не оценил работы участников.
            </p>
            <div>
              <Link
                href={hackathonUrl}
                className={buttonVariants({
                  className: "min-h-11 px-5 text-base",
                })}
              >
                Открыть хакатон
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map((item) => (
            <HackathonResultItem key={item.submissionId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HackathonResultsPage({
  params,
}: HackathonResultsPageProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <Suspense fallback={<ResultsSkeleton />}>
        <HackathonResultsContent params={params} />
      </Suspense>
    </div>
  );
}
