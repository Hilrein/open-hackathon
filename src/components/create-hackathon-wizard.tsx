"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  formatHackathonDateRange,
} from "@/lib/hackathon-formatters";
import {
  getFirstStepForErrors,
  parseTagsInput,
  validateAllSteps,
  validateStep1,
  validateStep2,
  type WizardFieldErrors,
  type WizardFieldName,
  type WizardFormState,
  type WizardMode,
  type WizardStep,
} from "@/lib/hackathon-wizard-validation";
import type { Hackathon, HackathonFormat } from "@/types/hackathon";
import { cn } from "cn";

const STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: "О хакатоне" },
  { step: 2, label: "Когда и где" },
  { step: 3, label: "Детали и проверка" },
];

const FORMAT_OPTIONS: {
  value: HackathonFormat;
  label: string;
  description: string;
}[] = [
  {
    value: "online",
    label: "Онлайн",
    description: "Участники подключаются удалённо",
  },
  {
    value: "offline",
    label: "Офлайн",
    description: "Очная встреча на площадке",
  },
  {
    value: "hybrid",
    label: "Гибрид",
    description: "Можно участвовать очно или онлайн",
  },
];

interface CreateHackathonWizardProps {
  defaultOrganizerName?: string;
  mode?: WizardMode;
  initialHackathon?: Hackathon;
}

