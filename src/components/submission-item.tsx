import { Calendar, ExternalLink, Mail, User, UsersRound } from "lucide-react";
import { SubmissionReviewForm } from "@/components/submission-review-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { OrganizerSubmissionDTO } from "@/lib/hackathon-submissions";
import type { HackathonStatus } from "@/types/hackathon";

interface SubmissionItemProps {
  slug: string;
  hackathonStatus: HackathonStatus;
  submission: OrganizerSubmissionDTO;
}

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

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function SubmissionItem({
  slug,
  hackathonStatus,
  submission,
}: SubmissionItemProps) {
  const createdLabel = formatRussianDate(submission.createdAt);
  const updatedLabel = formatRussianDate(submission.updatedAt);
  const createdMs = Date.parse(submission.createdAt);
  const updatedMs = Date.parse(submission.updatedAt);
  const hasDistinctUpdate =
    !Number.isNaN(createdMs) &&
    !Number.isNaN(updatedMs) &&
    Math.abs(updatedMs - createdMs) > 60_000;

  const showEmail = submission.authorEmail !== submission.authorName;
  const repoHost = submission.repoUrl ? getHostname(submission.repoUrl) : "";
  const demoHost = submission.demoUrl ? getHostname(submission.demoUrl) : "";

  return (
    <article>
      <Card>
        <CardHeader className="gap-3 pb-4">
          {submission.isTeamSubmission ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="gap-1.5 px-2.5 py-0.5 text-xs"
              >
                <UsersRound className="size-3.5" aria-hidden="true" />
                Команда
              </Badge>
              {submission.teamName ? (
                <span className="min-w-0 break-words text-sm font-semibold text-foreground">
                  {submission.teamName}
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground">
                Работа команды. Сдал капитан.
              </span>
            </div>
          ) : null}

          <h2 className="break-words text-xl font-bold leading-snug text-foreground">
            {submission.title}
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-foreground">
              <User
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 break-words">
                {submission.authorName}
              </span>
            </span>

            {showEmail ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-all">
                  {submission.authorEmail}
                </span>
              </span>
            ) : null}

            {createdLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4 shrink-0" aria-hidden="true" />
                Сдано {createdLabel}
              </span>
            ) : null}

            {hasDistinctUpdate && updatedLabel ? (
              <span>Обновлено {updatedLabel}</span>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="whitespace-pre-line break-words text-base leading-relaxed text-foreground">
            {submission.description}
          </p>

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {submission.repoUrl ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <a
                  href={submission.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: "outline",
                    className: "min-h-11 px-4 text-base",
                  })}
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Открыть репозиторий
                  <span className="sr-only"> (откроется в новой вкладке)</span>
                </a>
                {repoHost ? (
                  <span className="min-w-0 break-all text-xs text-muted-foreground">
                    {repoHost}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                Репозиторий не указан
              </span>
            )}

            {submission.demoUrl ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <a
                  href={submission.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: "outline",
                    className: "min-h-11 px-4 text-base",
                  })}
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Открыть демо
                  <span className="sr-only"> (откроется в новой вкладке)</span>
                </a>
                {demoHost ? (
                  <span className="min-w-0 break-all text-xs text-muted-foreground">
                    {demoHost}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                Демо не указано
              </span>
            )}
          </div>

          <Separator />

          <SubmissionReviewForm
            slug={slug}
            submissionId={submission.id}
            hackathonStatus={hackathonStatus}
            initialReview={submission.review}
          />
        </CardContent>
      </Card>
    </article>
  );
}
