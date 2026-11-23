"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyHackathonLinkButtonProps {
  slug: string;
}

export function CopyHackathonLinkButton({
  slug,
}: CopyHackathonLinkButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status === "idle") {
      return;
    }
    const timer = window.setTimeout(() => setStatus("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function handleCopy() {
    const url = `${window.location.origin}/hackathons/${encodeURIComponent(
      slug
    )}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setStatus("copied");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleCopy}
        className="min-h-11 px-5 text-base"
      >
        {status === "copied" ? (
          <Check className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <Copy className="size-4 shrink-0" aria-hidden="true" />
        )}
        {status === "copied" ? "Ссылка скопирована" : "Скопировать ссылку"}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {status === "copied"
          ? "Ссылка на хакатон скопирована в буфер обмена."
          : status === "error"
            ? "Не удалось скопировать ссылку. Откройте страницу хакатона и скопируйте адрес из браузера."
            : ""}
      </span>
    </div>
  );
}
