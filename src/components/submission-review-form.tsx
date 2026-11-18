"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Info, Star, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SubmissionReviewDTO } from "@/lib/hackathon-reviews";
import { reviewSchema } from "@/lib/review-schema";
import type { HackathonStatus } from "@/types/hackathon";
import { cn } from "cn";

interface SubmissionReviewFormProps {
  slug: string;
  submissionId: string;
  hackathonStatus: HackathonStatus;
  initialReview: SubmissionReviewDTO | null;
}

type ReviewFieldName = "score" | "feedback";
type ReviewFieldErrors = Partial<Record<ReviewFieldName, string>>;

interface ReviewApiResponse {
  review?: SubmissionReviewDTO;
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function SubmissionReviewForm({
  slug,
  submissionId,
  hackathonStatus,
  initialReview,
}: SubmissionReviewFormProps) {
  const router = useRouter();
  const [review, setReview] = useState<SubmissionReviewDTO | null>(
    initialReview
  );
  const [scoreValue, setScoreValue] = useState<string>(
    initialReview ? String(initialReview.score) : ""
  );
  const [feedback, setFeedback] = useState<string>(
    initialReview?.feedback ?? ""
  );

  const [fieldErrors, setFieldErrors] = useState<ReviewFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const isFinished = hackathonStatus === "finished";
  const isBusy = isSaving || isRemoving;
  const redirectToSignInUrl = `/sign-in?redirect=${encodeURIComponent(
    `/my-hackathons/${slug}/submissions`
  )}`;
  const endpoint = `/api/hackathons/${encodeURIComponent(
    slug
  )}/submissions/${encodeURIComponent(submissionId)}/review`;

  const scoreErrorId = `review-score-error-${submissionId}`;
  const scoreHintId = `review-score-hint-${submissionId}`;
  const feedbackErrorId = `review-feedback-error-${submissionId}`;
  const feedbackHintId = `review-feedback-hint-${submissionId}`;
  const scoreSelectId = `review-score-${submissionId}`;
  const feedbackTextareaId = `review-feedback-${submissionId}`;

  function clearFieldError(field: ReviewFieldName) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFinished || isBusy) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const numericScore =
      scoreValue.trim().length > 0 ? Number(scoreValue) : Number.NaN;
    const trimmedFeedback = feedback.trim();

