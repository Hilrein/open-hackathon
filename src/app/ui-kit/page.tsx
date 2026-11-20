import Link from "next/link";
import { UsersRound } from "lucide-react";
import { HackathonCard } from "@/components/hackathon-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  HACKATHON_FORMAT_CONFIG,
  HACKATHON_STATUS_CONFIG,
} from "@/lib/hackathon-formatters";
import { mockHackathons } from "@/lib/mock-hackathons";
import { cn } from "cn";

const PALETTE_SWATCHES = [
  {
    name: "Фон",
    token: "--background",
    className: "bg-background text-foreground border-border",
  },
  {
    name: "Карточка",
    token: "--card",
    className: "bg-card text-foreground border-border",
  },
  {
    name: "Приглушённый слой",
    token: "--muted",
    className: "bg-muted text-foreground border-border",
  },
  {
    name: "Главное действие",
    token: "--primary",
    className: "bg-primary text-primary-foreground border-transparent",
  },
  {
    name: "Наведение",
    token: "--primary-hover",
    className: "bg-primary-hover text-primary-foreground border-transparent",
  },
  {
    name: "Акцент",
    token: "--accent",
    className: "bg-accent text-accent-foreground border-primary/20",
  },
  {
    name: "Успех",
    token: "--success",
    className: "bg-success-bg text-success border-success/25",
  },
  {
    name: "Предупреждение",
    token: "--warning",
    className: "bg-warning-bg text-warning border-warning/25",
  },
  {
    name: "Ошибка",
    token: "--destructive",
    className: "bg-destructive-bg text-destructive border-destructive/25",
  },
  {
    name: "Информация",
    token: "--info",
    className: "bg-info-bg text-info border-info/25",
  },
] as const;

export default function UiKitPage() {
  const sampleHackathons = [
    mockHackathons.find(
      (item) => item.status === "upcoming" && item.format === "online"
    ),
    mockHackathons.find(
      (item) => item.status === "active" && item.format === "offline"
    ),
    mockHackathons.find(
      (item) => item.status === "finished" && item.format === "hybrid"
    ),
  ].filter((item): item is NonNullable<typeof item> => item !== undefined);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Базовые компоненты
        </h1>
        <p className="max-w-[60ch] text-base text-muted-foreground">
          Служебная страница для проверки внешнего вида элементов интерфейса.
        </p>
      </div>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Палитра</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PALETTE_SWATCHES.map((swatch) => (
            <div
              key={swatch.token}
              className={cn(
                "flex min-h-24 flex-col justify-between rounded-xl border p-3.5 shadow-xs",
                swatch.className
              )}
            >
              <span className="text-sm font-semibold">{swatch.name}</span>
              <code className="font-mono text-xs opacity-85">
                {swatch.token}
              </code>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Типографика</h2>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">H1</p>
              <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Найдите хакатон или создайте свой
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">H2</p>
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Ближайшие хакатоны
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">H3</p>
              <p className="text-xl font-bold tracking-tight text-foreground">
                Заголовок карточки
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Основной текст и табличные числа
              </p>
              <p className="max-w-[62ch] text-base leading-relaxed text-foreground">
                Основной текст набирается от 16px с комфортным межстрочным
                интервалом. Счётчики и оценки используют табличные цифры:{" "}
                <span className="font-semibold tabular-nums">
                  1 место · 9 из 10 · 42 / 120
                </span>
                .
              </p>
              <p className="text-sm text-muted-foreground">
                Второстепенный текст от 14px остаётся контрастным и читаемым.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Кнопки</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Основная кнопка</Button>
          <Button variant="secondary" size="lg">
            Вторичная кнопка
          </Button>
          <Button variant="outline" size="lg">
            Контурная кнопка
          </Button>
          <Button variant="ghost" size="lg">
            Текстовая кнопка
          </Button>
          <Button variant="destructive" size="lg">
            Удалить
          </Button>
          <Button disabled size="lg">
            Неактивная кнопка
          </Button>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Метки</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="outline" className={HACKATHON_STATUS_CONFIG.upcoming.className}>
              {HACKATHON_STATUS_CONFIG.upcoming.label}
            </Badge>
            <Badge variant="outline" className={HACKATHON_STATUS_CONFIG.active.className}>
              {HACKATHON_STATUS_CONFIG.active.detailLabel}
            </Badge>
            <Badge variant="outline" className={HACKATHON_STATUS_CONFIG.finished.className}>
              {HACKATHON_STATUS_CONFIG.finished.label}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="outline" className={HACKATHON_FORMAT_CONFIG.online.className}>
              {HACKATHON_FORMAT_CONFIG.online.label}
            </Badge>
            <Badge variant="outline" className={HACKATHON_FORMAT_CONFIG.offline.className}>
              {HACKATHON_FORMAT_CONFIG.offline.label}
            </Badge>
            <Badge variant="outline" className={HACKATHON_FORMAT_CONFIG.hybrid.className}>
              {HACKATHON_FORMAT_CONFIG.hybrid.label}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1.5 border-team/30 bg-team-bg text-team"
            >
              <UsersRound className="size-3.5" aria-hidden="true" />
              Команда
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Badge>Обычная метка</Badge>
            <Badge variant="secondary">Вторичная метка</Badge>
            <Badge variant="outline">Контурная метка</Badge>
            <Badge variant="destructive">Ошибка</Badge>
          </div>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Карточка</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Заголовок карточки</CardTitle>
            <CardDescription className="text-base">
              Короткое пояснение к содержимому карточки.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-base">
            Пример простого текста внутри карточки для проверки отступов и
            читаемости.
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Поле ввода</h2>
        <div className="flex max-w-md flex-col gap-2">
          <Label htmlFor="sample-input" className="text-base">
            Подпись поля
          </Label>
          <Input
            id="sample-input"
            type="text"
            placeholder="Введите текст"
            className="min-h-11 text-base"
          />
        </div>
      </section>

      <Separator />

      <section className="flex max-w-3xl flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Уведомление</h2>
        <Alert className="p-4">
          <AlertTitle className="text-base font-semibold">
            Информационное сообщение
          </AlertTitle>
          <AlertDescription className="mt-1 text-base">
            Простой текст уведомления для проверки контраста и отступов.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive" className="p-4">
          <AlertTitle className="text-base font-semibold">
            Не удалось загрузить хакатоны
          </AlertTitle>
          <AlertDescription className="mt-1 text-base">
            Попробуйте обновить страницу позже.
          </AlertDescription>
        </Alert>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Пустое состояние</h2>
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-muted/45 px-6 py-12 text-center shadow-xs">
          <div className="flex max-w-md flex-col gap-2">
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Ничего не найдено
            </h3>
            <p className="text-base text-muted-foreground">
              Попробуйте изменить запрос или сбросить фильтры.
            </p>
          </div>
          <Link
            href="/hackathons"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "mt-1 min-h-11 px-6 text-base"
            )}
          >
            Сбросить фильтры
          </Link>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold tracking-tight">Карточка хакатона</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sampleHackathons.map((hackathon) => (
            <HackathonCard key={hackathon.id} hackathon={hackathon} />
          ))}
        </div>
      </section>
    </div>
  );
}
