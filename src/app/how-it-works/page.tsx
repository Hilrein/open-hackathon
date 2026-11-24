import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Как это работает — Платформа хакатонов",
  description:
    "Пошаговые сценарии для участников и организаторов: от поиска хакатона и сборки команды до сдачи работы, оценивания и публикации результатов.",
};

const PARTICIPANT_STEPS = [
  {
    number: "1",
    title: "Найдите хакатон",
    description:
      "Откройте каталог и выберите интересное событие по теме, формату и датам проведения.",
  },
  {
    number: "2",
    title: "Присоединитесь",
    description:
      "Нажмите «Участвовать» на странице хакатона — после этого откроются разделы команды и работы.",
  },
  {
    number: "3",
    title: "Соберите команду",
    description:
      "При желании создайте команду и поделитесь кодом приглашения, либо войдите по коду капитана. Участвовать можно и в одиночку.",
  },
  {
    number: "4",
    title: "Сдайте работу",
    description:
      "Во время хакатона добавьте название, описание и ссылки на репозиторий или демо. Командную работу сдаёт капитан.",
  },
  {
    number: "5",
    title: "Посмотрите результаты",
    description:
      "После завершения организатор оценит проекты и оставит комментарии, а итоговый рейтинг появится на странице результатов.",
  },
] as const;

const ORGANIZER_STEPS = [
  {
    number: "1",
    title: "Создайте хакатон",
    description:
      "Заполните простую форму: название, описание задачи, даты, формат и при необходимости призовой фонд и теги.",
  },
  {
    number: "2",
    title: "Поделитесь ссылкой",
    description:
      "Отправьте страницу хакатона участникам, чтобы они могли ознакомиться с условиями и подать заявку.",
  },
  {
    number: "3",
    title: "Следите за участниками и командами",
    description:
      "В разделе «Мои хакатоны» видны все зарегистрированные участники, составы команд и сданные проекты.",
  },
  {
    number: "4",
    title: "Оцените работы и опубликуйте результаты",
    description:
      "После окончания хакатона поставьте оценки от 1 до 10 и оставьте обратную связь — оценённые работы появятся в публичных результатах.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Как это работает
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Платформа объединяет всё, что нужно для участия и проведения хакатона:
          регистрацию, команды, сдачу работ, оценивание и публикацию итогов.
        </p>
      </div>

      <section
        aria-labelledby="participant-flow-heading"
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <h2
            id="participant-flow-heading"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Для участников
          </h2>
          <p className="text-base text-muted-foreground">
            Пять шагов от выбора хакатона до получения оценки.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PARTICIPANT_STEPS.map((step) => (
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
      </section>

      <section
        aria-labelledby="organizer-flow-heading"
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <h2
            id="organizer-flow-heading"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Для организаторов
          </h2>
          <p className="text-base text-muted-foreground">
            Четыре шага, чтобы провести хакатон и подвести итоги.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {ORGANIZER_STEPS.map((step) => (
            <li key={step.number}>
              <Card className="h-full p-2">
                <CardHeader className="gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-10 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground"
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
      </section>

      <section
        aria-labelledby="get-started-heading"
        className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-6 shadow-xs sm:p-8"
      >
        <div className="flex flex-col gap-1.5">
          <h2
            id="get-started-heading"
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            С чего начать
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground">
            Выберите подходящий хакатон в каталоге или запустите собственное
            событие.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/hackathons"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "min-h-11 px-6 text-base"
            )}
          >
            Смотреть хакатоны
          </Link>
          <Link
            href="/create"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-11 px-6 text-base"
            )}
          >
            Создать хакатон
          </Link>
        </div>
      </section>
    </div>
  );
}