interface ApiHackathonMutationResponse {
  slug?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function buildInitialFormState(
  mode: WizardMode,
  defaultOrganizerName: string,
  initialHackathon?: Hackathon
): WizardFormState {
  if (mode === "edit" && initialHackathon) {
    return {
      title: initialHackathon.title,
      description: initialHackathon.description,
      startDate: toDatetimeLocalValue(initialHackathon.startDate),
      endDate: toDatetimeLocalValue(initialHackathon.endDate),
      format: initialHackathon.format,
      location:
        initialHackathon.format === "online" &&
        initialHackathon.location === "Онлайн"
          ? ""
          : initialHackathon.location,
      organizerName: initialHackathon.organizerName || defaultOrganizerName,
      maxParticipants:
        initialHackathon.maxParticipants !== undefined
          ? String(initialHackathon.maxParticipants)
          : "",
      prizePool: initialHackathon.prizePool ?? "",
      tagsInput: initialHackathon.tags.join(", "),
    };
  }

  return {
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    format: "online",
    location: "",
    organizerName: defaultOrganizerName,
    maxParticipants: "",
    prizePool: "",
    tagsInput: "",
  };
}

export function CreateHackathonWizard({
  defaultOrganizerName = "",
  mode = "create",
  initialHackathon,
}: CreateHackathonWizardProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";
  if (isEditMode && !initialHackathon) {
    throw new Error("initialHackathon is required when mode is edit");
  }

  const [step, setStep] = useState<WizardStep>(1);
  const [formState, setFormState] = useState<WizardFormState>(() =>
    buildInitialFormState(mode, defaultOrganizerName, initialHackathon)
  );
  const [fieldErrors, setFieldErrors] = useState<WizardFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof WizardFormState>(
    key: K,
    value: WizardFormState[K],
    errorKey?: WizardFieldName
  ) {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (errorKey && fieldErrors[errorKey]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
    if (serverError) {
      setServerError(null);
    }
  }

  function handleNextStep() {
    setServerError(null);
    if (step === 1) {
      const errors = validateStep1(formState);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
      setStep(2);
      return;
    }

    if (step === 2) {
      const errors = validateStep2(formState, mode);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
      setStep(3);
    }
  }

  function handlePrevStep() {
    setServerError(null);
    setFieldErrors({});
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setServerError(null);
    const { errors, firstErrorStep } = validateAllSteps(formState, mode);
    if (firstErrorStep !== null) {
      setFieldErrors(errors);
      setStep(firstErrorStep);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const parsedTags = parseTagsInput(formState.tagsInput);
    const trimmedOrganizer = formState.organizerName.trim();
    const trimmedPrize = formState.prizePool.trim();
    const maxParticipantsRaw = formState.maxParticipants.trim();

    const payload: Record<string, unknown> = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      startDate: new Date(formState.startDate).toISOString(),
      endDate: new Date(formState.endDate).toISOString(),
      format: formState.format,
      location:
        formState.format === "online" ? "Онлайн" : formState.location.trim(),
    };

    if (isEditMode) {
      payload.organizerName =
        trimmedOrganizer.length > 0 ? trimmedOrganizer : null;
      payload.maxParticipants =
        maxParticipantsRaw.length > 0 ? Number(maxParticipantsRaw) : null;
      payload.prizePool = trimmedPrize.length > 0 ? trimmedPrize : null;
      payload.tags = parsedTags;
    } else {
      if (trimmedOrganizer.length > 0) {
        payload.organizerName = trimmedOrganizer;
      }
      if (maxParticipantsRaw.length > 0) {
        payload.maxParticipants = Number(maxParticipantsRaw);
      }
      if (trimmedPrize.length > 0) {
        payload.prizePool = trimmedPrize;
      }
      if (parsedTags.length > 0) {
        payload.tags = parsedTags;
      }
    }

    const endpoint =
      isEditMode && initialHackathon
        ? `/api/hackathons/${encodeURIComponent(initialHackathon.id)}`
        : "/api/hackathons";
    const method = isEditMode ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        setServerError("Сессия истекла. Войдите снова.");
        setIsSubmitting(false);
        const redirectTarget =
          isEditMode && initialHackathon
            ? `/my-hackathons/${initialHackathon.id}/edit`
            : "/create";
        router.push(`/sign-in?redirect=${encodeURIComponent(redirectTarget)}`);
        return;
      }

      let data: ApiHackathonMutationResponse = {};
      try {
        data = (await response.json()) as ApiHackathonMutationResponse;
      } catch {
        data = {};
      }

      if (
        (isEditMode ? response.status === 200 : response.status === 201) &&
        data.slug
      ) {
        router.push(`/hackathons/${data.slug}`);
        router.refresh();
        return;
      }

      if (isEditMode && response.status === 403) {
        setServerError("Вы можете редактировать только свои хакатоны.");
        setIsSubmitting(false);
        return;
      }

      if (isEditMode && response.status === 404) {
        setServerError("Хакатон не найден.");
        setIsSubmitting(false);
        return;
      }

      if (response.status === 400) {
        if (data.fieldErrors) {
          const mappedErrors: WizardFieldErrors = {};
          const allowedKeys: WizardFieldName[] = [
            "title",
            "description",
            "startDate",
            "endDate",
            "format",
            "location",
            "organizerName",
            "maxParticipants",
            "prizePool",
            "tags",
          ];
          for (const key of allowedKeys) {
            const firstMsg = data.fieldErrors[key]?.[0];
            if (firstMsg) {
              mappedErrors[key] = firstMsg;
            }
          }
          setFieldErrors(mappedErrors);
          const errorStep = getFirstStepForErrors(mappedErrors);
          if (errorStep !== null) {
            setStep(errorStep);
          }
          setServerError("Проверьте поля формы.");
        } else {
          setServerError(
            data.error ||
              (isEditMode
                ? "Не удалось сохранить изменения. Проверьте данные."
                : "Не удалось создать хакатон. Проверьте данные.")
          );
        }
        setIsSubmitting(false);
        return;
      }

      setServerError(
        isEditMode
          ? "Не удалось сохранить изменения. Попробуйте позже."
          : "Не удалось создать хакатон. Попробуйте позже."
      );
      setIsSubmitting(false);
    } catch {
      setServerError(
        "Не удалось соединиться с сервером. Проверьте интернет и попробуйте ещё раз."
      );
      setIsSubmitting(false);
    }
  }

  const parsedTags = parseTagsInput(formState.tagsInput);
  const resolvedLocation =
    formState.format === "online"
      ? "Онлайн"
      : formState.location.trim() || "Не указано";

  const previewDateRange =
    formState.startDate &&
    formState.endDate &&
    !Number.isNaN(Date.parse(formState.startDate)) &&
    !Number.isNaN(Date.parse(formState.endDate))
      ? formatHackathonDateRange(
          new Date(formState.startDate).toISOString(),
          new Date(formState.endDate).toISOString()
        )
      : "Не указаны";

