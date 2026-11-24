"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
  buildAuthLink,
  getSafeRedirectPath,
  mapAuthError,
} from "@/lib/auth-helpers";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignInFieldErrors {
  email?: string;
  password?: string;
}

function isEmailServerError(
  error: { code?: string; message?: string } | null | undefined
): boolean {
  const code = error?.code;
  const message = error?.message?.toLowerCase() ?? "";
  return code === "INVALID_EMAIL" || message.includes("invalid email");
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);

    const trimmedEmail = email.trim();
    const nextErrors: SignInFieldErrors = {};

    if (trimmedEmail.length === 0) {
      nextErrors.email = "Введите почту.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = "Введите корректную почту.";
    }

    if (password.length === 0) {
      nextErrors.password = "Введите пароль.";
    }

    if (nextErrors.email || nextErrors.password) {
      setFieldErrors(nextErrors);
      if (nextErrors.email) {
        emailRef.current?.focus({ preventScroll: true });
      } else if (nextErrors.password) {
        passwordRef.current?.focus({ preventScroll: true });
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.email({
        email: trimmedEmail,
        password,
      });

      if (error) {
        const mappedError = mapAuthError(error, "sign-in");
        if (isEmailServerError(error)) {
          setFieldErrors({ email: mappedError });
          emailRef.current?.focus({ preventScroll: true });
        } else {
          setErrorMessage(mappedError);
        }
        setIsSubmitting(false);
        return;
      }

      const target = getSafeRedirectPath(rawRedirect);
      router.push(target);
      router.refresh();
    } catch {
      setErrorMessage("Не удалось войти. Попробуйте ещё раз.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md py-4 sm:py-8">
      <Card className="p-2">
        <CardHeader className="gap-2">
          <h1 className="font-heading text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl">
            Вход
          </h1>
          <CardDescription className="text-base">
            Войдите, чтобы участвовать в хакатонах и создавать свои.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          {errorMessage && (
            <Alert variant="destructive" role="alert" className="p-4">
              <AlertDescription className="text-base">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="sign-in-email" className="text-base">
                Почта
              </Label>
              <Input
                ref={emailRef}
                id="sign-in-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={
                  fieldErrors.email ? "sign-in-email-error" : undefined
                }
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                placeholder="you@example.com"
                disabled={isSubmitting}
                className="min-h-11 text-base"
              />
              {fieldErrors.email ? (
                <p
                  id="sign-in-email-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sign-in-password" className="text-base">
                Пароль
              </Label>
              <div className="relative">
                <Input
                  ref={passwordRef}
                  id="sign-in-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? "sign-in-password-error" : undefined
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: undefined,
                      }));
                    }
                  }}
                  disabled={isSubmitting}
                  className="min-h-11 pr-12 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isSubmitting}
                  aria-label={
                    showPassword ? "Скрыть пароль" : "Показать пароль"
                  }
                  aria-pressed={showPassword}
                  className="absolute top-0 right-0 inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.password ? (
                <p
                  id="sign-in-password-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="mt-2 min-h-12 w-full text-base"
            >
              {isSubmitting ? "Входим..." : "Войти"}
            </Button>
          </form>

          <p className="text-center text-base text-muted-foreground">
            Нет аккаунта?{" "}
            <Link
              href={buildAuthLink("/sign-up", rawRedirect)}
              className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Зарегистрируйтесь
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SignInSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-md py-4 sm:py-8"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Загружаем форму входа...</span>
      <Card className="p-2">
        <CardHeader className="gap-2">
          <div className="h-8 w-24 animate-pulse rounded-lg bg-muted/60 motion-reduce:animate-none sm:h-9" />
          <div className="h-6 w-full animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none" />
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="h-6 w-16 animate-pulse rounded-lg bg-muted/60 motion-reduce:animate-none" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="h-6 w-20 animate-pulse rounded-lg bg-muted/60 motion-reduce:animate-none" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none" />
            </div>

            <div className="mt-2 h-12 w-full animate-pulse rounded-lg bg-muted/60 motion-reduce:animate-none" />
          </div>

          <div className="mx-auto h-6 w-56 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SignInForm />
    </Suspense>
  );
}
