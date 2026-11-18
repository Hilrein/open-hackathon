import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileCode2,
  Lock,
  Users,
  UsersRound,
} from "lucide-react";
import { OrganizerTeamItem } from "@/components/organizer-team-item";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  TeamForbiddenError,
  TeamNotFoundError,
  listTeams,
  type TeamDTO,
} from "@/lib/hackathon-teams";
import { getSession } from "@/lib/session";
import type { Hackathon } from "@/types/hackathon";

export const metadata: Metadata = {
  title: "Команды хакатона — Платформа хакатонов",
  description: "Команды и состав участников вашего хакатона.",
};

function getTeamsWord(count: number): string {
  const abs = Math.abs(count) % 100;
  const lastDigit = abs % 10;

  if (abs > 10 && abs < 20) {
    return "команд";
  }
  if (lastDigit === 1) {
    return "команда";
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return "команды";
  }
  return "команд";
}

function TeamsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted/50" />
      <div className="h-48 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}

interface OrganizerTeamsContentProps {
  params: Promise<{ slug: string }>;
}

async function OrganizerTeamsContent({ params }: OrganizerTeamsContentProps) {
  await connection();

  const { slug } = await params;
  const session = await getSession();

  if (!session) {
    redirect(
      `/sign-in?redirect=${encodeURIComponent(`/my-hackathons/${slug}/teams`)}`
    );
  }

  let hackathon: Hackathon | null = null;
  let teams: TeamDTO[] = [];
  let state: "ok" | "not-found" | "forbidden" | "error" = "ok";

  try {
    const record = await getHackathonWithOwnerBySlug(slug);
    if (!record) {
      state = "not-found";
    } else if (record.organizerId !== session.user.id) {
      state = "forbidden";
    } else {
      hackathon = record.hackathon;
      teams = await listTeams(slug, session.user.id);
    }
  } catch (error: unknown) {
    if (error instanceof TeamNotFoundError) {
      state = "not-found";
    } else if (error instanceof TeamForbiddenError) {
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
            Нельзя посмотреть команды
          </h1>
          <p className="text-base text-muted-foreground">
            Вы можете смотреть команды только своих хакатонов.
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
            Не удалось загрузить команды
          </h1>
          <p className="text-base text-muted-foreground">
            Попробуйте обновить страницу позже.
          </p>
          <div>
            <Link
              href={`/my-hackathons/${encodeURIComponent(slug)}/teams`}
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
  const isFinished = hackathon.status === "finished";
  const membersInTeamsCount = teams.reduce(
    (sum, team) => sum + team.memberCount,
    0
  );
  const hasSoloParticipants =
    !isFinished && membersInTeamsCount < hackathon.participantsCount;

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
            href={`/my-hackathons/${hackathon.id}/submissions`}
            className={buttonVariants({
              variant: "outline",
              className: "min-h-11 px-4 text-base",
            })}
          >
            <FileCode2 className="size-4" aria-hidden="true" />
            Работы
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
          Команды хакатона
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
            <UsersRound className="size-3.5" aria-hidden="true" />
            {teams.length} {getTeamsWord(teams.length)}
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-sm">
            В командах: {formatParticipantsCount(membersInTeamsCount)}
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-sm">
            Участников хакатона: {formatParticipantsCount(hackathon.participantsCount)}
          </Badge>
        </div>

        {hasSoloParticipants ? (
          <p className="text-sm text-muted-foreground">
            Часть участников пока без команды.
          </p>
        ) : null}
      </div>

      {isFinished ? (
        <Alert className="border-border bg-muted/50 text-foreground">
          <Lock className="size-4" aria-hidden="true" />
          <AlertDescription className="text-sm sm:text-base">
            Хакатон завершён. Состав команд зафиксирован.
          </AlertDescription>
        </Alert>
      ) : null}

      {teams.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 p-6 text-center sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">
              Команд пока нет
            </h2>
            <p className="mx-auto max-w-md text-base text-muted-foreground">
              {isFinished
                ? "В этом хакатоне команды не были созданы."
                : "Участники ещё не создали команды. Они могут создать команду или войти по коду."}
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
        <div className="space-y-4">
          {teams.map((team) => (
            <OrganizerTeamItem key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrganizerTeamsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <Suspense fallback={<TeamsSkeleton />}>
        <OrganizerTeamsContent params={props.params} />
      </Suspense>
    </div>
  );
}
