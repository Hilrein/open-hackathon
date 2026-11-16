import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { HackathonCard } from "@/components/hackathon-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllHackathons } from "@/db/queries";
import {
  filterHackathons,
  hasActiveCatalogParams,
  parseHackathonCatalogParams,
  sortHackathons,
} from "@/lib/hackathon-catalog";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Хакатоны — Платформа хакатонов",
  description:
    "Каталог хакатонов: поиск по теме, городу, статусу и формату.",
};

interface HackathonsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function formatFoundCount(count: number): string {
  const abs = Math.abs(count) % 100;
  const lastDigit = abs % 10;

  if (abs > 10 && abs < 20) {
    return `Найдено ${count} хакатонов`;
  }
  if (lastDigit === 1) {
    return `Найден ${count} хакатон`;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `Найдено ${count} хакатона`;
  }
  return `Найдено ${count} хакатонов`;
}

function DatabaseErrorState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-6 py-14 text-center shadow-xs">
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">
          Не удалось загрузить хакатоны
        </h2>
        <p className="text-base text-muted-foreground">
          Попробуйте обновить страницу позже.
        </p>
      </div>
      <Link
        href="/hackathons"
        className={cn(
          buttonVariants({ variant: "default", size: "lg" }),
          "mt-2 min-h-11 px-6 text-base"
        )}
      >
        Обновить страницу
      </Link>
    </div>
  );
}

function EmptyDatabaseState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-6 py-14 text-center shadow-xs">
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">
          Пока нет хакатонов
        </h2>
        <p className="text-base text-muted-foreground">
          Как только организаторы добавят хакатоны, они появятся здесь.
        </p>
      </div>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "mt-2 min-h-11 px-6 text-base"
        )}
      >
        На главную
      </Link>
    </div>
  );
}

function NoMatchesState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-6 py-14 text-center shadow-xs">
      <div aria-hidden="true" className="text-4xl">
        🔍
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">
          Ничего не найдено
        </h2>
        <p className="text-base text-muted-foreground">
          Попробуйте изменить запрос или сбросить фильтры.
        </p>
      </div>
      <Link
        href="/hackathons"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "mt-2 min-h-11 px-6 text-base"
        )}
      >
        Сбросить фильтры
      </Link>
    </div>
  );
}

async function HackathonsCatalogContent({ searchParams }: HackathonsPageProps) {
  await connection();
  const rawParams = await searchParams;
  const params = parseHackathonCatalogParams(rawParams);
  const isFiltered = hasActiveCatalogParams(params);

  let allHackathons;
  try {
    allHackathons = await getAllHackathons();
  } catch (error: unknown) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка загрузки каталога хакатонов (${errorName}).`);
    return <DatabaseErrorState />;
  }

  if (allHackathons.length === 0) {
    return <EmptyDatabaseState />;
  }

  const filtered = filterHackathons(allHackathons, params);
  const results = sortHackathons(filtered, params.sort);
  const formKey = `${params.q}|${params.status}|${params.format}|${params.sort}`;

  return (
    <div className="flex flex-col gap-6">
      <form
        key={formKey}
        method="get"
        action="/hackathons"
        className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-12 lg:items-end"
      >
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
          <Label htmlFor="catalog-q" className="text-sm font-medium">
            Поиск
          </Label>
          <Input
            id="catalog-q"
            name="q"
            type="search"
            defaultValue={params.q}
            placeholder="Название, тема или город"
            className="min-h-11 text-base"
          />
        </div>

        <div className="flex flex-col gap-2 lg:col-span-2">
          <Label htmlFor="catalog-status" className="text-sm font-medium">
            Статус
          </Label>
          <select
            id="catalog-status"
            name="status"
            defaultValue={params.status}
            className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">Все статусы</option>
            <option value="upcoming">Скоро</option>
            <option value="active">Идёт сейчас</option>
            <option value="finished">Завершён</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 lg:col-span-2">
          <Label htmlFor="catalog-format" className="text-sm font-medium">
            Формат
          </Label>
          <select
            id="catalog-format"
            name="format"
            defaultValue={params.format}
            className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">Все форматы</option>
            <option value="online">Онлайн</option>
            <option value="offline">Офлайн</option>
            <option value="hybrid">Гибрид</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 lg:col-span-2">
          <Label htmlFor="catalog-sort" className="text-sm font-medium">
            Сортировка
          </Label>
          <select
            id="catalog-sort"
            name="sort"
            defaultValue={params.sort}
            className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="actual">Сначала актуальные</option>
            <option value="date-asc">Сначала ближайшие</option>
            <option value="date-desc">Сначала новые</option>
            <option value="participants">Больше участников</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-2 lg:justify-end">
          <Button
            type="submit"
            size="lg"
            className="min-h-11 flex-1 px-5 text-base lg:flex-initial"
          >
            Показать
          </Button>
          {isFiltered && (
            <Link
              href="/hackathons"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-11 px-4 text-base"
              )}
            >
              Сбросить
            </Link>
          )}
        </div>
      </form>

      <p className="text-base font-medium text-muted-foreground">
        {formatFoundCount(results.length)}
      </p>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((hackathon) => (
            <HackathonCard key={hackathon.id} hackathon={hackathon} />
          ))}
        </div>
      ) : (
        <NoMatchesState />
      )}
    </div>
  );
}

export default function HackathonsPage({ searchParams }: HackathonsPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Хакатоны
        </h1>
        <p className="text-lg text-muted-foreground">
          Найдите хакатон по теме, городу или формату.
        </p>
      </div>

      <Suspense
        fallback={
          <p className="text-base text-muted-foreground">
            Загружаем список хакатонов...
          </p>
        }
      >
        <HackathonsCatalogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
