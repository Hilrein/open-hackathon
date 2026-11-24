import { Calendar, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { SubmissionReviewDTO } from "@/lib/hackathon-reviews";
import type { HackathonStatus } from "@/types/hackathon";

interface SubmissionReviewViewProps {
  review: SubmissionReviewDTO | null;
  hackathonStatus: HackathonStatus;
  hasSubmission: boolean;
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

export function SubmissionReviewView({
  review,
  hackathonStatus,
  hasSubmission,
}: SubmissionReviewViewProps) {
  if (!hasSubmission) {
    return null;
  }

  if (review) {
    const reviewedLabel = formatRussianDate(review.updatedAt || review.createdAt);

    return (
      <Card>
        <CardHeader className="gap-3 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-foreground">
              Оценка организатора
            </h2>
            <Badge
              variant="secondary"
              className="gap-1.5 px-3 py-1 text-base font-semibold tabular-nums"
            >
              <Star className="size-4 fill-current" aria-hidden="true" />
              {review.score} из 10
            </Badge>
          </div>
          {reviewedLabel ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="size-4 shrink-0" aria-hidden="true" />
              Оценено {reviewedLabel}
            </p>
          ) : null}
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          {review.feedback ? (
            <p className="whitespace-pre-line break-words text-base leading-relaxed text-foreground">
              {review.feedback}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Комментарий не оставлен.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (hackathonStatus === "finished") {
    return (
      <Card>
        <CardContent className="space-y-1.5 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Работа ожидает оценки
          </h2>
          <p className="text-base text-muted-foreground">
            Организатор ещё не оценил вашу работу.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-1.5 p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          Оценка появится позже
        </h2>
        <p className="text-base text-muted-foreground">
          Организатор оценит работу после завершения хакатона.
        </p>
      </CardContent>
    </Card>
  );
}
