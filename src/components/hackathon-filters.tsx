"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  HackathonFiltersState,
  HackathonFormatFilter,
  HackathonSortOption,
  HackathonStatusFilter,
} from "@/lib/filter-hackathons";

const STATUS_LABELS: Record<HackathonStatusFilter, string> = {
  all: "Все статусы",
  upcoming: "Скоро",
  active: "Идёт сейчас",
  finished: "Завершён",
};

const FORMAT_LABELS: Record<HackathonFormatFilter, string> = {
  all: "Все форматы",
  online: "Онлайн",
  offline: "Офлайн",
  hybrid: "Гибрид",
};

const SORT_LABELS: Record<HackathonSortOption, string> = {
  "date-asc": "По дате (ближайшие)",
  "date-desc": "По дате (поздние)",
  "participants-desc": "По количеству участников",
};

interface HackathonFiltersProps {
  filters: HackathonFiltersState;
  hasActiveFilters: boolean;
  onChange: (next: HackathonFiltersState) => void;
  onReset: () => void;
}

export function HackathonFilters({
  filters,
  hasActiveFilters,
  onChange,
  onReset,
}: HackathonFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs lg:flex-row lg:items-center lg:gap-4">
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="Поиск по названию..."
          aria-label="Поиск по названию"
          className="min-h-11 pl-10 text-base"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap lg:gap-3">
        <Select
          value={filters.status}
          onValueChange={(value) => {
            if (value) {
              onChange({
                ...filters,
                status: value as HackathonStatusFilter,
              });
            }
          }}
        >
          <SelectTrigger
            aria-label="Фильтр по статусу"
            className="min-h-11 w-full bg-background px-3 text-base sm:w-44"
          >
            <SelectValue>
              {(value: string | null) =>
                value
                  ? STATUS_LABELS[value as HackathonStatusFilter] ?? value
                  : STATUS_LABELS.all
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="py-2 text-base">
              {STATUS_LABELS.all}
            </SelectItem>
            <SelectItem value="upcoming" className="py-2 text-base">
              {STATUS_LABELS.upcoming}
            </SelectItem>
            <SelectItem value="active" className="py-2 text-base">
              {STATUS_LABELS.active}
            </SelectItem>
            <SelectItem value="finished" className="py-2 text-base">
              {STATUS_LABELS.finished}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.format}
          onValueChange={(value) => {
            if (value) {
              onChange({
                ...filters,
                format: value as HackathonFormatFilter,
              });
            }
          }}
        >
          <SelectTrigger
            aria-label="Фильтр по формату"
            className="min-h-11 w-full bg-background px-3 text-base sm:w-44"
          >
            <SelectValue>
              {(value: string | null) =>
                value
                  ? FORMAT_LABELS[value as HackathonFormatFilter] ?? value
                  : FORMAT_LABELS.all
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="py-2 text-base">
              {FORMAT_LABELS.all}
            </SelectItem>
            <SelectItem value="online" className="py-2 text-base">
              {FORMAT_LABELS.online}
            </SelectItem>
            <SelectItem value="offline" className="py-2 text-base">
              {FORMAT_LABELS.offline}
            </SelectItem>
            <SelectItem value="hybrid" className="py-2 text-base">
              {FORMAT_LABELS.hybrid}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(value) => {
            if (value) {
              onChange({
                ...filters,
                sort: value as HackathonSortOption,
              });
            }
          }}
        >
          <SelectTrigger
            aria-label="Сортировка"
            className="min-h-11 w-full bg-background px-3 text-base sm:w-64"
          >
            <SelectValue>
              {(value: string | null) =>
                value
                  ? SORT_LABELS[value as HackathonSortOption] ?? value
                  : SORT_LABELS["date-asc"]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-asc" className="py-2 text-base">
              {SORT_LABELS["date-asc"]}
            </SelectItem>
            <SelectItem value="date-desc" className="py-2 text-base">
              {SORT_LABELS["date-desc"]}
            </SelectItem>
            <SelectItem value="participants-desc" className="py-2 text-base">
              {SORT_LABELS["participants-desc"]}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="min-h-11 w-full px-4 text-base lg:w-auto"
        >
          Сбросить фильтры
        </Button>
      )}
    </div>
  );
}
