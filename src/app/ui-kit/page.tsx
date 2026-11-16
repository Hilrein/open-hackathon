import { HackathonCard } from "@/components/hackathon-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { mockHackathons } from "@/lib/mock-hackathons";

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Базовые компоненты
        </h1>
        <p className="text-base text-muted-foreground">
          Служебная страница для проверки внешнего вида элементов интерфейса.
        </p>
      </div>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Кнопки</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg" className="min-h-11 px-5 text-base">
            Основная кнопка
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="min-h-11 px-5 text-base"
          >
            Вторичная кнопка
          </Button>
          <Button disabled size="lg" className="min-h-11 px-5 text-base">
            Неактивная кнопка
          </Button>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Карточка</h2>
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
        <h2 className="text-xl font-semibold">Поле ввода</h2>
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

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Метки</h2>
        <div className="flex flex-wrap gap-3">
          <Badge className="px-3 py-1 text-sm">Обычная метка</Badge>
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            Вторичная метка
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm">
            Контурная метка
          </Badge>
        </div>
      </section>

      <Separator />

      <section className="flex max-w-3xl flex-col gap-4">
        <h2 className="text-xl font-semibold">Уведомление</h2>
        <Alert className="p-4">
          <AlertTitle className="text-base font-semibold">
            Информационное сообщение
          </AlertTitle>
          <AlertDescription className="mt-1 text-base">
            Простой текст уведомления для проверки контраста и отступов.
          </AlertDescription>
        </Alert>
      </section>

      <Separator />

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold">Карточка хакатона</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sampleHackathons.map((hackathon) => (
            <HackathonCard key={hackathon.id} hackathon={hackathon} />
          ))}
        </div>
      </section>
    </div>
  );
}