  const descriptionPreview =
    formState.description.trim().length > 160
      ? `${formState.description.trim().slice(0, 160)}...`
      : formState.description.trim();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          Шаг {step} из 3
        </p>

        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {STEPS.map((item) => {
            const isCurrent = item.step === step;
            const isCompleted = item.step < step;
            return (
              <li
                key={item.step}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium",
                  isCurrent &&
                    "border-primary bg-primary text-primary-foreground",
                  isCompleted && "border-primary/30 bg-accent text-foreground",
                  !isCurrent &&
                    !isCompleted &&
                    "border-border bg-card text-muted-foreground"
                )}
              >
                <span className="font-bold">{item.step}.</span>
                <span>{item.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {serverError && (
        <Alert variant="destructive" className="p-4">
          <AlertDescription className="text-base">
            {serverError}
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-2">
        <CardHeader className="gap-2">
          <CardTitle className="text-2xl font-bold sm:text-3xl">
            {step === 1 && "Расскажите о хакатоне"}
            {step === 2 && "Когда и где проходит хакатон"}
            {step === 3 && "Последние штрихи"}
          </CardTitle>
          <CardDescription className="text-base">
            {step === 1 &&
              "Название и описание помогут участникам понять, что вы хотите создать."}
            {step === 2 &&
              "Укажите даты и формат. Участникам важно понимать, сколько времени есть на работу."}
            {step === 3 &&
              "Эти поля необязательные. Заполните их, если хотите дать участникам больше информации."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {step === 1 && (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="wizard-title" className="text-base">
                      Название хакатона
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {formState.title.trim().length} / 120
                    </span>
                  </div>
                  <Input
                    id="wizard-title"
                    type="text"
                    value={formState.title}
                    onChange={(event) =>
                      updateField("title", event.target.value, "title")
                    }
                    placeholder="Например: Хакатон городских сервисов"
                    aria-invalid={Boolean(fieldErrors.title)}
                    aria-describedby={
                      fieldErrors.title
                        ? "wizard-title-error"
                        : "wizard-title-hint"
                    }
                    className="min-h-11 text-base"
                  />
                  <p
                    id="wizard-title-hint"
                    className="text-sm text-muted-foreground"
                  >
                    Коротко и понятно. От 5 до 120 символов.
                  </p>
                  {fieldErrors.title && (
                    <p
                      id="wizard-title-error"
                      className="text-sm font-medium text-destructive"
                    >
                      {fieldErrors.title}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="wizard-description" className="text-base">
                      Описание
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {formState.description.trim().length} / 2000
                    </span>
                  </div>
                  <textarea
                    id="wizard-description"
                    rows={5}
                    value={formState.description}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value,
                        "description"
                      )
                    }
                    placeholder="Что нужно сделать? Для кого этот хакатон? Какой результат ожидается?"
                    aria-invalid={Boolean(fieldErrors.description)}
                    aria-describedby={
                      fieldErrors.description
                        ? "wizard-description-error"
                        : "wizard-description-hint"
                    }
                    className="min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                  />
                  <p
                    id="wizard-description-hint"
                    className="text-sm text-muted-foreground"
                  >
                    Опишите задачу простыми словами. От 20 до 2000 символов.
                  </p>
                  {fieldErrors.description && (
                    <p
                      id="wizard-description-error"
                      className="text-sm font-medium text-destructive"
                    >
                      {fieldErrors.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Link
                    href={isEditMode ? "/my-hackathons" : "/hackathons"}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "min-h-11 px-5 text-base"
                    )}
                  >
                    Отмена
                  </Link>
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleNextStep}
                    className="min-h-11 px-6 text-base"
                  >
                    Далее
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wizard-start-date" className="text-base">
                      Начало
                    </Label>
                    <Input
                      id="wizard-start-date"
                      type="datetime-local"
                      value={formState.startDate}
                      onChange={(event) =>
                        updateField(
                          "startDate",
                          event.target.value,
                          "startDate"
                        )
                      }
                      aria-invalid={Boolean(fieldErrors.startDate)}
                      aria-describedby={
                        fieldErrors.startDate
                          ? "wizard-start-error"
                          : "wizard-start-hint"
                      }
                      className="min-h-11 text-base"
                    />
                    <p
                      id="wizard-start-hint"
                      className="text-sm text-muted-foreground"
                    >
                      Когда участники смогут начать работу.
                    </p>
                    {fieldErrors.startDate && (
                      <p
                        id="wizard-start-error"
                        className="text-sm font-medium text-destructive"
                      >
                        {fieldErrors.startDate}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wizard-end-date" className="text-base">
                      Окончание
                    </Label>
                    <Input
                      id="wizard-end-date"
                      type="datetime-local"
                      value={formState.endDate}
                      onChange={(event) =>
                        updateField("endDate", event.target.value, "endDate")
                      }
                      aria-invalid={Boolean(fieldErrors.endDate)}
                      aria-describedby={
                        fieldErrors.endDate
                          ? "wizard-end-error"
                          : "wizard-end-hint"
                      }
                      className="min-h-11 text-base"
                    />
                    <p
                      id="wizard-end-hint"
                      className="text-sm text-muted-foreground"
                    >
                      Когда нужно сдать проект.
                    </p>
                    {fieldErrors.endDate && (
                      <p
                        id="wizard-end-error"
                        className="text-sm font-medium text-destructive"
                      >
                        {fieldErrors.endDate}
                      </p>
                    )}
                  </div>
                </div>

                <fieldset className="flex flex-col gap-3">
                  <legend className="text-base font-medium text-foreground">
                    Формат
                  </legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {FORMAT_OPTIONS.map((option) => {
                      const isSelected = formState.format === option.value;
                      return (
                        <label
                          key={option.value}
                          className={cn(
                            "flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-colors",
                            isSelected
                              ? "border-primary bg-accent/50"
                              : "border-border bg-background hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="format"
                              value={option.value}
                              checked={isSelected}
                              onChange={() =>
                                updateField("format", option.value, "format")
                              }
                              className="size-4 accent-primary"
                            />
                            <span className="text-base font-semibold">
                              {option.label}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {option.description}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {fieldErrors.format && (
                    <p className="text-sm font-medium text-destructive">
                      {fieldErrors.format}
                    </p>
                  )}
                </fieldset>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="wizard-location" className="text-base">
                    Место проведения
                  </Label>
                  {formState.format === "online" ? (
                    <>
                      <Input
                        id="wizard-location"
                        type="text"
                        value="Онлайн"
                        disabled
                        className="min-h-11 text-base"
                      />
                      <p className="text-sm text-muted-foreground">
                        Для онлайн-хакатона место указывается автоматически.
                      </p>
                    </>
                  ) : (
                    <>
                      <Input
                        id="wizard-location"
                        type="text"
                        value={formState.location}
                        onChange={(event) =>
                          updateField(
                            "location",
                            event.target.value,
                            "location"
                          )
                        }
                        placeholder={
                          formState.format === "hybrid"
                            ? "Онлайн + Москва"
                            : "Например: Москва, Технопарк"
                        }
                        aria-invalid={Boolean(fieldErrors.location)}
                        aria-describedby={
                          fieldErrors.location
                            ? "wizard-location-error"
                            : "wizard-location-hint"
                        }
                        className="min-h-11 text-base"
                      />
                      <p
                        id="wizard-location-hint"
                        className="text-sm text-muted-foreground"
                      >
                        Укажите город и площадку, если они есть.
                      </p>
                      {fieldErrors.location && (
                        <p
                          id="wizard-location-error"
                          className="text-sm font-medium text-destructive"
                        >
                          {fieldErrors.location}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handlePrevStep}
                    className="min-h-11 px-5 text-base"
                  >
                    Назад
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleNextStep}
                    className="min-h-11 px-6 text-base"
                  >
                    Далее
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wizard-organizer" className="text-base">
                      Организатор
                    </Label>
                    <Input
                      id="wizard-organizer"
                      type="text"
                      value={formState.organizerName}
                      onChange={(event) =>
                        updateField(
                          "organizerName",
                          event.target.value,
                          "organizerName"
                        )
                      }
                      placeholder="Ваше имя или название организации"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(fieldErrors.organizerName)}
                      aria-describedby={
                        fieldErrors.organizerName
                          ? "wizard-organizer-error"
                          : "wizard-organizer-hint"
                      }
                      className="min-h-11 text-base"
                    />
                    <p
                      id="wizard-organizer-hint"
                      className="text-sm text-muted-foreground"
                    >
                      Если оставить пустым, мы подставим ваше имя.
                    </p>
                    {fieldErrors.organizerName && (
                      <p
                        id="wizard-organizer-error"
                        className="text-sm font-medium text-destructive"
                      >
                        {fieldErrors.organizerName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="wizard-max-participants"
                      className="text-base"
                    >
                      Максимум участников
                    </Label>
                    <Input
                      id="wizard-max-participants"
                      type="number"
                      min={1}
                      step={1}
                      value={formState.maxParticipants}
                      onChange={(event) =>
                        updateField(
                          "maxParticipants",
                          event.target.value,
                          "maxParticipants"
                        )
                      }
                      placeholder="Например: 200"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(fieldErrors.maxParticipants)}
                      aria-describedby={
                        fieldErrors.maxParticipants
                          ? "wizard-max-error"
                          : "wizard-max-hint"
                      }
                      className="min-h-11 text-base"
                    />
                    <p
                      id="wizard-max-hint"
                      className="text-sm text-muted-foreground"
                    >
                      Оставьте пустым, если лимита нет.
                    </p>
                    {fieldErrors.maxParticipants && (
                      <p
                        id="wizard-max-error"
                        className="text-sm font-medium text-destructive"
                      >
                        {fieldErrors.maxParticipants}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="wizard-prize" className="text-base">
                    Призовой фонд
                  </Label>
                  <Input
                    id="wizard-prize"
                    type="text"
                    value={formState.prizePool}
                    onChange={(event) =>
                      updateField("prizePool", event.target.value, "prizePool")
                    }
                    placeholder="Например: 500 000 ₽"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(fieldErrors.prizePool)}
                    aria-describedby={
                      fieldErrors.prizePool
                        ? "wizard-prize-error"
                        : "wizard-prize-hint"
                    }
                    className="min-h-11 text-base"
                  />
                  <p
                    id="wizard-prize-hint"
                    className="text-sm text-muted-foreground"
                  >
                    Можно указать сумму или написать «Без призов».
                  </p>
                  {fieldErrors.prizePool && (
                    <p
                      id="wizard-prize-error"
                      className="text-sm font-medium text-destructive"
                    >
                      {fieldErrors.prizePool}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="wizard-tags" className="text-base">
                    Темы и технологии
                  </Label>
                  <Input
                    id="wizard-tags"
                    type="text"
                    value={formState.tagsInput}
                    onChange={(event) =>
                      updateField("tagsInput", event.target.value, "tags")
                    }
                    placeholder="Например: AI, Дизайн, Python"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(fieldErrors.tags)}
                    aria-describedby={
                      fieldErrors.tags ? "wizard-tags-error" : "wizard-tags-hint"
                    }
                    className="min-h-11 text-base"
                  />
                  <p
                    id="wizard-tags-hint"
                    className="text-sm text-muted-foreground"
                  >
                    До 8 тегов через запятую.
                  </p>
                  {fieldErrors.tags && (
                    <p
                      id="wizard-tags-error"
                      className="text-sm font-medium text-destructive"
                    >
                      {fieldErrors.tags}
                    </p>
                  )}
                  {parsedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {parsedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="px-2.5 py-0.5 text-sm font-normal"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {isEditMode
                      ? "Проверьте перед сохранением"
                      : "Проверьте перед созданием"}
                  </h2>
                  <dl className="flex flex-col gap-2 text-base">
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Название
                      </dt>
                      <dd className="font-medium text-foreground">
                        {formState.title.trim()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Описание
                      </dt>
                      <dd className="text-foreground">{descriptionPreview}</dd>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div>
                        <dt className="text-sm text-muted-foreground">Даты</dt>
                        <dd className="font-medium text-foreground">
                          {previewDateRange}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">
                          Формат
                        </dt>
                        <dd className="font-medium text-foreground">
                          {HACKATHON_FORMAT_CONFIG[formState.format].label}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Место</dt>
                        <dd className="font-medium text-foreground">
                          {resolvedLocation}
                        </dd>
                      </div>
                    </div>
                    {formState.organizerName.trim() && (
                      <div>
                        <dt className="text-sm text-muted-foreground">
                          Организатор
                        </dt>
                        <dd className="font-medium text-foreground">
                          {formState.organizerName.trim()}
                        </dd>
                      </div>
                    )}
                    {formState.maxParticipants.trim() && (
                      <div>
                        <dt className="text-sm text-muted-foreground">
                          Максимум участников
                        </dt>
                        <dd className="font-medium text-foreground">
                          {formState.maxParticipants.trim()}
                        </dd>
                      </div>
                    )}
                    {formState.prizePool.trim() && (
                      <div>
                        <dt className="text-sm text-muted-foreground">
                          Призовой фонд
                        </dt>
                        <dd className="font-medium text-foreground">
                          {formState.prizePool.trim()}
                        </dd>
                      </div>
                    )}
                    {parsedTags.length > 0 && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Теги</dt>
                        <dd className="mt-1 flex flex-wrap gap-1.5">
                          {parsedTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="px-2.5 py-0.5 text-xs font-normal"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={isSubmitting}
                    onClick={handlePrevStep}
                    className="min-h-11 px-5 text-base"
                  >
                    Назад
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="min-h-11 px-6 text-base"
                  >
                    {isEditMode
                      ? isSubmitting
                        ? "Сохраняем..."
                        : "Сохранить изменения"
                      : isSubmitting
                        ? "Создаём хакатон..."
                        : "Создать хакатон"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
