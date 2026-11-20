import Link from "next/link";
import { Calendar, Clock, FileCode2, MapPin, Users } from "lucide-react";
import { ParticipateButton } from "@/components/participate-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  HACKATHON_FORMAT_CONFIG,
  HACKATHON_STATUS_CONFIG,
  formatHackathonDateRange,
  formatParticipantsCount,
} from "@/lib/hackathon-formatters";
import type { Hackathon } from "@/types/hackathon";

interface ParticipationItemProps {
  hackathon: Hackathon;
  joinedAt: string;
  hasSubmission?: boolean;
}

function formatJoinedDate(iso: string): string {
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

export function ParticipationItem({
  hackathon,
  joinedAt,
  hasSubmission = false,
}: ParticipationItemProps) {
  const statusConfig = HACKATHON_STATUS_CONFIG[hackathon.status];
  const formatConfig = HACKATHON_FORMAT_CONFIG[hackathon.format];
  const joinedLabel = formatJoinedDate(joinedAt);
  const isFinished = hackathon.status === "finished";
  const isFull =
    hackathon.maxParticipants !== undefined &&
    hackathon.participantsCount >= hackathon.maxParticipants;
  const workLinkLabel = "Работа";

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between">
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
              className="rounded-sm hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {hackathon.title}
            </Link>
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4 shrink-0" aria-hidden="true" />
              {formatHackathonDateRange(hackathon.startDate, hackathon.endDate)}
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

          {joinedLabel ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              Вы присоединились {joinedLabel}
            </p>
          ) : null}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 md:w-64">
          <Link
            href={`/my-participations/${hackathon.id}/work`}
            className={buttonVariants({
              variant:
                !hasSubmission && hackathon.status === "active"
                  ? "default"
                  : "outline",
              size: "lg",
              className: "min-h-11 w-full text-base",
            })}
          >
            <FileCode2 className="size-4" aria-hidden="true" />
            {workLinkLabel}
          </Link>
          <Link
            href={`/my-participations/${hackathon.id}/team`}
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "min-h-11 w-full text-base",
            })}
          >
            <Users className="size-4" aria-hidden="true" />
            Команда
          </Link>
          <ParticipateButton
            slug={hackathon.id}
            hackathonTitle={hackathon.title}
            isAuthenticated={true}
            isOrganizer={false}
            isFinished={isFinished}
            isFull={isFull}
            initialParticipating={true}
            initialParticipantsCount={hackathon.participantsCount}
            showParticipantsCount={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
