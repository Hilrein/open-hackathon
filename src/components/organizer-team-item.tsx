import { Calendar, Crown, KeyRound, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatParticipantsCount } from "@/lib/hackathon-formatters";
import type { TeamDTO } from "@/lib/hackathon-teams";

interface OrganizerTeamItemProps {
  team: TeamDTO;
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

export function OrganizerTeamItem({ team }: OrganizerTeamItemProps) {
  const createdLabel = formatRussianDate(team.createdAt);

  return (
    <Card>
      <CardHeader className="gap-3 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <CardTitle className="text-xl font-bold leading-snug text-foreground">
            {team.name}
          </CardTitle>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
            <Users className="size-3.5" aria-hidden="true" />
            {formatParticipantsCount(team.memberCount)}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <Crown
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            Капитан: {team.captainName}
          </span>
          {createdLabel ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4 shrink-0" aria-hidden="true" />
              Создана {createdLabel}
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <KeyRound
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-sm text-muted-foreground">
              Код приглашения:
            </span>
            <span className="select-all font-mono text-base font-semibold tracking-wider text-foreground">
              {team.inviteCode}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Участники могут войти в команду по этому коду.
          </p>
        </div>

        <Separator />

        <div className="space-y-2.5">
          <h3 className="text-base font-semibold text-foreground">Состав</h3>
          <ul className="divide-y divide-border rounded-lg border">
            {team.members.map((member) => {
              const joinedLabel = formatRussianDate(member.joinedAt);
              return (
                <li
                  key={member.id}
                  className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
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
      </CardContent>
    </Card>
  );
}
