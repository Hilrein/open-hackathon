import type { HackathonFormat } from "@/types/hackathon";

export type WizardStep = 1 | 2 | 3;

export type WizardMode = "create" | "edit";

export type WizardFieldName =
  | "title"
  | "description"
  | "startDate"
  | "endDate"
  | "format"
  | "location"
  | "organizerName"
  | "maxParticipants"
  | "prizePool"
  | "tags";

export type WizardFieldErrors = Partial<Record<WizardFieldName, string>>;

export interface WizardFormState {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  format: HackathonFormat;
  location: string;
  organizerName: string;
  maxParticipants: string;
  prizePool: string;
  tagsInput: string;
}

const MAX_PAST_SKEW_MS = 60_000;

export function parseTagsInput(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function validateStep1(state: WizardFormState): WizardFieldErrors {
  const errors: WizardFieldErrors = {};
  const title = state.title.trim();
  const description = state.description.trim();

  if (title.length === 0) {
    errors.title = "Введите название хакатона.";
  } else if (title.length < 5 || title.length > 120) {
    errors.title = "Название должно быть от 5 до 120 символов.";
  }

  if (description.length === 0) {
    errors.description = "Добавьте описание хакатона.";
  } else if (description.length < 20 || description.length > 2000) {
    errors.description = "Описание должно быть от 20 до 2000 символов.";
  }

  return errors;
}

export function validateStep2(
  state: WizardFormState,
  mode: WizardMode = "create"
): WizardFieldErrors {
  const errors: WizardFieldErrors = {};

  if (!state.startDate) {
    errors.startDate = "Укажите дату начала.";
  } else {
    const startMs = Date.parse(state.startDate);
    if (Number.isNaN(startMs)) {
      errors.startDate = "Укажите корректную дату начала.";
    } else if (mode === "create" && startMs < Date.now() - MAX_PAST_SKEW_MS) {
      errors.startDate = "Дата начала должна быть в будущем.";
    }
  }

  if (!state.endDate) {
    errors.endDate = "Укажите дату окончания.";
  } else {
    const endMs = Date.parse(state.endDate);
    if (Number.isNaN(endMs)) {
      errors.endDate = "Укажите корректную дату окончания.";
    } else if (state.startDate && !Number.isNaN(Date.parse(state.startDate))) {
      if (endMs <= Date.parse(state.startDate)) {
        errors.endDate = "Дата окончания должна быть позже даты начала.";
      }
    }
  }

  if (
    state.format !== "online" &&
    state.format !== "offline" &&
    state.format !== "hybrid"
  ) {
    errors.format = "Выберите формат.";
  }

  if (state.format !== "online") {
    const location = state.location.trim();
    if (location.length === 0) {
      errors.location = "Укажите место проведения.";
    } else if (location.length < 2 || location.length > 120) {
      errors.location = "Место проведения должно быть от 2 до 120 символов.";
    }
  }

  return errors;
}

export function validateStep3(state: WizardFormState): WizardFieldErrors {
  const errors: WizardFieldErrors = {};
  const organizerName = state.organizerName.trim();
  const prizePool = state.prizePool.trim();
  const maxParticipantsRaw = state.maxParticipants.trim();
  const tags = parseTagsInput(state.tagsInput);

  if (organizerName.length > 80) {
    errors.organizerName =
      "Название организатора не должно превышать 80 символов.";
  }

  if (maxParticipantsRaw.length > 0) {
    const parsed = Number(maxParticipantsRaw);
    if (!Number.isInteger(parsed) || parsed < 1) {
      errors.maxParticipants =
        "Лимит участников должен быть положительным числом.";
    } else if (parsed > 100_000) {
      errors.maxParticipants = "Лимит участников не может превышать 100 000.";
    }
  }

  if (prizePool.length > 50) {
    errors.prizePool = "Призовой фонд не должен превышать 50 символов.";
  }

  if (tags.length > 8) {
    errors.tags = "Можно указать не больше 8 тегов.";
  } else if (tags.some((tag) => tag.length > 30)) {
    errors.tags = "Каждый тег должен быть не длиннее 30 символов.";
  }

  return errors;
}

export function validateAllSteps(
  state: WizardFormState,
  mode: WizardMode = "create"
): {
  errors: WizardFieldErrors;
  firstErrorStep: WizardStep | null;
} {
  const step1Errors = validateStep1(state);
  const step2Errors = validateStep2(state, mode);
  const step3Errors = validateStep3(state);
  const errors: WizardFieldErrors = {
    ...step1Errors,
    ...step2Errors,
    ...step3Errors,
  };

  if (Object.keys(step1Errors).length > 0) {
    return { errors, firstErrorStep: 1 };
  }
  if (Object.keys(step2Errors).length > 0) {
    return { errors, firstErrorStep: 2 };
  }
  if (Object.keys(step3Errors).length > 0) {
    return { errors, firstErrorStep: 3 };
  }
  return { errors: {}, firstErrorStep: null };
}

export function getFirstStepForErrors(
  errors: WizardFieldErrors
): WizardStep | null {
  if (errors.title || errors.description) {
    return 1;
  }
  if (errors.startDate || errors.endDate || errors.format || errors.location) {
    return 2;
  }
  if (
    errors.organizerName ||
    errors.maxParticipants ||
    errors.prizePool ||
    errors.tags
  ) {
    return 3;
  }
  return null;
}
