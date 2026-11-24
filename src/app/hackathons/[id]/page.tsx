import { Suspense, cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  SearchX,
  Trophy,
  Users,
} from "lucide-react";
import { ParticipateButton } from "@/components/participate-button";
import { RetryButton } from "@/components/retry-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  getHackathonBySlug,
  getHackathonParticipationContext,
} from "@/db/queries";
import { getOwnSubmission } from "@/lib/hackathon-submissions";
import { getSession } from "@/lib/session";
import {
  HACKATHON_FORMAT_CONFIG,
  HACKATHON_STATUS_CONFIG,
  formatHackathonDateRange,
  formatParticipantsCount,
  getParticipantsWord,
} from "@/lib/hackathon-formatters";
import { cn } from "cn";

interface HackathonDetailPageProps {
  params: Promise<{ id: string }>;
}

const getCachedHackathonBySlug = cache(async (slug: string) => {
  return getHackathonBySlug(slug);
});

function isHackathonFinished(endDateIso: string): boolean {
  return Date.parse(endDateIso) <= Date.now();
}

export async function generateMetadata({
  params,
}: HackathonDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const hackathon = await getCachedHackathonBySlug(id);

    if (!hackathon) {
      return {
        title: "Хакатон не найден — Платформа хакатонов",
        description: "Этот хакатон не найден на платформе.",
      };
    }

    return {
      title: `${hackathon.title} — Платформа хакатонов`,
      description: hackathon.description.slice(0, 150),
    };
  } catch {
    return {
      title: "Хакатон — Платформа хакатонов",
      description: "Информация о хакатоне.",
    };
  }
}

function HackathonNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-6 py-16 text-center shadow-xs">
      <div
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <SearchX className="size-6" aria-hidden="true" />
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Хакатон не найден
        </h1>
        <p className="text-base text-muted-foreground">
          Возможно, он был удалён или вы перешли по неверной ссылке.
        </p>
      </div>
      <Link
        href="/hackathons"
        className={cn(
          buttonVariants({ variant: "default", size: "lg" }),
          "mt-2 min-h-11 px-6 text-base"
        )}
      >
        Вернуться к хакатонам
      </Link>
    </div>
  );
}

function HackathonLoadError() {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-6 py-16 text-center shadow-xs"
    >
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Не удалось загрузить хакатон
        </h1>
        <p className="text-base text-muted-foreground">
          Попробуйте обновить страницу позже.
        </p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <RetryButton variant="default" size="lg" className="px-6" />
        <Link
          href="/hackathons"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "min-h-11 px-6 text-base"
          )}
        >
          Вернуться к хакатонам
        </Link>
      </div>
    </div>
  );
}

function HackathonDetailSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Загружаем страницу хакатона...</span>

      <div className="flex items-center justify-between gap-3">
        <div className="h-11 w-44 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="h-7 w-24 animate-pulse rounded-full bg-muted/50 motion-reduce:animate-none" />
          <div className="h-7 w-24 animate-pulse rounded-full bg-muted/40 motion-reduce:animate-none" />
        </div>
        <div className="h-10 w-full max-w-2xl animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40 motion-reduce:animate-none" />
          <div className="flex flex-col gap-3">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
            <div className="h-5 w-full animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
            <div className="h-5 w-5/6 animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
            <div className="h-5 w-4/6 animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
          </div>
        </div>

        <aside className="order-first lg:order-none">
          <div className="h-56 animate-pulse rounded-xl border border-border bg-muted/40 motion-reduce:animate-none" />
        </aside>
      </div>
    </div>
  );
}

