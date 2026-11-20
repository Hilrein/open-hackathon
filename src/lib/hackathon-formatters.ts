import type { HackathonFormat, HackathonStatus } from "@/types/hackathon";

export const HACKATHON_STATUS_CONFIG: Record<
  HackathonStatus,
  { label: string; detailLabel: string; className: string }
> = {
  upcoming: {
    label: "Скоро",
    detailLabel: "Скоро",
    className:
      "border-status-upcoming/30 bg-status-upcoming-bg text-status-upcoming",
  },
  active: {
    label: "Идёт",
    detailLabel: "Идёт сейчас",
    className:
      "border-status-active/30 bg-status-active-bg text-status-active",
  },
  finished: {
    label: "Завершён",
    detailLabel: "Завершён",
    className:
      "border-status-finished/30 bg-status-finished-bg text-status-finished",
  },
};

export const HACKATHON_FORMAT_CONFIG: Record<
  HackathonFormat,
  { label: string; className: string }
> = {
  online: {
    label: "Онлайн",
    className:
      "border-format-online/30 bg-format-online-bg text-format-online",
  },
  offline: {
    label: "Офлайн",
    className:
      "border-format-offline/30 bg-format-offline-bg text-format-offline",
  },
  hybrid: {
    label: "Гибрид",
    className:
      "border-format-hybrid/30 bg-format-hybrid-bg text-format-hybrid",
  },
};

export function getParticipantsWord(count: number): string {
  const abs = Math.abs(count) % 100;
  const lastDigit = abs % 10;

  if (abs > 10 && abs < 20) {
    return "участников";
  }
  if (lastDigit === 1) {
    return "участник";
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return "участника";
  }
  return "участников";
}

export function formatParticipantsCount(count: number): string {
  return `${count} ${getParticipantsWord(count)}`;
}

export function formatHackathonDateRange(
  startIso: string,
  endIso: string
): string {
  const start = new Date(startIso);
  const end = new Date(endIso);

  const dayFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric" });
  const monthYearFormatter = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  });
  const dayMonthFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  });
  const fullFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    const startDay = dayFormatter.format(start);
    const endDay = dayFormatter.format(end);
    const monthYear = monthYearFormatter.format(end).replace(/\s*г\.?$/, "");
    if (startDay === endDay) {
      return `${startDay} ${monthYear}`;
    }
    return `${startDay}–${endDay} ${monthYear}`;
  }

  if (sameYear) {
    const startPart = dayMonthFormatter.format(start);
    const endPart = fullFormatter.format(end).replace(/\s*г\.?$/, "");
    return `${startPart} – ${endPart}`;
  }

  const startFull = fullFormatter.format(start).replace(/\s*г\.?$/, "");
  const endFull = fullFormatter.format(end).replace(/\s*г\.?$/, "");
  return `${startFull} – ${endFull}`;
}
