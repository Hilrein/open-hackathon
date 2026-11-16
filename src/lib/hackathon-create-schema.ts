import { z } from "zod";

const MAX_PAST_SKEW_MS = 60_000;

export const hackathonCreateSchema = z
  .object({
    title: z
      .string({ message: "Укажите название хакатона." })
      .trim()
      .min(5, "Название должно быть от 5 до 120 символов.")
      .max(120, "Название должно быть от 5 до 120 символов."),
    description: z
      .string({ message: "Укажите описание хакатона." })
      .trim()
      .min(20, "Описание должно быть от 20 до 2000 символов.")
      .max(2000, "Описание должно быть от 20 до 2000 символов."),
    startDate: z
      .string({ message: "Укажите корректную дату начала." })
      .refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "Укажите корректную дату начала."
      ),
    endDate: z
      .string({ message: "Укажите корректную дату окончания." })
      .refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "Укажите корректную дату окончания."
      ),
    location: z
      .string({ message: "Укажите место проведения или напишите Онлайн." })
      .trim()
      .min(2, "Укажите место проведения или напишите Онлайн.")
      .max(120, "Место проведения не должно превышать 120 символов."),
    format: z.enum(["online", "offline", "hybrid"], {
      message: "Выберите формат хакатона.",
    }),
    organizerName: z
      .string()
      .trim()
      .max(80, "Название организатора не должно превышать 80 символов.")
      .optional(),
    maxParticipants: z
      .number({ message: "Лимит участников должен быть положительным числом." })
      .int("Лимит участников должен быть целым числом.")
      .positive("Лимит участников должен быть положительным числом.")
      .max(100_000, "Лимит участников не может превышать 100 000.")
      .optional(),
    prizePool: z
      .string()
      .trim()
      .max(50, "Призовой фонд не должен превышать 50 символов.")
      .optional(),
    tags: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Тег не должен быть пустым.")
          .max(30, "Тег не должен превышать 30 символов.")
      )
      .max(8, "Можно указать не больше 8 тегов.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const startMs = Date.parse(data.startDate);
    const endMs = Date.parse(data.endDate);

    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return;
    }

    if (startMs < Date.now() - MAX_PAST_SKEW_MS) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Дата начала должна быть в будущем.",
      });
    }

    if (endMs <= startMs) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Дата окончания должна быть позже даты начала.",
      });
    }
  });

export type CreateHackathonInput = z.infer<typeof hackathonCreateSchema>;
