import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CreateHackathonWizard } from "@/components/create-hackathon-wizard";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Создать хакатон — Платформа хакатонов",
  description: "Создайте хакатон по простым шагам.",
};

function CreateHackathonSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="mx-auto flex w-full max-w-3xl flex-col gap-6"
    >
      <span className="sr-only">Загружаем форму создания хакатона...</span>
      <div className="flex flex-col gap-2">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
        <div className="h-6 w-full max-w-lg animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-5 w-24 animate-pulse rounded bg-muted/50 motion-reduce:animate-none" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-11 animate-pulse rounded-lg border border-border bg-muted/40 motion-reduce:animate-none" />
          <div className="h-11 animate-pulse rounded-lg border border-border bg-muted/40 motion-reduce:animate-none" />
          <div className="h-11 animate-pulse rounded-lg border border-border bg-muted/40 motion-reduce:animate-none" />
        </div>
      </div>
      <div className="h-96 animate-pulse rounded-xl border border-border bg-muted/40 motion-reduce:animate-none" />
    </div>
  );
}

async function CreateHackathonContent() {
  await connection();
  const session = await getSession();

  if (!session) {
    redirect("/sign-in?redirect=/create");
  }

  const defaultOrganizerName =
    session.user.name?.trim() || session.user.email || "";

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Создать хакатон
        </h1>
        <p className="text-lg text-muted-foreground">
          Заполните несколько простых шагов, чтобы опубликовать хакатон на
          платформе.
        </p>
      </div>

      <CreateHackathonWizard defaultOrganizerName={defaultOrganizerName} />
    </div>
  );
}

export default function CreateHackathonPage() {
  return (
    <Suspense fallback={<CreateHackathonSkeleton />}>
      <CreateHackathonContent />
    </Suspense>
  );
}
