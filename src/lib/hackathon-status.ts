import type { HackathonStatus } from "@/types/hackathon";

function toTimestamp(value: Date | string): number {
  return value instanceof Date ? value.getTime() : Date.parse(value);
}

export function getHackathonEffectiveStatus(
  startDate: Date | string,
  endDate: Date | string,
  now: Date = new Date()
): HackathonStatus {
  const nowMs = now.getTime();
  const endMs = toTimestamp(endDate);
  if (endMs <= nowMs) {
    return "finished";
  }

  const startMs = toTimestamp(startDate);
  if (startMs <= nowMs) {
    return "active";
  }

  return "upcoming";
}
