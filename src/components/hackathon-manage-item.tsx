"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  FileCode2,
  MapPin,
  Pencil,
  Trash2,
  Users,
  UsersRound,
} from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  HACKATHON_FORMAT_CONFIG,
  HACKATHON_STATUS_CONFIG,
  formatHackathonDateRange,
  formatParticipantsCount,
} from "@/lib/hackathon-formatters";
import type { Hackathon } from "@/types/hackathon";

interface HackathonManageItemProps {
  hackathon: Hackathon;
}

function getDeleteErrorMessage(status: number, serverError?: string): string {
  if (status === 401) {
    return "Сессия истекла. Войдите в аккаунт снова.";
  }
  if (status === 403) {
    return "Можно удалять только свои хакатоны.";
  }
  if (status === 404) {
    return "Хакатон уже удалён или не найден.";
  }
  if (serverError && serverError.trim().length > 0) {
    return serverError;
  }
  return "Не удалось удалить хакатон. Попробуйте ещё раз.";
}

export function HackathonManageItem({ hackathon }: HackathonManageItemProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusConfig = HACKATHON_STATUS_CONFIG[hackathon.status];
  const formatConfig = HACKATHON_FORMAT_CONFIG[hackathon.format];

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/hackathons/${encodeURIComponent(hackathon.id)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        }
      );

      if (!response.ok) {
        let serverError: string | undefined;
        try {
          const payload = (await response.json()) as { error?: unknown };
          if (typeof payload.error === "string") {
            serverError = payload.error;
          }
        } catch {
          // Ignore malformed error body
        }

        setErrorMessage(getDeleteErrorMessage(response.status, serverError));
        return;
      }

      setIsDialogOpen(false);
      router.refresh();
    } catch {
      setErrorMessage(
        "Нет соединения с сервером. Проверьте интернет и попробуйте снова."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className={formatConfig.className}>
                {formatConfig.label}
              </Badge>
            </div>

            <h2 className="text-lg font-semibold leading-snug text-foreground">
              <Link
                href={`/hackathons/${hackathon.id}`}
                className="hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {hackathon.title}
              </Link>
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4 shrink-0" aria-hidden="true" />
                {formatHackathonDateRange(
                  hackathon.startDate,
                  hackathon.endDate
                )}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {hackathon.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4 shrink-0" aria-hidden="true" />
                {formatParticipantsCount(hackathon.participantsCount)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Link
              href={`/hackathons/${hackathon.id}`}
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11 px-4 text-base",
              })}
            >
              Открыть
            </Link>
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
              href={`/my-hackathons/${hackathon.id}/teams`}
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11 px-4 text-base",
              })}
            >
              <UsersRound className="size-4" aria-hidden="true" />
              Команды
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
              href={`/my-hackathons/${hackathon.id}/edit`}
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11 px-4 text-base",
              })}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Редактировать
            </Link>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setErrorMessage(null);
                setIsDialogOpen(true);
              }}
              disabled={isDeleting}
              className="min-h-11 px-4 text-base"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Удалить
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={isDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!isDeleting) {
            setIsDialogOpen(nextOpen);
            if (!nextOpen) {
              setErrorMessage(null);
            }
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить хакатон?</AlertDialogTitle>
            <AlertDialogDescription>
              Хакатон «{hackathon.title}» будет удалён без возможности
              восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {errorMessage ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {errorMessage}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Удаляем..." : "Да, удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
