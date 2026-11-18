"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Info, Lock, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubmissionDTO } from "@/lib/hackathon-submissions";
import { submissionSchema } from "@/lib/submission-schema";
import type { HackathonStatus } from "@/types/hackathon";
import { cn } from "cn";

interface SubmissionFormProps {
  slug: string;
  hackathonTitle: string;
  status: HackathonStatus;
  initialSubmission: SubmissionDTO | null;
}

type SubmissionFieldName = "title" | "description" | "repoUrl" | "demoUrl";
type SubmissionFieldErrors = Partial<Record<SubmissionFieldName, string>>;

interface SubmissionApiResponse {
  submission?: SubmissionDTO;
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const STATUS_HINT_MAP: Record<HackathonStatus, string> = {
  upcoming:
    "Хакатон ещё не начался. Сдать работу можно будет после старта.",
  active: "Сдайте работу до окончания хакатона.",
  finished:
    "Хакатон завершён. Работу можно посмотреть, но изменить или отозвать нельзя.",
};

export function SubmissionForm({
  slug,
  hackathonTitle,
  status,
  initialSubmission,
}: SubmissionFormProps) {
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionDTO | null>(
    initialSubmission
  );
  const [title, setTitle] = useState(initialSubmission?.title ?? "");
  const [description, setDescription] = useState(
    initialSubmission?.description ?? ""
  );
  const [repoUrl, setRepoUrl] = useState(initialSubmission?.repoUrl ?? "");
  const [demoUrl, setDemoUrl] = useState(initialSubmission?.demoUrl ?? "");

  const [fieldErrors, setFieldErrors] = useState<SubmissionFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);

  const isActive = status === "active";
  const isFinished = status === "finished";
  const isReadOnly = !isActive;
  const isBusy = isSaving || isWithdrawing;
  const redirectToSignInUrl = `/sign-in?redirect=${encodeURIComponent(
    `/my-participations/${slug}/work`
  )}`;

  function clearFieldError(field: SubmissionFieldName) {
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
    if (!isActive || isBusy) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      title,
      description,
      repoUrl: repoUrl.trim().length > 0 ? repoUrl.trim() : null,
      demoUrl: demoUrl.trim().length > 0 ? demoUrl.trim() : null,
    };

