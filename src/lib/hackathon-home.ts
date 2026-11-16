import type { Hackathon } from "@/types/hackathon";

export function selectFeaturedHackathons(
  hackathons: Hackathon[],
  limit = 3
): Hackathon[] {
  const maxItems = Math.max(0, limit);
  if (maxItems === 0) {
    return [];
  }

  const eligible = hackathons.filter(
    (hackathon) =>
      hackathon.status === "active" || hackathon.status === "upcoming"
  );

  const sorted = [...eligible].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "active" ? -1 : 1;
    }

    return Date.parse(a.startDate) - Date.parse(b.startDate);
  });

  return sorted.slice(0, maxItems);
}
