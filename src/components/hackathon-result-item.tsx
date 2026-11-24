import { Award, ExternalLink, Star, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PublicResultItem } from "@/lib/hackathon-results";

interface HackathonResultItemProps {
  item: PublicResultItem;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function getPlaceBadgeVariant(
  place: number
): "default" | "secondary" | "outline" {
  if (place === 1) {
    return "default";
  }
  if (place === 2 || place === 3) {
    return "secondary";
  }
  return "outline";
}

export function HackathonResultItem({ item }: HackathonResultItemProps) {
  const repoHost = item.repoUrl ? getHostname(item.repoUrl) : "";
  const demoHost = item.demoUrl ? getHostname(item.demoUrl) : "";
  const hasAnyLink = Boolean(item.repoUrl || item.demoUrl);

  return (
    <article>
      <Card>
        <CardHeader className="gap-3 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <Badge
              variant={getPlaceBadgeVariant(item.place)}
              className="gap-1.5 px-3 py-1 text-sm font-semibold"
            >
              <Award className="size-4" aria-hidden="true" />
              {item.place} место
            </Badge>

            <Badge
              variant="secondary"
              className="gap-1.5 px-3 py-1 text-sm font-semibold"
            >
              <Star className="size-3.5 fill-current" aria-hidden="true" />
              {item.score} из 10
            </Badge>
          </div>

          <h2 className="break-words text-xl font-bold leading-snug text-foreground">
            {item.title}
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <User className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">{item.authorName}</span>
            </span>
            {item.teamName !== null ? (
              <Badge variant="outline" className="px-2 py-0.5 text-xs">
                Команда
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          {hasAnyLink ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {item.repoUrl ? (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <a
                    href={item.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({
                      variant: "outline",
                      className: "min-h-11 px-4 text-base",
                    })}
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Открыть репозиторий
                    <span className="sr-only"> (откроется в новой вкладке)</span>
                  </a>
                  {repoHost ? (
                    <span className="min-w-0 break-all text-xs text-muted-foreground">
                      {repoHost}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {item.demoUrl ? (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <a
                    href={item.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({
                      variant: "outline",
                      className: "min-h-11 px-4 text-base",
                    })}
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Открыть демо
                    <span className="sr-only"> (откроется в новой вкладке)</span>
                  </a>
                  {demoHost ? (
                    <span className="min-w-0 break-all text-xs text-muted-foreground">
                      {demoHost}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Ссылки не указаны</p>
          )}
        </CardContent>
      </Card>
    </article>
  );
}