async function HackathonDetailContent({
  params,
}: HackathonDetailPageProps) {
  await connection();
  const { id } = await params;

  let hackathon;
  let session;
  let participationContext;
  let ownSubmission: Awaited<ReturnType<typeof getOwnSubmission>> = null;
  try {
    [hackathon, session] = await Promise.all([
      getCachedHackathonBySlug(id),
      getSession(),
    ]);

    if (hackathon) {
      participationContext = await getHackathonParticipationContext(
        id,
        session?.user.id ?? null
      );
      if (
        session &&
        participationContext?.isParticipating &&
        participationContext.organizerId !== session.user.id
      ) {
        ownSubmission = await getOwnSubmission(id, session.user.id);
      }
    }
  } catch (error: unknown) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка при загрузке хакатона из базы (${errorName}).`);
    return <HackathonLoadError />;
  }

  if (!hackathon) {
    return <HackathonNotFound />;
  }

  const isAuthenticated = Boolean(session);
  const isOrganizer = Boolean(
    session &&
      participationContext?.organizerId &&
      participationContext.organizerId === session.user.id
  );
  const isFinished = isHackathonFinished(hackathon.endDate);
  const isFull =
    hackathon.maxParticipants !== undefined &&
    hackathon.participantsCount >= hackathon.maxParticipants;
  const initialParticipating = participationContext?.isParticipating ?? false;

  const statusInfo = HACKATHON_STATUS_CONFIG[hackathon.status];
  const formatInfo = HACKATHON_FORMAT_CONFIG[hackathon.format];
  const paragraphs = hackathon.description
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const participantsText =
    hackathon.maxParticipants !== undefined
      ? `${hackathon.participantsCount} / ${hackathon.maxParticipants} ${getParticipantsWord(hackathon.maxParticipants)}`
      : formatParticipantsCount(hackathon.participantsCount);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/hackathons"
          className={cn(
            buttonVariants({ variant: "ghost", size: "lg" }),
            "min-h-11 px-3 text-base"
          )}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Назад к хакатонам
        </Link>

        {hackathon.status === "finished" ? (
          <Link
            href={`/hackathons/${hackathon.id}/results`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-11 px-4 text-base"
            )}
          >
            Результаты
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1 text-sm font-medium",
              statusInfo.className
            )}
          >
            {statusInfo.detailLabel}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1 text-sm font-medium",
              formatInfo.className
            )}
          >
            {formatInfo.label}
          </Badge>
        </div>

        <h1 className="break-words text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {hackathon.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-8">
          <Card className="p-2">
            <CardHeader>
              <h2 className="text-xl font-semibold leading-snug text-foreground">
                Основная информация
              </h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-base">
              <div className="flex items-center gap-3">
                <Calendar
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>
                  {formatHackathonDateRange(
                    hackathon.startDate,
                    hackathon.endDate
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <MapPin
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">{hackathon.location}</span>
              </div>

              <div className="flex items-center gap-3">
                <Building2
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">
                  Организатор: {hackathon.organizerName}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Users
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="tabular-nums">{participantsText}</span>
              </div>

              {hackathon.prizePool && (
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-accent/70 px-4 py-3 text-lg font-semibold text-accent-foreground">
                  <Trophy className="size-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 break-words">
                    Призовой фонд: {hackathon.prizePool}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <section className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-foreground">Описание</h2>
            <div className="prose-measure flex flex-col gap-3 text-base leading-relaxed text-foreground">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          {hackathon.tags.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                Темы и технологии
              </h2>
              <div className="flex flex-wrap gap-2">
                {hackathon.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-3 py-1 text-sm font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="order-first lg:order-none lg:sticky lg:top-24 lg:self-start">
          <Card className="p-2">
            <CardHeader>
              <h2 className="text-xl font-semibold leading-snug text-foreground">
                Участие
              </h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-base text-muted-foreground">
                {isFinished && initialParticipating
                  ? "Этот хакатон уже завершился. Ваше участие сохранено в истории."
                  : isFinished
                    ? "Этот хакатон уже завершился. Подача заявок закрыта."
                    : isOrganizer
                      ? "Вы организатор этого хакатона."
                      : initialParticipating
                        ? "Вы участвуете в этом хакатоне."
                        : isFull
                          ? "Все места на этом хакатоне уже заняты."
                          : "Подайте заявку, чтобы принять участие в хакатоне."}
              </p>

              {isOrganizer ? (
                <Link
                  href={`/my-hackathons/${hackathon.id}/participants`}
                  className={cn(
                    buttonVariants({ variant: "default", size: "default" }),
                    "min-h-11 w-full text-base"
                  )}
                >
                  Управлять хакатоном
                </Link>
              ) : null}

              {initialParticipating && !isOrganizer ? (
                <div className="flex flex-col gap-2.5 border-b pb-4">
                  {isFinished ? (
                    <p className="text-sm font-medium text-foreground">
                      {ownSubmission
                        ? "Работа была сдана."
                        : "Работа не была сдана."}
                    </p>
                  ) : ownSubmission ? (
                    <p className="text-sm font-medium text-foreground">
                      Работа сдана.
                    </p>
                  ) : hackathon.status === "active" ? (
                    <p className="text-sm text-muted-foreground">
                      Работа доступна на странице работы. В команде её сдаёт
                      капитан.
                    </p>
                  ) : hackathon.status === "upcoming" ? (
                    <p className="text-sm text-muted-foreground">
                      Работу можно будет сдать после старта хакатона.
                    </p>
                  ) : null}

                  <Link
                    href={`/my-participations/${hackathon.id}/work`}
                    className={cn(
                      buttonVariants({
                        variant:
                          !ownSubmission && hackathon.status === "active"
                            ? "default"
                            : "outline",
                        size: "default",
                      }),
                      "min-h-11 w-full text-base"
                    )}
                  >
                    Работа
                  </Link>

                  <Link
                    href={`/my-participations/${hackathon.id}/team`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "default" }),
                      "min-h-11 w-full text-base"
                    )}
                  >
                    Команда
                  </Link>

                  {isFinished ? (
                    <Link
                      href={`/hackathons/${hackathon.id}/results`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "default" }),
                        "min-h-11 w-full text-base"
                      )}
                    >
                      Результаты
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <ParticipateButton
                slug={hackathon.id}
                hackathonTitle={hackathon.title}
                isAuthenticated={isAuthenticated}
                isOrganizer={isOrganizer}
                isFinished={isFinished}
                isFull={isFull}
                initialParticipating={initialParticipating}
                initialParticipantsCount={hackathon.participantsCount}
                showParticipantsCount={false}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function HackathonDetailPage({
  params,
}: HackathonDetailPageProps) {
  return (
    <Suspense fallback={<HackathonDetailSkeleton />}>
      <HackathonDetailContent params={params} />
    </Suspense>
  );
}
