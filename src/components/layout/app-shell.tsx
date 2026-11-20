import { HeaderNav } from "@/components/layout/header-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md">
        <HeaderNav />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
        {children}
      </main>

      <footer className="border-t border-border bg-muted/45">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:text-base">
          Платформа для поиска, организации и проведения хакатонов.
        </div>
      </footer>
    </div>
  );
}
