"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Code2, Menu, X } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export const NAV_ITEMS = [
  { href: "/hackathons", label: "Хакатоны" },
  { href: "/how-it-works", label: "Как это работает" },
  { href: "/create", label: "Создать хакатон" },
] as const;

const PUBLIC_NAV_ITEMS = NAV_ITEMS.slice(0, 2);
const CREATE_NAV_ITEM = NAV_ITEMS[2];

function isNavPathActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DesktopNavLinksFallback() {
  return (
    <nav
      aria-label="Основная навигация"
      className="hidden items-center gap-1.5 whitespace-nowrap lg:flex"
    >
      {PUBLIC_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex min-h-11 items-center rounded-lg border border-transparent px-4 text-base font-medium whitespace-nowrap text-foreground transition-colors hover:bg-muted motion-reduce:transition-none"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function DesktopNavLinks() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Основная навигация"
      className="hidden items-center gap-1.5 whitespace-nowrap lg:flex"
    >
      {PUBLIC_NAV_ITEMS.map((item) => {
        const isActive = isNavPathActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-lg border px-4 text-base font-medium whitespace-nowrap transition-colors motion-reduce:transition-none",
              isActive
                ? "border-primary/25 bg-accent text-accent-foreground shadow-[inset_0_-2px_0_0_var(--primary)]"
                : "border-transparent text-foreground hover:bg-muted"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function DesktopCreateActionFallback() {
  return (
    <Link
      href={CREATE_NAV_ITEM.href}
      className={cn(
        buttonVariants({ variant: "default", size: "default" }),
        "min-h-11 px-4 text-base whitespace-nowrap"
      )}
    >
      {CREATE_NAV_ITEM.label}
    </Link>
  );
}

function DesktopCreateAction() {
  const pathname = usePathname();
  const isActive = isNavPathActive(pathname, CREATE_NAV_ITEM.href);

  return (
    <Link
      href={CREATE_NAV_ITEM.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: "default", size: "default" }),
        "min-h-11 px-4 text-base whitespace-nowrap",
        isActive &&
          "ring-2 ring-primary/35 ring-offset-2 ring-offset-card underline decoration-primary-foreground/80 underline-offset-4"
      )}
    >
      {CREATE_NAV_ITEM.label}
    </Link>
  );
}

function MobileNavLinksFallback({ onClose }: { onClose: () => void }) {
  return (
    <ul className="mx-auto flex max-w-6xl flex-col gap-1.5">
      {PUBLIC_NAV_ITEMS.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={onClose}
            className="flex min-h-11 w-full items-center justify-start rounded-lg border border-transparent px-4 text-base font-medium text-foreground transition-colors hover:bg-muted motion-reduce:transition-none"
          >
            {item.label}
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={CREATE_NAV_ITEM.href}
          onClick={onClose}
          className="flex min-h-11 w-full items-center justify-start rounded-lg border border-transparent bg-primary px-4 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/85 motion-reduce:transition-none"
        >
          {CREATE_NAV_ITEM.label}
        </Link>
      </li>
    </ul>
  );
}

function MobileNavLinks({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const isCreateActive = isNavPathActive(pathname, CREATE_NAV_ITEM.href);

  return (
    <ul className="mx-auto flex max-w-6xl flex-col gap-1.5">
      {PUBLIC_NAV_ITEMS.map((item) => {
        const isActive = isNavPathActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 w-full items-center justify-start rounded-lg border px-4 text-base font-medium transition-colors motion-reduce:transition-none",
                isActive
                  ? "border-primary/25 bg-accent text-accent-foreground shadow-[inset_3px_0_0_0_var(--primary)]"
                  : "border-transparent text-foreground hover:bg-muted"
              )}
            >
              <span>{item.label}</span>
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
        <Link
          href={CREATE_NAV_ITEM.href}
          onClick={onClose}
          aria-current={isCreateActive ? "page" : undefined}
          className={cn(
            "flex min-h-11 w-full items-center justify-start rounded-lg border border-transparent bg-primary px-4 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/85 motion-reduce:transition-none",
            isCreateActive &&
              "ring-2 ring-primary/35 ring-offset-2 ring-offset-card underline decoration-primary-foreground/80 underline-offset-4"
          )}
        >
          <span>{CREATE_NAV_ITEM.label}</span>
          {isCreateActive && (
            <Check
              aria-hidden="true"
              className="ml-auto size-4 shrink-0 text-primary-foreground"
            />
          )}
        </Link>
      </li>
    </ul>
  );
}

export function HeaderNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    function handleMediaChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, [menuOpen]);

  return (
    <div ref={containerRef}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            onClick={closeMenu}
            aria-label="Хакатоны — на главную"
            className="inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-1.5 text-xl font-bold tracking-tight whitespace-nowrap text-foreground transition-colors hover:text-primary motion-reduce:transition-none"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs"
            >
              <Code2 className="size-4" />
            </span>
            <span>Хакатоны</span>
          </Link>

          <Suspense fallback={<DesktopNavLinksFallback />}>
            <DesktopNavLinks />
          </Suspense>
        </div>

        <div className="hidden shrink-0 items-center gap-3 whitespace-nowrap lg:flex">
          <Suspense fallback={<DesktopCreateActionFallback />}>
            <DesktopCreateAction />
          </Suspense>
          <UserMenu />
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-foreground transition-colors hover:bg-muted motion-reduce:transition-none lg:hidden"
        >
          {menuOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Мобильная навигация"
          className="border-t border-border bg-card px-4 py-3 lg:hidden"
        >
          <Suspense fallback={<MobileNavLinksFallback onClose={closeMenu} />}>
            <MobileNavLinks onClose={closeMenu} />
          </Suspense>
          <div className="mx-auto mt-3 max-w-6xl border-t border-border pt-3">
            <UserMenu fullWidthOnMobile onAction={closeMenu} />
          </div>
        </nav>
      )}
    </div>
  );
}
