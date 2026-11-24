import Link from "next/link";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  HACKATHON_FORMAT_CONFIG,
  HACKATHON_STATUS_CONFIG,
  formatHackathonDateRange,
  formatParticipantsCount,
  getParticipantsWord,
} from "@/lib/hackathon-formatters";
import { cn } from "cn";
import type { Hackathon } from "@/types/hackathon";

interface HackathonCardProps {
  hackathon: Hackathon;
  headingLevel?: "h2" | "h3";
}

const MAX_VISIBLE_TAGS = 4;

export function HackathonCard({
  hackathon,
  headingLevel = "h3",
}: HackathonCardProps) {
  const statusInfo = HACKATHON_STATUS_CONFIG[hackathon.status];
  const formatInfo = HACKATHON_FORMAT_CONFIG[hackathon.format];
  const visibleTags = hackathon.tags.slice(0, MAX_VISIBLE_TAGS);
  const extraTagsCount = hackathon.tags.length - visibleTags.length;
  const firstLetter = hackathon.title.trim().charAt(0).toUpperCase() || "Х";
  const HeadingTag = headingLevel;

  return (
    <article className="h-full">
      <Link
        href={`/hackathons/${hackathon.id}`}
        className="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Card className="flex h-full flex-col gap-0 overflow-hidden border bg-card py-0 shadow-sm transition-colors group-hover:border-primary/40 group-hover:bg-accent/25">
          <div
            aria-hidden="true"
            className="flex h-32 items-center justify-center border-b bg-muted/60 px-6"
          >
            <div className="flex size-14 items-center justify-center rounded-xl bg-background text-2xl font-bold text-muted-foreground shadow-xs">
              {firstLetter}
            </div>
          </div>

          <CardHeader className="gap-3 p-6 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "px-2.5 py-0.5 text-xs font-medium",
                  statusInfo.className
                )}
              >
                {statusInfo.label}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "px-2.5 py-0.5 text-xs font-medium",
                  formatInfo.className
                )}
              >
                {formatInfo.label}
              </Badge>
            </div>

            <HeadingTag className="break-words text-xl font-bold leading-snug text-foreground">
              {hackathon.title}
            </HeadingTag>

            <CardDescription className="line-clamp-2 overflow-hidden text-ellipsis text-base leading-relaxed text-muted-foreground">
              {hackathon.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4 px-6 py-3">
            <div className="flex flex-col gap-2 text-sm text-foreground">
              <div className="flex items-center gap-2">
                <Calendar
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">
                  {formatHackathonDateRange(
                    hackathon.startDate,
                    hackathon.endDate
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">
                  {hackathon.location}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Users
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">
                  {hackathon.maxParticipants !== undefined
                    ? `${hackathon.participantsCount} / ${hackathon.maxParticipants} ${getParticipantsWord(hackathon.maxParticipants)}`
                    : formatParticipantsCount(hackathon.participantsCount)}
                </span>
              </div>
            </div>

            {hackathon.prizePool && (
              <div className="flex items-center gap-2 rounded-lg bg-accent/60 px-3 py-2 text-base font-semibold text-accent-foreground">
                <Trophy className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  Призовой фонд: {hackathon.prizePool}
                </span>
              </div>
            )}

            {visibleTags.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                {visibleTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-2.5 py-0.5 text-xs font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
                {extraTagsCount > 0 && (
                  <Badge
                    variant="outline"
                    className="px-2.5 py-0.5 text-xs font-normal text-muted-foreground"
                  >
                    +{extraTagsCount}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t bg-muted/20 px-6 py-4 text-sm text-muted-foreground">
            <span className="min-w-0 break-words">
              Организатор: {hackathon.organizerName}
            </span>
          </CardFooter>
        </Card>
      </Link>
    </article>
  );
}
