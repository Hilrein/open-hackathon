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

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(mapAuthError(error, "sign-in"));
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
          <CardTitle className="text-2xl font-bold sm:text-3xl">
            <h1>Вход</h1>
          </CardTitle>
          <CardDescription className="text-base">
            Войдите, чтобы участвовать в хакатонах и создавать свои.
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
              <Label htmlFor="sign-in-email" className="text-base">
                Почта
              </Label>
              <Input
                id="sign-in-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={isSubmitting}
                className="min-h-11 text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sign-in-password" className="text-base">
                Пароль
              </Label>
              <Input
                id="sign-in-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                className="min-h-11 text-base"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="mt-2 min-h-11 w-full text-base"
            >
              {isSubmitting ? "Входим..." : "Войти"}
            </Button>
          </form>

          <p className="text-center text-base text-muted-foreground">
            Нет аккаунта?{" "}
            <Link
              href={buildAuthLink("/sign-up", rawRedirect)}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Зарегистрируйтесь
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-md py-8 text-base text-muted-foreground">
          Загрузка...
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
