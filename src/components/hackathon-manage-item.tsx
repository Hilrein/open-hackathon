"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ExternalLink,
  FileCode2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  UsersRound,
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
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      <Card className="py-0">
        <CardContent className="flex flex-col p-0">
          <div className="min-w-0 space-y-2.5 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className={formatConfig.className}>
                {formatConfig.label}
              </Badge>
            </div>

            <h2 className="min-w-0 break-words text-lg font-semibold leading-snug text-foreground">
              <Link
                href={`/hackathons/${hackathon.id}`}
                className="rounded-sm hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
              <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                <span className="break-words">{hackathon.location}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4 shrink-0" aria-hidden="true" />
                {formatParticipantsCount(hackathon.participantsCount)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-border bg-muted/20 px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-2.5">
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
            </div>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isDeleting}
                    aria-label={`Ещё действия для хакатона «${hackathon.title}»`}
                    className="min-h-11 gap-2 px-4 text-base"
                  />
                }
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
                <span>Ещё</span>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={8} className="w-56">
                <DropdownMenuLinkItem
                  render={<Link href={`/hackathons/${hackathon.id}`} />}
                >
                  <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                  <span>Открыть на сайте</span>
                </DropdownMenuLinkItem>
                <DropdownMenuLinkItem
                  render={<Link href={`/my-hackathons/${hackathon.id}/edit`} />}
                >
                  <Pencil className="size-4 shrink-0" aria-hidden="true" />
                  <span>Редактировать</span>
                </DropdownMenuLinkItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={() => {
                    setErrorMessage(null);
                    setIsDialogOpen(true);
                  }}
                >
                  <Trash2 className="size-4 shrink-0" aria-hidden="true" />
                  <span>Удалить</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        <AlertDialogContent className="data-[size=default]:sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить хакатон?</AlertDialogTitle>
            <AlertDialogDescription className="break-words text-sm leading-relaxed text-muted-foreground">
              Хакатон «{hackathon.title}» будет удалён без возможности
              восстановления. Вместе с ним удалятся все его участники
              {hackathon.participantsCount > 0
                ? ` (${formatParticipantsCount(hackathon.participantsCount)})`
                : ""}
              , команды, сданные работы и оценки. Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {errorMessage ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="min-h-11 px-4 text-base">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="min-h-11 px-4 text-base"
            >
              {isDeleting ? "Удаляем..." : "Да, удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
