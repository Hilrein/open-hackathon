import { z } from "zod";

function normalizeOptionalFeedback(
  value: string | null | undefined
): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const reviewSchema = z.object({
  score: z
    .number({ message: "Оценка должна быть целым числом от 1 до 10." })
    .int("Оценка должна быть целым числом от 1 до 10.")
    .min(1, "Оценка должна быть целым числом от 1 до 10.")
    .max(10, "Оценка должна быть целым числом от 1 до 10."),
  feedback: z
    .string({ message: "Комментарий должен быть текстом." })
    .trim()
    .max(2000, "Комментарий не длиннее 2000 символов.")
    .nullable()
    .optional()
    .transform(normalizeOptionalFeedback),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
