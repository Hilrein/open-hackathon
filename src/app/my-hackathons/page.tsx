import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { HackathonManageItem } from "@/components/hackathon-manage-item";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getHackathonsByOrganizer } from "@/db/queries";
import { getSession } from "@/lib/session";
import type { Hackathon } from "@/types/hackathon";

export const metadata: Metadata = {
  title: "Мои хакатоны — Платформа хакатонов",
  description: "Управляйте хакатонами, которые вы создали.",
};

function MyHackathonsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="h-32 animate-pulse rounded-xl border border-border bg-muted/40"
        />
      ))}
    </div>
  );
}

async function MyHackathonsContent() {
  await connection();

  const session = await getSession();
  if (!session) {
    redirect("/sign-in?redirect=/my-hackathons");
  }

  let hackathons: Hackathon[] = [];
  let hasError = false;

  try {
    hackathons = await getHackathonsByOrganizer(session.user.id);
  } catch {
    hasError = true;
  }

  if (hasError) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">
            Не удалось загрузить ваши хакатоны
          </h2>
          <p className="mx-auto max-w-md text-base text-muted-foreground">
            Возникла ошибка при обращении к базе данных. Попробуйте обновить
            страницу чуть позже.
          </p>
          <div>
            <Link
              href="/my-hackathons"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11 px-5 text-base",
              })}
            >
              Обновить страницу
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hackathons.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6 text-center sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">
            У вас пока нет созданных хакатонов
          </h2>
          <p className="mx-auto max-w-md text-base text-muted-foreground">
            Создайте первый хакатон — это займёт пару минут, и он сразу появится
            в общем каталоге.
          </p>
          <div>
            <Link
              href="/create"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11 px-5 text-base",
              })}
            >
              <Plus className="size-4" aria-hidden="true" />
              Создать хакатон
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hackathons.map((hackathon) => (
        <HackathonManageItem key={hackathon.id} hackathon={hackathon} />
      ))}
    </div>
  );
}

export default function MyHackathonsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Мои хакатоны
          </h1>
          <p className="text-base text-muted-foreground">
            Здесь собраны хакатоны, которые вы создали.
          </p>
        </div>
        <Link
          href="/create"
          className={buttonVariants({
            className: "min-h-11 shrink-0 px-5 text-base",
          })}
        >
          <Plus className="size-4" aria-hidden="true" />
          Создать хакатон
        </Link>
      </div>

      <Suspense fallback={<MyHackathonsSkeleton />}>
        <MyHackathonsContent />
      </Suspense>
    </div>
  );
}
