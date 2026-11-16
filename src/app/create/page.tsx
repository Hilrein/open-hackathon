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
    <Suspense
      fallback={
        <div className="py-12 text-base text-muted-foreground">Загрузка...</div>
      }
    >
      <CreateHackathonContent />
    </Suspense>
  );
}
