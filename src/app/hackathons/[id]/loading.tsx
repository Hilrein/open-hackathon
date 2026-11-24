export default function HackathonDetailLoading() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Загружаем страницу хакатона...</span>

      <div className="flex items-center justify-between gap-3">
        <div className="h-11 w-44 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="h-7 w-24 animate-pulse rounded-full bg-muted/50 motion-reduce:animate-none" />
          <div className="h-7 w-24 animate-pulse rounded-full bg-muted/40 motion-reduce:animate-none" />
        </div>
        <div className="h-10 w-full max-w-2xl animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40 motion-reduce:animate-none" />
          <div className="flex flex-col gap-3">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
            <div className="h-5 w-full animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
            <div className="h-5 w-5/6 animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
            <div className="h-5 w-4/6 animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
          </div>
        </div>

        <aside className="order-first lg:order-none">
          <div className="h-56 animate-pulse rounded-xl border border-border bg-muted/40 motion-reduce:animate-none" />
        </aside>
      </div>
    </div>
  );
}
