import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STEPS = [
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

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Как это работает
      </h1>

      <ol className="grid gap-6 md:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.number}>
            <Card className="h-full p-2">
              <CardHeader className="gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {step.number}
                </span>
                <CardTitle className="text-xl">{step.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {step.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
