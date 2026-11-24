export default function HackathonsLoading() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Загружаем список хакатонов...</span>

      <div className="flex flex-col gap-2">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
        <div className="h-6 w-full max-w-md animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none" />
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-12">
        <div className="h-11 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none sm:col-span-2 lg:col-span-6" />
        <div className="h-11 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none lg:col-span-3" />
        <div className="h-11 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none lg:col-span-3" />
        <div className="h-11 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none sm:col-span-2 lg:col-span-5" />
        <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-7">
          <div className="h-11 w-32 animate-pulse rounded-lg bg-muted/50 motion-reduce:animate-none" />
        </div>
      </div>

      <div className="h-6 w-40 animate-pulse rounded bg-muted/40 motion-reduce:animate-none" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
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
    </div>
  );
}
