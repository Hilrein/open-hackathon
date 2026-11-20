"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  Check,
  ChevronDown,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "cn";

interface UserMenuProps {
  onAction?: () => void;
  fullWidthOnMobile?: boolean;
}

const ACCOUNT_LINKS = [
  {
    href: "/my-participations",
    label: "Мои участия",
    icon: ClipboardList,
  },
  {
    href: "/my-hackathons",
    label: "Мои хакатоны",
    icon: Briefcase,
  },
] as const;

function isNavPathActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getUserInitial(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  return source ? source.charAt(0).toUpperCase() : "?";
}

function UserMenuSkeleton({
  fullWidthOnMobile = false,
}: {
  fullWidthOnMobile?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-11 animate-pulse rounded-lg bg-muted/60 motion-reduce:animate-none",
        fullWidthOnMobile ? "w-full" : "w-40"
      )}
    />
  );
}

function UserMenuInner({
  onAction,
  fullWidthOnMobile = false,
}: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (isPending) {
    return <UserMenuSkeleton fullWidthOnMobile={fullWidthOnMobile} />;
  }

  const isSignInActive = isNavPathActive(pathname, "/sign-in");

  if (!session?.user) {
    if (fullWidthOnMobile) {
      return (
        <Link
          href="/sign-in"
          onClick={onAction}
          aria-current={isSignInActive ? "page" : undefined}
          className={cn(
            "flex min-h-11 w-full items-center justify-start rounded-lg border px-4 text-base font-medium transition-colors motion-reduce:transition-none",
            isSignInActive
              ? "border-primary/25 bg-accent text-accent-foreground shadow-[inset_3px_0_0_0_var(--primary)]"
              : "border-input bg-background text-foreground hover:bg-muted"
          )}
        >
          <span>Войти</span>
          {isSignInActive && (
            <Check
              aria-hidden="true"
              className="ml-auto size-4 shrink-0 text-primary"
            />
          )}
        </Link>
      );
    }

    return (
      <Link
        href="/sign-in"
        onClick={onAction}
        aria-current={isSignInActive ? "page" : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "min-h-11 w-40 justify-center px-4 text-base whitespace-nowrap",
          isSignInActive &&
            "border-primary/25 bg-accent text-accent-foreground shadow-[inset_0_-2px_0_0_var(--primary)]"
        )}
      >
        Войти
      </Link>
    );
  }

  const trimmedName = session.user.name?.trim() || "";
  const displayName = trimmedName || session.user.email;
  const secondaryEmail =
    trimmedName && session.user.email && trimmedName !== session.user.email
      ? session.user.email
      : null;
  const initial = getUserInitial(session.user.name, session.user.email);
  const isAccountSectionActive = ACCOUNT_LINKS.some((item) =>
    isNavPathActive(pathname, item.href)
  );

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

  if (fullWidthOnMobile) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-1.5">
        <div className="flex min-w-0 items-center gap-3 px-4 py-2">
          <span
            aria-hidden="true"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            {secondaryEmail && (
              <p className="truncate text-xs text-muted-foreground">
                {secondaryEmail}
              </p>
            )}
          </div>
        </div>

        <ul className="flex w-full flex-col gap-1.5">
          {ACCOUNT_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive = isNavPathActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onAction?.()}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-start gap-2.5 rounded-lg border px-4 text-base font-medium transition-colors motion-reduce:transition-none",
                    isActive
                      ? "border-primary/25 bg-accent text-accent-foreground shadow-[inset_3px_0_0_0_var(--primary)]"
                      : "border-transparent text-foreground hover:bg-muted"
                  )}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <Check
                      aria-hidden="true"
                      className="ml-auto size-4 shrink-0 text-primary"
                    />
                  )}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex min-h-11 w-full items-center justify-start gap-2.5 rounded-lg border border-transparent px-4 text-base font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
            >
              <LogOut aria-hidden="true" className="size-4 shrink-0" />
              <span>{isSigningOut ? "Выходим..." : "Выйти"}</span>
            </button>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "group/trigger min-h-11 w-40 justify-between gap-2 px-3 text-base",
          isAccountSectionActive &&
            "border-primary/25 bg-accent/60 text-accent-foreground shadow-[inset_0_-2px_0_0_var(--primary)]"
        )}
      >
        <span
          aria-hidden="true"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground ring-1 ring-primary/15"
        >
          {initial}
        </span>
        <span className="sr-only">Меню аккаунта: </span>
        <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground">
          {displayName}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-aria-expanded/trigger:rotate-180 motion-reduce:transition-none"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuLabel className="flex min-w-0 items-center gap-2.5 px-3 py-2">
          <span
            aria-hidden="true"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            {secondaryEmail && (
              <p className="truncate text-xs font-normal text-muted-foreground">
                {secondaryEmail}
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuGroupLabel className="sr-only">
            Личный кабинет
          </DropdownMenuGroupLabel>
          {ACCOUNT_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive = isNavPathActive(pathname, item.href);
            return (
              <DropdownMenuLinkItem
                key={item.href}
                render={<Link href={item.href} />}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onAction?.()}
                className={cn(
                  isActive &&
                    "bg-accent/70 text-accent-foreground shadow-[inset_3px_0_0_0_var(--primary)]"
                )}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {isActive && (
                  <Check
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary"
                  />
                )}
              </DropdownMenuLinkItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          closeOnClick={false}
          onClick={handleSignOut}
        >
          <LogOut aria-hidden="true" className="size-4 shrink-0" />
          <span>{isSigningOut ? "Выходим..." : "Выйти"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserMenu(props: UserMenuProps) {
  return (
    <Suspense
      fallback={
        <UserMenuSkeleton fullWidthOnMobile={props.fullWidthOnMobile} />
      }
    >
      <UserMenuInner {...props} />
    </Suspense>
  );
}
