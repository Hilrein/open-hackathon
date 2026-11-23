"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Info,
  Lock,
  Trash2,
} from "lucide-react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { SubmissionDTO } from "@/lib/hackathon-submissions";
import { submissionSchema } from "@/lib/submission-schema";
import type { HackathonStatus } from "@/types/hackathon";
import { cn } from "cn";

interface SubmissionFormProps {
  slug: string;
  hackathonTitle: string;
  status: HackathonStatus;
  initialSubmission: SubmissionDTO | null;
  isInTeam: boolean;
  viewerIsCaptain: boolean;
  teamName: string | null;
  captainName: string | null;
  canEdit: boolean;
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
    "Хакатон ещё не начался. Работу можно будет сдать после старта.",
  active: "Сдайте работу до окончания хакатона.",
  finished:
    "Хакатон завершён. Работу можно посмотреть, но изменить или отозвать нельзя.",
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

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function joinDescribedBy(
  ...ids: Array<string | false | null | undefined>
): string | undefined {
  const filtered = ids.filter(Boolean) as string[];
  return filtered.length > 0 ? filtered.join(" ") : undefined;
}

const SUBMISSION_FIELD_ORDER: SubmissionFieldName[] = [
  "title",
  "description",
  "repoUrl",
  "demoUrl",
];

function getFirstSubmissionErrorField(
  errors: SubmissionFieldErrors
): SubmissionFieldName | null {
  for (const field of SUBMISSION_FIELD_ORDER) {
    if (errors[field]) {
      return field;
    }
  }
  return null;
}

export function SubmissionForm({
  slug,
  hackathonTitle,
  status,
  initialSubmission,
  isInTeam,
  viewerIsCaptain,
  teamName,
  captainName,
  canEdit,
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

  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const repoUrlRef = useRef<HTMLInputElement>(null);
  const demoUrlRef = useRef<HTMLInputElement>(null);
  const focusNonceRef = useRef(0);
  const handledFocusNonceRef = useRef(0);
  const [pendingFocus, setPendingFocus] = useState<{
    field: SubmissionFieldName;
    nonce: number;
  } | null>(null);

  const isReadOnly = !canEdit;
  const isBusy = isSaving || isWithdrawing;

  function scheduleFieldFocus(field: SubmissionFieldName) {
    focusNonceRef.current += 1;
    setPendingFocus({ field, nonce: focusNonceRef.current });
  }

  useEffect(() => {
    if (isBusy || !pendingFocus) {
      return;
    }
    if (handledFocusNonceRef.current === pendingFocus.nonce) {
      return;
    }
    handledFocusNonceRef.current = pendingFocus.nonce;

    const fieldElementMap: Record<SubmissionFieldName, HTMLElement | null> = {
      title: titleRef.current,
      description: descriptionRef.current,
      repoUrl: repoUrlRef.current,
      demoUrl: demoUrlRef.current,
    };
    fieldElementMap[pendingFocus.field]?.focus({ preventScroll: true });
  }, [isBusy, pendingFocus]);
  const redirectToSignInUrl = `/sign-in?redirect=${encodeURIComponent(
    `/my-participations/${slug}/work`
  )}`;

  const alertMessage = canEdit
    ? isInTeam && teamName
      ? `Это работа команды «${teamName}». Она одна на всю команду.`
      : STATUS_HINT_MAP[status]
    : isInTeam && !viewerIsCaptain
      ? `Работу команды сдаёт капитан ${captainName ?? ""}. Вы можете смотреть работу.`
      : status === "upcoming"
        ? STATUS_HINT_MAP.upcoming
        : STATUS_HINT_MAP.finished;

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
    if (!canEdit || isBusy) {
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
      const firstErrorField = getFirstSubmissionErrorField(mapped);
      if (firstErrorField) {
        scheduleFieldFocus(firstErrorField);
      }
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
        setErrorMessage(serverError || "Работу команды сдаёт капитан.");
        router.refresh();
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
          const firstErrorField = getFirstSubmissionErrorField(mapped);
          if (firstErrorField) {
            scheduleFieldFocus(firstErrorField);
          }
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
    if (!canEdit || !submission || isBusy) {
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
        setErrorMessage(serverError || "Работу команды сдаёт капитан.");
        router.refresh();
        return;
      }

      if (response.status === 404) {
        setErrorMessage(serverError || "Хакатон или работа не найдены.");
        router.refresh();
        return;
      }

      if (response.status === 400) {
        setErrorMessage(
          serverError ||
            (isInTeam
              ? "Не удалось отозвать работу команды."
              : "Не удалось отозвать работу.")
        );
        return;
      }

      setErrorMessage(
        isInTeam
          ? "Не удалось отозвать работу команды. Попробуйте позже."
          : "Не удалось отозвать работу. Попробуйте позже."
      );
    } catch {
      setIsWithdrawDialogOpen(false);
      setErrorMessage(
        "Не удалось соединиться с сервером. Проверьте интернет и попробуйте ещё раз."
      );
    } finally {
      setIsWithdrawing(false);
    }
  }

  if (isReadOnly) {
    if (!submission) {
      const emptyReadOnlyTitle =
        isInTeam && !viewerIsCaptain
          ? status === "finished"
            ? "Работа команды не была сдана."
            : "Капитан ещё не сдал работу команды."
          : status === "upcoming"
            ? "Хакатон ещё не начался. Работу можно будет сдать после старта."
            : "Работа не была сдана.";

      const emptyReadOnlyDescription =
        isInTeam && !viewerIsCaptain
          ? status === "finished"
            ? `Хакатон завершён. Работу команды сдаёт капитан ${captainName ?? ""}.`
            : `Работу команды сдаёт капитан ${captainName ?? ""}. Когда капитан сдаст работу, вы увидите её здесь.`
          : status === "upcoming"
            ? "Когда хакатон начнётся, на этой странице откроется форма сдачи работы."
            : "Хакатон завершён. Приём работ закрыт.";

      return (
        <div className="mx-auto w-full max-w-2xl space-y-5">
          <Card>
            <CardContent className="space-y-2 p-6 text-center sm:p-8">
              <div className="mx-auto mb-2 inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Lock className="size-5" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {emptyReadOnlyTitle}
              </h2>
              <p className="mx-auto max-w-md text-base text-muted-foreground">
                {emptyReadOnlyDescription}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const updatedLabel = formatRussianDate(
      submission.updatedAt || submission.createdAt
    );
    const repoHost = submission.repoUrl ? getHostname(submission.repoUrl) : "";
    const demoHost = submission.demoUrl ? getHostname(submission.demoUrl) : "";

    return (
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <Alert className="border-border bg-muted/50 text-foreground">
          <Lock className="size-4" aria-hidden="true" />
          <AlertDescription className="text-sm sm:text-base">
            {alertMessage}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="gap-2 pb-4">
            <h2 className="break-words text-xl font-bold leading-snug text-foreground">
              {submission.title}
            </h2>
            {updatedLabel ? (
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="size-4 shrink-0" aria-hidden="true" />
                Обновлено {updatedLabel}
              </p>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-5">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertDescription className="text-sm sm:text-base">
          {alertMessage}
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
                <span
                  id="submission-title-count"
                  className={cn(
                    "text-xs",
                    title.trim().length > 120
                      ? "font-medium text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {title.trim().length} / 120
                </span>
              </div>
              <Input
                ref={titleRef}
                id="submission-title"
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  clearFieldError("title");
                }}
                disabled={isBusy}
                placeholder="Например: Помощник для планирования задач"
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={joinDescribedBy(
                  "submission-title-hint",
                  "submission-title-count",
                  fieldErrors.title && "submission-title-error"
                )}
                className="min-h-11 text-base"
              />
              <p
                id="submission-title-hint"
                className="text-sm text-muted-foreground"
              >
                От 5 до 120 символов.
              </p>
              {fieldErrors.title ? (
                <p
                  id="submission-title-error"
                  role="alert"
                  className="text-sm font-medium text-destructive"
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
                <span
                  id="submission-description-count"
                  className={cn(
                    "text-xs",
                    description.trim().length > 2000
                      ? "font-medium text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {description.trim().length} / 2000
                </span>
              </div>
              <textarea
                ref={descriptionRef}
                id="submission-description"
                rows={6}
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  clearFieldError("description");
                }}
                disabled={isBusy}
                placeholder="Что делает ваш проект? Как его запустить? Что уже готово?"
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={joinDescribedBy(
                  "submission-description-hint",
                  "submission-description-count",
                  fieldErrors.description && "submission-description-error"
                )}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
              />
              <p
                id="submission-description-hint"
                className="text-sm text-muted-foreground"
              >
                От 20 до 2000 символов.
              </p>
              {fieldErrors.description ? (
                <p
                  id="submission-description-error"
                  role="alert"
                  className="text-sm font-medium text-destructive"
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
                ref={repoUrlRef}
                id="submission-repo"
                type="url"
                value={repoUrl}
                onChange={(event) => {
                  setRepoUrl(event.target.value);
                  clearFieldError("repoUrl");
                }}
                disabled={isBusy}
                placeholder="https://github.com/..."
                aria-invalid={Boolean(fieldErrors.repoUrl)}
                aria-describedby={joinDescribedBy(
                  "submission-repo-hint",
                  fieldErrors.repoUrl && "submission-repo-error"
                )}
                className="min-h-11 text-base"
              />
              <p
                id="submission-repo-hint"
                className="text-sm text-muted-foreground"
              >
                Необязательно. GitHub, GitLab или другой репозиторий.
              </p>
              {fieldErrors.repoUrl ? (
                <p
                  id="submission-repo-error"
                  role="alert"
                  className="text-sm font-medium text-destructive"
                >
                  {fieldErrors.repoUrl}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="submission-demo" className="text-base">
                Ссылка на демо
              </Label>
              <Input
                ref={demoUrlRef}
                id="submission-demo"
                type="url"
                value={demoUrl}
                onChange={(event) => {
                  setDemoUrl(event.target.value);
                  clearFieldError("demoUrl");
                }}
                disabled={isBusy}
                placeholder="https://..."
                aria-invalid={Boolean(fieldErrors.demoUrl)}
                aria-describedby={joinDescribedBy(
                  "submission-demo-hint",
                  fieldErrors.demoUrl && "submission-demo-error"
                )}
                className="min-h-11 text-base"
              />
              <p
                id="submission-demo-hint"
                className="text-sm text-muted-foreground"
              >
                Необязательно. Видео, презентация или рабочий сайт.
              </p>
              {fieldErrors.demoUrl ? (
                <p
                  id="submission-demo-error"
                  role="alert"
                  className="text-sm font-medium text-destructive"
                >
                  {fieldErrors.demoUrl}
                </p>
              ) : null}
            </div>

            {canEdit ? (
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isBusy}
                  aria-busy={isSaving}
                  className="min-h-11 px-6 text-base"
                >
                  {isSaving
                    ? "Сохраняем..."
                    : submission
                      ? "Сохранить изменения"
                      : isInTeam
                        ? "Сдать работу команды"
                        : "Сдать работу"}
                </Button>

                {submission ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    disabled={isBusy}
                    aria-busy={isWithdrawing}
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
            <AlertDialogTitle>
              {isInTeam ? "Отозвать работу команды?" : "Отозвать работу?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isInTeam
                ? `Работа команды «${teamName ?? ""}» будет удалена. Все участники команды потеряют доступ к ней. Вы сможете сдать работу снова, пока хакатон идёт.`
                : `Работа «${submission?.title ?? hackathonTitle}» будет удалена. Вы сможете сдать её снова, пока хакатон идёт.`}
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
              {isWithdrawing
                ? "Отзываем..."
                : isInTeam
                  ? "Отозвать работу команды"
                  : "Отозвать работу"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
