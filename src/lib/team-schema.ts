import { z } from "zod";

const TEAM_NAME_REGEX = /^[\p{L}\p{N} ._-]+$/u;
const INVITE_CODE_REGEX = /^[A-Z0-9]{6,8}$/;

export const createTeamSchema = z.object({
  name: z
    .string({ message: "Укажите название команды." })
    .trim()
    .min(3, "Название команды должно быть от 3 до 50 символов.")
    .max(50, "Название команды должно быть от 3 до 50 символов.")
    .refine(
      (value) => TEAM_NAME_REGEX.test(value),
      "Название может содержать только буквы, цифры, пробелы, дефис, подчёркивание и точку."
    ),
});

export const joinTeamSchema = z.object({
  inviteCode: z
    .string({ message: "Укажите код приглашения." })
    .trim()
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => value.length >= 6 && value.length <= 8,
      "Код приглашения должен быть от 6 до 8 символов."
    )
    .refine(
      (value) => INVITE_CODE_REGEX.test(value),
      "Код приглашения может содержать только латинские буквы A–Z и цифры 0–9."
    ),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type JoinTeamInput = z.infer<typeof joinTeamSchema>;
