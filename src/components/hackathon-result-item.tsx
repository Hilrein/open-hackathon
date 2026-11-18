import { Award, ExternalLink, Star, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

        <CardTitle className="text-xl font-bold leading-snug text-foreground">
          {item.title}
        </CardTitle>

        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="size-4 shrink-0" aria-hidden="true" />
          <span>{item.authorName}</span>
        </p>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        {hasAnyLink ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {item.repoUrl ? (
              <div className="flex flex-wrap items-center gap-2">
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
                </a>
                {repoHost ? (
                  <span className="text-xs text-muted-foreground">
                    {repoHost}
                  </span>
                ) : null}
              </div>
            ) : null}

            {item.demoUrl ? (
              <div className="flex flex-wrap items-center gap-2">
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
                </a>
                {demoHost ? (
                  <span className="text-xs text-muted-foreground">
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
  );
}
