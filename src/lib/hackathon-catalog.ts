import type {
  Hackathon,
  HackathonFormat,
  HackathonStatus,
} from "@/types/hackathon";

export type HackathonCatalogStatusFilter = "all" | HackathonStatus;
export type HackathonCatalogFormatFilter = "all" | HackathonFormat;
export type HackathonCatalogSort =
  | "actual"
  | "date-asc"
  | "date-desc"
  | "participants";

export interface HackathonCatalogParams {
  q: string;
  status: HackathonCatalogStatusFilter;
  format: HackathonCatalogFormatFilter;
  sort: HackathonCatalogSort;
}

export const CATALOG_PAGE_SIZE = 6;

export const DEFAULT_HACKATHON_CATALOG_PARAMS: HackathonCatalogParams = {
  q: "",
  status: "all",
  format: "all",
  sort: "actual",
};

const VALID_STATUSES = new Set<HackathonCatalogStatusFilter>([
  "all",
  "upcoming",
  "active",
  "finished",
]);

const VALID_FORMATS = new Set<HackathonCatalogFormatFilter>([
  "all",
  "online",
  "offline",
  "hybrid",
]);

const VALID_SORTS = new Set<HackathonCatalogSort>([
  "actual",
  "date-asc",
  "date-desc",
  "participants",
]);

const STATUS_PRIORITY: Record<HackathonStatus, number> = {
  active: 0,
  upcoming: 1,
  finished: 2,
};

function getFirstParamValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parseHackathonCatalogParams(
  raw: Record<string, string | string[] | undefined>
): HackathonCatalogParams {
  const rawQ = getFirstParamValue(raw.q)?.trim() ?? "";
  const rawStatus = getFirstParamValue(raw.status);
  const rawFormat = getFirstParamValue(raw.format);
  const rawSort = getFirstParamValue(raw.sort);

  const status =
    rawStatus && VALID_STATUSES.has(rawStatus as HackathonCatalogStatusFilter)
      ? (rawStatus as HackathonCatalogStatusFilter)
      : DEFAULT_HACKATHON_CATALOG_PARAMS.status;

  const format =
    rawFormat && VALID_FORMATS.has(rawFormat as HackathonCatalogFormatFilter)
      ? (rawFormat as HackathonCatalogFormatFilter)
      : DEFAULT_HACKATHON_CATALOG_PARAMS.format;

  const sort =
    rawSort && VALID_SORTS.has(rawSort as HackathonCatalogSort)
      ? (rawSort as HackathonCatalogSort)
      : DEFAULT_HACKATHON_CATALOG_PARAMS.sort;

  return {
    q: rawQ,
    status,
    format,
    sort,
  };
}

export function parseCatalogPage(raw: string | string[] | undefined): number {
  const first = getFirstParamValue(raw)?.trim();
  if (!first || !/^[1-9]\d*$/.test(first)) {
    return 1;
  }
  const parsed = Number.parseInt(first, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function buildCatalogSearchParams(
  params: HackathonCatalogParams,
  page: number
): URLSearchParams {
  const searchParams = new URLSearchParams();
  const trimmedQ = params.q.trim();

  if (trimmedQ.length > 0) {
    searchParams.set("q", trimmedQ);
  }
  if (params.status !== DEFAULT_HACKATHON_CATALOG_PARAMS.status) {
    searchParams.set("status", params.status);
  }
  if (params.format !== DEFAULT_HACKATHON_CATALOG_PARAMS.format) {
    searchParams.set("format", params.format);
  }
  if (params.sort !== DEFAULT_HACKATHON_CATALOG_PARAMS.sort) {
    searchParams.set("sort", params.sort);
  }
  if (Number.isInteger(page) && page > 1) {
    searchParams.set("page", String(page));
  }

  return searchParams;
}

export function hasActiveCatalogParams(
  params: HackathonCatalogParams
): boolean {
  return (
    params.q !== DEFAULT_HACKATHON_CATALOG_PARAMS.q ||
    params.status !== DEFAULT_HACKATHON_CATALOG_PARAMS.status ||
    params.format !== DEFAULT_HACKATHON_CATALOG_PARAMS.format ||
    params.sort !== DEFAULT_HACKATHON_CATALOG_PARAMS.sort
  );
}

export function filterHackathons(
  hackathons: Hackathon[],
  params: HackathonCatalogParams
): Hackathon[] {
  const query = params.q.trim().toLowerCase();

  return hackathons.filter((hackathon) => {
    if (query !== "") {
      const searchable = [
        hackathon.title,
        hackathon.description,
        hackathon.location,
        hackathon.organizerName,
        ...hackathon.tags,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(query)) {
        return false;
      }
    }

    if (params.status !== "all" && hackathon.status !== params.status) {
      return false;
    }

    if (params.format !== "all" && hackathon.format !== params.format) {
      return false;
    }

    return true;
  });
}

export function sortHackathons(
  hackathons: Hackathon[],
  sort: HackathonCatalogSort
): Hackathon[] {
  return [...hackathons].sort((a, b) => {
    if (sort === "participants") {
      return b.participantsCount - a.participantsCount;
    }

    const timeA = Date.parse(a.startDate);
    const timeB = Date.parse(b.startDate);

    if (sort === "date-desc") {
      return timeB - timeA;
    }

    if (sort === "date-asc") {
      return timeA - timeB;
    }

    const priorityDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return timeA - timeB;
  });
}
