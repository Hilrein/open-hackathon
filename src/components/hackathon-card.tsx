import Link from "next/link";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HACKATHON_FORMAT_CONFIG,
  HACKATHON_STATUS_CONFIG,
  formatHackathonDateRange,
  formatParticipantsCount,
} from "@/lib/hackathon-formatters";
import { cn } from "cn";
import type { Hackathon } from "@/types/hackathon";

interface HackathonCardProps {
  hackathon: Hackathon;
}

const MAX_VISIBLE_TAGS = 4;

const COVER_THEMES = [
  {
    surface:
      "bg-gradient-to-br from-[hsl(262_83%_54%/0.18)] via-[hsl(238_68%_48%/0.10)] to-[hsl(272_72%_44%/0.16)]",
    orbPrimary: "bg-primary/15",
    orbSecondary: "bg-format-hybrid/15",
    monogram: "border-primary/20 text-primary",
  },
  {
    surface:
      "bg-gradient-to-br from-[hsl(190_86%_30%/0.18)] via-[hsl(214_82%_40%/0.10)] to-[hsl(262_83%_54%/0.14)]",
    orbPrimary: "bg-format-online/15",
    orbSecondary: "bg-primary/12",
    monogram: "border-format-online/25 text-format-online",
  },
  {
    surface:
      "bg-gradient-to-br from-[hsl(152_76%_28%/0.18)] via-[hsl(190_86%_30%/0.10)] to-[hsl(214_82%_40%/0.14)]",
    orbPrimary: "bg-status-active/15",
    orbSecondary: "bg-format-online/14",
    monogram: "border-status-active/25 text-status-active",
  },
  {
    surface:
      "bg-gradient-to-br from-[hsl(32_90%_42%/0.18)] via-[hsl(18_82%_46%/0.10)] to-[hsl(328_76%_40%/0.14)]",
    orbPrimary: "bg-status-upcoming/16",
    orbSecondary: "bg-format-offline/14",
    monogram: "border-status-upcoming/25 text-status-upcoming",
  },
  {
    surface:
      "bg-gradient-to-br from-[hsl(328_76%_40%/0.17)] via-[hsl(290_68%_44%/0.10)] to-[hsl(262_83%_54%/0.15)]",
    orbPrimary: "bg-format-offline/15",
    orbSecondary: "bg-primary/14",
    monogram: "border-format-offline/25 text-format-offline",
  },
  {
    surface:
      "bg-gradient-to-br from-[hsl(238_68%_46%/0.18)] via-[hsl(214_82%_40%/0.10)] to-[hsl(152_76%_28%/0.14)]",
    orbPrimary: "bg-format-hybrid/15",
    orbSecondary: "bg-status-active/14",
    monogram: "border-format-hybrid/25 text-format-hybrid",
  },
] as const;

function getCoverThemeIndex(slug: string): number {
  let hash = 2166136261;
  for (let i = 0; i < slug.length; i += 1) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % COVER_THEMES.length;
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
  const statusInfo = HACKATHON_STATUS_CONFIG[hackathon.status];
  const formatInfo = HACKATHON_FORMAT_CONFIG[hackathon.format];
  const visibleTags = hackathon.tags.slice(0, MAX_VISIBLE_TAGS);
  const extraTagsCount = hackathon.tags.length - visibleTags.length;
  const firstLetter = hackathon.title.trim().charAt(0).toUpperCase() || "Х";
  const coverTheme = COVER_THEMES[getCoverThemeIndex(hackathon.id)];

  return (
    <Link
      href={`/hackathons/${hackathon.id}`}
      className="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Card className="motion-lift flex h-full flex-col gap-0 overflow-hidden border-border bg-card py-0 transition-[transform,box-shadow,border-color] duration-150 group-hover:-translate-y-0.5 group-hover:border-border-strong group-hover:shadow-[0_4px_12px_hsl(258_34%_13%/0.08),0_12px_28px_-10px_hsl(262_83%_54%/0.16)]">
        <div
          className={cn(
            "relative flex h-32 items-center justify-center overflow-hidden border-b border-border/80 px-6",
            coverTheme.surface
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -top-8 -left-8 size-28 rounded-full blur-xl",
              coverTheme.orbPrimary
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -right-6 -bottom-10 size-32 rounded-full blur-xl",
              coverTheme.orbSecondary
            )}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-5 bottom-2 select-none text-6xl leading-none font-extrabold tracking-tighter text-foreground/[0.06]"
          >
            {firstLetter}
          </span>
          <div
            aria-hidden="true"
            className={cn(
              "relative flex size-14 items-center justify-center rounded-2xl border bg-card/95 text-2xl font-extrabold shadow-xs backdrop-blur-xs",
              coverTheme.monogram
            )}
          >
            {firstLetter}
          </div>
        </div>

        <CardHeader className="gap-3 p-6 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
            <Badge variant="outline" className={formatInfo.className}>
              {formatInfo.label}
            </Badge>
          </div>

          <CardTitle className="text-xl font-bold leading-snug tracking-tight text-foreground transition-colors duration-150 group-hover:text-primary">
            {hackathon.title}
          </CardTitle>

          <CardDescription className="line-clamp-2 max-w-[60ch] overflow-hidden text-ellipsis text-base leading-relaxed text-muted-foreground">
            {hackathon.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 px-6 py-3">
          <div className="flex flex-col gap-2 text-sm text-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 shrink-0 text-muted-foreground" />
              <span>
                {formatHackathonDateRange(
                  hackathon.startDate,
                  hackathon.endDate
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span>{hackathon.location}</span>
            </div>

            <div className="flex items-center gap-2 tabular-nums">
              <Users className="size-4 shrink-0 text-muted-foreground" />
              <span>
                {hackathon.maxParticipants !== undefined
                  ? `${hackathon.participantsCount} / ${hackathon.maxParticipants}`
                  : formatParticipantsCount(hackathon.participantsCount)}
              </span>
            </div>
          </div>

          {hackathon.prizePool && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/15 bg-accent/80 px-3 py-2 text-sm font-semibold text-accent-foreground sm:text-base">
              <Trophy className="size-4 shrink-0" />
              <span className="tabular-nums">
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
                  className="border-transparent bg-muted/85 font-medium text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
              {extraTagsCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-border/80 bg-transparent font-medium text-muted-foreground tabular-nums"
                >
                  +{extraTagsCount}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-border/80 bg-muted/35 px-6 py-3.5 text-sm text-muted-foreground">
          Организатор: {hackathon.organizerName}
        </CardFooter>
      </Card>
    </Link>
  );
}
