import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileCode2,
  Pencil,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  HACKATHON_STATUS_CONFIG,
  formatHackathonDateRange,
} from "@/lib/hackathon-formatters";
import { cn } from "cn";
import type { Hackathon } from "@/types/hackathon";

export type OrganizerHackathonSection =
  | "participants"
  | "teams"
  | "submissions"
  | "edit";

interface OrganizerHackathonNavProps {
  hackathon: Hackathon;
  activeSection: OrganizerHackathonSection;
  showPublicResults?: boolean;
}

const NAV_SECTIONS: ReadonlyArray<{
  key: OrganizerHackathonSection;
  label: string;
  suffix: string;
  icon: typeof Users;
}> = [
  {
    key: "participants",
    label: "Участники",
    suffix: "participants",
    icon: Users,
  },
  {
    key: "teams",
    label: "Команды",
    suffix: "teams",
    icon: UsersRound,
  },
  {
    key: "submissions",
    label: "Работы",
    suffix: "submissions",
    icon: FileCode2,
  },
  {
    key: "edit",
    label: "Редактировать",
    suffix: "edit",
    icon: Pencil,
  },
];

export function OrganizerHackathonNav({
  hackathon,
  activeSection,
  showPublicResults = false,
}: OrganizerHackathonNavProps) {
  const statusConfig = HACKATHON_STATUS_CONFIG[hackathon.status];
  const hackathonUrl = `/hackathons/${hackathon.id}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/my-hackathons"
          className={buttonVariants({
            variant: "ghost",
            className: "min-h-11 px-3 text-base",
          })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Назад в мои хакатоны
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          {showPublicResults ? (
            <Link
              href={`/hackathons/${hackathon.id}/results`}
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11 px-4 text-base",
              })}
            >
              <Trophy className="size-4" aria-hidden="true" />
              Публичные результаты
            </Link>
          ) : null}

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

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.detailLabel}
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-4 shrink-0" aria-hidden="true" />
            {formatHackathonDateRange(hackathon.startDate, hackathon.endDate)}
          </span>
        </div>

        <p className="min-w-0 break-words text-base text-muted-foreground">
          <Link
            href={hackathonUrl}
            className="rounded-sm font-semibold text-foreground hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {hackathon.title}
          </Link>
        </p>
      </div>

      <nav
        aria-label="Разделы хакатона"
        className="rounded-xl border border-border bg-card p-1.5 shadow-xs"
      >
        <ul className="flex flex-wrap items-center gap-1.5">
          {NAV_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = section.key === activeSection;
            const href = `/my-hackathons/${hackathon.id}/${section.suffix}`;

            return (
              <li key={section.key} className="min-w-0 flex-1 sm:flex-initial">
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-3.5 text-base whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none sm:w-auto sm:justify-start",
                    isActive
                      ? "border-primary/30 bg-accent font-semibold text-accent-foreground shadow-[inset_0_-2px_0_0_var(--primary)]"
                      : "border-transparent font-medium text-foreground hover:bg-muted/80"
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{section.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
