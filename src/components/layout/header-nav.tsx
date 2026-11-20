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
      className="hidden items-center gap-1.5 md:flex"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-lg border px-4 text-base font-medium transition-[color,background-color,border-color,box-shadow] duration-150",
              isActive
                ? "border-primary/25 bg-accent font-semibold text-accent-foreground shadow-[inset_0_-2px_0_0_var(--primary)]"
                : "border-transparent text-foreground hover:bg-muted/80 hover:text-foreground"
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
                "flex min-h-11 w-full items-center rounded-lg border px-4 text-base font-medium transition-[color,background-color,border-color] duration-150",
                isActive
                  ? "border-primary/25 border-l-4 border-l-primary bg-accent font-semibold text-accent-foreground"
                  : "border-transparent text-foreground hover:bg-muted/80"
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
      <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-1.5 text-xl font-extrabold tracking-tight text-foreground transition-colors duration-150 hover:text-primary"
        >
          <span
            aria-hidden="true"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-format-hybrid to-format-online shadow-xs"
          >
            <span className="size-2.5 rotate-45 rounded-[2px] bg-primary-foreground/95" />
          </span>
          <span>Хакатоны</span>
        </Link>

        <Suspense
          fallback={
            <nav
              aria-label="Основная навигация"
              className="hidden items-center gap-1.5 md:flex"
            >
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-lg border border-transparent px-4 text-base font-medium text-foreground transition-colors duration-150 hover:bg-muted/80"
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
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-[color,background-color,border-color] duration-150 hover:border-border-strong hover:bg-accent/60 md:hidden"
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Мобильная навигация"
          className="border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md transition-opacity duration-150 md:hidden"
        >
          <Suspense fallback={null}>
            <MobileNavLinks onClose={() => setMenuOpen(false)} />
          </Suspense>
          <div className="mx-auto mt-3 max-w-6xl border-t border-border pt-3">
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
