"use client";

import { Button } from "@/components/ui/button";
import type { HackathonStatus } from "@/types/hackathon";

interface ParticipateButtonProps {
  status: HackathonStatus;
  title: string;
}

export function ParticipateButton({ status, title }: ParticipateButtonProps) {
  if (status === "finished") {
    return (
      <Button disabled size="lg" className="min-h-12 w-full text-base">
        Хакатон завершён
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="lg"
      onClick={() => {
        console.log("Участие в хакатоне:", title);
        alert(`Регистрация на «${title}» будет добавлена на следующем шаге.`);
      }}
      className="min-h-12 w-full text-base"
    >
      Участвовать
    </Button>
  );
}
