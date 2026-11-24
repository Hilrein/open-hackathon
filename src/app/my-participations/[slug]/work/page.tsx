import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Calendar, ExternalLink, UsersRound } from "lucide-react";
import { RetryButton } from "@/components/retry-button";
import { SubmissionForm } from "@/components/submission-form";
import { SubmissionReviewView } from "@/components/submission-review-view";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getHackathonWorkContext } from "@/db/queries";
import {
  HACKATHON_STATUS_CONFIG,
  formatHackathonDateRange,
} from "@/lib/hackathon-formatters";
import { getOwnSubmission } from "@/lib/hackathon-submissions";
import { getMyTeam } from "@/lib/hackathon-teams";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Ваша работа — Платформа хакатонов",
  description: "Сдайте и обновите свою работу для хакатона.",
};

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

function WorkPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="h-10 w-56 animate-pulse rounded-lg bg-muted/50" />
      <div className="h-96 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}

interface HackathonWorkContentProps {
  params: Promise<{ slug: string }>;
}

async function HackathonWorkContent({ params }: HackathonWorkContentProps) {
  await connection();

  const { slug } = await params;
  const session = await getSession();

  if (!session) {
    redirect(
      `/sign-in?redirect=${encodeURIComponent(
        `/my-participations/${slug}/work`
      )}`
    );
  }

  let context: Awaited<ReturnType<typeof getHackathonWorkContext>> | null =
    null;
  let ownSubmission: Awaited<ReturnType<typeof getOwnSubmission>> = null;
  let myTeam: Awaited<ReturnType<typeof getMyTeam>> = null;
  let hasError = false;

  try {
    context = await getHackathonWorkContext(slug, session.user.id);
    if (context.kind === "ok") {
      [ownSubmission, myTeam] = await Promise.all([
        getOwnSubmission(slug, session.user.id),
        getMyTeam(slug, session.user.id),
      ]);
    }
  } catch {
    hasError = true;
  }

  if (hasError || !context) {
    return (
      <Card role="alert" className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">
            Не удалось загрузить работу
          </h1>
          <p className="text-base text-muted-foreground">
            Попробуйте обновить страницу позже.
          </p>
          <div>
            <RetryButton variant="outline" />
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
            Сдавать работу могут только участники.
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
  const updatedLabel = ownSubmission
    ? formatRussianDate(ownSubmission.updatedAt)
    : "";

  const isInTeam = Boolean(myTeam);
  const viewerIsCaptain = myTeam?.viewerIsCaptain ?? false;
  const teamName = myTeam?.name ?? null;
  const captainName = myTeam?.captainName ?? null;
  const canEdit = ownSubmission
    ? ownSubmission.canEdit
    : hackathon.status === "active" && (!isInTeam || viewerIsCaptain);

  const waitingForCaptainSubmission =
    !ownSubmission && isInTeam && !viewerIsCaptain;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
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
            href={`/my-participations/${hackathon.id}/team`}
            className={buttonVariants({
              variant: "outline",
              className: "min-h-11 px-4 text-base",
            })}
          >
            <UsersRound className="size-4" aria-hidden="true" />
            Команда
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
          {isInTeam ? "Работа команды" : "Ваша работа"}
        </h1>

        <p className="text-base text-muted-foreground">
          <Link
            href={hackathonUrl}
            className="rounded-sm font-medium text-foreground hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {hackathon.title}
          </Link>
        </p>

        {isInTeam && teamName ? (
          <p className="text-sm font-medium text-foreground">
            {viewerIsCaptain
              ? `Команда «${teamName}». Вы капитан, вы сдаёте работу.`
              : ownSubmission
                ? `Команда «${teamName}».`
                : `Команда «${teamName}». Работу сдаёт капитан ${captainName ?? ""}.`}
          </p>
        ) : null}

        {!waitingForCaptainSubmission ? (
          <p className="text-sm font-medium text-muted-foreground">
            {ownSubmission
              ? `Работа сдана.${updatedLabel ? ` Обновлено ${updatedLabel}.` : ""}`
              : hackathon.status === "finished"
                ? "Работа не была сдана."
                : "Работа пока не сдана."}
          </p>
        ) : null}
      </div>

      {waitingForCaptainSubmission ? (
        <Card>
          <CardContent className="space-y-2 p-6 text-center sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">
              {hackathon.status === "finished"
                ? "Работа команды не была сдана."
                : "Капитан ещё не сдал работу команды."}
            </h2>
            <p className="mx-auto max-w-md text-base text-muted-foreground">
              {hackathon.status === "finished"
                ? "Хакатон завершён. Приём работ закрыт."
                : "Когда капитан сдаст работу, вы увидите её здесь."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <SubmissionForm
          slug={hackathon.id}
          hackathonTitle={hackathon.title}
          status={hackathon.status}
          initialSubmission={ownSubmission}
          isInTeam={isInTeam}
          viewerIsCaptain={viewerIsCaptain}
          teamName={teamName}
          captainName={captainName}
          canEdit={canEdit}
        />
      )}

      <SubmissionReviewView
        review={ownSubmission?.review ?? null}
        hackathonStatus={hackathon.status}
        hasSubmission={Boolean(ownSubmission)}
      />
    </div>
  );
}

export default function HackathonWorkPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<WorkPageSkeleton />}>
      <HackathonWorkContent params={props.params} />
    </Suspense>
  );
}
