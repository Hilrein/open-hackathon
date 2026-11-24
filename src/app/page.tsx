import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AlertCircle } from "lucide-react";
import { HackathonCard } from "@/components/hackathon-card";
import { RetryButton } from "@/components/retry-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { getAllHackathons } from "@/db/queries";
import { selectFeaturedHackathons } from "@/lib/hackathon-home";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Платформа хакатонов",
  description:
    "Простая платформа для поиска, организации и проведения хакатонов.",
};

const HOW_IT_WORKS_STEPS = [
  {
    number: "1",
    title: "Найдите хакатон",
    description: "Выберите хакатон, который вам интересен.",
  },
  {
    number: "2",
    title: "Соберите команду",
    description: "Объединитесь с участниками или подайте заявку.",
  },
  {
    number: "3",
    title: "Сдайте проект",
    description: "Выполните задание и отправьте результат.",
  },
] as const;

function FeaturedErrorState() {
  return (
    <Alert variant="destructive" role="alert" className="p-6">
      <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
      <AlertDescription className="flex flex-col items-start gap-4 text-base">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold text-foreground">
            Не удалось загрузить хакатоны
          </h3>
          <p className="text-base text-muted-foreground">
            Попробуйте обновить страницу позже.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RetryButton variant="default" size="lg" />
          <Link
            href="/hackathons"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-11 px-5 text-base"
            )}
          >
            Открыть каталог
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}

function FeaturedHackathonsSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Загружаем ближайшие хакатоны...</span>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
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
      <div className="h-11 w-56 animate-pulse rounded-lg border border-border bg-muted/40 motion-reduce:animate-none" />
    </div>
  );
}

function FeaturedEmptyState() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-foreground">
          Сейчас нет активных хакатонов
        </h3>
        <p className="text-base text-muted-foreground">
          Загляните позже или посмотрите весь каталог.
        </p>
      </div>
      <Link
        href="/hackathons"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "min-h-11 px-5 text-base"
        )}
      >
        Открыть каталог
      </Link>
    </div>
  );
}

async function FeaturedHackathonsContent() {
  await connection();

  let allHackathons;
  try {
    allHackathons = await getAllHackathons();
  } catch (error: unknown) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Ошибка загрузки ближайших хакатонов (${errorName}).`);
    return <FeaturedErrorState />;
  }

  const featured = selectFeaturedHackathons(allHackathons, 3);

  if (featured.length === 0) {
    return <FeaturedEmptyState />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((hackathon) => (
          <HackathonCard key={hackathon.id} hackathon={hackathon} />
        ))}
      </div>

      <div>
        <Link
          href="/hackathons"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "min-h-11 px-6 text-base"
          )}
        >
          Смотреть все хакатоны
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-start gap-6 py-4 sm:py-8">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Найдите хакатон или создайте свой
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Простая платформа для участников, организаторов и команд.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/hackathons"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "min-h-12 px-7 text-base font-semibold shadow-sm"
            )}
          >
            Смотреть хакатоны
          </Link>
          <Link
            href="/create"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-12 px-6 text-base"
            )}
          >
            Создать хакатон
          </Link>
        </div>
      </section>

      <section aria-labelledby="featured-heading" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2
            id="featured-heading"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Ближайшие хакатоны
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">
            Актуальные хакатоны, которые скоро начнутся или уже идут.
          </p>
        </div>

        <Suspense fallback={<FeaturedHackathonsSkeleton />}>
          <FeaturedHackathonsContent />
        </Suspense>
      </section>

      <section aria-labelledby="how-it-works-heading" className="flex flex-col gap-6">
        <h2
          id="how-it-works-heading"
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Как это работает
        </h2>

        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <li key={step.number}>
              <Card className="h-full p-2">
                <CardHeader className="gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
                  >
                    {step.number}
                  </span>
                  <h3 className="text-xl font-semibold leading-snug text-foreground">
                    {step.title}
                  </h3>
                  <CardDescription className="text-base leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ol>

        <div>
          <Link
            href="/how-it-works"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "min-h-11 px-4 text-base"
            )}
          >
            Подробнее о процессе
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="organizers-heading"
        className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-6 shadow-xs sm:p-8"
      >
        <div className="flex flex-col gap-2">
          <h2
            id="organizers-heading"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Хотите провести хакатон?
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            Создайте хакатон и соберите участников на одной платформе.
          </p>
        </div>
        <Link
          href="/create"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "min-h-11 px-6 text-base"
          )}
        >
          Создать хакатон
        </Link>
      </section>
    </div>
  );
}
