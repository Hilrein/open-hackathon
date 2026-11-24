import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronDown, Search } from "lucide-react";
import { HackathonCard } from "@/components/hackathon-card";
import { RetryButton } from "@/components/retry-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildCatalogSearchParams,
  hasActiveCatalogParams,
  parseCatalogPage,
  parseHackathonCatalogParams,
} from "@/lib/hackathon-catalog";
import {
  getHackathonsCatalogPage,
  getTotalHackathonsCount,
} from "@/lib/hackathon-catalog-query";
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
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-6 py-14 text-center shadow-xs"
    >
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">
          Не удалось загрузить хакатоны
        </h2>
        <p className="text-base text-muted-foreground">
          Попробуйте обновить страницу позже.
        </p>
      </div>
      <RetryButton variant="default" size="lg" className="mt-2 px-6" />
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
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/create"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "min-h-11 px-6 text-base"
          )}
        >
          Создать хакатон
        </Link>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "min-h-11 px-6 text-base"
          )}
        >
          На главную
        </Link>
      </div>
    </div>
  );
}

function NoMatchesState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-6 py-14 text-center shadow-xs">
      <div
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <Search className="size-6" aria-hidden="true" />
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

function HackathonsCatalogSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Загружаем список хакатонов...</span>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-12">
        <div className="h-11 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none sm:col-span-2 lg:col-span-6" />
        <div className="h-11 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none lg:col-span-3" />
        <div className="h-11 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none lg:col-span-3" />
        <div className="h-11 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none sm:col-span-2 lg:col-span-5" />
        <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-7">
          <div className="h-11 w-32 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
        </div>
      </div>

      <div className="h-6 w-40 animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="flex h-96 flex-col overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="h-32 animate-pulse bg-muted/50 motion-reduce:animate-none" />
            <div className="flex flex-1 flex-col gap-3 p-6">
              <div className="flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded-full bg-muted/50 motion-reduce:animate-none" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-muted/40 motion-reduce:animate-none" />
              </div>
              <div className="h-7 w-3/4 animate-pulse rounded bg-muted/50 motion-reduce:animate-none" />
              <div className="h-10 w-full animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
              <div className="mt-auto space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function HackathonsCatalogContent({ searchParams }: HackathonsPageProps) {
  await connection();
  const rawParams = await searchParams;
  const params = parseHackathonCatalogParams(rawParams);
  const requestedPage = parseCatalogPage(rawParams.page);
  const isFiltered = hasActiveCatalogParams(params);

  let catalogPage;
  let isDatabaseEmpty = false;
  try {
    catalogPage = await getHackathonsCatalogPage(params, requestedPage);
    if (catalogPage.total === 0) {
      if (!isFiltered) {
        isDatabaseEmpty = true;
      } else {
        const totalInDatabase = await getTotalHackathonsCount();
        isDatabaseEmpty = totalInDatabase === 0;
      }
    }
  } catch (error: unknown) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка загрузки каталога хакатонов (${errorName}).`);
    return <DatabaseErrorState />;
  }

  if (isDatabaseEmpty) {
    return <EmptyDatabaseState />;
  }

  const formKey = `${params.q}|${params.status}|${params.format}|${params.sort}`;

  function buildPageHref(targetPage: number): string {
    const queryString = buildCatalogSearchParams(params, targetPage).toString();
    return queryString ? `/hackathons?${queryString}` : "/hackathons";
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        key={formKey}
        method="get"
        action="/hackathons"
        className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-12 lg:items-end"
      >
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-6">
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

        <div className="flex flex-col gap-2 lg:col-span-3">
          <Label htmlFor="catalog-status" className="text-sm font-medium">
            Статус
          </Label>
          <div className="relative">
            <select
              id="catalog-status"
              name="status"
              defaultValue={params.status}
              className="min-h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <option value="all">Все статусы</option>
              <option value="upcoming">Скоро</option>
              <option value="active">Идёт сейчас</option>
              <option value="finished">Завершён</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:col-span-3">
          <Label htmlFor="catalog-format" className="text-sm font-medium">
            Формат
          </Label>
          <div className="relative">
            <select
              id="catalog-format"
              name="format"
              defaultValue={params.format}
              className="min-h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <option value="all">Все форматы</option>
              <option value="online">Онлайн</option>
              <option value="offline">Офлайн</option>
              <option value="hybrid">Гибрид</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-5">
          <Label htmlFor="catalog-sort" className="text-sm font-medium">
            Сортировка
          </Label>
          <div className="relative">
            <select
              id="catalog-sort"
              name="sort"
              defaultValue={params.sort}
              className="min-h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <option value="actual">Сначала актуальные</option>
              <option value="date-asc">Сначала ближайшие</option>
              <option value="date-desc">Сначала новые</option>
              <option value="participants">Больше участников</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-7 lg:justify-end">
          <Button
            type="submit"
            size="default"
            className="min-h-11 flex-1 whitespace-nowrap px-5 text-base sm:flex-initial"
          >
            Показать
          </Button>
          {isFiltered && (
            <Link
              href="/hackathons"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "min-h-11 whitespace-nowrap px-4 text-base"
              )}
            >
              Сбросить
            </Link>
          )}
        </div>
      </form>

      {catalogPage.total > 0 ? (
        <p
          aria-live="polite"
          className="text-base font-medium text-muted-foreground"
        >
          {formatFoundCount(catalogPage.total)}
        </p>
      ) : null}

      {catalogPage.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {catalogPage.items.map((hackathon) => (
              <HackathonCard
                key={hackathon.id}
                hackathon={hackathon}
                headingLevel="h2"
              />
            ))}
          </div>

          {catalogPage.totalPages > 1 ? (
            <nav
              aria-label="Пагинация каталога"
              className="flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row"
            >
              {catalogPage.page > 1 ? (
                <Link
                  href={buildPageHref(catalogPage.page - 1)}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "min-h-11 w-full px-5 text-base sm:w-auto"
                  )}
                >
                  Назад
                </Link>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled
                  className="min-h-11 w-full px-5 text-base sm:w-auto"
                >
                  Назад
                </Button>
              )}

              <p className="text-sm font-medium text-muted-foreground sm:text-base">
                Страница {catalogPage.page} из {catalogPage.totalPages}
              </p>

              {catalogPage.page < catalogPage.totalPages ? (
                <Link
                  href={buildPageHref(catalogPage.page + 1)}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "min-h-11 w-full px-5 text-base sm:w-auto"
                  )}
                >
                  Вперёд
                </Link>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled
                  className="min-h-11 w-full px-5 text-base sm:w-auto"
                >
                  Вперёд
                </Button>
              )}
            </nav>
          ) : null}
        </>
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

      <Suspense fallback={<HackathonsCatalogSkeleton />}>
        <HackathonsCatalogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
