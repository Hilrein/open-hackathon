import type {
  Hackathon,
  HackathonFormat,
  HackathonStatus,
} from "@/types/hackathon";

export type HackathonStatusFilter = "all" | HackathonStatus;
export type HackathonFormatFilter = "all" | HackathonFormat;
export type HackathonSortOption = "date-asc" | "date-desc" | "participants-desc";

export interface HackathonFiltersState {
  search: string;
  status: HackathonStatusFilter;
  format: HackathonFormatFilter;
  sort: HackathonSortOption;
}

export const DEFAULT_HACKATHON_FILTERS: HackathonFiltersState = {
  search: "",
  status: "all",
  format: "all",
  sort: "date-asc",
};

export function hasActiveHackathonFilters(
  filters: HackathonFiltersState
): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.status !== DEFAULT_HACKATHON_FILTERS.status ||
    filters.format !== DEFAULT_HACKATHON_FILTERS.format ||
    filters.sort !== DEFAULT_HACKATHON_FILTERS.sort
  );
}

export function filterAndSortHackathons(
  hackathons: Hackathon[],
  filters: HackathonFiltersState
): Hackathon[] {
  const normalizedQuery = filters.search.trim().toLowerCase();

  const filtered = hackathons.filter((hackathon) => {
    if (
      normalizedQuery !== "" &&
      !hackathon.title.toLowerCase().includes(normalizedQuery)
    ) {
      return false;
    }

    if (filters.status !== "all" && hackathon.status !== filters.status) {
      return false;
    }

    if (filters.format !== "all" && hackathon.format !== filters.format) {
      return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    if (filters.sort === "participants-desc") {
      return b.participantsCount - a.participantsCount;
    }

    const timeA = Date.parse(a.startDate);
    const timeB = Date.parse(b.startDate);

    if (filters.sort === "date-desc") {
      return timeB - timeA;
    }

    return timeA - timeB;
  });
}
