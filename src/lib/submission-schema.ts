import { z } from "zod";

function normalizeOptionalHttpUrl(
  value: string | null | undefined,
  ctx: z.RefinementCtx
): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > 500) {
    ctx.addIssue({
      code: "custom",
      message: "Ссылка не должна превышать 500 символов.",
    });
    return z.NEVER;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      ctx.addIssue({
        code: "custom",
        message: "Ссылка должна начинаться с http:// или https://.",
      });
      return z.NEVER;
    }
  } catch {
    ctx.addIssue({
      code: "custom",
      message: "Укажите корректную ссылку (начинается с http:// или https://).",
    });
    return z.NEVER;
  }

  return trimmed;
}

const optionalUrlSchema = z
  .string({ message: "Укажите корректную ссылку." })
  .nullable()
  .optional()
  .transform(normalizeOptionalHttpUrl);

export const submissionSchema = z.object({
  title: z
    .string({ message: "Укажите название проекта." })
    .trim()
    .min(5, "Название должно быть от 5 до 120 символов.")
    .max(120, "Название должно быть от 5 до 120 символов."),
  description: z
    .string({ message: "Добавьте описание проекта." })
    .trim()
    .min(20, "Описание должно быть от 20 до 2000 символов.")
    .max(2000, "Описание должно быть от 20 до 2000 символов."),
  repoUrl: optionalUrlSchema,
  demoUrl: optionalUrlSchema,
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
