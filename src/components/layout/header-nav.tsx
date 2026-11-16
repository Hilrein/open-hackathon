"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "cn";

export const NAV_ITEMS = [
  { href: "/hackathons", label: "Хакатоны" },
  { href: "/how-it-works", label: "Как это работает" },
  { href: "/create", label: "Создать хакатон" },
] as const;

function DesktopNavLinks() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Основная навигация"
      className="hidden items-center gap-2 md:flex"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-lg px-4 text-base font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavLinks({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="mx-auto flex max-w-6xl flex-col gap-2">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 w-full items-center rounded-lg px-4 text-base font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function HeaderNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="inline-flex min-h-11 items-center rounded-md px-2 text-xl font-bold tracking-tight text-foreground hover:text-primary/80"
        >
          Хакатоны
        </Link>

        <Suspense
          fallback={
            <nav
              aria-label="Основная навигация"
              className="hidden items-center gap-2 md:flex"
            >
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-4 text-base font-medium text-foreground hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          }
        >
          <DesktopNavLinks />
        </Suspense>

        <div className="hidden items-center md:flex">
          <UserMenu />
        </div>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted md:hidden"
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Мобильная навигация"
          className="border-t bg-card px-4 py-3 md:hidden"
        >
          <Suspense fallback={null}>
            <MobileNavLinks onClose={() => setMenuOpen(false)} />
          </Suspense>
          <div className="mx-auto mt-3 max-w-6xl border-t pt-3">
            <UserMenu
              fullWidthOnMobile
              onAction={() => setMenuOpen(false)}
            />
          </div>
        </nav>
      )}
    </>
  );
}
