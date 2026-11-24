export default function HomeLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex flex-col gap-16"
    >
      <span className="sr-only">Загружаем главную страницу...</span>

      <section className="flex flex-col items-start gap-6 py-4 sm:py-8">
        <div className="h-12 w-full max-w-2xl animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none sm:h-14" />
        <div className="h-7 w-full max-w-xl animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none" />
        <div className="flex flex-wrap gap-4">
          <div className="h-12 w-48 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
          <div className="h-12 w-44 animate-pulse rounded-lg border border-border bg-muted/40 motion-reduce:animate-none" />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-9 w-64 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
          <div className="h-6 w-full max-w-md animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="flex h-96 flex-col overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="h-32 animate-pulse bg-muted/50 motion-reduce:animate-none" />
              <div className="flex flex-1 flex-col gap-3 p-6">
                <div className="flex gap-2">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-muted/50 motion-reduce:animate-none" />
                  <div className="h-6 w-20 animate-pulse rounded-full bg-muted/40 motion-reduce:animate-none" />
                </div>
                <div className="h-7 w-3/4 animate-pulse rounded bg-muted/50 motion-reduce:animate-none" />
                <div className="h-10 w-full animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
                <div className="mt-auto space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-xl border border-border bg-muted/40 motion-reduce:animate-none"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
