import type { Metadata } from "next";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";
import { HackathonCard } from "@/components/hackathon-card";
import { RetryButton } from "@/components/retry-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  HACKATHON_FORMAT_CONFIG,
  HACKATHON_STATUS_CONFIG,
} from "@/lib/hackathon-formatters";
import { mockHackathons } from "@/lib/mock-hackathons";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Дизайн-система и компоненты — Платформа хакатонов",
  description:
    "Служебная витрина цветовых токенов, типографики, состояний и базовых компонентов интерфейса.",
  robots: {
    index: false,
    follow: false,
  },
};

const BASE_SWATCHES = [
  {
    name: "Фон страницы",
    token: "--background",
    swatchClass: "bg-background border-border",
  },
  {
    name: "Карточка",
    token: "--card",
    swatchClass: "bg-card border-border",
  },
  {
    name: "Вложенный блок",
    token: "--surface-elevated",
    swatchClass: "bg-surface-elevated border-border",
  },
  {
    name: "Приглушённый фон",
    token: "--muted",
    swatchClass: "bg-muted border-border",
  },
  {
    name: "Основной текст",
    token: "--foreground",
    swatchClass: "bg-foreground border-foreground",
  },
  {
    name: "Второстепенный текст",
    token: "--muted-foreground",
    swatchClass: "bg-muted-foreground border-muted-foreground",
  },
  {
    name: "Граница",
    token: "--border",
    swatchClass: "bg-border border-border-strong",
  },
  {
    name: "Акцентная граница",
    token: "--border-strong",
    swatchClass: "bg-border-strong border-border-strong",
  },
  {
    name: "Граница поля",
    token: "--input",
    swatchClass: "bg-input border-input",
  },
  {
    name: "Фокус-кольцо",
    token: "--ring",
    swatchClass: "bg-ring border-ring",
  },
] as const;

const BRAND_SWATCHES = [
  {
    name: "Главное действие",
    token: "--primary",
    swatchClass: "bg-primary text-primary-foreground border-primary",
    sampleText: "Aa",
  },
  {
    name: "Наведение primary",
    token: "--primary-hover",
    swatchClass: "bg-primary-hover text-primary-foreground border-primary-hover",
    sampleText: "Aa",
  },
  {
    name: "Вторичная поверхность",
    token: "--secondary",
    swatchClass: "bg-secondary text-secondary-foreground border-border",
    sampleText: "Aa",
  },
  {
    name: "Мягкий акцент",
    token: "--accent",
    swatchClass: "bg-accent text-accent-foreground border-primary/20",
    sampleText: "Aa",
  },
] as const;