    const parsed = reviewSchema.safeParse({
      score: numericScore,
      feedback: trimmedFeedback.length > 0 ? trimmedFeedback : null,
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      const mapped: ReviewFieldErrors = {};
      if (flattened.score?.[0]) {
        mapped.score = flattened.score[0];
      }
      if (flattened.feedback?.[0]) {
        mapped.feedback = flattened.feedback[0];
      }
      setFieldErrors(mapped);
      setErrorMessage("Проверьте поля формы.");
      return;
    }

    setFieldErrors({});
    setIsSaving(true);

    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          score: parsed.data.score,
          feedback: parsed.data.feedback ?? null,
        }),
      });

      if (response.status === 401) {
        setErrorMessage("Сессия истекла. Войдите снова.");
        router.push(redirectToSignInUrl);
        return;
      }

      let data: ReviewApiResponse = {};
      try {
        data = (await response.json()) as ReviewApiResponse;
      } catch {
        data = {};
      }

      if (response.ok && data.review) {
        setReview(data.review);
        setScoreValue(String(data.review.score));
        setFeedback(data.review.feedback ?? "");
        setSuccessMessage("Оценка сохранена.");
        router.refresh();
        return;
      }

      const serverError =
        typeof data.error === "string" && data.error.trim().length > 0
          ? data.error
          : undefined;

      if (response.status === 403) {
        setErrorMessage(
          serverError || "Вы можете оценивать работы только своих хакатонов."
        );
        return;
      }

      if (response.status === 404) {
        setErrorMessage(serverError || "Работа не найдена.");
        router.refresh();
        return;
      }

      if (response.status === 400) {
        if (data.fieldErrors) {
          const mapped: ReviewFieldErrors = {};
          if (data.fieldErrors.score?.[0]) {
            mapped.score = data.fieldErrors.score[0];
          }
          if (data.fieldErrors.feedback?.[0]) {
            mapped.feedback = data.fieldErrors.feedback[0];
          }
          setFieldErrors(mapped);
          setErrorMessage("Проверьте поля формы.");
        } else {
          setErrorMessage(serverError || "Не удалось сохранить оценку.");
          router.refresh();
        }
        return;
      }

      setErrorMessage("Не удалось сохранить оценку. Попробуйте позже.");
    } catch {
      setErrorMessage(
        "Не удалось соединиться с сервером. Проверьте интернет и попробуйте ещё раз."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove() {
    if (!review || isBusy) {
      return;
    }

    setIsRemoving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (response.status === 401) {
        setIsRemoveDialogOpen(false);
        setErrorMessage("Сессия истекла. Войдите снова.");
        router.push(redirectToSignInUrl);
        return;
      }

      let data: ReviewApiResponse = {};
      try {
        data = (await response.json()) as ReviewApiResponse;
      } catch {
        data = {};
      }

      setIsRemoveDialogOpen(false);

      if (response.ok) {
        setReview(null);
        setScoreValue("");
        setFeedback("");
        setFieldErrors({});
        setSuccessMessage("Оценка снята.");
        router.refresh();
        return;
      }

      const serverError =
        typeof data.error === "string" && data.error.trim().length > 0
          ? data.error
          : undefined;

      if (response.status === 403) {
        setErrorMessage(
          serverError || "Вы можете оценивать работы только своих хакатонов."
        );
        return;
      }

      if (response.status === 404) {
        setErrorMessage(serverError || "Работа не найдена.");
        router.refresh();
        return;
      }

      if (response.status === 400) {
        setErrorMessage(serverError || "Не удалось сохранить оценку.");
        router.refresh();
        return;
      }

      setErrorMessage("Не удалось сохранить оценку. Попробуйте позже.");
    } catch {
      setIsRemoveDialogOpen(false);
      setErrorMessage(
        "Не удалось соединиться с сервером. Проверьте интернет и попробуйте ещё раз."
      );
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">
          Оценка организатора
        </h3>
        {review ? (
          <Badge variant="secondary" className="gap-1 px-2.5 py-0.5 text-sm">
            <Star className="size-3.5 fill-current" aria-hidden="true" />
            {review.score} из 10
          </Badge>
        ) : null}
      </div>

      {successMessage ? (
        <Alert
          role="status"
          className="border-primary/30 bg-primary/10 text-foreground"
        >
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          <AlertDescription className="text-sm font-medium">
            {successMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {!isFinished ? (
        <div className="space-y-3">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>Оценивание станет доступно после завершения хакатона.</span>
          </p>

          {review ? (
            <div className="space-y-3 rounded-lg border bg-background p-3.5">
              <p className="text-sm font-semibold text-foreground">
                Текущая оценка: {review.score} из 10
              </p>
              {review.feedback ? (
                <p className="whitespace-pre-line break-words text-sm text-foreground">
                  {review.feedback}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Комментарий не оставлен.
                </p>
              )}
              <div>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isBusy}
                  onClick={() => setIsRemoveDialogOpen(true)}
                  className="min-h-11 px-4 text-base"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  {isRemoving ? "Снимаем..." : "Снять оценку"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor={scoreSelectId} className="text-base">
              Оценка
            </Label>
            <select
              id={scoreSelectId}
              value={scoreValue}
              onChange={(event) => {
                setScoreValue(event.target.value);
                clearFieldError("score");
              }}
              aria-invalid={Boolean(fieldErrors.score)}
              aria-describedby={fieldErrors.score ? scoreErrorId : scoreHintId}
              className={cn(
                "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
              )}
            >
              <option value="">Выберите оценку</option>
              {SCORE_OPTIONS.map((option) => (
                <option key={option} value={String(option)}>
                  {option}
                </option>
              ))}
            </select>
            {fieldErrors.score ? (
              <p id={scoreErrorId} className="text-sm text-destructive">
                {fieldErrors.score}
              </p>
            ) : (
              <p id={scoreHintId} className="text-sm text-muted-foreground">
                От 1 до 10.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={feedbackTextareaId} className="text-base">
                Комментарий
              </Label>
              <span className="text-xs text-muted-foreground">
                {feedback.trim().length} / 2000
              </span>
            </div>
            <textarea
              id={feedbackTextareaId}
              rows={3}
              value={feedback}
              onChange={(event) => {
                setFeedback(event.target.value);
                clearFieldError("feedback");
              }}
              placeholder="Что получилось хорошо? Что можно улучшить?"
              aria-invalid={Boolean(fieldErrors.feedback)}
              aria-describedby={
                fieldErrors.feedback ? feedbackErrorId : feedbackHintId
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
            />
            {fieldErrors.feedback ? (
              <p id={feedbackErrorId} className="text-sm text-destructive">
                {fieldErrors.feedback}
              </p>
            ) : (
              <p id={feedbackHintId} className="text-sm text-muted-foreground">
                Необязательно. Участник увидит этот комментарий.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="submit"
              size="lg"
              disabled={isBusy}
              className="min-h-11 px-5 text-base"
            >
              {isSaving
                ? "Сохраняем..."
                : review
                  ? "Сохранить оценку"
                  : "Поставить оценку"}
            </Button>

            {review ? (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                disabled={isBusy}
                onClick={() => setIsRemoveDialogOpen(true)}
                className="min-h-11 px-5 text-base"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {isRemoving ? "Снимаем..." : "Снять оценку"}
              </Button>
            ) : null}
          </div>
        </form>
      )}

      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!isRemoving) {
            setIsRemoveDialogOpen(nextOpen);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Снять оценку?</AlertDialogTitle>
            <AlertDialogDescription>
              Оценка и комментарий будут удалены. Вы сможете поставить оценку
              заново.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={isRemoving}
              onClick={handleRemove}
            >
              {isRemoving ? "Снимаем..." : "Снять оценку"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