    const parsed = submissionSchema.safeParse(payload);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      const mapped: SubmissionFieldErrors = {};
      const keys: SubmissionFieldName[] = [
        "title",
        "description",
        "repoUrl",
        "demoUrl",
      ];
      for (const key of keys) {
        const msg = flattened[key]?.[0];
        if (msg) {
          mapped[key] = msg;
        }
      }
      setFieldErrors(mapped);
      setErrorMessage("Проверьте поля формы.");
      return;
    }

    setFieldErrors({});
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/hackathons/${encodeURIComponent(slug)}/submission`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            title: parsed.data.title,
            description: parsed.data.description,
            repoUrl: parsed.data.repoUrl ?? null,
            demoUrl: parsed.data.demoUrl ?? null,
          }),
        }
      );

      if (response.status === 401) {
        setErrorMessage("Сессия истекла. Войдите снова.");
        router.push(redirectToSignInUrl);
        return;
      }

      let data: SubmissionApiResponse = {};
      try {
        data = (await response.json()) as SubmissionApiResponse;
      } catch {
        data = {};
      }

      if (response.ok && data.submission) {
        setSubmission(data.submission);
        setTitle(data.submission.title);
        setDescription(data.submission.description);
        setRepoUrl(data.submission.repoUrl ?? "");
        setDemoUrl(data.submission.demoUrl ?? "");
        setSuccessMessage("Работа сохранена.");
        router.refresh();
        return;
      }

      const serverError =
        typeof data.error === "string" && data.error.trim().length > 0
          ? data.error
          : undefined;

      if (response.status === 403) {
        setErrorMessage(serverError || "Сначала присоединитесь к хакатону.");
        return;
      }

      if (response.status === 404) {
        setErrorMessage(serverError || "Хакатон или работа не найдены.");
        router.refresh();
        return;
      }

      if (response.status === 400) {
        if (data.fieldErrors) {
          const mapped: SubmissionFieldErrors = {};
          const keys: SubmissionFieldName[] = [
            "title",
            "description",
            "repoUrl",
            "demoUrl",
          ];
          for (const key of keys) {
            const msg = data.fieldErrors[key]?.[0];
            if (msg) {
              mapped[key] = msg;
            }
          }
          setFieldErrors(mapped);
          setErrorMessage("Проверьте поля формы.");
        } else {
          setErrorMessage(serverError || "Не удалось сохранить работу.");
        }
        return;
      }

      setErrorMessage("Не удалось сохранить работу. Попробуйте позже.");
    } catch {
      setErrorMessage(
        "Не удалось соединиться с сервером. Проверьте интернет и попробуйте ещё раз."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleWithdraw() {
    if (isFinished || !submission || isBusy) {
      return;
    }

    setIsWithdrawing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `/api/hackathons/${encodeURIComponent(slug)}/submission`,
        {
          method: "DELETE",
          credentials: "same-origin",
        }
      );

      if (response.status === 401) {
        setIsWithdrawDialogOpen(false);
        setErrorMessage("Сессия истекла. Войдите снова.");
        router.push(redirectToSignInUrl);
        return;
      }

      let data: SubmissionApiResponse = {};
      try {
        data = (await response.json()) as SubmissionApiResponse;
      } catch {
        data = {};
      }

      if (response.ok) {
        setSubmission(null);
        setTitle("");
        setDescription("");
        setRepoUrl("");
        setDemoUrl("");
        setFieldErrors({});
        setIsWithdrawDialogOpen(false);
        setSuccessMessage("Работа отозвана.");
        router.refresh();
        return;
      }

      const serverError =
        typeof data.error === "string" && data.error.trim().length > 0
          ? data.error
          : undefined;

      setIsWithdrawDialogOpen(false);

      if (response.status === 403) {
        setErrorMessage(serverError || "Сначала присоединитесь к хакатону.");
        return;
      }

      if (response.status === 404) {
        setErrorMessage(serverError || "Хакатон или работа не найдены.");
        router.refresh();
        return;
      }

      if (response.status === 400) {
        setErrorMessage(serverError || "Не удалось отозвать работу.");
        return;
      }

      setErrorMessage("Не удалось сохранить работу. Попробуйте позже.");
    } catch {
      setIsWithdrawDialogOpen(false);
      setErrorMessage(
        "Не удалось соединиться с сервером. Проверьте интернет и попробуйте ещё раз."
      );
    } finally {
      setIsWithdrawing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <Alert
        className={cn(
          isReadOnly && "border-border bg-muted/50 text-foreground"
        )}
      >
        {isReadOnly ? (
          <Lock className="size-4" aria-hidden="true" />
        ) : (
          <Info className="size-4" aria-hidden="true" />
        )}
        <AlertDescription className="text-sm sm:text-base">
          {STATUS_HINT_MAP[status]}
          {isReadOnly ? " Поля открыты только для чтения." : ""}
        </AlertDescription>
      </Alert>

      {successMessage ? (
        <Alert
          role="status"
          className="border-primary/30 bg-primary/10 text-foreground"
        >
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          <AlertDescription className="text-sm font-medium sm:text-base">
            {successMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription className="text-sm sm:text-base">
            {errorMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="submission-title" className="text-base">
                  Название работы
                </Label>
                <span className="text-xs text-muted-foreground">
                  {title.trim().length} / 120
                </span>
              </div>
              <Input
                id="submission-title"
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  clearFieldError("title");
                }}
                readOnly={isReadOnly}
                placeholder="Например: Помощник для планирования задач"
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={
                  fieldErrors.title ? "submission-title-error" : undefined
                }
                className={cn(
                  "min-h-11 text-base",
                  isReadOnly && "cursor-default bg-muted/40 text-muted-foreground"
                )}
              />
              {fieldErrors.title ? (
                <p
                  id="submission-title-error"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.title}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="submission-description" className="text-base">
                  Описание
                </Label>
                <span className="text-xs text-muted-foreground">
                  {description.trim().length} / 2000
                </span>
              </div>
              <textarea
                id="submission-description"
                rows={6}
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  clearFieldError("description");
                }}
                readOnly={isReadOnly}
                placeholder="Что делает ваш проект? Как его запустить? Что уже готово?"
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={
                  fieldErrors.description
                    ? "submission-description-error"
                    : undefined
                }
                className={cn(
                  "w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
                  isReadOnly && "cursor-default bg-muted/40 text-muted-foreground"
                )}
              />
              {fieldErrors.description ? (
                <p
                  id="submission-description-error"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.description}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="submission-repo" className="text-base">
                Ссылка на репозиторий
              </Label>
              <Input
                id="submission-repo"
                type="url"
                value={repoUrl}
                onChange={(event) => {
                  setRepoUrl(event.target.value);
                  clearFieldError("repoUrl");
                }}
                readOnly={isReadOnly}
                placeholder="https://github.com/..."
                aria-invalid={Boolean(fieldErrors.repoUrl)}
                aria-describedby={
                  fieldErrors.repoUrl
                    ? "submission-repo-error"
                    : "submission-repo-hint"
                }
                className={cn(
                  "min-h-11 text-base",
                  isReadOnly && "cursor-default bg-muted/40 text-muted-foreground"
                )}
              />
              {fieldErrors.repoUrl ? (
                <p
                  id="submission-repo-error"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.repoUrl}
                </p>
              ) : (
                <p
                  id="submission-repo-hint"
                  className="text-sm text-muted-foreground"
                >
                  Необязательно. GitHub, GitLab или другой репозиторий.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="submission-demo" className="text-base">
                Ссылка на демо
              </Label>
              <Input
                id="submission-demo"
                type="url"
                value={demoUrl}
                onChange={(event) => {
                  setDemoUrl(event.target.value);
                  clearFieldError("demoUrl");
                }}
                readOnly={isReadOnly}
                placeholder="https://..."
                aria-invalid={Boolean(fieldErrors.demoUrl)}
                aria-describedby={
                  fieldErrors.demoUrl
                    ? "submission-demo-error"
                    : "submission-demo-hint"
                }
                className={cn(
                  "min-h-11 text-base",
                  isReadOnly && "cursor-default bg-muted/40 text-muted-foreground"
                )}
              />
              {fieldErrors.demoUrl ? (
                <p
                  id="submission-demo-error"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.demoUrl}
                </p>
              ) : (
                <p
                  id="submission-demo-hint"
                  className="text-sm text-muted-foreground"
                >
                  Необязательно. Видео, презентация или рабочий сайт.
                </p>
              )}
            </div>

            {(isActive || (submission && !isFinished)) ? (
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                {isActive ? (
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isBusy}
                    className="min-h-11 px-6 text-base"
                  >
                    {isSaving
                      ? "Сохраняем..."
                      : submission
                        ? "Сохранить изменения"
                        : "Сдать работу"}
                  </Button>
                ) : (
                  <div />
                )}

                {submission && !isFinished ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    disabled={isBusy}
                    onClick={() => setIsWithdrawDialogOpen(true)}
                    className="min-h-11 px-5 text-base"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    {isWithdrawing ? "Отзываем..." : "Отозвать работу"}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <AlertDialog
        open={isWithdrawDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!isWithdrawing) {
            setIsWithdrawDialogOpen(nextOpen);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отозвать работу?</AlertDialogTitle>
            <AlertDialogDescription>
              Работа «{submission?.title ?? hackathonTitle}» будет удалена. Вы
              сможете сдать её снова, пока хакатон идёт.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWithdrawing}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={isWithdrawing}
              onClick={handleWithdraw}
            >
              {isWithdrawing ? "Отзываем..." : "Отозвать работу"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
