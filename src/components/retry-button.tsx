"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

interface RetryButtonProps {
  label?: string;
  variant?: "default" | "outline";
  size?: "default" | "lg";
  className?: string;
}

export function RetryButton({
  label = "Обновить страницу",
  variant = "outline",
  size = "default",
  className,
}: RetryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRetry() {
    if (isPending) {
      return;
    }
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={isPending}
      aria-busy={isPending}
      onClick={handleRetry}
      className={cn("min-h-11 px-5 text-base", className)}
    >
      <RefreshCw
        className={cn(
          "size-4 shrink-0",
          isPending && "animate-spin motion-reduce:animate-none"
        )}
        aria-hidden="true"
      />
      {isPending ? "Обновляем..." : label}
    </Button>
  );
}
