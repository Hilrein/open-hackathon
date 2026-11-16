export function getSafeRedirectPath(rawRedirect: string | null): string {
  if (!rawRedirect) {
    return "/";
  }

  if (rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")) {
    return rawRedirect;
  }

  return "/";
}

export function buildAuthLink(
  path: "/sign-in" | "/sign-up",
  rawRedirect: string | null
): string {
  const safeRedirect = getSafeRedirectPath(rawRedirect);
  if (safeRedirect === "/") {
    return path;
  }

  return `${path}?redirect=${encodeURIComponent(safeRedirect)}`;
}

interface AuthErrorLike {
  code?: string;
  message?: string;
}

export function mapAuthError(
  error: AuthErrorLike | null | undefined,
  mode: "sign-in" | "sign-up"
): string {
  const code = error?.code;
  const message = error?.message?.toLowerCase() ?? "";

  if (
    code === "INVALID_EMAIL_OR_PASSWORD" ||
    message.includes("invalid email or password")
  ) {
    return "Неверная почта или пароль.";
  }

  if (
    code === "USER_ALREADY_EXISTS" ||
    code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
    message.includes("already exists")
  ) {
    return "Пользователь с такой почтой уже зарегистрирован. Попробуйте войти.";
  }

  if (code === "INVALID_EMAIL" || message.includes("invalid email")) {
    return "Введите корректную почту.";
  }

  if (
    code === "PASSWORD_TOO_SHORT" ||
    message.includes("password too short")
  ) {
    return "Пароль должен быть не короче 8 символов.";
  }

  return mode === "sign-in"
    ? "Не удалось войти. Попробуйте ещё раз."
    : "Не удалось создать аккаунт. Попробуйте ещё раз.";
}
