"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length === 0) {
      setErrorMessage("Введите ваше имя.");
      return;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setErrorMessage("Введите корректную почту.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Пароль должен быть не короче 8 символов.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.signUp.email({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      if (error) {
        setErrorMessage(mapAuthError(error, "sign-up"));
        setIsSubmitting(false);
        return;
      }

      const target = getSafeRedirectPath(rawRedirect);
      router.push(target);
      router.refresh();
    } catch {
      setErrorMessage("Не удалось создать аккаунт. Попробуйте ещё раз.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md py-4 sm:py-8">
      <Card className="p-2">
        <CardHeader className="gap-2">
          <CardTitle className="text-2xl font-bold sm:text-3xl">
            <h1>Регистрация</h1>
          </CardTitle>
          <CardDescription className="text-base">
            Создайте аккаунт, чтобы участвовать в хакатонах и создавать свои.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          {errorMessage && (
            <Alert variant="destructive" className="p-4">
              <AlertDescription className="text-base">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sign-up-name" className="text-base">
                Имя
              </Label>
              <Input
                id="sign-up-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Как вас зовут?"
                disabled={isSubmitting}
                className="min-h-11 text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sign-up-email" className="text-base">
                Почта
              </Label>
              <Input
                id="sign-up-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={isSubmitting}
                className="min-h-11 text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sign-up-password" className="text-base">
                Пароль
              </Label>
              <Input
                id="sign-up-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                className="min-h-11 text-base"
              />
              <p className="text-sm text-muted-foreground">
                Минимум 8 символов.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="mt-2 min-h-11 w-full text-base"
            >
              {isSubmitting ? "Создаём аккаунт..." : "Создать аккаунт"}
            </Button>
          </form>

          <p className="text-center text-base text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link
              href={buildAuthLink("/sign-in", rawRedirect)}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Войдите
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-md py-8 text-base text-muted-foreground">
          Загрузка...
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
