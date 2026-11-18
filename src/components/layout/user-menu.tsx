"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "cn";

interface UserMenuProps {
  onAction?: () => void;
  fullWidthOnMobile?: boolean;
}

export function UserMenu({ onAction, fullWidthOnMobile = false }: UserMenuProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (isPending) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-11 rounded-lg bg-muted/60",
          fullWidthOnMobile ? "w-full" : "w-24"
        )}
      />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/sign-in"
        onClick={onAction}
        className={cn(
          buttonVariants({ variant: "default", size: "default" }),
          "min-h-11 px-4 text-base",
          fullWidthOnMobile && "w-full"
        )}
      >
        Войти
      </Link>
    );
  }

  const displayName = session.user.name?.trim() || session.user.email;

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      onAction?.();
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5 sm:gap-3",
        fullWidthOnMobile && "w-full justify-between"
      )}
    >
      <Link
        href="/my-participations"
        onClick={() => onAction?.()}
        className={buttonVariants({
          variant: "ghost",
          className: "min-h-11 px-3 text-base",
        })}
      >
        Мои участия
      </Link>
      <Link
        href="/my-hackathons"
        onClick={() => onAction?.()}
        className={buttonVariants({
          variant: "ghost",
          className: "min-h-11 px-3 text-base",
        })}
      >
        Мои хакатоны
      </Link>
      <div className="flex items-center gap-3">
        <span className="truncate text-sm font-medium text-foreground sm:text-base">
          {displayName}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="min-h-11 shrink-0 px-4 text-base"
        >
          {isSigningOut ? "Выходим..." : "Выйти"}
        </Button>
      </div>
    </div>
  );
}
