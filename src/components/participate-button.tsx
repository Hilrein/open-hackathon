"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Users } from "lucide-react";
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
import { formatParticipantsCount } from "@/lib/hackathon-formatters";
import { cn } from "cn";

interface ParticipateButtonProps {
  slug: string;
  hackathonTitle: string;
  isAuthenticated: boolean;
  isOrganizer: boolean;
  isFinished: boolean;
  isFull: boolean;
  initialParticipating: boolean;
  initialParticipantsCount: number;
  showParticipantsCount?: boolean;
}

interface ParticipateApiResponse {
  participating?: boolean;
  participantsCount?: number;
  error?: string;
}

export function ParticipateButton({
  slug,
  hackathonTitle,
  isAuthenticated,
  isOrganizer,
  isFinished,
  isFull,
  initialParticipating,
  initialParticipantsCount,
  showParticipantsCount = true,
}: ParticipateButtonProps) {
  const router = useRouter();
  const [participating, setParticipating] = useState(initialParticipating);
  const [participantsCount, setParticipantsCount] = useState(
    initialParticipantsCount
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectToSignInUrl = `/sign-in?redirect=${encodeURIComponent(
    `/hackathons/${slug}`
  )}`;

  async function handleMutation(method: "POST" | "DELETE") {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/hackathons/${encodeURIComponent(slug)}/participate`,
        {
          method,
          credentials: "same-origin",
        }
      );

      if (response.status === 401) {
        setErrorMessage("Сессия истекла. Войдите снова.");
        setIsCancelDialogOpen(false);
        router.push(redirectToSignInUrl);
        return;
      }

      let data: ParticipateApiResponse = {};
      try {
        data = (await response.json()) as ParticipateApiResponse;
      } catch {
        data = {};
      }

      if (response.ok && typeof data.participantsCount === "number") {
        setParticipating(Boolean(data.participating));
        setParticipantsCount(data.participantsCount);
        setIsCancelDialogOpen(false);
        router.refresh();
        return;
      }

      const serverError =
        typeof data.error === "string" && data.error.trim().length > 0
          ? data.error
          : undefined;

      if (response.status === 403) {
        setErrorMessage("Организатор не может участвовать в своём хакатоне.");
        setIsCancelDialogOpen(false);
        router.refresh();
        return;
      }

      if (response.status === 404) {
        setErrorMessage(serverError || "Хакатон не найден.");
        setIsCancelDialogOpen(false);
        router.refresh();
        return;
      }

      if (response.status === 400) {
        setErrorMessage(serverError || "Хакатон уже завершён.");
        setIsCancelDialogOpen(false);
        router.refresh();
        return;
      }

      if (response.status === 409) {
        setErrorMessage(
          serverError || "Не удалось изменить участие. Обновите страницу."
        );
        setIsCancelDialogOpen(false);
        router.refresh();
        return;
      }

      setErrorMessage("Не удалось изменить участие. Попробуйте позже.");
      setIsCancelDialogOpen(false);
    } catch {
      setErrorMessage(
        "Не удалось соединиться с сервером. Проверьте интернет и попробуйте ещё раз."
      );
      setIsCancelDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {participating ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-sm font-medium text-foreground">
            <CheckCircle2
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>Вы участвуете</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isLoading}
            onClick={() => {
              setErrorMessage(null);
              setIsCancelDialogOpen(true);
            }}
            className="min-h-12 w-full text-base"
          >
            {isLoading ? "Отменяем..." : "Отменить участие"}
          </Button>
        </div>
      ) : isFinished ? (
        <Button
          type="button"
          disabled
          size="lg"
          className="min-h-12 w-full text-base"
        >
          Хакатон завершён
        </Button>
      ) : isOrganizer ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            disabled
            size="lg"
            className="min-h-12 w-full text-base"
          >
            Вы организатор
          </Button>
          <p className="text-sm text-muted-foreground">
            Организатор не может участвовать в своём хакатоне.
          </p>
        </div>
      ) : isFull ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            disabled
            size="lg"
            className="min-h-12 w-full text-base"
          >
            Мест нет
          </Button>
          <p className="text-sm text-muted-foreground">
            Достигнут лимит участников.
          </p>
        </div>
      ) : !isAuthenticated ? (
        <Link
          href={redirectToSignInUrl}
          className={cn(
            buttonVariants({ size: "lg" }),
            "min-h-12 w-full text-base"
          )}
        >
          Войти, чтобы участвовать
        </Link>
      ) : (
        <Button
          type="button"
          size="lg"
          disabled={isLoading}
          onClick={() => handleMutation("POST")}
          className="min-h-12 w-full text-base"
        >
          {isLoading ? "Присоединяем..." : "Участвовать"}
        </Button>
      )}

      {showParticipantsCount ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4 shrink-0" aria-hidden="true" />
          <span>{formatParticipantsCount(participantsCount)}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <AlertDialog
        open={isCancelDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!isLoading) {
            setIsCancelDialogOpen(nextOpen);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить участие?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы перестанете быть участником хакатона «{hackathonTitle}».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Остаться участником
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={isLoading}
              onClick={() => handleMutation("DELETE")}
            >
              {isLoading ? "Отменяем..." : "Отменить участие"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