const SEMANTIC_SWATCHES = [
  {
    name: "Успех",
    token: "--success / --success-surface",
    swatchClass: "bg-success-surface text-success border-success/30",
    sampleText: "Готово",
  },
  {
    name: "Внимание",
    token: "--warning / --warning-surface",
    swatchClass: "bg-warning-surface text-warning border-warning/30",
    sampleText: "Важно",
  },
  {
    name: "Ошибка",
    token: "--destructive / --destructive-surface",
    swatchClass:
      "bg-destructive-surface text-destructive border-destructive/30",
    sampleText: "Ошибка",
  },
  {
    name: "Информация",
    token: "--info / --info-surface",
    swatchClass: "bg-info-surface text-info border-info/30",
    sampleText: "Справка",
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
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-2">
        <h1 className="type-h1 text-foreground">Дизайн-система и компоненты</h1>
        <p className="prose-measure text-base text-muted-foreground">
          Служебная витрина токенов палитры, типографики, глубины, состояний и
          базовых примитивов платформы хакатонов.
        </p>
      </div>

      <Separator />

      <section aria-labelledby="uikit-palette" className="flex flex-col gap-6">
        <h2 id="uikit-palette" className="type-h2 text-foreground">
          Палитра и градиенты
        </h2>

        <div className="flex flex-col gap-3">
          <h3 className="type-h3 text-foreground">
            Базовые поверхности, текст и границы
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {BASE_SWATCHES.map((item) => (
              <div
                key={item.token}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-card"
              >
                <div
                  className={cn(
                    "h-12 w-full rounded-lg border",
                    item.swatchClass
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {item.token}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="type-h3 text-foreground">Главное действие и акценты</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BRAND_SWATCHES.map((item) => (
              <div
                key={item.token}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-card"
              >
                <div
                  className={cn(
                    "flex h-12 w-full items-center justify-center rounded-lg border text-base font-bold",
                    item.swatchClass
                  )}
                >
                  {item.sampleText}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {item.token}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="type-h3 text-foreground">
            Смысловые пары (текст на подложке)
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SEMANTIC_SWATCHES.map((item) => (
              <div
                key={item.token}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-card"
              >
                <div
                  className={cn(
                    "flex h-12 w-full items-center justify-center rounded-lg border text-sm font-semibold",
                    item.swatchClass
                  )}
                >
                  {item.sampleText}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {item.token}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="type-h3 text-foreground">
            Статусы, форматы и градиенты
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Токены статусов (--status-*)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["upcoming", "active", "finished"] as const).map(
                      (status) => (
                        <Badge
                          key={status}
                          variant="outline"
                          className={cn(
                            "px-3 py-1 text-sm font-medium",
                            HACKATHON_STATUS_CONFIG[status].className
                          )}
                        >
                          {HACKATHON_STATUS_CONFIG[status].detailLabel}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Токены форматов (--format-*)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["online", "offline", "hybrid"] as const).map(
                      (format) => (
                        <Badge
                          key={format}
                          variant="outline"
                          className={cn(
                            "px-3 py-1 text-sm font-medium",
                            HACKATHON_FORMAT_CONFIG[format].className
                          )}
                        >
                          {HACKATHON_FORMAT_CONFIG[format].label}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <div className="bg-brand-gradient flex h-20 items-center justify-center rounded-xl text-base font-bold text-primary-foreground shadow-card">
                    Бренд
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    --gradient-brand
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="bg-hero-wash flex h-20 items-center justify-center rounded-xl border border-border text-sm font-medium text-foreground">
                    Мягкий фон hero
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    --gradient-hero-bg
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      <section
        aria-labelledby="uikit-typography"
        className="flex flex-col gap-5"
      >
        <h2 id="uikit-typography" className="type-h2 text-foreground">
          Типографика
        </h2>

        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="space-y-1">
              <p className="font-mono text-xs text-muted-foreground">
                h1 / .type-h1 (weight 800, tight tracking)
              </p>
              <p className="type-h1 text-foreground">
                Найдите хакатон или создайте свой
              </p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="font-mono text-xs text-muted-foreground">
                h2 / .type-h2 (weight 700, tight tracking)
              </p>
              <p className="type-h2 text-foreground">Ближайшие хакатоны</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="font-mono text-xs text-muted-foreground">
                h3 / .type-h3 (20px, weight 700)
              </p>
              <p className="type-h3 text-foreground">
                Соберите команду и сдайте проект
              </p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="font-mono text-xs text-muted-foreground">
                body / .type-body (16px, max-width 65ch)
              </p>
              <p className="type-body prose-measure text-foreground">
                Основной текст описаний ограничен комфортной шириной строки,
                чтобы длинные условия хакатонов и комментарии организатора легко
                читались на широком экране.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-xs text-muted-foreground">
                secondary / .type-secondary (14px) + tabular-nums
              </p>
              <p className="type-secondary text-muted-foreground">
                Второстепенные подписи, даты и подсказки под полями форм.
              </p>
              <div className="flex flex-wrap gap-4 pt-1 text-base font-semibold tabular-nums text-foreground">
                <span>1 место · 10 из 10</span>
                <span>2 место · 9 из 10</span>
                <span>48 / 120 участников</span>
                <span>184 / 2000 символов</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section aria-labelledby="uikit-buttons" className="flex flex-col gap-5">
        <h2 id="uikit-buttons" className="type-h2 text-foreground">
          Кнопки
        </h2>

        <div className="flex flex-col gap-4">
          <h3 className="type-h3 text-foreground">Варианты</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default">Основная</Button>
            <Button variant="secondary">Вторичная</Button>
            <Button variant="outline">Контурная</Button>
            <Button variant="ghost">Прозрачная</Button>
            <Button variant="destructive">Удалить</Button>
            <Button variant="link">Ссылка-кнопка</Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="type-h3 text-foreground">Размеры и состояния</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">Большая (48px)</Button>
            <Button size="default">Обычная (44px)</Button>
            <Button size="sm">Компактная (44px)</Button>
            <Button size="icon" aria-label="Добавить">
              <Plus className="size-4" aria-hidden="true" />
            </Button>
            <Button className="bg-primary-hover">Состояние hover</Button>
            <Button className="ring-3 ring-ring/40 outline-2 outline-offset-2 outline-ring">
              Состояние focus
            </Button>
            <Button disabled>Неактивная</Button>
            <Button disabled aria-busy="true">
              <RefreshCw
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Сохраняем...
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      <section aria-labelledby="uikit-fields" className="flex flex-col gap-5">
        <h2 id="uikit-fields" className="type-h2 text-foreground">
          Поля форм
        </h2>

        <Card>
          <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="uikit-input-default" className="text-base">
                Обычное поле
              </Label>
              <Input
                id="uikit-input-default"
                type="text"
                placeholder="Например: Хакатон городских сервисов"
                aria-describedby="uikit-input-default-hint"
              />
              <p
                id="uikit-input-default-hint"
                className="text-sm text-muted-foreground"
              >
                От 5 до 120 символов.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="uikit-input-error" className="text-base">
                Поле с ошибкой
              </Label>
              <Input
                id="uikit-input-error"
                type="text"
                defaultValue="Аб"
                aria-invalid="true"
                aria-describedby="uikit-input-error-hint uikit-input-error-msg"
              />
              <p
                id="uikit-input-error-hint"
                className="text-sm text-muted-foreground"
              >
                Подсказка остаётся видимой при ошибке.
              </p>
              <p
                id="uikit-input-error-msg"
                role="alert"
                className="text-sm font-medium text-destructive"
              >
                Название должно быть от 5 до 120 символов.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="uikit-select" className="text-base">
                Выпадающий список
              </Label>
              <div className="relative">
                <select
                  id="uikit-select"
                  defaultValue="online"
                  className="min-h-11 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-9 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                >
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="uikit-input-disabled" className="text-base">
                Заблокированное поле
              </Label>
              <Input
                id="uikit-input-disabled"
                type="text"
                value="Онлайн"
                disabled
                aria-describedby="uikit-input-disabled-hint"
              />
              <p
                id="uikit-input-disabled-hint"
                className="text-sm text-muted-foreground"
              >
                Для онлайн-хакатона место указывается автоматически.
              </p>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="uikit-textarea" className="text-base">
                Многострочное поле
              </Label>
              <textarea
                id="uikit-textarea"
                rows={3}
                placeholder="Опишите задачу простыми словами..."
                className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section aria-labelledby="uikit-badges" className="flex flex-col gap-5">
        <h2 id="uikit-badges" className="type-h2 text-foreground">
          Бейджи
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <Badge className="px-3 py-1 text-sm">Основной</Badge>
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            Вторичный
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm">
            Контурный
          </Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
            <UsersRound className="size-3.5" aria-hidden="true" />
            Команда
          </Badge>
          {(["upcoming", "active", "finished"] as const).map((status) => (
            <Badge
              key={status}
              variant="outline"
              className={cn(
                "px-3 py-1 text-sm font-medium",
                HACKATHON_STATUS_CONFIG[status].className
              )}
            >
              {HACKATHON_STATUS_CONFIG[status].label}
            </Badge>
          ))}
          {(["online", "offline", "hybrid"] as const).map((format) => (
            <Badge
              key={format}
              variant="outline"
              className={cn(
                "px-3 py-1 text-sm font-medium",
                HACKATHON_FORMAT_CONFIG[format].className
              )}
            >
              {HACKATHON_FORMAT_CONFIG[format].label}
            </Badge>
          ))}
        </div>
      </section>

      <Separator />

      <section aria-labelledby="uikit-cards" className="flex flex-col gap-5">
        <h2 id="uikit-cards" className="type-h2 text-foreground">
          Карточка хакатона
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sampleHackathons.map((hackathon) => (
            <HackathonCard key={hackathon.id} hackathon={hackathon} />
          ))}
        </div>
      </section>

      <Separator />

      <section aria-labelledby="uikit-alerts" className="flex flex-col gap-5">
        <h2 id="uikit-alerts" className="type-h2 text-foreground">
          Уведомления
        </h2>

        <div className="flex max-w-3xl flex-col gap-3">
          <Alert variant="info" role="status">
            <Info className="size-4" aria-hidden="true" />
            <AlertTitle>Информация</AlertTitle>
            <AlertDescription>
              Сдайте работу до окончания хакатона. В команде работу отправляет
              капитан.
            </AlertDescription>
          </Alert>

          <Alert variant="success" role="status">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            <AlertTitle>Готово</AlertTitle>
            <AlertDescription>
              Изменения сохранены и уже отображаются в каталоге.
            </AlertDescription>
          </Alert>

          <Alert variant="warning" role="status">
            <AlertTriangle className="size-4" aria-hidden="true" />
            <AlertTitle>Обратите внимание</AlertTitle>
            <AlertDescription>
              До окончания приёма работ осталось меньше часа.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive" role="alert">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>
              Не удалось сохранить данные. Проверьте поля формы и попробуйте ещё
              раз.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <Separator />

      <section aria-labelledby="uikit-states" className="flex flex-col gap-5">
        <h2 id="uikit-states" className="type-h2 text-foreground">
          Состояния: пустое, ошибка и скелетон
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <div
                aria-hidden="true"
                className="flex size-12 items-center justify-center rounded-full bg-surface-elevated text-muted-foreground"
              >
                <Search className="size-6" aria-hidden="true" />
              </div>
              <h3 className="type-h3 text-foreground">Ничего не найдено</h3>
              <p className="text-base text-muted-foreground">
                Попробуйте изменить запрос или сбросить фильтры.
              </p>
            </CardContent>
          </Card>

          <Card role="alert">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <h3 className="type-h3 text-foreground">
                Не удалось загрузить данные
              </h3>
              <p className="text-base text-muted-foreground">
                Попробуйте обновить страницу позже.
              </p>
              <RetryButton variant="default" />
            </CardContent>
          </Card>
        </div>

        <div
          role="status"
          aria-busy="true"
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <span className="sr-only">Пример скелетона загрузки...</span>
          <div className="flex flex-col gap-3">
            <div className="h-6 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded-lg bg-surface-elevated motion-reduce:animate-none" />
            <div className="h-4 w-2/3 animate-pulse rounded-lg bg-surface-elevated motion-reduce:animate-none" />
          </div>
        </div>
      </section>

      <Separator />

      <section aria-labelledby="uikit-depth" className="flex flex-col gap-5">
        <h2 id="uikit-depth" className="type-h2 text-foreground">
          Поверхности, тени, радиусы и фокус
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-5">
            <h3 className="type-h3 text-foreground">Фон страницы</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              bg-background — тёплая бумага.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="type-h3 text-foreground">Карточка</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              bg-card + border-border + shadow-card.
            </p>
          </div>
          <div className="rounded-xl border border-border-strong bg-surface-elevated p-5 shadow-card-hover">
            <h3 className="type-h3 text-foreground">Наведение / акцент</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              bg-surface-elevated + border-border-strong + shadow-card-hover.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h3 className="type-h3 text-foreground">Радиусы и фокус-кольцо</h3>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <div className="rounded-sm border border-border bg-surface-elevated px-4 py-2 text-sm font-medium">
              rounded-sm
            </div>
            <div className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium">
              rounded-lg
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated px-4 py-2 text-sm font-medium">
              rounded-xl
            </div>
            <div className="rounded-2xl border border-border bg-surface-elevated px-4 py-2 text-sm font-medium">
              rounded-2xl
            </div>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground ring-3 ring-ring/40 outline-2 outline-offset-2 outline-ring"
            >
              Видимый фокус (ring)
            </button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
