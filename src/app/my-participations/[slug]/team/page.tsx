import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Calendar, ExternalLink, FileCode2, Lock } from "lucide-react";
import { TeamPanel } from "@/components/team-panel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getHackathonWorkContext } from "@/db/queries";
import {
  HACKATHON_STATUS_CONFIG,
  formatHackathonDateRange,
} from "@/lib/hackathon-formatters";
import { getMyTeam } from "@/lib/hackathon-teams";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Ваша команда — Платформа хакатонов",
  description: "Создайте команду или присоединитесь к команде хакатона.",
};

function TeamPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="h-10 w-56 animate-pulse rounded-lg bg-muted/50" />
      <div className="h-72 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}

interface HackathonTeamContentProps {
  params: Promise<{ slug: string }>;
}

async function HackathonTeamContent({ params }: HackathonTeamContentProps) {
  await connection();

  const { slug } = await params;
  const session = await getSession();

  if (!session) {
    redirect(
      `/sign-in?redirect=${encodeURIComponent(
        `/my-participations/${slug}/team`
      )}`
    );
  }

  let context: Awaited<ReturnType<typeof getHackathonWorkContext>> | null =
    null;
  let initialTeam: Awaited<ReturnType<typeof getMyTeam>> = null;
  let hasError = false;

  try {
    context = await getHackathonWorkContext(slug, session.user.id);
    if (context.kind === "ok") {
      initialTeam = await getMyTeam(slug, session.user.id);
    }
  } catch {
    hasError = true;
  }

  if (hasError || !context) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">
            Не удалось загрузить команду
          </h1>
          <p className="text-base text-muted-foreground">
            Попробуйте обновить страницу позже.
          </p>
          <div>
            <Link
              href={`/my-participations/${encodeURIComponent(slug)}/team`}
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

  if (context.kind === "not-found") {
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
              href="/my-participations"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11 px-5 text-base",
              })}
            >
              Мои участия
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (context.kind === "not-participant") {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">
            Сначала присоединитесь к хакатону
          </h1>
          <p className="text-base text-muted-foreground">
            Команды доступны только участникам хакатона.
          </p>
          <div>
            <Link
              href={`/hackathons/${context.hackathon.id}`}
              className={buttonVariants({
                className: "min-h-11 px-5 text-base",
              })}
            >
              Открыть хакатон
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { hackathon } = context;
  const statusConfig = HACKATHON_STATUS_CONFIG[hackathon.status];
  const hackathonUrl = `/hackathons/${hackathon.id}`;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/my-participations"
          className={buttonVariants({
            variant: "ghost",
            className: "min-h-11 px-3 text-base",
          })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Назад в мои участия
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/my-participations/${hackathon.id}/work`}
            className={buttonVariants({
              variant: "outline",
              className: "min-h-11 px-4 text-base",
            })}
          >
            <FileCode2 className="size-4" aria-hidden="true" />
            {initialTeam ? "Работа команды" : "Ваша работа"}
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
          Ваша команда
        </h1>

        <p className="text-base text-muted-foreground">
          <Link
            href={hackathonUrl}
            className="rounded-sm font-medium text-foreground hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {hackathon.title}
          </Link>
        </p>
      </div>

      {hackathon.status === "finished" && initialTeam !== null ? (
        <Alert className="border-border bg-muted/50 text-foreground">
          <Lock className="size-4" aria-hidden="true" />
          <AlertDescription className="text-sm sm:text-base">
            Хакатон завершён. Команду можно смотреть, но изменять нельзя.
          </AlertDescription>
        </Alert>
      ) : null}

      <TeamPanel
        slug={hackathon.id}
        hackathonTitle={hackathon.title}
        hackathonStatus={hackathon.status}
        initialTeam={initialTeam}
      />
    </div>
  );
}

export default function HackathonTeamPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<TeamPageSkeleton />}>
      <HackathonTeamContent params={props.params} />
    </Suspense>
  );
}
