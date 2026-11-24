"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  FileCode2,
  LogOut,
  Trash2,
  Users,
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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatParticipantsCount } from "@/lib/hackathon-formatters";
import type { TeamDTO } from "@/lib/hackathon-teams";
import { createTeamSchema, joinTeamSchema } from "@/lib/team-schema";
import type { HackathonStatus } from "@/types/hackathon";

interface TeamPanelProps {
  slug: string;
  hackathonTitle: string;
  hackathonStatus: HackathonStatus;
  initialTeam: TeamDTO | null;
}

interface TeamApiResponse {
  team?: TeamDTO;
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
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

function joinDescribedBy(
  ...ids: Array<string | false | null | undefined>
): string | undefined {
  const filtered = ids.filter(Boolean) as string[];
  return filtered.length > 0 ? filtered.join(" ") : undefined;
}

export function TeamPanel({
  slug,
  hackathonStatus,
  initialTeam,
}: TeamPanelProps) {
  const router = useRouter();
  const [team, setTeam] = useState<TeamDTO | null>(initialTeam);
  const [error, setError] = useState<string | null>(null);
  const [showWorkLinkOnError, setShowWorkLinkOnError] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<
    "create" | "join" | "leave" | "disband" | null
  >(null);

  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createNameError, setCreateNameError] = useState<string | null>(null);
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null);

  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">(
    "idle"
  );
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isDisbandDialogOpen, setIsDisbandDialogOpen] = useState(false);

  const createNameRef = useRef<HTMLInputElement>(null);
  const joinCodeRef = useRef<HTMLInputElement>(null);
  const focusNonceRef = useRef(0);
  const handledFocusNonceRef = useRef(0);
  const [pendingFocus, setPendingFocus] = useState<{
    field: "createName" | "joinCode";
    nonce: number;
  } | null>(null);

  const isFinished = hackathonStatus === "finished";
  const isBusy = pending !== null;

  function scheduleFieldFocus(field: "createName" | "joinCode") {
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

    if (pendingFocus.field === "createName") {
      createNameRef.current?.focus({ preventScroll: true });
    } else {
      joinCodeRef.current?.focus({ preventScroll: true });
    }
  }, [isBusy, pendingFocus]);
  const redirectToSignInUrl = `/sign-in?redirect=${encodeURIComponent(
    `/my-participations/${slug}/team`
  )}`;

  async function handleCopyCode(code: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        setCopyState("copied");
        window.setTimeout(() => {
          setCopyState("idle");
        }, 2000);
        return;
      }
      setCopyState("manual");
    } catch {
      setCopyState("manual");
    }
  }

  async function handleCreateTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isFinished || isBusy) {
      return;
    }

    setError(null);
    setShowWorkLinkOnError(false);
    setSuccess(null);

    const parsed = createTeamSchema.safeParse({ name: teamName });
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors.name?.[0] ?? null;
      setCreateNameError(msg);
      setError("Проверьте поля формы.");
      scheduleFieldFocus("createName");
      return;
    }

    setCreateNameError(null);
    setPending("create");

    try {
      const response = await fetch(
        `/api/hackathons/${encodeURIComponent(slug)}/teams`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ name: parsed.data.name }),
        }
      );

      if (response.status === 401) {
        setError("Сессия истекла. Войдите снова.");
        router.push(redirectToSignInUrl);
        return;
      }

      let data: TeamApiResponse = {};
      try {
        data = (await response.json()) as TeamApiResponse;
      } catch {
        data = {};
      }

      if (response.ok && data.team) {
        setTeam(data.team);
        setTeamName("");
        setInviteCode("");
        setSuccess("Команда создана.");
        router.refresh();
        return;
      }

      const serverError =
        typeof data.error === "string" && data.error.trim().length > 0
          ? data.error
          : undefined;

      if (response.status === 403) {
        setError(serverError || "Команды доступны только участникам хакатона.");
        return;
      }

      if (response.status === 404) {
        setError(serverError || "Команда не найдена.");
        router.refresh();
        return;
      }

      if (response.status === 400) {
        if (data.fieldErrors?.name?.[0]) {
          setCreateNameError(data.fieldErrors.name[0]);
          setError("Проверьте поля формы.");
          scheduleFieldFocus("createName");
        } else {
          setError(serverError || "Не удалось создать команду.");
          router.refresh();
        }
        return;
      }

      if (response.status === 409) {
        setError(
          serverError || "Вы уже состоите в команде или название занято."
        );
        setShowWorkLinkOnError(true);
        router.refresh();
        return;
      }

      setError("Не удалось создать команду. Попробуйте позже.");
    } catch {
      setError(
        "Не удалось соединиться с сервером. Проверьте интернет и попробуйте ещё раз."
      );
    } finally {
      setPending(null);
    }
  }

  async function handleJoinTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isFinished || isBusy) {
      return;
    }

    setError(null);
    setShowWorkLinkOnError(false);
    setSuccess(null);

    const parsed = joinTeamSchema.safeParse({ inviteCode });
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors.inviteCode?.[0] ?? null;
      setJoinCodeError(msg);
      setError("Проверьте поля формы.");
      scheduleFieldFocus("joinCode");
      return;
    }

    setJoinCodeError(null);
    setPending("join");

    try {
      const response = await fetch(
        `/api/hackathons/${encodeURIComponent(slug)}/teams/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ inviteCode: parsed.data.inviteCode }),
        }
      );

      if (response.status === 401) {
        setError("Сессия истекла. Войдите снова.");
        router.push(redirectToSignInUrl);
        return;
      }

      let data: TeamApiResponse = {};
      try {
        data = (await response.json()) as TeamApiResponse;
      } catch {
        data = {};
      }

      if (response.ok && data.team) {
        setTeam(data.team);
        setTeamName("");
        setInviteCode("");
        setSuccess("Вы вошли в команду.");
        router.refresh();
        return;
      }

      const serverError =
        typeof data.error === "string" && data.error.trim().length > 0
          ? data.error
          : undefined;

      if (response.status === 403) {
        setError(serverError || "Команды доступны только участникам хакатона.");
        return;
      }

      if (response.status === 404) {
        setError(serverError || "Команда не найдена.");
        router.refresh();
        return;
      }

      if (response.status === 400) {
        if (data.fieldErrors?.inviteCode?.[0]) {
          setJoinCodeError(data.fieldErrors.inviteCode[0]);
          setError("Проверьте поля формы.");
          scheduleFieldFocus("joinCode");
        } else {
          setError(serverError || "Не удалось войти в команду.");
          router.refresh();
        }
        return;
      }

      if (response.status === 409) {
        setError(
          serverError ||
            "Не удалось войти в команду. Возможно, вы уже состоите в команде."
        );
        setShowWorkLinkOnError(true);
        router.refresh();
        return;
      }

      setError("Не удалось войти в команду. Попробуйте позже.");
    } catch {
      setError(
        "Не удалось соединиться с сервером. Проверьте интернет и попробуйте ещё раз."
      );
    } finally {
      setPending(null);
    }
  }

  async function handleLeaveTeam() {
    if (isFinished || isBusy || !team) {
      return;
    }

    setError(null);
    setShowWorkLinkOnError(false);
    setSuccess(null);
    setPending("leave");

    try {
      const response = await fetch(
        `/api/hackathons/${encodeURIComponent(slug)}/teams/my`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        }
      );

      if (response.status === 401) {
        setIsLeaveDialogOpen(false);
        setError("Сессия истекла. Войдите снова.");
        router.push(redirectToSignInUrl);
        return;
      }

      let data: TeamApiResponse = {};
      try {
        data = (await response.json()) as TeamApiResponse;
      } catch {
        data = {};
      }

      setIsLeaveDialogOpen(false);

      if (response.ok) {
        setTeam(null);
        setSuccess("Вы покинули команду.");
        router.refresh();
        return;
      }

      const serverError =
        typeof data.error === "string" && data.error.trim().length > 0
          ? data.error
          : undefined;

      if (response.status === 403) {
        setError(serverError || "Команды доступны только участникам хакатона.");
        return;
      }

      if (response.status === 404) {
        setError(serverError || "Команда не найдена.");
        router.refresh();
        return;
      }

      if (response.status === 400) {
        setError(serverError || "Не удалось покинуть команду.");
        router.refresh();
        return;
      }

      setError("Не удалось покинуть команду. Попробуйте позже.");
    } catch {
      setIsLeaveDialogOpen(false);
      setError(
        "Не удалось соединиться с сервером. Проверьте интернет и попробуйте ещё раз."
      );
    } finally {
      setPending(null);
    }
  }

  async function handleDisbandTeam() {
    if (isFinished || isBusy || !team) {
      return;
    }

    setError(null);
    setShowWorkLinkOnError(false);
    setSuccess(null);
    setPending("disband");

    try {
      const response = await fetch(
        `/api/hackathons/${encodeURIComponent(slug)}/teams/${encodeURIComponent(
          team.id
        )}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        }
      );

      if (response.status === 401) {
        setIsDisbandDialogOpen(false);
        setError("Сессия истекла. Войдите снова.");
        router.push(redirectToSignInUrl);
        return;
      }

      let data: TeamApiResponse = {};
      try {
        data = (await response.json()) as TeamApiResponse;
      } catch {
        data = {};
      }

      setIsDisbandDialogOpen(false);

      if (response.ok) {
        setTeam(null);
        setSuccess("Команда распущена.");
        router.refresh();
        return;
      }

      const serverError =
        typeof data.error === "string" && data.error.trim().length > 0
          ? data.error
          : undefined;

      if (response.status === 403) {
        setError(serverError || "Команды доступны только участникам хакатона.");
        return;
      }

      if (response.status === 404) {
        setError(serverError || "Команда не найдена.");
        router.refresh();
        return;
      }

      if (response.status === 400) {
        setError(serverError || "Не удалось распустить команду.");
        router.refresh();
        return;
      }

      setError("Не удалось распустить команду. Попробуйте позже.");
    } catch {
      setIsDisbandDialogOpen(false);
      setError(
        "Не удалось соединиться с сервером. Проверьте интернет и попробуйте ещё раз."
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-5">
      {success ? (
        <Alert variant="success" role="status">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          <AlertDescription className="text-sm font-medium sm:text-base">
            {success}
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription className="flex flex-col gap-2 text-sm sm:text-base">
            <span>{error}</span>
            {showWorkLinkOnError ? (
              <div>
                <Link
                  href={`/my-participations/${slug}/work`}
                  className="font-medium underline underline-offset-4 hover:opacity-80"
                >
                  Перейти к работе
                </Link>
              </div>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {!team ? (
        isFinished ? (
          <Card>
            <CardContent className="p-6 text-center sm:p-8">
              <p className="text-base text-muted-foreground">
                Хакатон завершён. Команды больше нельзя создавать или менять.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold leading-snug text-foreground">
                  Создать команду
                </h2>
                <CardDescription className="text-sm sm:text-base">
                  Вы станете капитаном и получите код для приглашения.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleCreateTeam}
                  className="space-y-4"
                  noValidate
                >
                  <div className="space-y-2">
                    <Label htmlFor="team-create-name" className="text-base">
                      Название команды
                    </Label>
                    <Input
                      ref={createNameRef}
                      id="team-create-name"
                      type="text"
                      value={teamName}
                      onChange={(event) => {
                        setTeamName(event.target.value);
                        if (createNameError) setCreateNameError(null);
                        if (error) setError(null);
                        if (success) setSuccess(null);
                      }}
                      disabled={isBusy}
                      placeholder="Например: Код и кофе"
                      aria-required="true"
                      aria-invalid={Boolean(createNameError)}
                      aria-describedby={joinDescribedBy(
                        "team-create-name-hint",
                        createNameError && "team-create-name-error"
                      )}
                      className="min-h-11 text-base"
                    />
                    <p
                      id="team-create-name-hint"
                      className="text-sm text-muted-foreground"
                    >
                      От 3 до 50 символов.
                    </p>
                    {createNameError ? (
                      <p
                        id="team-create-name-error"
                        role="alert"
                        className="text-sm font-medium text-destructive"
                      >
                        {createNameError}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isBusy}
                    aria-busy={pending === "create"}
                    className="min-h-11 w-full text-base"
                  >
                    {pending === "create" ? "Создаём..." : "Создать команду"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold leading-snug text-foreground">
                  Войти по коду
                </h2>
                <CardDescription className="text-sm sm:text-base">
                  Попросите код у капитана команды.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleJoinTeam}
                  className="space-y-4"
                  noValidate
                >
                  <div className="space-y-2">
                    <Label htmlFor="team-join-code" className="text-base">
                      Код приглашения
                    </Label>
                    <Input
                      ref={joinCodeRef}
                      id="team-join-code"
                      type="text"
                      value={inviteCode}
                      onChange={(event) => {
                        setInviteCode(event.target.value.toUpperCase());
                        if (joinCodeError) setJoinCodeError(null);
                        if (error) setError(null);
                        if (success) setSuccess(null);
                      }}
                      disabled={isBusy}
                      placeholder="ABC123"
                      maxLength={8}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-required="true"
                      aria-invalid={Boolean(joinCodeError)}
                      aria-describedby={joinDescribedBy(
                        "team-join-code-hint",
                        joinCodeError && "team-join-code-error"
                      )}
                      className="min-h-11 font-mono text-base uppercase tracking-wider"
                    />
                    <p
                      id="team-join-code-hint"
                      className="text-sm text-muted-foreground"
                    >
                      Код приглашения содержит от 6 до 8 символов: латинские
                      буквы и цифры.
                    </p>
                    {joinCodeError ? (
                      <p
                        id="team-join-code-error"
                        role="alert"
                        className="text-sm font-medium text-destructive"
                      >
                        {joinCodeError}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    size="lg"
                    disabled={isBusy}
                    aria-busy={pending === "join"}
                    className="min-h-11 w-full text-base"
                  >
                    {pending === "join" ? "Входим..." : "Войти в команду"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            </div>
            <p className="text-sm text-muted-foreground">
              Если вы уже сдали личную работу, сначала отзовите её — иначе войти
              в команду не получится.
            </p>
          </div>
        )
      ) : (
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <h2 className="min-w-0 break-words text-2xl font-bold leading-snug text-foreground">
                {team.name}
              </h2>
              <Badge
                variant={team.viewerIsCaptain ? "default" : "secondary"}
                className="gap-1.5 px-3 py-1 text-sm"
              >
                {team.viewerIsCaptain ? (
                  <Crown className="size-3.5" aria-hidden="true" />
                ) : (
                  <Users className="size-3.5" aria-hidden="true" />
                )}
                {team.viewerIsCaptain ? "Вы капитан" : "Вы участник"}
              </Badge>
            </div>

            {formatRussianDate(team.createdAt) ? (
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="size-4 shrink-0" aria-hidden="true" />
                Команда создана {formatRussianDate(team.createdAt)}
              </p>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-6">
            {!isFinished ? (
              <>
                <div className="space-y-2.5 rounded-xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Код приглашения
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="select-all break-all font-mono text-2xl font-bold tracking-widest text-foreground">
                      {team.inviteCode}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => handleCopyCode(team.inviteCode)}
                      className="min-h-11 px-4 text-base"
                    >
                      {copyState === "copied" ? (
                        <>
                          <Check className="size-4" aria-hidden="true" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="size-4" aria-hidden="true" />
                          Скопировать код
                        </>
                      )}
                    </Button>
                  </div>
                  <span role="status" aria-live="polite" className="sr-only">
                    {copyState === "copied"
                      ? "Код приглашения скопирован."
                      : copyState === "manual"
                        ? "Скопируйте код вручную."
                        : ""}
                  </span>
                  {copyState === "manual" ? (
                    <p className="text-sm text-muted-foreground">
                      Скопируйте код вручную.
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    Поделитесь кодом с теми, кого хотите пригласить.
                  </p>
                </div>

                <Separator />
              </>
            ) : null}

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Состав команды
                </h3>
                <Badge variant="outline" className="gap-1.5 px-2.5 py-0.5 text-sm">
                  <Users className="size-3.5" aria-hidden="true" />
                  {formatParticipantsCount(team.memberCount)}
                </Badge>
              </div>

              <ul className="divide-y divide-border rounded-xl border">
                {team.members.map((member) => {
                  const joinedLabel = formatRussianDate(member.joinedAt);
                  return (
                    <li
                      key={member.id}
                      className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-medium text-foreground">
                          {member.name}
                        </span>
                        {member.isCaptain ? (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Crown className="size-3" aria-hidden="true" />
                            Капитан
                          </Badge>
                        ) : null}
                      </div>
                      {joinedLabel ? (
                        <span className="text-sm text-muted-foreground">
                          Присоединился {joinedLabel}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={`/my-participations/${slug}/work`}
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "min-h-11 px-5 text-base",
                })}
              >
                <FileCode2 className="size-4" aria-hidden="true" />
                Работа команды
              </Link>

              {!isFinished ? (
                team.viewerIsCaptain ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    disabled={isBusy}
                    aria-busy={pending === "disband"}
                    onClick={() => setIsDisbandDialogOpen(true)}
                    className="min-h-11 px-5 text-base"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    {pending === "disband"
                      ? "Распускаем..."
                      : "Распустить команду"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={isBusy}
                    aria-busy={pending === "leave"}
                    onClick={() => setIsLeaveDialogOpen(true)}
                    className="min-h-11 px-5 text-base"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    {pending === "leave" ? "Выходим..." : "Покинуть команду"}
                  </Button>
                )
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={isDisbandDialogOpen}
        onOpenChange={(nextOpen) => {
          if (pending !== "disband") {
            setIsDisbandDialogOpen(nextOpen);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Распустить команду?</AlertDialogTitle>
            <AlertDialogDescription>
              Команда «{team?.name ?? ""}» будет удалена. Все участники выйдут
              из команды. Работа команды, если она сдана, тоже будет удалена.
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending === "disband"}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={pending === "disband"}
              onClick={handleDisbandTeam}
            >
              {pending === "disband" ? "Распускаем..." : "Распустить команду"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isLeaveDialogOpen}
        onOpenChange={(nextOpen) => {
          if (pending !== "leave") {
            setIsLeaveDialogOpen(nextOpen);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Покинуть команду?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы выйдете из команды «{team?.name ?? ""}». Вернуться можно будет
              по коду приглашения.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending === "leave"}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={pending === "leave"}
              onClick={handleLeaveTeam}
            >
              {pending === "leave" ? "Выходим..." : "Покинуть команду"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
